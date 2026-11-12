<?php
declare(strict_types=1);

/**
 * Conferência do SMTP da caixa de envio, sem mandar e-mail (EM-B2, plano-sessao-unica.md 8.1.8).
 * Abre a conexão (com TLS verificado, em produção), confere o certificado, faz EHLO e AUTH e sai com QUIT.
 * Sem --envelope, nunca manda MAIL FROM. Nunca imprime o login, a senha nem o texto que o servidor devolveu.
 *
 * Uso:  php conferir-smtp.php <dir-privado> [--destino=tcp://127.0.0.1:<porta>] [--envelope]
 *
 * Com --envelope, depois do AUTH confere o envelope: MAIL FROM e RCPT TO com o remetente do site e QUIT. Nunca manda
 * DATA: nenhuma mensagem existe. Imprime duas linhas a mais, `remetente` e `destinatario` (sim ou não).
 *
 * Sem --destino, a conexão é a de produção (smtp.hostinger.com:465). Com --destino, a conexão vai só para
 * loopback e sem TLS: é o SMTP falso dos testes. Qualquer outro destino é recusado.
 * No servidor, aponte o núcleo por D26_NUCLEO=<pasta api/nucleo publicada>.
 * Sai com 0 se a autenticação passou (e, com --envelope, se o remetente e o destinatário também foram aceitos), e com
 * 1 nos demais casos. A saída só tem as linhas de rótulo tls, auth, mecanismos, codigo, etapa, remetente e destinatario.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

require __DIR__ . '/apoio/cli.php';

$cmd = 'conferir-smtp';
// Erro inesperado sai em uma linha, sem pilha: a conferência só vê o privado, nunca o arquivo de contas.
set_exception_handler(static function (Throwable $e) use ($cmd): void {
    fwrite(STDERR, "$cmd: erro interno (detalhes omitidos de propósito)\n");
    exit(1);
});
d26_cli_carregar_nucleo($cmd, ['config', 'respostas', 'correio']);

[$pos, $opcoes] = d26_cli_separar($cmd, array_slice($argv, 1), ['destino', 'envelope']);
if (count($pos) !== 1) {
    d26_cli_falha($cmd, 'uso: php conferir-smtp.php <dir-privado> [--destino=tcp://127.0.0.1:<porta>] [--envelope]');
}
if (($opcoes['envelope'] ?? '') !== '') {
    d26_cli_falha($cmd, '--envelope não leva valor');
}
$envelope = array_key_exists('envelope', $opcoes);
$priv = rtrim($pos[0], '/');
if (!is_dir($priv)) {
    d26_cli_falha($cmd, 'diretório privado não encontrado');
}

if (array_key_exists('destino', $opcoes)) {
    $loopback = d26_correio_loopback($opcoes['destino']);
    if ($loopback === null) {
        d26_cli_falha($cmd, '--destino recusado: só tcp://127.0.0.1:<porta>');
    }
    $alvo = ['endereco' => $loopback, 'tls' => false];
} else {
    $alvo = d26_correio_alvo(PHP_SAPI, getenv('D26_SMTP_TESTE') ?: null);
}

$resultado = d26_correio_conferir($priv, $alvo, $envelope);
echo 'tls: ' . ($resultado['tls'] ? 'sim' : 'não') . "\n";
echo 'auth: ' . ($resultado['auth'] ? 'sim' : 'não') . "\n";
if ($envelope) {
    echo 'remetente: ' . ($resultado['remetente'] ? 'sim' : 'não') . "\n";
    echo 'destinatario: ' . ($resultado['destinatario'] ? 'sim' : 'não') . "\n";
}
if ($resultado['mecanismos'] !== []) {
    echo 'mecanismos: ' . implode(' ', $resultado['mecanismos']) . "\n";
}
if ($resultado['codigo'] !== null) {
    echo 'codigo: ' . $resultado['codigo'] . "\n";
}
if ($resultado['etapa'] !== null) {
    echo 'etapa: ' . $resultado['etapa'] . "\n";
}
exit($resultado['auth'] && (!$envelope || ($resultado['remetente'] && $resultado['destinatario'])) ? 0 : 1);
