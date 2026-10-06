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
$reserva = time();
// Aparelho confiável reavaliado DENTRO do lock de tentativas (ordem de locks: tentativas, usuários).
$res = d26_limite_reservar_detalhado($priv, $login, $ip, $reserva, static fn (): bool => d26_dispositivo_confiavel($priv, $login));
if ($res['espera'] > 0) {
    d26_erro(429, 'aguarde', "Muitas tentativas. Aguarde {$res['espera']} segundos e tente de novo.", ['segundos' => $res['espera']]);
}
if (!d26_senha_confere($conta, $atual)) {
    d26_erro(401, 'senha-atual', 'A senha atual não confere.');
}
d26_limite_sucesso($priv, $login, $ip, $reserva, $res['inseriu']['c']);
$motivo = d26_validar_senha_nova($nova, $login, $atual);
if ($motivo !== null) {
    d26_erro(400, 'senha-fraca', $motivo);
}

$hashNovo = d26_hash_senha($nova);
// Fora de qualquer lock: ponto de pausa dos testes de corrida (no-op em produção).
d26_teste_pausar('troca-antes-gravar', $login);
// Só grava se a conta ainda é a que foi lida (compare-and-swap sob lock); senão uma
// redefinição do admin feita no meio seria sobrescrita. Nunca autentica sem gravar.
$versao = d26_contas_trocar_senha($priv, $login, $hashNovo, $conta);
if ($versao === 0) {
    d26_erro(409, 'conta-alterada', 'A conta foi alterada enquanto a troca era feita. Entre de novo.');
}
d26_sessao_autenticar($priv, $login, (string) $conta['uid'], $versao, false);
// A troca invalidou os aparelhos; este navegador acabou de provar a senha. Preso à versão e ao uid da troca.
d26_dispositivo_emitir($priv, $login, $versao, (string) $conta['uid']);
d26_responder(200, ['ok' => true, 'csrf' => $_SESSION['csrf']]);
