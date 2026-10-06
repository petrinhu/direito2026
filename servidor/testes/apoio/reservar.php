<?php
declare(strict_types=1);

// Uso: php reservar.php <dir-privado> <login> <ip> <vezes>. Imprime quantas reservas passaram (espera 0).
define('D26_API', true);
foreach (['config', 'armazenamento', 'respostas', 'contas', 'limite'] as $m) {
    require __DIR__ . "/../../../public/api/nucleo/$m.php";
}
$livres = 0;
for ($i = 0; $i < (int) $argv[4]; $i++) {
    if (d26_limite_reservar($argv[1], $argv[2], $argv[3], time()) === 0) {
        $livres++;
    }
}
echo $livres;
