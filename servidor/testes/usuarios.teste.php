<?php
declare(strict_types=1);

teste('usuarios.php: sem sessão 401; usuário comum 403 nao-admin (GET e POST)', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('comum1', 'SenhaComum12345', false, false);
    igual(401, $a->cliente()->get('/api/usuarios.php')->status);
    $c = $a->entrar('comum1', 'SenhaComum12345');
    $g = $c->get('/api/usuarios.php');
    igual(403, $g->status);
    igual('nao-admin', $g->json()['erro']);
    $p = $c->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'intruso1']);
    igual(403, $p->status);
    igual('nao-admin', $p->json()['erro']);
    $logins = array_column($a->lerUsuarios()['usuarios'], 'usuario');
    igual(false, in_array('intruso1', $logins, true), 'nada foi criado');
});

teste('usuarios.php: admin lista sem NUNCA expor o hash', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('comum1', 'SenhaComum12345', false, true);
    $r = $a->entrar()->get('/api/usuarios.php');
    igual(200, $r->status);
    naoContem('argon2', $r->corpo);
    naoContem('hash', $r->corpo);
    $lista = $r->json()['usuarios'];
    igual(2, count($lista));
    igual(['usuario', 'admin', 'ativo', 'deveTrocarSenha', 'criadoEm', 'ultimoLogin'], array_keys($lista[0]), 'campos exatos');
});

teste('admin cria usuário com senha informada: nasce com troca obrigatória', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $r = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana.silva', 'senhaProvisoria' => 'Provisoria-Ana1']);
    igual(200, $r->status);
    igual('Provisoria-Ana1', $r->json()['senhaProvisoria']);
    $e = $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'ana.silva', 'senha' => 'Provisoria-Ana1']);
    igual(200, $e->status);
    igual(true, $e->json()['deveTrocarSenha']);
    igual(false, $e->json()['admin'], 'criar nunca concede admin');
});

teste('admin cria usuário sem senha: servidor gera 12 caracteres sem ambíguos, exibidos uma vez', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $r = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia']);
    igual(200, $r->status);
    $senha = $r->json()['senhaProvisoria'];
    verdadeiro(is_string($senha) && preg_match('/^[A-HJ-NP-Za-km-z2-9]{12}$/D', $senha) === 1, 'formato da senha gerada');
    $outra = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'caio'])->json()['senhaProvisoria'];
    verdadeiro($senha !== $outra, 'senhas geradas diferem');
    naoContem($senha, $admin->get('/api/usuarios.php')->corpo, 'listagem não repete a senha');
    igual(200, $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'bia', 'senha' => $senha])->status);
});

teste('criar: login duplicado 409; login inválido 400; "Chefe" é diferente de "chefe"', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $dup = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => Ambiente::LOGIN_ADMIN]);
    igual(409, $dup->status);
    igual('existe', $dup->json()['erro']);
    foreach (['ab', 'com espaço', 'açúcar', str_repeat('a', 33), "abc\n", ''] as $ruim) {
        $r = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => $ruim]);
        igual(400, $r->status, json_encode($ruim));
        igual('login-invalido', $r->json()['erro']);
    }
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'Chefe'])->status, 'caixa diferente é outro login');
});

teste('criar: senha provisória vazia ou acima de 128 é 400', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(400, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'dani', 'senhaProvisoria' => ''])->status);
    igual(400, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'dani', 'senhaProvisoria' => str_repeat('x', 129)])->status);
});

teste('acao desconhecida ou usuário-alvo inexistente: 400', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(400, $admin->post('/api/usuarios.php', ['acao' => 'virar-admin', 'usuario' => 'x'])->status);
    igual(400, $admin->post('/api/usuarios.php', ['usuario' => 'x'])->status);
    foreach (['redefinir', 'ativar', 'desativar', 'excluir'] as $acao) {
        $r = $admin->post('/api/usuarios.php', ['acao' => $acao, 'usuario' => 'ninguem']);
        igual(400, $r->status, $acao);
        igual('nao-encontrado', $r->json()['erro'], $acao);
    }
});

teste('redefinir: senha antiga morre, nova provisória entra com troca obrigatória e sessão antiga cai', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('eva', 'SenhaDaEva12345', false, false);
    $eva = $a->entrar('eva', 'SenhaDaEva12345');
    igual(true, $eva->get('/api/sessao.php')->json()['autenticado']);
    $admin = $a->entrar();
    $r = $admin->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'eva']);
    igual(200, $r->status);
    $nova = $r->json()['senhaProvisoria'];
    verdadeiro(is_string($nova) && strlen($nova) === 12, 'gerou 12 caracteres');
    igual(false, $eva->get('/api/sessao.php')->json()['autenticado'], 'sessão antiga caiu');
    $a->zerarTentativas();
    igual(401, $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'eva', 'senha' => 'SenhaDaEva12345'])->status);
    $e = $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'eva', 'senha' => $nova]);
    igual(200, $e->status);
    igual(true, $e->json()['deveTrocarSenha']);
});

teste('desativar: não entra mais, sessão antiga cai; ativar devolve o acesso', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('fabio', 'SenhaDoFabio1234', false, false);
    $fabio = $a->entrar('fabio', 'SenhaDoFabio1234');
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => 'fabio'])->status);
    igual(false, $fabio->get('/api/sessao.php')->json()['autenticado'], 'sessão do desativado caiu');
    $r = $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'fabio', 'senha' => 'SenhaDoFabio1234']);
    igual(401, $r->status, 'desativado não entra');
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'ativar', 'usuario' => 'fabio'])->status);
    $a->zerarTentativas();
    igual(200, $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'fabio', 'senha' => 'SenhaDoFabio1234'])->status, 'reativado entra');
});

teste('excluir: some da lista, não entra e a sessão antiga cai', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('gina', 'SenhaDaGina12345', false, false);
    $gina = $a->entrar('gina', 'SenhaDaGina12345');
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'excluir', 'usuario' => 'gina'])->status);
    igual(['chefe'], array_column($admin->get('/api/usuarios.php')->json()['usuarios'], 'usuario'));
    igual(false, $gina->get('/api/sessao.php')->json()['autenticado']);
    igual(401, $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'gina', 'senha' => 'SenhaDaGina12345'])->status);
});

teste('ações do admin sobre si mesmo: 409 em redefinir, ativar, desativar e excluir', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    foreach (['redefinir', 'ativar', 'desativar', 'excluir'] as $acao) {
        $r = $admin->post('/api/usuarios.php', ['acao' => $acao, 'usuario' => Ambiente::LOGIN_ADMIN]);
        igual(409, $r->status, $acao);
        igual('si-mesmo', $r->json()['erro'], $acao);
    }
    $u = $a->lerUsuarios()['usuarios'][0];
    igual(true, $u['ativo']);
    igual(Ambiente::LOGIN_ADMIN, $u['usuario']);
    igual(200, $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'a senha do admin não mudou');
});

teste('não existe ação de conceder admin: campo admin no corpo é ignorado', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'hugo', 'admin' => true, 'senhaProvisoria' => 'Provisoria-Hugo1']);
    $hugo = array_values(array_filter($a->lerUsuarios()['usuarios'], static fn (array $u): bool => $u['usuario'] === 'hugo'))[0];
    igual(false, $hugo['admin']);
});
