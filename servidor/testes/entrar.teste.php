<?php
declare(strict_types=1);

teste('login certo: 200, sessão autenticada e csrf novo', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $csrfAntes = $c->csrf;
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    igual(200, $r->status);
    $j = $r->json();
    igual(true, $j['ok']);
    igual(Ambiente::LOGIN_ADMIN, $j['usuario']);
    igual(true, $j['admin']);
    igual(false, $j['deveTrocarSenha']);
    verdadeiro(is_string($j['csrf']) && $j['csrf'] !== $csrfAntes, 'csrf renovado no login');
    $s = $c->get('/api/sessao.php')->json();
    igual(true, $s['autenticado']);
    igual(Ambiente::LOGIN_ADMIN, $s['usuario']);
    igual(true, $s['admin']);
});

teste('login regenera o id de sessão e o id antigo deixa de valer (fixação)', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    $antigo = $c->cookies['__Host-d26'] ?? '';
    verdadeiro(preg_match('/^[A-Za-z0-9,-]{22,128}$/D', $antigo) === 1, 'o login criou a sessão');
    igual(200, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'novo login com sessão ativa');
    verdadeiro(($c->cookies['__Host-d26'] ?? '') !== $antigo, 'id mudou');
    $atacante = $a->cliente();
    $atacante->cookies['__Host-d26'] = $antigo;
    igual(false, $atacante->get('/api/sessao.php')->json()['autenticado'], 'id antigo não autentica');
});

teste('senha errada: 401 credenciais com mensagem genérica', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'errada-errada']);
    igual(401, $r->status);
    $j = $r->json();
    igual(false, $j['ok']);
    igual('credenciais', $j['erro']);
    verdadeiro(is_string($j['mensagem']) && $j['mensagem'] !== '', 'mensagem em pt-br presente');
    igual(false, $c->get('/api/sessao.php')->json()['autenticado']);
});

teste('login é case-sensitive', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    igual(401, $c->post('/api/entrar.php', ['usuario' => 'Chefe', 'senha' => Ambiente::SENHA_ADMIN])->status, 'login com maiúscula');
    igual(401, $c->post('/api/entrar.php', ['usuario' => 'CHEFE', 'senha' => Ambiente::SENHA_ADMIN])->status, 'login em caixa alta');
});

teste('senha é case-sensitive', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    igual(401, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => strtolower(Ambiente::SENHA_ADMIN)])->status);
    igual(401, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => strtoupper(Ambiente::SENHA_ADMIN)])->status);
});

teste('usuário inexistente, senha errada e login malformado dão a MESMA resposta', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $existenteErrada = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'senha-errada-1']);
    $inexistente = $c->post('/api/entrar.php', ['usuario' => 'ninguem', 'senha' => 'senha-errada-1']);
    $malformado = $c->post('/api/entrar.php', ['usuario' => "a b\n", 'senha' => 'senha-errada-1']);
    igual(401, $inexistente->status);
    igual($existenteErrada->corpo, $inexistente->corpo, 'corpo idêntico');
    igual($existenteErrada->corpo, $malformado->corpo, 'corpo idêntico para login malformado');
    igual($existenteErrada->cabecalho('content-length'), $inexistente->cabecalho('content-length'));
});

teste('usuário inexistente leva tempo comparável ao de senha errada (sem atalho de tempo)', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $medir = static function (string $usuario) use ($c): float {
        $t = microtime(true);
        $c->post('/api/entrar.php', ['usuario' => $usuario, 'senha' => 'senha-errada-1']);
        return microtime(true) - $t;
    };
    $existente = $medir(Ambiente::LOGIN_ADMIN);
    $inexistente = $medir('fantasma');
    // Se pulasse o Argon2id, o inexistente levaria poucos ms contra ~150 ms do existente.
    verdadeiro($inexistente > $existente * 0.5, sprintf('inexistente %.3fs vs existente %.3fs', $inexistente, $existente));
});

teste('corpo com campos ausentes ou de tipo errado: 400, nunca 500', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    foreach ([[], ['usuario' => 'x'], ['usuario' => ['a'], 'senha' => 'b'], ['usuario' => 'x', 'senha' => 12345]] as $corpo) {
        $r = $c->post('/api/entrar.php', $corpo);
        igual(400, $r->status, json_encode($corpo));
        igual('invalido', $r->json()['erro']);
    }
    igual(400, $c->post('/api/entrar.php', '{quebrado')->status, 'JSON quebrado');
    igual(400, $c->post('/api/entrar.php', '[1,2]')->status, 'JSON que não é objeto');
});

teste('desativado não entra', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('inativo1', 'SenhaInativa123', false, false, false);
    $c = $a->clienteComSessao();
    $r = $c->post('/api/entrar.php', ['usuario' => 'inativo1', 'senha' => 'SenhaInativa123']);
    igual(401, $r->status);
    igual('credenciais', $r->json()['erro'], 'mesma resposta de credenciais inválidas');
});

teste('ultimoLogin é gravado no login bem-sucedido', function (): void {
    $a = Ambiente::novo();
    $a->entrar();
    $u = $a->lerUsuarios()['usuarios'][0];
    verdadeiro(is_string($u['ultimoLogin']) && strtotime($u['ultimoLogin']) > time() - 60, 'ultimoLogin recente');
});
