<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';

// Sem sessão, sem disco: só prova que o PHP executa neste servidor.
d26_metodo(['GET']);
d26_responder(200, ['ok' => true]);
