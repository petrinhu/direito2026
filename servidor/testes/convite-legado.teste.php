<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/**
 * Link com ?t= (o formato de antes da 1.17, com o token na consulta). Sai o ramo que aceitava esse link: o GET com
 * ?t= recebe a casca, que é a tela de link incompleto (o convite.js mostra o aviso quando não há #t=). Vale para
 * qualquer valor de t, inclusive o de formato certo. Nada disso lê conta, reserva limite por IP, grava o token ou
 * cria contador. Nome de teste começa com "convite-legado:" (filtro do rodar.php).
 */

/** Varre todos os arquivos sob $dir e conta os que contêm $trecho. Piso: conta os arquivos varridos (L-36). @return array{arquivos: int, achados: int} */
function legadoVarrer(string $dir, string $trecho): array
{
    $arquivos = 0;
    $achados = 0;
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $f) {
        if ($f->isFile()) {
            $arquivos++;
            if (str_contains((string) file_get_contents($f->getPathname()), $trecho)) {
                $achados++;
            }
        }
    }
    return ['arquivos' => $arquivos, 'achados' => $achados];
}

teste('convite-legado: L1 GET com ?t= de formato certo: 200 com a casca, sem Location, sem o token no corpo, no-store e referrer só com a origem', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $r = $a->cliente()->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO);
    igual(200, $r->status, 'link com ?t= recebe a casca, sem 303');
    verdadeiro($r->cabecalho('location') === null, 'nenhum Location na resposta');
    igual('private, no-store', $r->cabecalho('cache-control'), 'sem cache');
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'referrer só com a origem');
    naoContem($token, $r->corpo, 'o token não volta no corpo da casca');
    contem('<input type="hidden" name="t" value="">', $r->corpo, 'campo t segue vazio: o token só entra pelo #t=');
    contem('<form id="convite-form" method="post" action="/api/convite.php?envio" hidden>', $r->corpo, 'formulário segue escondido');
});

teste('convite-legado: L2 quarenta GET com ?t= não tocam o limite: com o IP cheio, o GET segue 200 e o POST segue dando 429', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Casca($c)->corpo, 'csrf');
    $limitesAntes = hash_file('sha256', $a->priv . '/tentativas.json');
    for ($i = 0; $i < 40; $i++) {
        igual(200, $c->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, "GET com t $i");
    }
    igual($limitesAntes, hash_file('sha256', $a->priv . '/tentativas.json'), 'o GET com t não mexe em tentativas.json');
    for ($i = 0; $i < 30; $i++) {
        igual(404, cvb2Enviar($c, cvb2Campos(str_repeat('0', 64), $csrf, CVB2_SENHA))->status, "falha de token $i");
    }
    igual(429, cvb2Enviar($c, cvb2Campos(str_repeat('0', 64), $csrf, CVB2_SENHA))->status, 'com o IP cheio, o POST dá 429');
    igual(200, $c->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, 'com o IP cheio, o GET com ?t= segue 200 (não é 429 nem 303)');
});

teste('convite-legado: L3 três GET com ?t= não gravam o token em nenhum arquivo do privado; o controle acha o hash', function (): void {
    $a = Ambiente::novo();
    $tokens = [cvb2Convidar($a, 'ana'), cvb2Convidar($a, 'bia'), cvb2Convidar($a, 'cora')];
    $c = $a->cliente();
    foreach ($tokens as $t) {
        igual(200, $c->get('/api/convite.php?t=' . $t, PORTAO_NAVEGACAO)->status, 'link com ?t=');
    }
    $encontrados = 0;
    $arquivos = 0;
    foreach ($tokens as $t) {
        $v = legadoVarrer($a->priv, $t);
        $encontrados += $v['achados'];
        $arquivos = max($arquivos, $v['arquivos']);
    }
    verdadeiro($arquivos > 0, 'piso de varredura: o privado tem arquivos');
    igual(0, $encontrados, 'nenhum token em nenhum arquivo do privado (encontrados/analisados/falharam: 0/' . $arquivos . '/0)');
    $controle = legadoVarrer($a->priv, hash('sha256', $tokens[0]));
    verdadeiro($controle['achados'] >= 1, 'controle positivo: o hash do token aparece em usuarios.json (o grep lê os arquivos)');
});

teste('convite-legado: L4 PUT com ?t= continua 405, sem efeito', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $r = $a->cliente()->enviar('PUT', '/api/convite.php?t=' . $token, '', []);
    igual(405, $r->status, 'método PUT');
});

teste('convite-legado: L5 com usuarios.json corrompido ou ausente, o GET com ?t= segue 200 (a casca não lê contas)', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    file_put_contents($a->priv . '/usuarios.json', '{quebrado');
    igual(200, $a->cliente()->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, 'com usuarios.json corrompido');
    unlink($a->priv . '/usuarios.json');
    igual(200, $a->cliente()->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, 'com usuarios.json ausente');
});

teste('convite-legado: L6 t com 63 ou 65 hex, em maiúsculas, vazio ou em lista: casca 200, sem 404 e sem linha nova no erros.log', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $log = $a->priv . '/erros.log';
    $antes = is_file($log) ? (string) file_get_contents($log) : '';
    $c = $a->cliente();
    $pedidos = [
        '/api/convite.php?t=' . substr($token, 0, 63),
        '/api/convite.php?t=' . $token . 'a',
        '/api/convite.php?t=' . strtoupper($token),
        '/api/convite.php?t=',
        '/api/convite.php?t[]=' . $token,
    ];
    foreach ($pedidos as $caminho) {
        $r = $c->get($caminho, PORTAO_NAVEGACAO);
        igual(200, $r->status, "casca para $caminho");
        verdadeiro($r->cabecalho('location') === null, 'nenhum Location');
    }
    $depois = is_file($log) ? (string) file_get_contents($log) : '';
    igual($antes, $depois, 'nenhuma linha nova no erros.log');
    naoContem($token, $depois, 'o token não vai ao erros.log');
});

teste('convite-legado: L7 cinquenta GET com ?t= não mudam nenhum arquivo do privado e não criam contador', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $c->get('/api/convite.php', PORTAO_NAVEGACAO); // aquece: a primeira emissão do cookie pré pode criar o segredo
    $antes = cascaInstantaneo($a->priv);
    verdadeiro(count($antes) > 0, 'piso de varredura: o privado tem arquivos');
    for ($i = 0; $i < 50; $i++) {
        igual(200, $c->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, "GET com t $i");
    }
    igual($antes, cascaInstantaneo($a->priv), 'nenhum arquivo do privado mudou nem nasceu');
    verdadeiro(!is_file($a->priv . '/convite-legado.json'), 'nenhum contador de link antigo foi criado');
});
