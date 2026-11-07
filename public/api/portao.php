<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';
require_once __DIR__ . '/nucleo/portao.php';

d26_portao_executar();
