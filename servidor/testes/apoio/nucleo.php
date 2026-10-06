<?php
declare(strict_types=1);

/** Carrega a biblioteca do núcleo para testes unitários (sem servidor). */
if (!defined('D26_API')) {
    define('D26_API', true);
}
foreach (['config', 'armazenamento', 'respostas', 'contas', 'limite', 'dispositivo', 'csrf'] as $modulo) {
    require_once RAIZ_REPO . "/public/api/nucleo/$modulo.php";
}

function dirTemporario(): string
{
    $dir = rtrim(getenv('TMPDIR') ?: '/var/tmp', '/') . '/d26-testes-' . bin2hex(random_bytes(6));
    mkdir($dir, 0700, true);
    return $dir;
}
