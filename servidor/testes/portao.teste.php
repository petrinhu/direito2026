<?php
declare(strict_types=1);

/**
 * Portão do site inteiro (plano do CTO do login único, seção 1.3). Uma linha da
 * ordem de decisão, um teste vermelho primeiro. O app é sintético: vem de D26_APP,
 * com manifesto em atual/manifesto.json. Nenhum conteúdo real entra aqui (L-28).
 */

const PORTAO_CSP_SHELL = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'none'; manifest-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const PORTAO_CSP_TELA = "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
const PORTAO_NAVEGACAO = ['Sec-Fetch-Mode' => 'navigate'];

/**
 * App sintético no layout de PRODUÇÃO (LU-F2.4, revisão F5.2, mutante P2): atual é link relativo para
 * versoes/v1, e o manifesto e os arquivos moram na versão. Com atual de diretório real, o portão sem
 * realpath passaria na suíte e seria recusado em produção.
 */
function portaoSemearApp(Ambiente $a): void
{
    $dir = $a->app . '/versoes/v1';
    mkdir($dir . '/assets', 0700, true);
    file_put_contents($dir . '/index.html', '<!doctype html><title>app sintético</title><p>CONTEUDO-SINTETICO-APP</p><script src="assets/app.js"></script>');
    file_put_contents($dir . '/assets/app.js', 'var x = "CONTEUDO-SINTETICO-JS";');
    symlink('versoes/v1', $a->app . '/atual');
    file_put_contents($dir . '/manifesto.json', json_encode([
        'versao' => 'teste',
        'arquivos' => [
            'index.html' => ['tipo' => 'text/html; charset=utf-8'],
            'assets/app.js' => ['tipo' => 'text/javascript; charset=utf-8'],
        ],
    ], JSON_THROW_ON_ERROR));
}

/** Cliente com sessão válida e o app sintético no lugar. */
function portaoLogado(Ambiente $a): Cliente
{
    portaoSemearApp($a);
    return $a->entrar();
}

teste('portão: método que não é GET nem HEAD responde 405 sem corpo, com Allow', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    foreach (['POST', 'PUT', 'DELETE'] as $m) {
        $r = $a->cliente()->enviar($m, '/', [], []);
        igual(405, $r->status, "$m: status");
        igual('', $r->corpo, "$m: sem corpo");
        igual('GET, HEAD', $r->cabecalho('allow'), "$m: Allow");
    }
});

teste('portão: caminho com .. ou NUL responde 400 antes de qualquer outra decisão', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    igual(400, $c->get('/a/../b', PORTAO_NAVEGACAO)->status, '..');
    igual(400, $c->get('/a%00b', PORTAO_NAVEGACAO)->status, 'NUL');
});

teste('portão: anônimo em navegação recebe a tela de entrada (200, no-store, com formulário e sem script)', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $r = $a->cliente()->get('/', PORTAO_NAVEGACAO);
    igual(200, $r->status, 'status');
    igual('private, no-store', $r->cabecalho('cache-control'), 'Cache-Control');
    contem('<form', $r->corpo, 'tela de entrada tem formulário');
    naoContem('<script', $r->corpo, 'tela de entrada sem script');
    naoContem('CONTEUDO-SINTETICO', $r->corpo, 'nenhum byte do app');
});

teste('portão: anônimo sem navegação recebe 401 sem corpo, mesmo para arquivo do app', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $r = $a->cliente()->get('/assets/app.js');
    igual(401, $r->status, 'status');
    igual('', $r->corpo, 'sem corpo');
});

teste('portão: troca pendente recebe a tela de troca em navegação; o resto 403 sem corpo e nenhum byte do app', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = portaoLogado($a);
    $tela = $c->get('/', PORTAO_NAVEGACAO);
    igual(200, $tela->status, 'tela de troca');
    contem('senha', $tela->corpo, 'é a tela de troca');
    naoContem('CONTEUDO-SINTETICO', $tela->corpo, 'nenhum byte do app antes da troca');
    $r = $c->get('/assets/app.js');
    igual(403, $r->status, 'fora da navegação: 403');
    igual('', $r->corpo, 'sem corpo');
});

teste('portão: sessão válida entrega o index do manifesto em navegação e o arquivo com o tipo do manifesto', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    $index = $c->get('/', PORTAO_NAVEGACAO);
    igual(200, $index->status, 'index');
    igual('text/html; charset=utf-8', $index->cabecalho('content-type'), 'tipo do manifesto');
    contem('CONTEUDO-SINTETICO-APP', $index->corpo, 'index do app');
    $js = $c->get('/assets/app.js');
    igual(200, $js->status, 'arquivo');
    igual('text/javascript; charset=utf-8', $js->cabecalho('content-type'), 'tipo do manifesto no arquivo');
});

