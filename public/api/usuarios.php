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
if (!in_array($acao, ['criar', 'redefinir', 'ativar', 'desativar', 'excluir', 'revogar-aparelhos'], true)) {
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
    if (!is_string($informada) || !d26_senha_provisoria_valida($informada, D26_PROVISORIA_MINIMA_API)) {
        d26_erro(400, 'senha-invalida', 'A senha provisória deve ter de 8 a 128 caracteres.');
    }
    return $informada;
};

/**
 * Toda ação roda em d26_admin_agir: UMA mutação sob lock que revalida o ator
 * (admin, ativo, uid/versão da sessão) e recusa deixar o sistema sem admin ativo.
 */
$agir = static function (string $acao, string $alvo, ?string $hash) use ($priv, $conta): string {
    d26_teste_pausar('usuarios-antes-agir', (string) $conta['usuario']); // fora de lock; no-op em produção
    $r = d26_admin_agir($priv, $conta, $acao, $alvo, $hash);
    if ($r === 'ator-invalido') {
        d26_erro(401, 'sem-sessao', 'É preciso entrar para continuar.');
    }
    if ($r === 'ultimo-admin') {
        d26_erro(409, 'ultimo-admin', 'Esta ação deixaria o sistema sem nenhum administrador ativo.');
    }
    return $r;
};

if ($acao === 'criar') {
    if (!d26_login_valido($alvo)) {
        d26_erro(400, 'login-invalido', 'Use de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.');
    }
    $senha = $provisoria();
    if ($agir('criar', $alvo, d26_hash_senha($senha)) === 'existe') {
        d26_erro(409, 'existe', 'Já existe um usuário com esse nome.');
    }
    d26_responder(200, ['ok' => true, 'senhaProvisoria' => $senha]);
}

if (!d26_login_valido($alvo)) {
    d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
}

if ($acao === 'redefinir') {
    $senha = $provisoria();
    if ($agir('redefinir', $alvo, d26_hash_senha($senha)) !== 'ok') {
        d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
    }
    d26_responder(200, ['ok' => true, 'senhaProvisoria' => $senha]);
}

if ($agir($acao, $alvo, null) !== 'ok') {
    d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
}
d26_responder(200, ['ok' => true]);
