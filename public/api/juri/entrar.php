<?php
declare(strict_types=1);

define('D26_API', true);
define('D26_AREA', 'juri');
require __DIR__ . '/../nucleo/inicio.php';
require_once __DIR__ . '/../nucleo/juri.php';

/**
 * Login da Júri: o navegador manda usuario e AUTH (nunca a senha). A conta guarda
 * Argon2id(AUTH). Ordem: formato do corpo e do AUTH (400, sem tocar o limite),
 * reserva no limite (429), conferência (401 genérico, conta inexistente gasta o
 * mesmo Argon2id), depois UMA mutação sob lock que confirma a mesma conta.
 */
d26_metodo(['POST']);
$priv = d26_priv();
d26_sessao_iniciar($priv); // só abre sessão se já houver uma em disco
d26_exigir_post_seguro();

$corpo = d26_juri_corpo(['usuario', 'auth']);
$usuario = $corpo['usuario'];
$auth = $corpo['auth'];
if (!is_string($usuario) || !d26_juri_auth_valido($auth)) {
    d26_erro(400, 'invalido', 'Requisição inválida.');
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$loginValido = d26_login_valido($usuario);
// Reserva ANTES do Argon2id, mesma regra do Interdisciplinar (limite compartilhado por login).
$reserva = time();
$res = d26_limite_reservar_detalhado(
    $priv,
    $usuario,
    $ip,
    $reserva,
    static fn (): bool => $loginValido && d26_dispositivo_confiavel($priv, $usuario)
);
if ($res['espera'] > 0) {
    d26_erro(429, 'aguarde', "Muitas tentativas. Aguarde {$res['espera']} segundos e tente de novo.", ['segundos' => $res['espera']]);
}

$conta = $loginValido ? d26_contas_buscar($priv, $usuario) : null;
if ($conta !== null) {
    $conta = d26_juri_conta_validar($conta);
}
$confere = d26_senha_confere($conta, $auth);
if (!$confere || $conta === null || $conta['ativo'] !== true || !is_string($conta['uid'] ?? null) || $conta['uid'] === '') {
    d26_erro(401, 'credenciais', 'Usuário ou senha inválidos.');
}

$novoHash = password_needs_rehash((string) $conta['hash'], PASSWORD_ARGON2ID, D26_ARGON) ? d26_hash_senha($auth) : null;
// O aparelho que já é confiável não ocupa outra vaga.
$token = $res['confiavel'] ? null : d26_dispositivo_gerar_token();
// Login = UMA mutação sob lock: a conta tem de ser a mesma que foi conferida.
$versao = d26_contas_efetivar_login($priv, $usuario, $conta, $novoHash, $token);
if ($versao === null) {
    d26_erro(401, 'credenciais', 'Usuário ou senha inválidos.'); // a reserva fica: conta como tentativa
}

d26_limite_sucesso($priv, $usuario, $ip, $reserva, $res['inseriu']['c']);
d26_sessao_autenticar($priv, $usuario, (string) $conta['uid'], $versao, true);
if ($token !== null) {
    d26_dispositivo_entregar($token);
}

d26_responder(200, [
    'usuario' => $usuario,
    'deveTrocarSenha' => $conta['deveTrocarSenha'],
    'csrf' => $_SESSION['csrf'],
    'embrulho' => d26_juri_embrulho_saida($conta),
]);
