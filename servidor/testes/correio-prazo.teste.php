<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/*
 * Prazo total do envio contado desde antes do connect (D-2, revisão L-12 de EM-B3; mutação D3-SEM-INICIO).
 * Os testes D3 de email.teste.php passam o instante de início à mão, ou usam loopback (milissegundos): nenhum faz
 * o connect demorar. Este faz: o ouvinte de apoio/conexaoLenta.php deixa a fila de accept cheia por ~2 s, o SYN do
 * cliente é descartado e retransmitido, e o connect só completa quando o ouvinte libera a vaga.
 */

teste('e-mail: D-2 o prazo total de 4 s conta desde antes do connect: um connect que esperou ~2 s não ganha outro total depois dele', function (): void {
    correioCarregar();
    $dir = dirTemporario();
    $marca = $dir . '/aceite.txt';
    $pipes = [];
    $proc = proc_open(
        [PHP_BINARY, RAIZ_REPO . '/servidor/testes/apoio/conexaoLenta.php', '2', $marca],
        [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['file', $dir . '/lenta.err', 'w']],
        $pipes
    );
    verdadeiro(is_resource($proc), 'o ouvinte lento iniciou');
    try {
        $porta = (int) trim((string) fgets($pipes[1]));
        verdadeiro($porta > 0, 'o ouvinte lento informou a porta: ' . (string) @file_get_contents($dir . '/lenta.err'));
        $t0 = microtime(true);
        correioEsperarFalha(fn () => d26_correio_abrir(['endereco' => 'tcp://127.0.0.1:' . $porta, 'tls' => false], 10, 4));
        $decorrido = microtime(true) - $t0;
        $aceitouEm = is_file($marca) ? (float) file_get_contents($marca) : 0.0;
        verdadeiro(
            $aceitouEm > 0.0 && $aceitouEm - $t0 >= 1.5,
            'premissa: o connect esperou de verdade antes do aceite (aceitou em ' . round($aceitouEm - $t0, 2) . ' s)'
        );
        verdadeiro(
            $decorrido <= 5.0,
            'o prazo total de 4 s passou de 5 s: o total não contou o connect, que já tinha consumido ~2 s (decorreu ' . round($decorrido, 2) . ' s)'
        );
    } finally {
        if (is_resource($pipes[1])) {
            fclose($pipes[1]);
        }
        proc_terminate($proc);
        proc_close($proc);
    }
});
