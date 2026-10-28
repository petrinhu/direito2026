<?php
declare(strict_types=1);

define('D26_API', true);
define('D26_AREA', 'juri');
require __DIR__ . '/../nucleo/inicio.php';
require_once __DIR__ . '/../nucleo/juri.php';

/**
 * Estado da sessão da Júri. Formato FIXO: as quatro chaves saem sempre; anônimo
 * recebe null em usuario e deveTrocarSenha. Nunca devolve salt nem embrulho.
 */
d26_metodo(['GET']);
$priv = d26_priv();
$conta = d26_sessao_iniciar($priv);
$csrf = d26_csrf_token($priv);
if ($conta === null) {
    d26_responder(200, ['autenticado' => false, 'usuario' => null, 'deveTrocarSenha' => null, 'csrf' => $csrf]);
}
$conta = d26_juri_conta_validar($conta);
d26_responder(200, [
    'autenticado' => true,
    'usuario' => $conta['usuario'],
    'deveTrocarSenha' => $conta['deveTrocarSenha'],
    'csrf' => $csrf,
]);
