<?php
declare(strict_types=1);

/**
 * Apoio do teste aviso-lista.teste.php (fronteira da lista fechada de avisos, SE-F4). Roda em processo próprio, para
 * não carregar sessao.php dentro da suíte. Imprime um JSON com o resultado.
 *
 * Uso: php avisoFronteira.php <raiz-do-repositório> emitir <codigo>
 *      php avisoFronteira.php <raiz-do-repositório> ler <valor-do-cookie>
 */

$raiz = $argv[1] ?? '';
$modo = $argv[2] ?? '';
$valor = $argv[3] ?? '';
if ($raiz === '' || !is_file($raiz . '/public/api/nucleo/sessao.php')) {
    fwrite(STDERR, "avisoFronteira: raiz sem public/api/nucleo/sessao.php\n");
    exit(1);
}

define('D26_API', true);
foreach (['config', 'armazenamento', 'respostas', 'contas', 'limite', 'dispositivo', 'csrf', 'sessao'] as $modulo) {
    require $raiz . '/public/api/nucleo/' . $modulo . '.php';
}

if ($modo === 'emitir') {
    try {
        d26_aviso_emitir($valor);
        $cookies = array_values(array_filter(headers_list(), static fn (string $h): bool => stripos($h, 'set-cookie:') === 0));
        echo json_encode(['emitiu' => true, 'cookies' => $cookies], JSON_THROW_ON_ERROR);
    } catch (Throwable $e) {
        echo json_encode(['emitiu' => false, 'erro' => get_class($e)], JSON_THROW_ON_ERROR);
    }
    exit(0);
}

if ($modo === 'ler') {
    $_COOKIE[D26_AVISO_NOME] = $valor;
    echo json_encode(['codigo' => d26_aviso_pedido()], JSON_THROW_ON_ERROR);
    exit(0);
}

fwrite(STDERR, "avisoFronteira: modo desconhecido\n");
exit(1);
