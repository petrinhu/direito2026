<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';

d26_metodo(['GET', 'POST']);
$priv = d26_priv();
$conta = d26_sessao_iniciar($priv);
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    d26_exigir_post_seguro();
}
$conta = d26_exigir_conta($conta);
if ($conta['admin'] !== true) {
    d26_erro(403, 'nao-admin', 'Acesso restrito a quem administra.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    d26_responder(200, ['ok' => true, 'usuarios' => array_map('d26_conta_publica', d26_contas_listar($priv))]);
}

$corpo = d26_corpo_json();
$acao = $corpo['acao'] ?? null;
$alvo = $corpo['usuario'] ?? null;
if (!is_string($acao) || !is_string($alvo)) {
    d26_erro(400, 'invalido', 'Informe a ação e o usuário.');
}
if (!in_array($acao, ['criar', 'redefinir', 'ativar', 'desativar', 'excluir'], true)) {
    d26_erro(400, 'acao-invalida', 'Ação desconhecida.');
}
if ($acao !== 'criar' && $alvo === $conta['usuario']) {
    d26_erro(409, 'si-mesmo', 'Esta ação não pode ser feita sobre a própria conta.');
}

/** Senha provisória: a informada (validada) ou uma gerada. */
$provisoria = static function () use ($corpo): string {
    $informada = $corpo['senhaProvisoria'] ?? null;
    if ($informada === null) {
        return d26_gerar_senha_provisoria();
    }
    if (!is_string($informada) || !d26_senha_provisoria_valida($informada)) {
        d26_erro(400, 'senha-invalida', 'A senha provisória deve ter de 1 a 128 caracteres.');
    }
    return $informada;
};

if ($acao === 'criar') {
    if (!d26_login_valido($alvo)) {
        d26_erro(400, 'login-invalido', 'Use de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.');
    }
    $senha = $provisoria();
    if (d26_contas_criar($priv, $alvo, d26_hash_senha($senha), false) === 'existe') {
        d26_erro(409, 'existe', 'Já existe um usuário com esse nome.');
    }
    d26_responder(200, ['ok' => true, 'senhaProvisoria' => $senha]);
}

if (!d26_login_valido($alvo)) {
    d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
}

if ($acao === 'redefinir') {
    $senha = $provisoria();
    $r = d26_contas_redefinir($priv, $alvo, d26_hash_senha($senha));
    if ($r !== 'ok') {
        d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
    }
    d26_responder(200, ['ok' => true, 'senhaProvisoria' => $senha]);
}

$r = match ($acao) {
    'ativar' => d26_contas_definir_ativo($priv, $alvo, true),
    'desativar' => d26_contas_definir_ativo($priv, $alvo, false),
    default => d26_contas_excluir($priv, $alvo),
};
if ($r !== 'ok' && $r !== 'excluida') {
    d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
}
d26_responder(200, ['ok' => true]);
