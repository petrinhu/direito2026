<?php
declare(strict_types=1);

/**
 * Processo filho dos testes de área: php apoio/area.php <area|AUSENTE> <nucleo> [priv|-].
 * D26_AREA é constante de processo, então a fiação real (config, dispositivo,
 * estrutura) só se prova subindo um PHP novo por caso. Imprime, em JSON, o que o
 * núcleo resolveu. Não é teste: o runner (rodar.php) só lê *.teste.php.
 */

$area = $argv[1] ?? '';
$nucleo = $argv[2] ?? '';
$priv = $argv[3] ?? '-';

define('D26_API', true);
if ($area !== 'AUSENTE') {
    define('D26_AREA', $area);
}
require $nucleo . '/config.php';
require $nucleo . '/armazenamento.php';
require $nucleo . '/dispositivo.php';

$saida = [
    'sessao' => D26_SESSAO_NOME,
    'pre' => D26_PRE_NOME,
    'disp' => D26_DISP_NOME,
    'privado' => d26_dir_privado('/a/b/public_html/direito2026/api/nucleo', 'litespeed', null),
];
if ($priv !== '-') {
    d26_garantir_estrutura($priv);
    $subpastas = [];
    foreach (scandir($priv) ?: [] as $item) {
        if ($item !== '.' && $item !== '..' && is_dir($priv . '/' . $item)) {
            $subpastas[] = $item;
        }
    }
    sort($subpastas);
    $saida['subpastas'] = $subpastas;
}
echo json_encode($saida, JSON_THROW_ON_ERROR), "\n";
