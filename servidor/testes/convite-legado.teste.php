<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/**
 * Links antigos com ?t= (V17-C5, decisão Q2 do líder: aceitar por 48 h). O GET com um token de formato certo
 * responde 303 para /api/convite.php#t=<T>: o navegador manda o fragmento ao script da casca, e o GET não lê
 * conta, não toca o limite e não grava o token. O uso é contado num arquivo de tamanho limitado (3 dias) que não
 * guarda o token. Formato errado (63 ou 65 hex, maiúsculas, vazio, lista) é M3 com 404, sem ler conta.
 * Nome de teste começa com "convite-legado:" (filtro do rodar.php).
 */

/** Soma dos bytes de todos os arquivos sob $dir (medida do crescimento do privado). */
function legadoBytes(string $dir): int
{
    $total = 0;
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $f) {
        if ($f->isFile()) {
            $total += $f->getSize();
        }
    }
    return $total;
}

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

teste('convite-legado: L2 quarenta GET com link antigo não tocam o limite: o POST com token errado segue dando 404, não 429', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Casca($c)->corpo, 'csrf');
    $limitesAntes = hash_file('sha256', $a->priv . '/tentativas.json');
    for ($i = 0; $i < 40; $i++) {
        igual(303, $c->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, "GET legado $i");
    }
    igual($limitesAntes, hash_file('sha256', $a->priv . '/tentativas.json'), 'o GET legado não mexe em tentativas.json');
    igual(404, cvb2Enviar($c, cvb2Campos(str_repeat('0', 64), $csrf, CVB2_SENHA))->status, 'o POST de token errado dá 404, o IP segue livre');
});

teste('convite-legado: L3 depois de três GET com link antigo, o token não aparece em nenhum arquivo do privado; o controle acha o hash', function (): void {
    $a = Ambiente::novo();
    $tokens = [cvb2Convidar($a, 'ana'), cvb2Convidar($a, 'bia'), cvb2Convidar($a, 'cora')];
    $c = $a->cliente();
    foreach ($tokens as $t) {
        igual(303, $c->get('/api/convite.php?t=' . $t, PORTAO_NAVEGACAO)->status, 'link antigo');
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

teste('convite-legado: L4 PUT com link antigo continua 405, sem efeito', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $r = $a->cliente()->enviar('PUT', '/api/convite.php?t=' . $token, '', []);
    igual(405, $r->status, 'método PUT');
});

teste('convite-legado: L5 com usuarios.json corrompido ou ausente, o link antigo segue 303 (o GET não lê contas)', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    file_put_contents($a->priv . '/usuarios.json', '{quebrado');
    igual(303, $a->cliente()->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, 'com usuarios.json corrompido');
    unlink($a->priv . '/usuarios.json');
    igual(303, $a->cliente()->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, 'com usuarios.json ausente');
});

teste('convite-legado: L6 t com 63 ou 65 hex, em maiúsculas, vazio ou em lista: M3 com 404, sem linha nova no erros.log', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    file_put_contents($a->priv . '/usuarios.json', '{quebrado'); // formato errado não pode ler contas: segue 404 mesmo assim
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
        cvb2Mensagem($c->get($caminho, PORTAO_NAVEGACAO), 404, CVB2_M3);
    }
    $depois = is_file($log) ? (string) file_get_contents($log) : '';
    igual($antes, $depois, 'nenhuma linha nova no erros.log');
    naoContem($token, $depois, 'o token não vai ao erros.log');
});

teste('convite-legado: L7 mil GET com link antigo não fazem o privado crescer além de 1 KiB, e o contador guarda no máximo 3 dias', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    // Contador com cinco dias antigos já gravados: a conta tem de cair para 3 no primeiro uso.
    $dias = [];
    for ($i = 5; $i >= 1; $i--) {
        $dias[date('Y-m-d', strtotime("-$i day"))] = 1;
    }
    file_put_contents($a->priv . '/convite-legado.json', json_encode(['dias' => $dias], JSON_THROW_ON_ERROR));
    $c = $a->cliente();
    igual(303, $c->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, 'primeiro uso com o contador cheio');
    $d = json_decode((string) file_get_contents($a->priv . '/convite-legado.json'), true, 512, JSON_THROW_ON_ERROR);
    verdadeiro(count($d['dias']) <= 3, 'o contador guarda no máximo 3 dias (guardou ' . count($d['dias']) . ')');
    $antes = legadoBytes($a->priv);
    for ($i = 0; $i < 1000; $i++) {
        igual(303, $c->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO)->status, "GET legado $i");
    }
    $crescimento = legadoBytes($a->priv) - $antes;
    verdadeiro($crescimento <= 1024, "o privado cresceu $crescimento bytes em 1000 GET (teto: 1024)");
    $d = json_decode((string) file_get_contents($a->priv . '/convite-legado.json'), true, 512, JSON_THROW_ON_ERROR);
    verdadeiro(count($d['dias']) <= 3, 'depois de mil GET o contador segue com no máximo 3 dias');
});
