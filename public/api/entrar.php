<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';

d26_metodo(['POST']);
$priv = d26_priv();
d26_sessao_iniciar($priv); // só abre sessão se já houver uma em disco
d26_exigir_post_seguro();

$corpo = d26_corpo_json();
$usuario = $corpo['usuario'] ?? null;
$senha = $corpo['senha'] ?? null;
if (!is_string($usuario) || !is_string($senha)) {
    d26_erro(400, 'invalido', 'Informe usuário e senha.');
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$loginValido = d26_login_valido($usuario);
// Reserva atômica ANTES do Argon2id: requisições simultâneas não passam todas pelo mesmo teste.
// O aparelho confiável é reavaliado DENTRO do lock de tentativas (ordem de locks: tentativas, usuários).
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
$confere = d26_senha_confere($conta, $senha);
if (!$confere || $conta === null || $conta['ativo'] !== true || !is_string($conta['uid'] ?? null) || $conta['uid'] === '') {
    d26_erro(401, 'credenciais', 'Usuário ou senha inválidos.');
}

// Fora de qualquer lock: ponto de pausa dos testes de corrida (no-op em produção).
d26_teste_pausar('entrar-apos-verificar', $usuario);
$novoHash = password_needs_rehash((string) $conta['hash'], PASSWORD_ARGON2ID, D26_ARGON) ? d26_hash_senha($senha) : null;
// O aparelho que já é confiável não ocupa outra vaga.
$token = $res['confiavel'] ? null : d26_dispositivo_gerar_token();
// Login = UMA mutação sob lock: a conta tem de ser a mesma que foi verificada (ativa, uid, versão e hash).
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
    'ok' => true,
    'usuario' => $usuario,
    'admin' => $conta['admin'],
    'deveTrocarSenha' => $conta['deveTrocarSenha'],
    'csrf' => $_SESSION['csrf'],
]);
