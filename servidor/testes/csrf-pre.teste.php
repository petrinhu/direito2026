<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

teste('csrf pré-login: 50 GETs anônimos não criam nenhum arquivo em sessoes/', function (): void {
    $a = Ambiente::novo();
    for ($i = 0; $i < 50; $i++) {
        igual(200, $a->cliente()->get('/api/sessao.php')->status);
    }
    $c = $a->cliente();
    for ($i = 0; $i < 5; $i++) {
        $c->get('/api/sessao.php');
    }
    igual([], glob($a->priv . '/sessoes/*') ?: [], 'sessoes/ continua vazia');
});

teste('csrf pré-login: GET anônimo emite __Host-d26pre (Secure, HttpOnly, SameSite=Strict, path=/) e não o cookie de sessão', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $c->get('/api/sessao.php');
    igual(1, count($c->ultimoSetCookie), 'um Set-Cookie');
    $sc = $c->ultimoSetCookie[0];
    verdadeiro(str_starts_with($sc, '__Host-d26pre='), "nome em $sc");
    foreach (['Secure', 'HttpOnly', 'SameSite=Strict', 'path=/'] as $attr) {
        verdadeiro(stripos($sc, $attr) !== false, "atributo $attr em: $sc");
    }
    foreach (['domain=', 'expires=', 'max-age='] as $attr) {
        verdadeiro(stripos($sc, $attr) === false, "sem $attr em: $sc");
    }
    verdadeiro(!isset($c->cookies['__Host-d26']), 'sem cookie de sessão');
});

teste('csrf pré-login: o mesmo cookie dá o mesmo token; outro cookie, outro token', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $c->get('/api/sessao.php');
    $t1 = $c->csrf;
    $c->get('/api/sessao.php');
    igual($t1, $c->csrf, 'estável com o mesmo cookie');
    igual(1, count(array_filter(array_keys($c->cookies), static fn (string $n): bool => $n === '__Host-d26pre')), 'um cookie pré');
    verdadeiro($a->cliente()->get('/api/sessao.php')->json()['csrf'] !== $t1, 'cliente novo, token novo');
});

teste('csrf pré-login: login sem o cookie pré, com token forjado ou com token de outro cliente é 403 csrf', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $semCookie = $a->cliente();
    $semCookie->csrf = $c->csrf;
    $r = $semCookie->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    igual(403, $r->status, 'sem cookie pré');
    igual('csrf', $r->json()['erro']);

    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN], ['X-CSRF-Token' => str_repeat('a', 64)]);
    igual(403, $r->status, 'token forjado');

    $outro = $a->clienteComSessao();
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN], ['X-CSRF-Token' => (string) $outro->csrf]);
    igual(403, $r->status, 'token de outro cliente');

    $forjado = $a->cliente();
    $forjado->cookies['__Host-d26pre'] = str_repeat('0', 32);
    $forjado->csrf = hash('sha256', 'palpite');
    igual(403, $forjado->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'nonce escolhido pelo atacante, token chutado');
    igual([], glob($a->priv . '/sessoes/*') ?: [], 'nenhuma recusa criou sessão');
    igual(0, count($a->verificacoes()), 'recusa de csrf não gasta Argon2id');
});

teste('csrf pré-login: login certo cria a sessão só agora, com id novo e csrf novo; sessões em disco só de quem entrou', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $pre = $c->csrf;
    igual([], glob($a->priv . '/sessoes/*') ?: [], 'antes do login, nada em disco');
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    igual(200, $r->status);
    verdadeiro(isset($c->cookies['__Host-d26']), 'cookie de sessão emitido');
    verdadeiro($r->json()['csrf'] !== $pre, 'csrf da sessão é outro');
    igual(1, count(glob($a->priv . '/sessoes/sess_*') ?: []), 'uma sessão em disco');
    igual(true, $c->get('/api/sessao.php')->json()['autenticado']);
    $c->post('/api/sair.php');
    $s = $c->get('/api/sessao.php')->json();
    igual(false, $s['autenticado']);
    igual([], glob($a->priv . '/sessoes/*') ?: [], 'sair apaga a sessão e a visita seguinte não cria outra');
});

teste('csrf pré-login: cookie de sessão que não existe em disco é descartado sem criar arquivo', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $c->cookies['__Host-d26'] = 'idforjadoporatacante0123456789abcdef';
    $c->get('/api/sessao.php');
    igual([], glob($a->priv . '/sessoes/*') ?: [], 'nada criado');
    verdadeiro(!isset($c->cookies['__Host-d26']), 'cookie velho expirado pelo servidor');
});

teste('segredo: criado sob demanda com 600, estável, e o token é HMAC do nonce', function (): void {
    $priv = dirTemporario() . '/privado';
    mkdir($priv, 0700, true);
    $s1 = d26_segredo($priv);
    igual(0600, fileperms($priv . '/segredo.key') & 0777, 'segredo.key 600');
    verdadeiro(strlen($s1) >= 32, 'segredo com pelo menos 32 bytes');
    igual($s1, d26_segredo($priv), 'estável');
    $nonce = str_repeat('ab', 16);
    igual(hash_hmac('sha256', 'pre|' . $nonce, $s1), d26_csrf_pre_token($nonce, $s1));
    verdadeiro(d26_csrf_pre_token($nonce, $s1) !== d26_csrf_pre_token(str_repeat('cd', 16), $s1), 'nonce diferente, token diferente');
    file_put_contents($priv . '/segredo.key', 'curto');
    $recusou = false;
    try {
        d26_segredo($priv);
    } catch (RuntimeException) {
        $recusou = true;
    }
    verdadeiro($recusou, 'segredo corrompido é erro, nunca fallback fraco');
    apagarArvore(dirname($priv));
}, false);
