<?php
declare(strict_types=1);

/**
 * Ouvinte lento para o teste de prazo do connect (D-2, EM-B3). Só 127.0.0.1, nunca sai da máquina.
 * A fila de accept tem tamanho zero e a única vaga é ocupada por uma conexão deste próprio processo. Enquanto a
 * vaga está ocupada, o kernel descarta o SYN do cliente e o cliente o retransmite: o connect só completa depois
 * que o ouvinte aceita a conexão ocupante. Então o ouvinte grava, em <arquivo>, o instante em que aceitou o cliente
 * (o teste mede quanto o connect esperou) e fica calado: não responde nem a saudação. O teste mata o processo.
 *
 * Uso: php conexaoLenta.php <segundos-até-liberar-a-vaga> <arquivo-do-aceite>
 * Imprime a porta, em uma linha, no stdout, só depois de a vaga estar ocupada.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

$segundos = max(0, (int) ($argv[1] ?? 2));
$arquivoAceite = (string) ($argv[2] ?? '');

$contexto = stream_context_create(['socket' => ['backlog' => 0]]);
$servidor = stream_socket_server('tcp://127.0.0.1:0', $erroNumero, $erroTexto, STREAM_SERVER_BIND | STREAM_SERVER_LISTEN, $contexto);
if ($servidor === false) {
    fwrite(STDERR, "conexao lenta: sem porta: $erroTexto\n");
    exit(1);
}
$nome = (string) stream_socket_get_name($servidor, false);
$porta = (int) substr($nome, (int) strrpos($nome, ':') + 1);

// Ocupa a vaga. Guardado em variável: fechar o cliente aqui tiraria a conexão da fila antes do aceite.
$vaga = @stream_socket_client('tcp://127.0.0.1:' . $porta, $erroNumero2, $erroTexto2, 0, STREAM_CLIENT_ASYNC_CONNECT);
usleep(200000); // o handshake da vaga entra na fila em milissegundos

echo $porta . "\n";
flush();

sleep($segundos);
$ocupante = stream_socket_accept($servidor, 30);
if ($ocupante !== false) {
    fclose($ocupante);
}
$cliente = stream_socket_accept($servidor, 30);
if ($cliente === false) {
    exit(0);
}
file_put_contents($arquivoAceite, sprintf('%.6f', microtime(true)) . "\n");
// Calado: aceitou o cliente e não responde nada. O teste mata o processo depois de ver o prazo.
sleep(60);
exit(0);
