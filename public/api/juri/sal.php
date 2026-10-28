<?php
declare(strict_types=1);

define('D26_API', true);
define('D26_AREA', 'juri');
require __DIR__ . '/../nucleo/inicio.php';
require_once __DIR__ . '/../nucleo/juri.php';

/**
 * Pré-login da Júri: devolve o salt que o navegador usa para derivar AUTH.
 * Login inexistente recebe o salt FALSO (estável). Não reserva tentativa: é
 * consulta pública e não mede senha. Só POST com CSRF (pré-sessão).
 */
d26_metodo(['POST']);
$priv = d26_priv();
d26_sessao_iniciar($priv); // só abre sessão se já houver uma em disco
d26_exigir_post_seguro();

$corpo = d26_juri_corpo(['usuario']);
$usuario = $corpo['usuario'];
if (!is_string($usuario)) {
    d26_erro(400, 'invalido', 'Requisição inválida.');
}

$conta = d26_contas_buscar($priv, $usuario);
$salt = $conta === null
    ? d26_juri_salt_falso($priv, $usuario)
    : d26_juri_salt_da_conta($conta);

d26_responder(200, [
    'salt' => base64_encode($salt),
    'iter' => D26_JURI_ITER,
    'v' => D26_JURI_VERSAO,
]);
