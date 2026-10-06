<?php
declare(strict_types=1);

teste('POST sem X-CSRF-Token: 403 csrf', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN], ['X-CSRF-Token' => null]);
    igual(403, $r->status);
    igual('csrf', $r->json()['erro']);
    igual(false, $c->get('/api/sessao.php')->json()['autenticado'], 'não entrou');
});

teste('POST com token errado ou vazio: 403', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    foreach (['errado', '', str_repeat('a', 64)] as $t) {
        igual(403, $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['X-CSRF-Token' => $t])->status, "token '$t'");
    }
});

teste('token de OUTRA sessão não vale', function (): void {
    $a = Ambiente::novo();
    $c1 = $a->clienteComSessao();
    $c2 = $a->clienteComSessao();
    igual(403, $c1->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['X-CSRF-Token' => (string) $c2->csrf])->status);
});

teste('POST sem sessão (sem cookie) é recusado mesmo com token plausível', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    igual(403, $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['X-CSRF-Token' => str_repeat('a', 64)])->status);
});

teste('Origin estranho ou "null": 403 origem', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    foreach (['http://evil.example', 'null', 'http://127.0.0.1:1', 'https://' . parse_url($a->base, PHP_URL_HOST) . ':' . $a->porta] as $o) {
        $r = $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['Origin' => $o]);
        igual(403, $r->status, "Origin $o");
        igual('origem', $r->json()['erro'], "Origin $o");
    }
});

teste('Origin próprio ou ausente passa; Sec-Fetch-Site cross-site/same-site recusa, same-origin passa', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    igual(401, $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['Origin' => $a->base])->status, 'Origin próprio');
    igual(401, $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['Origin' => null])->status, 'sem Origin');
    igual(403, $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['Sec-Fetch-Site' => 'cross-site'])->status);
    igual(403, $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['Sec-Fetch-Site' => 'same-site'])->status);
    igual(401, $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['Sec-Fetch-Site' => 'same-origin'])->status);
});

teste('Content-Type diferente de application/json é recusado (400), inclusive form e text/plain', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $corpo = '{"usuario":"x","senha":"y"}';
    foreach (['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=x', 'application/jsonx'] as $tipo) {
        $r = $c->post('/api/entrar.php', $corpo, ['Content-Type' => $tipo]);
        igual(400, $r->status, $tipo);
        igual('tipo-conteudo', $r->json()['erro'], $tipo);
    }
    igual(401, $c->post('/api/entrar.php', $corpo, ['Content-Type' => 'application/json; charset=utf-8'])->status, 'charset é aceito');
    igual(401, $c->post('/api/entrar.php', $corpo, ['Content-Type' => 'Application/JSON'])->status, 'caixa do tipo é irrelevante');
});

teste('método errado: 405 com Allow, em todos os endpoints', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    $casos = [
        ['POST', '/api/saude.php', 'GET'],
        ['POST', '/api/sessao.php', 'GET'],
        ['GET', '/api/entrar.php', 'POST'],
        ['GET', '/api/sair.php', 'POST'],
        ['GET', '/api/trocar-senha.php', 'POST'],
        ['POST', '/api/conteudo.php', 'GET'],
        ['DELETE', '/api/usuarios.php', 'GET, POST'],
        ['PUT', '/api/entrar.php', 'POST'],
    ];
    foreach ($casos as [$metodo, $caminho, $allow]) {
        $r = $c->enviar($metodo, $caminho, $metodo === 'GET' ? null : [], ['Content-Type' => 'application/json', 'X-CSRF-Token' => (string) $c->csrf]);
        igual(405, $r->status, "$metodo $caminho");
        igual($allow, $r->cabecalho('allow'), "Allow de $caminho");
        igual('metodo', $r->json()['erro'], "$metodo $caminho");
    }
});
