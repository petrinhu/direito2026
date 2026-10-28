<?php
declare(strict_types=1);

define('D26_API', true);
define('D26_AREA', 'juri');
require __DIR__ . '/../nucleo/inicio.php';
require_once __DIR__ . '/../nucleo/juri.php';

/**
 * Troca de senha da Júri, feita no navegador: o corpo traz o AUTH atual (prova da
 * senha atual), e o AUTH novo com o salt novo e o embrulho novo da CEK (reembrulhada
 * no navegador). O servidor nunca vê a senha. Ordem: sessão e CSRF, formato do corpo
 * (400, sem tocar o limite), AUTH novo igual ao atual (400, sem Argon2id), limite
 * compartilhado com o login (429), conferência do AUTH atual (401 senha-atual) e,
 * por fim, UMA mutação sob lock que grava salt, verificador e embrulho juntos
 * (409 se a conta mudou no meio). Depois, sessão e aparelho novos; as outras
 * sessões e aparelhos da conta caem.
 */
d26_metodo(['POST']);
$priv = d26_priv();
$conta = d26_sessao_iniciar($priv);
d26_exigir_post_seguro();
// A troca é o único caminho permitido com troca de senha pendente (o embrulho sai daqui).
$conta = d26_juri_conta_validar(d26_exigir_conta($conta, true));

$corpo = d26_juri_corpo(['authAtual', 'salt', 'auth', 'embrulho']);
$authAtual = $corpo['authAtual'];
$auth = $corpo['auth'];
$salt = $corpo['salt'];
$embrulho = $corpo['embrulho'];
if (!d26_juri_auth_valido($authAtual)
    || !d26_juri_auth_valido($auth)
    || d26_juri_b64_bytes($salt, D26_JURI_SALT_BYTES) === null
    || !d26_juri_embrulho_valido($embrulho)) {
    d26_erro(400, 'invalido', 'Requisição inválida.');
}
// Mesmo AUTH é troca sem efeito. Compara só valores que o próprio cliente enviou, então não vaza nada.
if ($auth === $authAtual) {
    d26_erro(400, 'senha-repetida', 'A senha nova precisa ser diferente da atual.');
}

$login = (string) $conta['usuario'];
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$reserva = time();
// Mesmo limite do login e do destravar: falhas aqui contam junto com as de entrar.
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
if (!d26_senha_confere($conta, $authAtual)) {
    d26_erro(401, 'senha-atual', 'A senha atual não confere.');
}
d26_limite_sucesso($priv, $login, $ip, $reserva, $res['inseriu']['c']);

// Argon2id do AUTH novo fica FORA de qualquer lock (é o passo lento).
$hashNovo = d26_hash_senha($auth);
// Fora de qualquer lock: ponto de pausa dos testes de corrida (no-op em produção).
d26_teste_pausar('juri-troca-antes-gravar', $login);
// Uma mutação só, com compare-and-swap: a conta que conferiu ainda é a gravada.
$versao = d26_juri_contas_trocar_senha($priv, $login, $hashNovo, $salt, $embrulho, $conta);
if ($versao === 0) {
    d26_erro(409, 'conta-alterada', 'A conta foi alterada enquanto a troca era feita. Entre de novo.');
}
d26_sessao_autenticar($priv, $login, (string) $conta['uid'], $versao, false);
// A troca esvaziou os aparelhos; este navegador acabou de provar a senha. Preso à versão e ao uid da troca.
d26_dispositivo_emitir($priv, $login, $versao, (string) $conta['uid']);
d26_responder(200, ['ok' => true, 'csrf' => $_SESSION['csrf']]);
