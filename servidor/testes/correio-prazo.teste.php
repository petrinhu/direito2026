<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/*
 * Prazo total do envio contado desde antes do connect (D-2, revisão L-12 de EM-B3; mutações M3 e M8).
 * O connect só demora se a fila de accept estiver cheia. O ouvinte de apoio/conexaoLenta.php ocupa a única vaga e só
 * aceita depois de CPZ_ESPERA_S segundos; com a vaga ocupada, o kernel descarta o SYN do cliente, que o retransmite
 * (listen(2) e tcp(7)). A premissa é MEDIDA antes de cada teste: uma sonda crua de connect, com timeout de CPZ_SONDA_S,
 * tem de expirar. Se completar na hora ou for recusada, a fila não está cheia nesta máquina e o teste reprova, em vez
 * de passar vazio (L-36; revisão de EM-B3, ENV-BACKLOG128).
 */

// 4 s e não 3: com 3 s, o M8 (connect sem o total) saía em 2,03 s contra o teto de 2 s, margem de 30 ms (L-36).
const CPZ_ESPERA_S = 4;
const CPZ_SONDA_S = 1;

/**
 * Sobe o ouvinte lento e espera a porta. Se a porta não vier, encerra o processo antes de reprovar.
 *
 * @return array{proc: resource, pipes: array<int, resource>, porta: int}
 */
function cpzIniciarOuvinte(int $segundos, string $dir): array
{
    $pipes = [];
    $proc = proc_open(
        [PHP_BINARY, RAIZ_REPO . '/servidor/testes/apoio/conexaoLenta.php', (string) $segundos, $dir . '/aceite.txt'],
        [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['file', $dir . '/lenta.err', 'w']],
        $pipes
    );
    verdadeiro(is_resource($proc), 'o ouvinte lento iniciou');
    $ouvinte = ['proc' => $proc, 'pipes' => $pipes, 'porta' => (int) trim((string) fgets($pipes[1]))];
    if ($ouvinte['porta'] <= 0) {
        cpzEncerrarOuvinte($ouvinte);
        falhar('o ouvinte lento não informou a porta: ' . (string) @file_get_contents($dir . '/lenta.err'));
    }
    return $ouvinte;
}

/** @param array{proc: resource, pipes: array<int, resource>, porta: int} $ouvinte */
function cpzEncerrarOuvinte(array $ouvinte): void
{
    if (is_resource($ouvinte['pipes'][1])) {
        fclose($ouvinte['pipes'][1]);
    }
    proc_terminate($ouvinte['proc']);
    proc_close($ouvinte['proc']);
}

/**
 * Premissa medida: um connect cru ao ouvinte, com timeout de CPZ_SONDA_S, tem de EXPIRAR. Expirar = a fila está
 * cheia e o SYN foi descartado. Completar na hora ou ser recusada em tempo curto = o teste não prova nada nesta
 * máquina, então reprova.
 */
function cpzPremissaConnectBloqueia(int $porta): void
{
    $t0 = microtime(true);
    $sock = @stream_socket_client('tcp://127.0.0.1:' . $porta, $numero, $texto, CPZ_SONDA_S, STREAM_CLIENT_CONNECT);
    $decorrido = microtime(true) - $t0;
    if ($sock !== false) {
        fclose($sock);
        verdadeiro(false, 'premissa: o connect completou em ' . round($decorrido, 3) . ' s, a fila de accept não estava cheia nesta máquina; o teste não prova o prazo');
    }
    verdadeiro(
        $decorrido >= CPZ_SONDA_S - 0.1,
        'premissa: o connect foi recusado em ' . round($decorrido, 3) . ' s (' . $texto . ') em vez de expirar; o SYN não foi descartado e o teste não prova o prazo'
    );
}

teste('e-mail: D-2 o prazo total de 4 s conta desde antes do connect: um connect que esperou ~4 s não ganha outro total depois dele', function (): void {
    correioCarregar();
    $ouvinte = cpzIniciarOuvinte(CPZ_ESPERA_S, dirTemporario());
    try {
        cpzPremissaConnectBloqueia($ouvinte['porta']);
        $t0 = microtime(true);
        correioEsperarFalha(fn () => d26_correio_abrir(['endereco' => 'tcp://127.0.0.1:' . $ouvinte['porta'], 'tls' => false], 10, 4));
        $decorrido = microtime(true) - $t0;
        verdadeiro(
            $decorrido <= 5.0,
            'o prazo total de 4 s passou de 5 s: o total não contou o connect, que esperou ~' . CPZ_ESPERA_S . ' s (decorreu ' . round($decorrido, 2) . ' s)'
        );
    } finally {
        cpzEncerrarOuvinte($ouvinte);
    }
});

teste('e-mail: D-2 borda o connect nunca passa do prazo total de 1 s, mesmo com leitura de 10 s (ouvinte aceita depois de 4 s)', function (): void {
    correioCarregar();
    $ouvinte = cpzIniciarOuvinte(CPZ_ESPERA_S, dirTemporario());
    try {
        cpzPremissaConnectBloqueia($ouvinte['porta']);
        $t0 = microtime(true);
        correioEsperarFalha(fn () => d26_correio_abrir(['endereco' => 'tcp://127.0.0.1:' . $ouvinte['porta'], 'tls' => false], 10, CPZ_SONDA_S));
        $decorrido = microtime(true) - $t0;
        verdadeiro(
            $decorrido <= 2.0,
            'o prazo total de 1 s passou de 2 s: o connect ignorou o total e esperou a leitura de 10 s (decorreu ' . round($decorrido, 2) . ' s)'
        );
    } finally {
        cpzEncerrarOuvinte($ouvinte);
    }
});
