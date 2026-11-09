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
    $agora = time();
    d26_responder(200, ['ok' => true, 'usuarios' => array_map(
        static fn (array $c): array => d26_conta_publica($c, $agora),
        d26_contas_listar($priv)
    )]);
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
// R9 (decisão do líder, 08/11/2026): a senha não passa pelo painel. Quem cria ou redefine recebe um link.
if (in_array($acao, ['criar', 'redefinir'], true) && array_key_exists('senhaProvisoria', $corpo)) {
    d26_erro(400, 'senha-provisoria-recusada', 'O painel não define senha. Use o link de primeiro acesso.');
}
if ($acao !== 'criar' && $alvo === $conta['usuario']) {
    d26_erro(409, 'si-mesmo', 'Esta ação não pode ser feita sobre a própria conta.');
}

/**
 * Toda ação roda em d26_admin_agir: UMA mutação sob lock que revalida o ator
 * (admin, ativo, uid/versão da sessão) e recusa deixar o sistema sem admin ativo.
 */
$agir = static function (string $acao, string $alvo, ?string $hash, ?array $convite = null) use ($priv, $conta): string {
    d26_teste_pausar('usuarios-antes-agir', (string) $conta['usuario']); // fora de lock; no-op em produção
    $r = d26_admin_agir($priv, $conta, $acao, $alvo, $hash, $convite);
    if ($r === 'ator-invalido') {
        d26_erro(401, 'sem-sessao', 'É preciso entrar para continuar.');
    }
    if ($r === 'ultimo-admin') {
        d26_erro(409, 'ultimo-admin', 'Esta ação deixaria o sistema sem nenhum administrador ativo.');
    }
    return $r;
};

/**
 * Link novo (CV-B1): o token nasce AQUI, fora do lock. A conta recebe só o sha256 e o prazo
 * (d26_convite_registro). A senha da conta fica inverificável até a pessoa usar o link (CV-B2).
 *
 * @return array{string, array{hash: string, expiraEm: int}} [token, registro]
 */
$novoConvite = static function (): array {
    $token = d26_convite_token();
    return [$token, d26_convite_registro($token, time())];
};

if ($acao === 'criar') {
    if (!d26_login_valido($alvo)) {
        d26_erro(400, 'login-invalido', 'Use de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.');
    }
    [$token, $registro] = $novoConvite();
    if ($agir('criar', $alvo, d26_hash_inverificavel(), $registro) === 'existe') {
        d26_erro(409, 'existe', 'Já existe um usuário com esse nome.');
    }
    d26_responder(200, ['ok' => true, 'convite' => d26_convite_caminho($token)]);
}

if (!d26_login_valido($alvo)) {
    d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
}

if ($acao === 'redefinir') {
    [$token, $registro] = $novoConvite();
    if ($agir('redefinir', $alvo, d26_hash_inverificavel(), $registro) !== 'ok') {
        d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
    }
    // Depois do agir e fora do lock, como o CLI redefinir-senha: a pessoa não fica presa ao limite antigo.
    try {
        d26_limite_desbloquear_conta($priv, $alvo);
    } catch (Throwable $e) {
        d26_log_erro_em($priv, 'usuarios', 'redefinir: contadores não zerados (' . get_class($e) . ')');
    }
    d26_responder(200, ['ok' => true, 'convite' => d26_convite_caminho($token)]);
}

if ($agir($acao, $alvo, null) !== 'ok') {
    d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
}
d26_responder(200, ['ok' => true]);
