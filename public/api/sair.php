<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';

d26_metodo(['POST']);
d26_sessao_iniciar(d26_priv());
d26_exigir_post_seguro();
d26_sessao_encerrar();
d26_responder(200, ['ok' => true]);
