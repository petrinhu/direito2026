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
if (!in_array($acao, ['criar', 'redefinir', 'ativar', 'desativar', 'excluir', 'revogar-aparelhos', 'email'], true)) {
    d26_erro(400, 'acao-invalida', 'Ação desconhecida.');
}
// R9 (decisão do líder, 08/11/2026): a senha não passa pelo painel. Quem cria ou redefine recebe um link.
if (in_array($acao, ['criar', 'redefinir'], true) && array_key_exists('senhaProvisoria', $corpo)) {
    d26_erro(400, 'senha-provisoria-recusada', 'O painel não define senha. Use o link de primeiro acesso.');
}
// EM-B1: a ação 'email' é a única liberada sobre a própria conta, e só com a senha atual (8.1.2).
if (!in_array($acao, ['criar', 'email'], true) && $alvo === $conta['usuario']) {
    d26_erro(409, 'si-mesmo', 'Esta ação não pode ser feita sobre a própria conta.');
}

/**
 * Toda ação roda em d26_admin_agir: UMA mutação sob lock que revalida o ator
 * (admin, ativo, uid/versão da sessão) e recusa deixar o sistema sem admin ativo.
 */
$agir = static function (string $acao, string $alvo, ?string $hash, ?array $convite = null, ?string $email = null) use ($priv, $conta): string {
    d26_teste_pausar('usuarios-antes-agir', (string) $conta['usuario']); // fora de lock; no-op em produção
    $r = d26_admin_agir($priv, $conta, $acao, $alvo, $hash, $convite, $email);
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

/**
 * Reautenticação da PRÓPRIA conta para trocar o e-mail (EM-B1, 8.1.2): a senha atual é conferida com o mesmo
 * Argon2id do login, e a tentativa passa pelo mesmo limite (reserva ANTES do hash, ordem de locks: tentativas,
 * depois usuários). Sem senha: 403 sem contar tentativa. Errada: 403, a tentativa fica contada.
 */
$reautenticar = static function (array $conta, mixed $senhaAtual) use ($priv): void {
    if (!is_string($senhaAtual) || $senhaAtual === '') {
        d26_erro(403, 'senha-atual-exigida', 'Informe a senha atual para trocar o seu e-mail.');
    }
    $login = (string) $conta['usuario'];
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $reserva = time();
    $res = d26_limite_reservar_detalhado($priv, $login, $ip, $reserva, static fn (): bool => d26_dispositivo_confiavel($priv, $login));
    if ($res['espera'] > 0) {
        d26_erro(429, 'aguarde', "Muitas tentativas. Aguarde {$res['espera']} segundos e tente de novo.", ['segundos' => $res['espera']]);
    }
    if (!d26_senha_confere($conta, $senhaAtual)) {
        d26_erro(403, 'senha-atual', 'A senha atual não confere.');
    }
    d26_limite_sucesso($priv, $login, $ip, $reserva, $res['inseriu']['c']);
};

if ($acao === 'criar') {
    if (!d26_login_valido($alvo)) {
        d26_erro(400, 'login-invalido', 'Use de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.');
    }
    // EM-B1: o e-mail é obrigatório na criação. Sem ele válido, nada é gravado.
    $email = d26_email_normalizar($corpo['email'] ?? null);
    if ($email === null) {
        d26_erro(400, 'email-invalido', 'E-mail inválido.');
    }
    [$token, $registro] = $novoConvite();
    $r = $agir('criar', $alvo, d26_hash_inverificavel(), $registro, $email);
    if ($r === 'existe') {
        d26_erro(409, 'existe', 'Já existe um usuário com esse nome.');
    }
    if ($r === 'email-em-uso') {
        d26_erro(409, 'email-em-uso', 'Este e-mail já está em outra conta.');
    }
    d26_responder(200, ['ok' => true, 'convite' => d26_convite_caminho($token)]);
}

if (!d26_login_valido($alvo)) {
    d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
}

if ($acao === 'email') {
    $email = d26_email_normalizar($corpo['email'] ?? null);
    if ($email === null) {
        d26_erro(400, 'email-invalido', 'E-mail inválido.');
    }
    if ($alvo === $conta['usuario']) {
        $reautenticar($conta, $corpo['senhaAtual'] ?? null);
    }
    // Fora de qualquer lock: ponto de pausa do teste de corrida (no-op em produção). Chave = o alvo.
    d26_teste_pausar('email-antes-gravar', $alvo);
    $r = $agir('email', $alvo, null, null, $email);
    if ($r === 'email-em-uso') {
        d26_erro(409, 'email-em-uso', 'Este e-mail já está em outra conta.');
    }
    if ($r !== 'ok') {
        d26_erro(400, 'nao-encontrado', 'Usuário não encontrado.');
    }
    d26_responder(200, ['ok' => true]);
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
