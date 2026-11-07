<?php
declare(strict_types=1);

teste('roteador: rota sem sessão cai na tela de entrada do portão, público sem conteúdo é servido direto, /api inexistente é 404 e nucleo negado', function (): void {
    $a = Ambiente::novo(['docroot' => 'copia']);
    $c = $a->cliente();
    $tela = $c->get('/algum/caminho/da/spa', ['Sec-Fetch-Mode' => 'navigate']);
    igual(200, $tela->status);
    contem('<form', $tela->corpo, 'rota da SPA sem sessão devolve a tela de entrada');
    naoContem('<title>spa</title>', $tela->corpo, 'nunca o index do docroot');
    $publico = Ambiente::novo();
    contem('font-size', $publico->cliente()->get('/entrada.css')->corpo, 'público sem conteúdo é servido direto');
    foreach (['/api/', '/api/nao-existe.php', '/api/nao-existe', '/api/nucleo/contas.php', '/api/nucleo/'] as $caminho) {
        $r = $c->get($caminho);
        igual(404, $r->status, $caminho);
        naoContem('<title>spa</title>', $r->corpo, "$caminho não cai na SPA");
    }
    igual(['ok' => true], $c->get('/api/saude.php')->json(), 'endpoint existente executa');
});

/** CSP das telas do portão sem sessão (seção 1.3). */
const CSP_TELA_PORTAO = "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

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

teste('C-3 (R1-C6): nem os 404 do próprio roteador de dev expõem X-Powered-By', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    foreach (['/api/nucleo/config.php', '/api/nao-existe.php', '/api/juri/nao-existe.php'] as $caminho) {
        $r = $c->get($caminho);
        igual(404, $r->status, "$caminho: status");
        igual(null, $r->cabecalho('x-powered-by'), "$caminho: sem X-Powered-By");
    }
});
