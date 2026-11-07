<?php
declare(strict_types=1);

/**
 * Teto de 128 caracteres para a senha que se CONFERE (revisão de segurança, achado X9; LU-F2.4 e
 * LU-F2.5). Senha acima do teto nunca gasta Argon2id: é recusada antes do hash, com a mesma frase,
 * o mesmo status e o mesmo erro de senha errada, para login e para a senha atual da troca. Nenhuma
 * conta real pode ter senha acima de 128 (CLI, troca e redefinição recusam). Prova por contagem de
 * verificações, nunca por relógio. Sintético: senhas 'x' geradas aqui, nenhuma conta real.
 */

/** Senha sintética de $n caracteres; 'x' não coincide com nenhuma senha de teste. */
function tetoSenha(int $n): string
{
    return str_repeat('x', $n);
}

teste('login: senha de 129 caracteres no formulário é 401 com a frase e não gasta Argon2id', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    $r = acessoEnviar($c, $token, '/', Ambiente::LOGIN_ADMIN, tetoSenha(129));
    igual(401, $r->status, 'status');
    contem(ACESSO_FRASE, $r->corpo, 'a mesma frase da senha errada');
    igual(0, count($a->verificacoes()), 'nenhuma verificação de Argon2id');
});

teste('login: senha de 100 KB no formulário é 401 com a frase, sem Argon2id e sem erro de servidor', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    $r = acessoEnviar($c, $token, '/', Ambiente::LOGIN_ADMIN, tetoSenha(100000));
    igual(401, $r->status, 'status');
    contem(ACESSO_FRASE, $r->corpo, 'frase');
    igual(0, count($a->verificacoes()), 'nenhuma verificação de Argon2id');
});

teste('login: senha de exatamente 128 caracteres ainda é conferida (o teto não é mais apertado que o limite)', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    igual(401, acessoEnviar($c, $token, '/', Ambiente::LOGIN_ADMIN, tetoSenha(128))->status, 'senha errada de 128: 401');
    igual(1, count($a->verificacoes()), 'uma verificação: o caso de 128 chegou ao hash');
});

teste('login JSON: senha de 129 caracteres é 401 credenciais com a frase, sem Argon2id', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => tetoSenha(129)]);
    igual(401, $r->status, 'status');
    igual('credenciais', $r->json()['erro'], 'erro');
    igual(ACESSO_FRASE, $r->json()['mensagem'], 'mensagem: a frase do líder');
    igual(0, count($a->verificacoes()), 'nenhuma verificação de Argon2id');
});

teste('troca: senha atual de 129 caracteres é "A senha atual não confere." sem Argon2id', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = trocaTelaEntrar($a);
    $token = acessoCampo($c->get('/', PORTAO_NAVEGACAO)->corpo, 'csrf');
    $antes = count($a->verificacoes());
    $r = cfEnviarFormulario($c, '/api/troca.php', [
        'senhaAtual' => tetoSenha(129),
        'senhaNova' => TROCA_NOVA_VALIDA,
        'csrf' => $token,
    ], []);
    igual(401, $r->status, 'status');
    contem('A senha atual não confere.', $r->corpo, 'mesma mensagem da senha atual errada');
    igual($antes, count($a->verificacoes()), 'nenhuma verificação de Argon2id na troca');
});

teste('trocar-senha JSON: senha atual de 129 caracteres é 401 e não gasta Argon2id', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = $a->entrar();
    $antes = count($a->verificacoes());
    $r = $c->post('/api/trocar-senha.php', ['senhaAtual' => tetoSenha(129), 'senhaNova' => 'SenhaNovaDoAdmin123']);
    igual(401, $r->status, 'status');
    igual($antes, count($a->verificacoes()), 'nenhuma verificação de Argon2id');
});
