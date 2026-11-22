<?php
declare(strict_types=1);

/**
 * Runner de testes em PHP CLI puro (sem phpunit, nada a instalar).
 * Uso: php servidor/testes/rodar.php [filtro-no-nome] [--sem-servidor] [--sem-laco]
 * Descobre servidor/testes/*.teste.php. Sai com 1 se algum teste falhar ou
 * se nenhum for executado (piso de varredura não-vazia, L-36).
 *
 * Marcas: --sem-servidor pula os testes que precisam do php -S local; --sem-laco
 * pula os que precisam de escuta local ou de exec. Sem --sem-laco, o runner
 * pula os mesmos testes sozinho quando o ambiente não tem exec nem escuta
 * (função desabilitada): saem como "pulado por ambiente", nunca como falha.
 */

require __DIR__ . '/apoio/base.php';

/** Verdadeiro quando o PHP deste processo consegue abrir escuta local e executar comando. */
function ambienteTemLaco(): bool
{
    return function_exists('exec') && function_exists('stream_socket_server');
}

$argumentos = array_slice($argv, 1);
$semServidor = in_array('--sem-servidor', $argumentos, true);
$semLaco = in_array('--sem-laco', $argumentos, true) || !ambienteTemLaco();
$pulados = 0;
$filtro = '';
foreach ($argumentos as $a) {
    if (!str_starts_with($a, '--')) {
        $filtro = $a;
    }
}

$arquivos = glob(__DIR__ . '/*.teste.php') ?: [];
sort($arquivos);
foreach ($arquivos as $arquivo) {
    require $arquivo;
}

$encontrados = count(Registro::$testes);
$executados = 0;
$falharam = 0;
$inicio = microtime(true);

if ($semLaco && !ambienteTemLaco()) {
    echo "ambiente sem exec ou escuta local: testes com laço saem como pulado por ambiente\n";
}

foreach (Registro::$testes as $t) {
    if ($filtro !== '' && !str_contains($t['nome'], $filtro)) {
        continue;
    }
    if ($semServidor && $t['servidor']) {
        continue;
    }
    if ($semLaco && $t['laco']) {
        $pulados++;
        echo "  pulado por ambiente  {$t['nome']}\n";
        continue;
    }
    $executados++;
    try {
        ($t['corpo'])();
        echo "  ok  {$t['nome']}\n";
    } catch (Throwable $e) {
        $falharam++;
        echo "FALHA {$t['nome']}\n      " . str_replace("\n", "\n      ", $e->getMessage()) . "\n";
    }
    Ambiente::limparTudo();
}

printf(
    "\nencontrados: %d / executados: %d / falharam: %d / %.1fs (PHP %s)\n",
    $encontrados,
    $executados,
    $falharam,
    microtime(true) - $inicio,
    PHP_VERSION
);
printf("pulados por ambiente: %d\n", $pulados);

if ($executados === 0) {
    fwrite(STDERR, "rodar: zero teste executado é portão quebrado, não suíte limpa\n");
    exit(1);
}
exit($falharam > 0 ? 1 : 0);
