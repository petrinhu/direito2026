<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';

d26_metodo(['POST']);
$priv = d26_priv();
$conta = d26_sessao_iniciar($priv);
d26_exigir_post_seguro();
$conta = d26_exigir_conta($conta, true);

$corpo = d26_corpo_json();
$atual = $corpo['senhaAtual'] ?? null;
$nova = $corpo['senhaNova'] ?? null;
if (!is_string($atual) || !is_string($nova)) {
    d26_erro(400, 'invalido', 'Informe a senha atual e a senha nova.');
}

$login = (string) $conta['usuario'];
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$espera = d26_limite_pre($priv, $login, $ip, time());
if ($espera > 0) {
    d26_erro(429, 'aguarde', "Muitas tentativas. Aguarde {$espera} segundos e tente de novo.", ['segundos' => $espera]);
}
if (!d26_senha_confere($conta, $atual)) {
    d26_limite_falha($priv, $login, $ip, time());
    d26_erro(401, 'senha-atual', 'A senha atual não confere.');
}
$motivo = d26_validar_senha_nova($nova, $login, $atual);
if ($motivo !== null) {
    d26_erro(400, 'senha-fraca', $motivo);
}

$versao = d26_contas_trocar_senha($priv, $login, d26_hash_senha($nova));
d26_sessao_autenticar($login, $versao, false);
d26_responder(200, ['ok' => true, 'csrf' => $_SESSION['csrf']]);
