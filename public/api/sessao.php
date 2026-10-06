<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';

d26_metodo(['GET']);
$conta = d26_sessao_iniciar(d26_priv());
if ($conta === null) {
    d26_responder(200, ['ok' => true, 'autenticado' => false, 'csrf' => $_SESSION['csrf']]);
}
d26_responder(200, [
    'ok' => true,
    'autenticado' => true,
    'usuario' => $conta['usuario'],
    'admin' => $conta['admin'],
    'deveTrocarSenha' => $conta['deveTrocarSenha'],
    'csrf' => $_SESSION['csrf'],
]);
