<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';

d26_metodo(['POST']);
$priv = d26_priv();
d26_sessao_iniciar($priv);
d26_exigir_post_seguro();

$corpo = d26_corpo_json();
$usuario = $corpo['usuario'] ?? null;
$senha = $corpo['senha'] ?? null;
if (!is_string($usuario) || !is_string($senha)) {
    d26_erro(400, 'invalido', 'Informe usuário e senha.');
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$espera = d26_limite_pre($priv, $usuario, $ip, time());
if ($espera > 0) {
    d26_erro(429, 'aguarde', "Muitas tentativas. Aguarde {$espera} segundos e tente de novo.", ['segundos' => $espera]);
}

$conta = d26_login_valido($usuario) ? d26_contas_buscar($priv, $usuario) : null;
$confere = d26_senha_confere($conta, $senha);
if (!$confere || $conta === null || $conta['ativo'] !== true) {
    d26_limite_falha($priv, $usuario, $ip, time());
    d26_erro(401, 'credenciais', 'Usuário ou senha inválidos.');
}

d26_limite_sucesso($priv, $usuario, $ip);
$novoHash = password_needs_rehash((string) $conta['hash'], PASSWORD_ARGON2ID, D26_ARGON) ? d26_hash_senha($senha) : null;
d26_contas_registrar_login($priv, $usuario, $novoHash);
d26_sessao_autenticar($usuario, (int) $conta['versaoSessao'], true);

d26_responder(200, [
    'ok' => true,
    'usuario' => $usuario,
    'admin' => $conta['admin'],
    'deveTrocarSenha' => $conta['deveTrocarSenha'],
    'csrf' => $_SESSION['csrf'],
]);
