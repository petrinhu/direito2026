<?php
declare(strict_types=1);

const CONTEUDO_FIXTURE = '{"versao":1,"meta":{"titulo":"T","subtitulo":"S","descricao":"D"},"resumo":[],"mapa":{"rotulo":"R"},"quiz":[]}';

/** Admin cria o usuário comum e devolve o cliente já logado nele (com troca obrigatória). */
function criarEEntrar(Ambiente $a, string $login = 'aluno1', string $senha = 'ProvisoriaAluno1'): Cliente
{
    $admin = $a->entrar();
    $r = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => $login, 'senhaProvisoria' => $senha]);
    igual(200, $r->status, 'admin cria o usuário');
    return $a->entrar($login, $senha);
}

teste('troca obrigatória: conteudo.php responde 403 até trocar a senha', function (): void {
    $a = Ambiente::novo();
    $a->semearConteudo(CONTEUDO_FIXTURE);
    $c = criarEEntrar($a);
    $s = $c->get('/api/sessao.php')->json();
    igual(true, $s['deveTrocarSenha']);
    $r = $c->get('/api/conteudo.php');
    igual(403, $r->status);
    igual('troca-obrigatoria', $r->json()['erro']);
    naoContem('"versao":1', $r->corpo, 'conteúdo não vaza antes da troca');
});

teste('troca obrigatória: admin com a senha provisória também fica sem usuarios.php até trocar', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = $a->entrar();
    $r = $c->get('/api/usuarios.php');
    igual(403, $r->status);
    igual('troca-obrigatoria', $r->json()['erro']);
});

teste('trocar-senha: senha atual errada dá 401 senha-atual e a senha não muda', function (): void {
    $a = Ambiente::novo();
    $c = criarEEntrar($a);
    $r = $c->post('/api/trocar-senha.php', ['senhaAtual' => 'nao-e-essa-aqui', 'senhaNova' => 'NovaSenhaForte99']);
    igual(401, $r->status);
    igual('senha-atual', $r->json()['erro']);
    $a->zerarTentativas();
    igual(200, $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'aluno1', 'senha' => 'ProvisoriaAluno1'])->status, 'senha antiga segue valendo');
});

teste('trocar-senha: regras de senha nova (400 senha-fraca com mensagem)', function (): void {
    $a = Ambiente::novo();
    $c = criarEEntrar($a);
    $casos = [
        'curta (9)' => '123456789',
        'longa (129)' => str_repeat('x', 129),
        'igual ao login' => 'aluno1',
        'igual à provisória/atual' => 'ProvisoriaAluno1',
        '9 caracteres de 2 bytes' => str_repeat('ç', 9),
    ];
    foreach ($casos as $nome => $nova) {
        $r = $c->post('/api/trocar-senha.php', ['senhaAtual' => 'ProvisoriaAluno1', 'senhaNova' => $nova]);
        igual(400, $r->status, $nome);
        igual('senha-fraca', $r->json()['erro'], $nome);
        verdadeiro(is_string($r->json()['mensagem']) && $r->json()['mensagem'] !== '', "mensagem em $nome");
    }
    igual(200, $c->post('/api/trocar-senha.php', ['senhaAtual' => 'ProvisoriaAluno1', 'senhaNova' => str_repeat('ç', 10)])->status, '10 caracteres de 2 bytes valem');
});

