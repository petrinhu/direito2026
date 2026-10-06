<?php
declare(strict_types=1);

teste('roteador: SPA fallback, estático, /api inexistente é 404 (nunca o index) e nucleo negado', function (): void {
    $a = Ambiente::novo(['docroot' => 'copia']);
    $c = $a->cliente();
    $spa = $c->get('/algum/caminho/da/spa');
    igual(200, $spa->status);
    contem('<title>spa</title>', $spa->corpo, 'rota da SPA devolve o index');
    igual('estatico', $c->get('/arquivo.txt')->corpo, 'arquivo existente é servido');
    foreach (['/api/', '/api/nao-existe.php', '/api/nao-existe', '/api/nucleo/contas.php', '/api/nucleo/'] as $caminho) {
        $r = $c->get($caminho);
        igual(404, $r->status, $caminho);
        naoContem('<title>spa</title>', $r->corpo, "$caminho não cai na SPA");
    }
    igual(['ok' => true], $c->get('/api/saude.php')->json(), 'endpoint existente executa');
});

const CSP_PAGINAS = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

teste('I-3: páginas HTML (SPA e index.html) saem com os cabeçalhos de segurança e a CSP das páginas', function (): void {
    $a = Ambiente::novo(['docroot' => 'copia']);
    $c = $a->cliente();
    foreach (['/' => 'raiz', '/algum/caminho/da/spa' => 'rota da SPA', '/index.html' => 'index.html direto'] as $caminho => $nome) {
        $r = $c->get($caminho);
        igual(200, $r->status, $nome);
        igual('nosniff', $r->cabecalho('x-content-type-options'), "$nome: nosniff");
        igual('DENY', $r->cabecalho('x-frame-options'), "$nome: X-Frame-Options");
        igual('same-origin', $r->cabecalho('referrer-policy'), "$nome: Referrer-Policy");
        igual('max-age=31536000', $r->cabecalho('strict-transport-security'), "$nome: HSTS sem includeSubDomains nem preload");
    }
    igual(CSP_PAGINAS, $c->get('/')->cabecalho('content-security-policy'), 'CSP da SPA');
    igual(CSP_PAGINAS, $c->get('/algum/caminho/da/spa')->cabecalho('content-security-policy'), 'CSP da rota da SPA');
    igual(CSP_PAGINAS, $c->get('/index.html')->cabecalho('content-security-policy'), 'CSP do index.html direto');
    igual(null, $c->get('/arquivo.txt')->cabecalho('content-security-policy'), 'arquivo que não é página não leva a CSP');
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