teste('portão: caminho fora do manifesto cai no index em navegação (SPA) e responde 404 fora dela', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    $spa = $c->get('/rota/da/spa', PORTAO_NAVEGACAO);
    igual(200, $spa->status, 'SPA: status');
    contem('CONTEUDO-SINTETICO-APP', $spa->corpo, 'SPA: index');
    igual(404, $c->get('/nao-existe.js')->status, 'fora da navegação: 404');
});

teste('portão: app ausente ou manifesto ilegível responde 503 fechado, sem conteúdo parcial', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    unlink($a->app . '/atual/manifesto.json');
    $semManifesto = $c->get('/', PORTAO_NAVEGACAO);
    igual(503, $semManifesto->status, 'manifesto ausente');
    naoContem('CONTEUDO-SINTETICO', $semManifesto->corpo, 'nenhum byte do app');

    file_put_contents($a->app . '/atual/manifesto.json', '{isto não é json');
    $ilegivel = $c->get('/assets/app.js');
    igual(503, $ilegivel->status, 'manifesto ilegível');
    naoContem('CONTEUDO-SINTETICO', $ilegivel->corpo, 'nenhum byte do app');
});

teste('portão: manifesto com ../ é recusado (503) mesmo com o arquivo alvo existindo fora do app', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    file_put_contents($a->app . '/segredo.txt', 'SEGREDO-SINTETICO-FORA-DO-APP');
    $manifesto = json_decode((string) file_get_contents($a->app . '/atual/manifesto.json'), true, 16, JSON_THROW_ON_ERROR);
    $manifesto['arquivos']['../segredo.txt'] = ['tipo' => 'text/plain; charset=utf-8'];
    file_put_contents($a->app . '/atual/manifesto.json', json_encode($manifesto, JSON_THROW_ON_ERROR));
    $r = $c->get('/', PORTAO_NAVEGACAO);
    igual(503, $r->status, 'manifesto com ../ recusado por inteiro');
    naoContem('SEGREDO-SINTETICO', $r->corpo, 'nenhum byte de fora do app');
});

teste('portão: toda resposta traz Cache-Control private, no-store e CORP same-origin (200, 401, 403, 404, 405 e 503)', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    $respostas = [
        '200' => $c->get('/', PORTAO_NAVEGACAO),
        '404' => $c->get('/nao-existe.js'),
        '405' => $c->enviar('POST', '/', [], []),
    ];
    $anonimo = Ambiente::novo();
    portaoSemearApp($anonimo);
    $respostas['401'] = $anonimo->cliente()->get('/assets/app.js');
    foreach ($respostas as $nome => $r) {
        igual('private, no-store', $r->cabecalho('cache-control'), "$nome: Cache-Control");
        igual('same-origin', $r->cabecalho('cross-origin-resource-policy'), "$nome: CORP");
    }
});

teste('portão: CSP do shell e CSP da tela de entrada são exatas', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    igual(PORTAO_CSP_SHELL, $c->get('/', PORTAO_NAVEGACAO)->cabecalho('content-security-policy'), 'CSP do shell');
    igual(PORTAO_CSP_TELA, $a->cliente()->get('/', PORTAO_NAVEGACAO)->cabecalho('content-security-policy'), 'CSP da tela de entrada');
});

teste('portão: symlink dentro do app que aponta para fora do diretório do app dá 503 sem corpo (LU-F2.4, F5.2 I-1)', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    // O alvo fica FORA de atual/ (a pasta do app), mas dentro de D26_APP: é o caso que o portão tem de recusar.
    file_put_contents($a->app . '/SEGREDO-FORA-DO-ATUAL.txt', 'SEGREDO-SINTETICO-LINK');
    symlink($a->app . '/SEGREDO-FORA-DO-ATUAL.txt', $a->app . '/atual/linkfora.txt');
    $manifesto = json_decode((string) file_get_contents($a->app . '/atual/manifesto.json'), true, 512, JSON_THROW_ON_ERROR);
    $manifesto['arquivos']['linkfora.txt'] = ['tipo' => 'text/plain; charset=utf-8'];
    file_put_contents($a->app . '/atual/manifesto.json', json_encode($manifesto, JSON_THROW_ON_ERROR));

    $r = $c->get('/linkfora.txt');
    naoContem('SEGREDO-SINTETICO-LINK', $r->corpo, 'conteúdo fora do app não pode sair');
    igual(503, $r->status, 'symlink para fora do app: 503 fechado');
    igual('', $r->corpo, 'sem corpo');
});

teste('portão: a fixture usa o layout de produção, atual é link relativo para versoes/v1 (LU-F2.4, mutante P2)', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    verdadeiro(is_link($a->app . '/atual'), 'atual precisa ser link, como em produção');
    igual('versoes/v1', readlink($a->app . '/atual'), 'destino do link');
});