teste('trocar-senha: sucesso regenera o id, libera o conteúdo e invalida a senha antiga', function (): void {
    $a = Ambiente::novo();
    $a->semearConteudo(CONTEUDO_FIXTURE);
    $c = criarEEntrar($a);
    $idAntes = $c->cookies['__Host-d26'];
    $csrfAntes = $c->csrf;
    $r = $c->post('/api/trocar-senha.php', ['senhaAtual' => 'ProvisoriaAluno1', 'senhaNova' => 'NovaSenhaForte99']);
    igual(200, $r->status);
    verdadeiro(is_string($r->json()['csrf']) && $r->json()['csrf'] !== $csrfAntes, 'csrf novo');
    verdadeiro($c->cookies['__Host-d26'] !== $idAntes, 'id de sessão novo');
    $s = $c->get('/api/sessao.php')->json();
    igual(true, $s['autenticado'], 'segue autenticado');
    igual(false, $s['deveTrocarSenha']);
    igual(200, $c->get('/api/conteudo.php')->status, 'conteúdo liberado');

    $velho = $a->cliente();
    $velho->cookies['__Host-d26'] = $idAntes;
    igual(false, $velho->get('/api/sessao.php')->json()['autenticado'], 'id antigo morto');

    $a->zerarTentativas();
    igual(401, $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'aluno1', 'senha' => 'ProvisoriaAluno1'])->status, 'provisória não entra mais');
    $novo = $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'aluno1', 'senha' => 'NovaSenhaForte99']);
    igual(200, $novo->status);
    igual(false, $novo->json()['deveTrocarSenha']);
});

teste('trocar-senha: sem sessão é 401; sessões antigas do mesmo usuário caem (versaoSessao)', function (): void {
    $a = Ambiente::novo();
    igual(401, $a->clienteComSessao()->post('/api/trocar-senha.php', ['senhaAtual' => 'a', 'senhaNova' => 'b'])->status);
    $c1 = criarEEntrar($a);
    $c2 = $a->entrar('aluno1', 'ProvisoriaAluno1');
    igual(200, $c1->post('/api/trocar-senha.php', ['senhaAtual' => 'ProvisoriaAluno1', 'senhaNova' => 'NovaSenhaForte99'])->status);
    igual(false, $c2->get('/api/sessao.php')->json()['autenticado'], 'a outra sessão do mesmo usuário caiu');
});

teste('conteudo.php: sem sessão é 401 e não devolve conteúdo', function (): void {
    $a = Ambiente::novo();
    $a->semearConteudo(CONTEUDO_FIXTURE);
    $r = $a->cliente()->get('/api/conteudo.php');
    igual(401, $r->status);
    igual('sem-sessao', $r->json()['erro']);
    $r2 = $a->clienteComSessao()->get('/api/conteudo.php');
    igual(401, $r2->status, 'sessão anônima também é 401');
});

teste('conteudo.php: autenticado e sem troca pendente recebe o conteúdo do arquivo fixo', function (): void {
    $a = Ambiente::novo();
    $a->semearConteudo(CONTEUDO_FIXTURE);
    $r = $a->entrar()->get('/api/conteudo.php');
    igual(200, $r->status);
    $j = $r->json();
    igual(true, $j['ok']);
    igual('T', $j['conteudo']['meta']['titulo']);
    igual(1, $j['conteudo']['versao']);
});

teste('conteudo.php: ignora parâmetros de nome de arquivo (sem path traversal)', function (): void {
    $a = Ambiente::novo();
    $a->semearConteudo(CONTEUDO_FIXTURE);
    file_put_contents($a->priv . '/usuarios.json.bak', 'SEGREDO-DE-TESTE');
    $c = $a->entrar();
    foreach (['?arquivo=../usuarios.json', '?f=usuarios.json', '?nome=../../etc/passwd', '/../usuarios.json'] as $q) {
        $r = $c->get('/api/conteudo.php' . $q);
        naoContem('argon2', $r->corpo, $q);
        naoContem('SEGREDO-DE-TESTE', $r->corpo, $q);
        naoContem('root:', $r->corpo, $q);
    }
});

teste('conteudo.php: arquivo ausente dá 500 genérico sem caminho, e o detalhe vai ao erros.log privado', function (): void {
    $a = Ambiente::novo();
    $r = $a->entrar()->get('/api/conteudo.php');
    igual(500, $r->status);
    igual(false, $r->json()['ok']);
    naoContem($a->raiz, $r->corpo, 'caminho no corpo');
    naoContem('/var/', $r->corpo, 'caminho no corpo');
    naoContem('.json', $r->corpo, 'nome de arquivo no corpo');
    $log = $a->priv . '/erros.log';
    verdadeiro(is_file($log) && filesize($log) > 0, 'erros.log registrou');
    igual(0600, fileperms($log) & 0777, 'erros.log em 600');
});
