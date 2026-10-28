<?php
declare(strict_types=1);

define('D26_API', true);
define('D26_AREA', 'juri');
require __DIR__ . '/../nucleo/inicio.php';
require_once __DIR__ . '/../nucleo/juri.php';

/**
 * Destrava a CEK depois de recarregar a página: com sessão, o navegador manda o
 * AUTH de novo e recebe o embrulho (a CEK só vive na memória da aba). Usa o mesmo
 * limite do login, e libera a troca pendente (a troca precisa do embrulho).
 * Confere a conta DE NOVO sob lock antes de devolver o embrulho: se ela mudou
 * no meio, 409 e nada sai.
 */
d26_metodo(['POST']);
$priv = d26_priv();
$conta = d26_sessao_iniciar($priv);
d26_exigir_post_seguro();
$conta = d26_juri_conta_validar(d26_exigir_conta($conta, true));

$corpo = d26_juri_corpo(['auth']);
$auth = $corpo['auth'];
if (!d26_juri_auth_valido($auth)) {
    d26_erro(400, 'invalido', 'Requisição inválida.');
}

$login = (string) $conta['usuario'];
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$reserva = time();
$res = d26_limite_reservar_detalhado(
    $priv,
    $login,
    $ip,
    $reserva,
    static fn (): bool => d26_dispositivo_confiavel($priv, $login)
);
if ($res['espera'] > 0) {
    d26_erro(429, 'aguarde', "Muitas tentativas. Aguarde {$res['espera']} segundos e tente de novo.", ['segundos' => $res['espera']]);
}
if (!d26_senha_confere($conta, $auth)) {
    d26_erro(401, 'credenciais', 'A senha não confere.');
}
d26_limite_sucesso($priv, $login, $ip, $reserva, $res['inseriu']['c']);

// Fora de qualquer lock: ponto de pausa dos testes de corrida (no-op em produção).
d26_teste_pausar('destravar-antes-ler', $login);
// A conta que conferiu o AUTH ainda é a que está gravada (sob lock), senão o embrulho sairia de versão velha.
$atual = d26_contas_buscar_travada($priv, $login);
if ($atual === null || !d26_conta_igual_lida($atual, $conta)) {
    d26_erro(409, 'conta-alterada', 'A conta foi alterada enquanto a senha era conferida. Entre de novo.');
}

d26_responder(200, ['ok' => true, 'embrulho' => d26_juri_embrulho_saida(d26_juri_conta_validar($atual))]);
