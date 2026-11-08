<?php
declare(strict_types=1);

/** @return list<string> Públicos que o .htaccess serve direto, sem barra inicial (regra do grupo `- [L]`). */
function publicosDoHtaccess(): array
{
    $t = (string) file_get_contents(RAIZ_REPO . '/public/.htaccess');
    verdadeiro(preg_match('#^RewriteRule \^\(([^)]*)\)\$ - \[L\]$#m', $t, $m) === 1, 'regra dos públicos presente no .htaccess');
    return array_map(static fn (string $p): string => str_replace('\\', '', $p), explode('|', $m[1]));
}

/** @return list<string> Públicos que o roteador de dev serve direto, na mesma forma. */
function publicosDoRoteador(): array
{
    $src = (string) file_get_contents(RAIZ_REPO . '/servidor/dev/roteador.php');
    verdadeiro(preg_match('#\$publicos = \[([^\]]*)\];#', $src, $m) === 1, 'lista $publicos presente no roteador');
    preg_match_all("#'([^']+)'#", $m[1], $itens);
    return $itens[1];
}

teste('lista fechada: .htaccess e roteador de dev servem direto os mesmos públicos e usam o mesmo padrão de API', function (): void {
    $htaccess = publicosDoHtaccess();
    $roteador = publicosDoRoteador();
    sort($htaccess);
    sort($roteador);
    igual(['entrada.css', 'fontes/cormorant-garamond-700.woff2', 'fontes/inter-400.woff2', 'icones/favicon.svg', 'robots.txt', 'sw.js'], $htaccess, 'públicos do .htaccess');
    igual($htaccess, $roteador, 'públicos: .htaccess e roteador');
    $t = (string) file_get_contents(RAIZ_REPO . '/public/.htaccess');
    $src = (string) file_get_contents(RAIZ_REPO . '/servidor/dev/roteador.php');
    verdadeiro(preg_match('#^RewriteRule (\^api/[^ ]+) - \[L\]$#m', $t, $a) === 1, 'padrão de API do .htaccess');
    verdadeiro(preg_match("#\\\$padraoApi = '([^']+)';#", $src, $b) === 1, 'padrão de API do roteador');
    igual($a[1], $b[1], 'mesmo padrão de API nos dois');
}, false);

teste('roteador: rota sem sessão cai na tela de entrada do portão, público sem conteúdo é servido direto, /api inexistente é 404 e nucleo é 403', function (): void {
    $a = Ambiente::novo(['docroot' => 'copia']);
    $c = $a->cliente();
    $tela = $c->get('/algum/caminho/da/spa', ['Sec-Fetch-Mode' => 'navigate']);
    igual(200, $tela->status);
    contem('<form', $tela->corpo, 'rota da SPA sem sessão devolve a tela de entrada');
    naoContem('<title>spa</title>', $tela->corpo, 'nunca o index do docroot');
    $publico = Ambiente::novo();
    contem('font-size', $publico->cliente()->get('/entrada.css')->corpo, 'público sem conteúdo é servido direto');
    foreach (['/api/', '/api/nao-existe.php', '/api/nao-existe', '/api/nucleo-x.php', '/api/nucleo.php'] as $caminho) {
        $r = $c->get($caminho);
        igual(404, $r->status, $caminho);
        naoContem('<title>spa</title>', $r->corpo, "$caminho não cai na SPA");
    }
    foreach (['/api/nucleo', '/api/nucleo/', '/api/nucleo/contas.php'] as $caminho) {
        igual(403, $c->get($caminho)->status, "$caminho: negado como o .htaccess ([F,L])");
    }
    igual(['ok' => true], $c->get('/api/saude.php')->json(), 'endpoint existente executa');
});

teste('roteador: público presente sai direto; público ausente é 404 e não cai no portão; o resto passa pelo portão', function (): void {
    $c = Ambiente::novo()->cliente();
    $robots = $c->get('/robots.txt');
    igual(200, $robots->status, 'robots.txt direto');
    contem('User-agent', $robots->corpo, 'corpo do robots.txt');
    igual(200, $c->get('/icones/favicon.svg')->status, 'favicon direto');
    igual(401, $c->get('/manifest.webmanifest')->status, 'manifesto não é público: vai ao portão, anônimo 401');
    igual(401, $c->get('/assets/busca-indice.json')->status, 'índice de busca vai ao portão, anônimo 401');
    $copia = Ambiente::novo(['docroot' => 'copia'])->cliente();
    foreach (['/robots.txt', '/sw.js', '/entrada.css', '/icones/favicon.svg', '/fontes/inter-400.woff2', '/fontes/cormorant-garamond-700.woff2'] as $caminho) {
        igual(404, $copia->get($caminho)->status, "$caminho ausente: 404 do roteador, sem portão");
    }
});

/** CSP das telas do portão sem sessão (seção 1.3). */
const CSP_TELA_PORTAO = "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

teste('I-3: a tela de entrada sai com os cabeçalhos de segurança e a CSP da tela; arquivo fora da navegação não sai', function (): void {
    $a = Ambiente::novo(['docroot' => 'copia']);
    $c = $a->cliente();
    foreach (['/' => 'raiz', '/algum/caminho/da/spa' => 'rota da SPA', '/index.html' => 'index.html direto'] as $caminho => $nome) {
        $r = $c->get($caminho, ['Sec-Fetch-Mode' => 'navigate']);
        igual(200, $r->status, $nome);
        igual('nosniff', $r->cabecalho('x-content-type-options'), "$nome: nosniff");
        igual('DENY', $r->cabecalho('x-frame-options'), "$nome: X-Frame-Options");
        igual('same-origin', $r->cabecalho('referrer-policy'), "$nome: Referrer-Policy");
        igual('max-age=31536000', $r->cabecalho('strict-transport-security'), "$nome: HSTS sem includeSubDomains nem preload");
        igual(CSP_TELA_PORTAO, $r->cabecalho('content-security-policy'), "$nome: CSP da tela");
    }
    igual(401, $c->get('/arquivo.txt')->status, 'fora da navegação, o arquivo não sai sem sessão');
});

teste('I-3: a CSP restrita da API não é sobrescrita pela das páginas', function (): void {
    $a = Ambiente::novo(['docroot' => 'copia']);
    $r = $a->cliente()->get('/api/saude.php');
    igual("default-src 'none'; frame-ancestors 'none'", $r->cabecalho('content-security-policy'));
    igual(1, count($r->cabecalhos['content-security-policy'] ?? []), 'uma única CSP na API');
});

teste('C-3: nenhuma resposta da API expõe X-Powered-By', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    foreach (['/api/saude.php', '/api/sessao.php', '/api/conteudo.php'] as $caminho) {
        igual(null, $c->get($caminho)->cabecalho('x-powered-by'), $caminho);
    }
    igual(null, $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'])->cabecalho('x-powered-by'), 'erro 401');
    igual(null, $c->get('/api/entrar.php')->cabecalho('x-powered-by'), 'erro 405');
});

teste('C-3 (R1-C6): nem os 404 nem os 403 do próprio roteador de dev expõem X-Powered-By', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    foreach (['/api/nao-existe.php' => 404, '/api/juri/nao-existe.php' => 404, '/api/nucleo/config.php' => 403] as $caminho => $status) {
        $r = $c->get($caminho);
        igual($status, $r->status, "$caminho: status");
        igual(null, $r->cabecalho('x-powered-by'), "$caminho: sem X-Powered-By");
    }
});
