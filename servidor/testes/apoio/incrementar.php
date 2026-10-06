<?php
declare(strict_types=1);

// Uso: php incrementar.php <arquivo> <vezes>. Concorrência real sobre o armazenamento.
define('D26_API', true);
require __DIR__ . '/../../../public/api/nucleo/config.php';
require __DIR__ . '/../../../public/api/nucleo/armazenamento.php';
for ($i = 0; $i < (int) $argv[2]; $i++) {
    d26_atualizar_json($argv[1], ['n' => 0], static function (array &$d): void {
        $d['n']++;
    });
}