teste('portão: irmão de prefixo (versoes/v1-evil) não sai por link de dentro da versão servida (LU-F2.4, mutante P3)', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    mkdir($a->app . '/versoes/v1-evil', 0700, true);
    file_put_contents($a->app . '/versoes/v1-evil/segredo.txt', 'SEGREDO-SINTETICO-IRMAO');
    symlink('../v1-evil/segredo.txt', $a->app . '/versoes/v1/irmao.txt');
    $manifesto = json_decode((string) file_get_contents($a->app . '/atual/manifesto.json'), true, 512, JSON_THROW_ON_ERROR);
    $manifesto['arquivos']['irmao.txt'] = ['tipo' => 'text/plain; charset=utf-8'];
    file_put_contents($a->app . '/atual/manifesto.json', json_encode($manifesto, JSON_THROW_ON_ERROR));

    $r = $c->get('/irmao.txt');
    igual(503, $r->status, 'irmão de prefixo: 503 fechado');
    igual('', $r->corpo, 'sem corpo');
    naoContem('SEGREDO-SINTETICO-IRMAO', $r->corpo, 'conteúdo do irmão não pode sair');
});

teste('portão: 503 em navegação traz a tela indisponível (LU-F5.2, mutação M05)', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    unlink($a->app . '/atual/manifesto.json');
    $tela = $c->get('/', PORTAO_NAVEGACAO);
    igual(503, $tela->status, 'navegação: status');
    contem('Serviço indisponível no momento', $tela->corpo, 'navegação recebe a tela indisponível');
    igual('text/html; charset=utf-8', $tela->cabecalho('content-type'), 'a tela é HTML');
});

teste('portão: 503 fora de navegação é sem corpo (LU-F5.2, mutação M05)', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    unlink($a->app . '/atual/manifesto.json');
    $fora = $c->get('/assets/app.js');
    igual(503, $fora->status, 'fora de navegação: status');
    igual('', $fora->corpo, 'fora de navegação: sem corpo');
});

teste('portão: resposta de arquivo do app traz Content-Length igual ao tamanho do corpo (LU-F5.2, mutação M32)', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    $r = $c->get('/assets/app.js');
    igual(200, $r->status, 'arquivo: status');
    igual((string) strlen($r->corpo), $r->cabecalho('content-length'), 'Content-Length igual ao corpo');
});

teste('portão: M03, diretório legível listado no manifesto dá 503 sem corpo, igual ao arquivo ausente, nunca 200 (LU-F5.2)', function (): void {
    $a = Ambiente::novo();
    $c = portaoLogado($a);
    // atual/assets é diretório legível da fixture. Sem o is_file, o portão serviria um diretório como arquivo.
    $dir = $a->app . '/atual/assets';
    verdadeiro(is_dir($dir) && is_readable($dir), 'precondição: atual/assets é diretório legível');
    $manifesto = json_decode((string) file_get_contents($a->app . '/atual/manifesto.json'), true, 512, JSON_THROW_ON_ERROR);
    $manifesto['arquivos']['assets'] = ['tipo' => 'text/plain; charset=utf-8'];
    $manifesto['arquivos']['ausente.txt'] = ['tipo' => 'text/plain; charset=utf-8'];
    file_put_contents($a->app . '/atual/manifesto.json', json_encode($manifesto, JSON_THROW_ON_ERROR));

    // Sem a checagem de arquivo, o 503 sai por acidente de runtime (Notice de readfile() virado ErrorException
    // pelo set_error_handler de inicio.php), e o corpo e o status ficam iguais aos da recusa deliberada.
    // Por isso a prova do motivo é o erros.log: a recusa deliberada (D26Indisponivel) tem de ser o registro.
    $log = $a->priv . '/erros.log';
    $antes = is_file($log) ? (string) file_get_contents($log) : '';
    $r = $c->get('/assets');
    verdadeiro(is_file($log), 'erros.log registrou a recusa do diretório');
    $novo = substr((string) file_get_contents($log), strlen($antes));
    igual(503, $r->status, 'diretório listado no manifesto: 503, nunca 200');
    igual('', $r->corpo, 'fora de navegação, sem corpo');
    contem('D26Indisponivel', $novo, 'recusa deliberada do portão, não erro de runtime');
    naoContem('ErrorException', $novo, 'não é Notice de readfile() virado exceção');

    $ausente = $c->get('/ausente.txt');
    igual(503, $ausente->status, 'referência: arquivo ausente listado no manifesto dá 503');
    igual($ausente->corpo, $r->corpo, 'diretório responde o mesmo corpo que o arquivo ausente');
});
