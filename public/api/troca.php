<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';
require_once __DIR__ . '/nucleo/portao.php';

/**
 * Troca de senha obrigatória pelo formulário da tela (plano do CTO do login único, seção 1.3,
 * item 5, e seção 3; LU-F2.5). Sem sessão: 401 vazio, nunca conteúdo. Erro: a própria tela de
 * troca, com a mensagem, no status do erro. Sucesso: 303 para /, com a sessão regenerada.
 * A troca em JSON (trocar-senha.php) segue igual, para o app.
 */
d26_metodo(['POST']);
$priv = d26_priv();
$conta = d26_sessao_iniciar($priv);
if ($conta === null) {
    d26_portao_vazio(401);
}
d26_exigir_formulario_seguro($priv);
if ($conta['deveTrocarSenha'] === false) {
    d26_portao_vazio(303, ['Location' => '/']);
}

$atual = is_string($_POST['senhaAtual'] ?? null) ? $_POST['senhaAtual'] : '';
$nova = is_string($_POST['senhaNova'] ?? null) ? $_POST['senhaNova'] : '';
$login = (string) $conta['usuario'];
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$token = d26_csrf_pre_atual($priv);

$reserva = time();
$res = d26_limite_reservar_detalhado($priv, $login, $ip, $reserva, static fn (): bool => d26_dispositivo_confiavel($priv, $login));
if ($res['espera'] > 0) {
    d26_portao_tela(429, d26_tela_troca($token, "Muitas tentativas. Aguarde {$res['espera']} segundos."), PORTAO_CSP_TELA);
}
if (!d26_senha_confere($conta, $atual)) {
    d26_portao_tela(401, d26_tela_troca($token, 'A senha atual não confere.'), PORTAO_CSP_TELA);
}
d26_limite_sucesso($priv, $login, $ip, $reserva, $res['inseriu']['c']);

$motivo = d26_validar_senha_nova($nova, $login, $atual);
if ($motivo !== null) {
    d26_portao_tela(400, d26_tela_troca($token, $motivo), PORTAO_CSP_TELA);
}

$hashNovo = d26_hash_senha($nova);
// Fora de qualquer lock: ponto de pausa dos testes de corrida (no-op em produção).
d26_teste_pausar('troca-antes-gravar', $login);
// Compare-and-swap sob lock: só grava se a conta ainda é a que foi lida.
$versao = d26_contas_trocar_senha($priv, $login, $hashNovo, $conta);
if ($versao === 0) {
    d26_portao_tela(409, d26_tela_troca($token, 'A conta foi alterada enquanto a troca era feita. Entre de novo.'), PORTAO_CSP_TELA);
}
d26_sessao_autenticar($priv, $login, (string) $conta['uid'], $versao, false);
d26_dispositivo_emitir($priv, $login, $versao, (string) $conta['uid']);
d26_portao_vazio(303, ['Location' => '/']);
