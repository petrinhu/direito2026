<?php
declare(strict_types=1);

teste('429 com segundos depois de 5 falhas livres; login certo também espera', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    for ($i = 1; $i <= 6; $i++) {
        $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'errada-errada']);
        igual(401, $r->status, "falha $i ainda é 401");
    }
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'errada-errada']);
    igual(429, $r->status, '7ª tentativa imediata');
    $j = $r->json();
    igual('aguarde', $j['erro']);
    verdadeiro(is_int($j['segundos']) && $j['segundos'] >= 1 && $j['segundos'] <= 2, 'segundos entre 1 e 2, veio ' . var_export($j['segundos'] ?? null, true));
    $certa = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    igual(429, $certa->status, 'senha certa durante o bloqueio também espera');
    sleep(3);
    igual(200, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'libera ao fim da espera');
});

teste('usuário inexistente também conta e também é bloqueado', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    for ($i = 1; $i <= 6; $i++) {
        igual(401, $c->post('/api/entrar.php', ['usuario' => 'fantasma', 'senha' => 'qualquer-coisa'])->status);
    }
    igual(429, $c->post('/api/entrar.php', ['usuario' => 'fantasma', 'senha' => 'qualquer-coisa'])->status);
});

teste('bloqueio de um usuário não bloqueia outro usuário do mesmo IP', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    for ($i = 1; $i <= 6; $i++) {
        $c->post('/api/entrar.php', ['usuario' => 'fantasma', 'senha' => 'qualquer-coisa']);
    }
    igual(200, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status);
});

teste('sucesso zera o contador de falhas do usuário+IP', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    for ($i = 0; $i < 3; $i++) {
        $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'errada-errada']);
    }
    igual(200, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status);
    for ($i = 0; $i < 5; $i++) {
        igual(401, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'errada-errada'])->status);
    }
    igual(200, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'sem zerar já estaria em 429');
});

teste('30 falhas de um IP com logins diferentes bloqueiam o IP inteiro (429)', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    for ($i = 0; $i < 30; $i++) {
        igual(401, $c->post('/api/entrar.php', ['usuario' => "alvo$i", 'senha' => 'qualquer-coisa'])->status, "falha $i");
    }
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    igual(429, $r->status, 'IP bloqueado mesmo com credencial certa');
    verdadeiro($r->json()['segundos'] > 800, 'bloqueio de ~15 min');
});

teste('X-Forwarded-For não escapa do limite por IP', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    for ($i = 0; $i < 6; $i++) {
        $c->post('/api/entrar.php', ['usuario' => 'fantasma', 'senha' => 'qualquer-coisa'], ['X-Forwarded-For' => "9.9.9.$i"]);
    }
    igual(429, $c->post('/api/entrar.php', ['usuario' => 'fantasma', 'senha' => 'qualquer-coisa'], ['X-Forwarded-For' => '8.8.8.8'])->status);
});
