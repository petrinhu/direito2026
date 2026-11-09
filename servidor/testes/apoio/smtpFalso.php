<?php
declare(strict_types=1);

/**
 * SMTP falso para os testes do cliente de envio (EM-B2). Só 127.0.0.1, só texto puro, nunca sai da
 * máquina. Aceita UMA conexão, responde pelo roteiro JSON e grava, byte a byte, tudo o que o cliente
 * mandou no arquivo de conversa. Se ninguém conectar dentro do prazo, sai sem criar o arquivo de
 * conversa: arquivo ausente prova que nenhuma conexão chegou.
 *
 * Uso: php smtpFalso.php <roteiro.json> <conversa.bin>
 * Imprime a porta, em uma linha, no stdout (o teste lê essa linha e nada mais).
 *
 * Roteiro (todas as chaves opcionais; valor é lista de linhas, sem CRLF):
 *   saudacao, ehlo, auth (resposta final do AUTH PLAIN ou do AUTH LOGIN), authLogin (2 respostas 334),
 *   mail, rcpt, data (resposta ao DATA), fim (resposta ao ponto final), quit,
 *   fecharNoData (bool: fecha a conexão depois da primeira linha da mensagem),
 *   mudoEm (string: ao receber um comando que começa por esse texto, para de responder),
 *   mudoAposData (bool: responde ao DATA com 354 e depois para de ler o corpo),
 *   tls (objeto {cert, chave}: fala TLS com esse certificado; sem handshake válido, sai sem conversa).
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

$roteiro = json_decode((string) file_get_contents($argv[1]), true, 16, JSON_THROW_ON_ERROR);
$arquivoConversa = $argv[2];

/** @param list<string>|string $linhas */
function smtpFalsoResponder(mixed $sock, array|string $linhas): void
{
    foreach ((array) $linhas as $linha) {
        fwrite($sock, $linha . "\r\n");
    }
}

/** @return list<string> */
function smtpFalsoLista(array $roteiro, string $chave, array $padrao): array
{
    $valor = $roteiro[$chave] ?? $padrao;
    return is_array($valor) ? array_values($valor) : $padrao;
}

$contextoServidor = isset($roteiro['tls'])
    ? stream_context_create(['ssl' => ['local_cert' => (string) $roteiro['tls']['cert'], 'local_pk' => (string) $roteiro['tls']['chave']]])
    : stream_context_create();
$servidor = stream_socket_server('tcp://127.0.0.1:0', $erroNumero, $erroTexto, STREAM_SERVER_BIND | STREAM_SERVER_LISTEN, $contextoServidor);
if ($servidor === false) {
    fwrite(STDERR, "smtp falso: sem porta: $erroTexto\n");
    exit(1);
}
$nome = (string) stream_socket_get_name($servidor, false);
echo substr($nome, (int) strrpos($nome, ':') + 1) . "\n";
flush();

$sock = stream_socket_accept($servidor, 30);
if ($sock === false) {
    exit(0);
}
fclose($servidor);
stream_set_timeout($sock, 30);

// Com `tls`, o handshake do servidor vem antes de qualquer linha. Se o cliente recusar o certificado,
// o servidor sai sem criar o arquivo de conversa: arquivo ausente prova que nada SMTP chegou em claro.
if (isset($roteiro['tls']) && @stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_SERVER) !== true) {
    fclose($sock);
    exit(0);
}

$conversa = fopen($arquivoConversa, 'wb');
$enviaSaudacao = (string) ($roteiro['saudacao'] ?? '220 smtp.falso.teste pronto');
smtpFalsoResponder($sock, $enviaSaudacao);

$mudoEm = isset($roteiro['mudoEm']) ? strtoupper((string) $roteiro['mudoEm']) : null;

while (($linha = fgets($sock)) !== false) {
    fwrite($conversa, $linha);
    $comando = strtoupper(rtrim($linha, "\r\n"));

    if ($mudoEm !== null && str_starts_with($comando, $mudoEm)) {
        // Mudo: não responde nunca mais; o teste mata o processo depois de ver o prazo estourar.
        sleep(60);
        exit(0);
    }

    if (str_starts_with($comando, 'EHLO') || str_starts_with($comando, 'HELO')) {
        smtpFalsoResponder($sock, smtpFalsoLista($roteiro, 'ehlo', ['250-smtp.falso.teste', '250 AUTH PLAIN LOGIN']));
    } elseif (str_starts_with($comando, 'AUTH PLAIN')) {
        smtpFalsoResponder($sock, smtpFalsoLista($roteiro, 'auth', ['235 autenticado']));
    } elseif (str_starts_with($comando, 'AUTH LOGIN')) {
        $dois = smtpFalsoLista($roteiro, 'authLogin', ['334 VXNlcm5hbWU6', '334 UGFzc3dvcmQ6']);
        smtpFalsoResponder($sock, $dois[0] ?? '334 VXNlcm5hbWU6');
        $usuarioLinha = fgets($sock);
        if ($usuarioLinha === false) {
            break;
        }
        fwrite($conversa, $usuarioLinha);
        smtpFalsoResponder($sock, $dois[1] ?? '334 UGFzc3dvcmQ6');
        $senhaLinha = fgets($sock);
        if ($senhaLinha === false) {
            break;
        }
        fwrite($conversa, $senhaLinha);
        smtpFalsoResponder($sock, smtpFalsoLista($roteiro, 'auth', ['235 autenticado']));
    } elseif (str_starts_with($comando, 'MAIL FROM:')) {
        smtpFalsoResponder($sock, smtpFalsoLista($roteiro, 'mail', ['250 remetente aceito']));
    } elseif (str_starts_with($comando, 'RCPT TO:')) {
        smtpFalsoResponder($sock, smtpFalsoLista($roteiro, 'rcpt', ['250 destinatario aceito']));
    } elseif ($comando === 'DATA') {
        smtpFalsoResponder($sock, smtpFalsoLista($roteiro, 'data', ['354 pode enviar']));
        if (($roteiro['mudoAposData'] ?? false) === true) {
            // Aceitou o DATA e parou de ler: o corpo fica preso no buffer do socket, e o teste mata o processo.
            sleep(60);
            exit(0);
        }
        $primeira = true;
        while (($dados = fgets($sock)) !== false) {
            fwrite($conversa, $dados);
            if ($primeira && ($roteiro['fecharNoData'] ?? false) === true) {
                break 2;
            }
            $primeira = false;
            if ($dados === ".\r\n") {
                smtpFalsoResponder($sock, smtpFalsoLista($roteiro, 'fim', ['250 mensagem aceita']));
                break;
            }
        }
    } elseif ($comando === 'QUIT') {
        smtpFalsoResponder($sock, smtpFalsoLista($roteiro, 'quit', ['221 tchau']));
        break;
    } else {
        smtpFalsoResponder($sock, '500 comando desconhecido');
    }
}

fclose($conversa);
fclose($sock);
exit(0);
