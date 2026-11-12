<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/*
 * Conferência do envelope sem enviar mensagem (EM-SMTP-APELIDO, adendo-corte-1700.md 22.2 e 22.3; condição O5 do
 * CISO). `conferir-smtp.php --envelope` faz AUTH, MAIL FROM, RCPT TO e QUIT, nunca DATA, e imprime só rótulos:
 * nunca o login, a senha nem o texto que o servidor SMTP devolveu. Os helpers ficam em correio.teste.php.
 * Nenhum teste aqui abre conexão para fora de 127.0.0.1.
 */

/** Roda o CLI contra o SMTP falso. @return array{int, string, string} [rc, stdout, stderr] */
function correioConferirEnvelope(string $priv, array $falso, bool $envelope): array
{
    $args = [$priv, '--destino=tcp://127.0.0.1:' . $falso['porta']];
    if ($envelope) {
        $args[] = '--envelope';
    }
    return rodarCliScript('conferir-smtp.php', $args, '');
}

/** Rótulos que a saída do CLI pode ter (O5). Qualquer outra linha reprova. */
const CORREIO_ROTULOS_CLI = ['tls', 'auth', 'mecanismos', 'codigo', 'etapa', 'remetente', 'destinatario'];

/** Cada linha não vazia começa por um rótulo permitido seguido de ": ". */
function correioSoRotulosPermitidos(string $saida, string $contexto): void
{
    $linhas = array_filter(explode("\n", $saida), static fn (string $l): bool => $l !== '');
    verdadeiro(count($linhas) > 0, "$contexto: a saída tem linhas (varredura não vazia)");
    foreach ($linhas as $linha) {
        $rotulo = explode(': ', $linha, 2)[0];
        verdadeiro(
            in_array($rotulo, CORREIO_ROTULOS_CLI, true) && str_contains($linha, ': '),
            "$contexto: toda linha começa por um rótulo permitido (veio uma linha com o rótulo '" . substr($rotulo, 0, 20) . "')"
        );
    }
}

teste('e-mail: E19u conferir-smtp --envelope contra o SMTP falso: AUTH, MAIL FROM e RCPT TO com o remetente, QUIT, nunca DATA; auth, remetente e destinatario sim; rc 0', function (): void {
    correioCarregar();
    $priv = correioPriv();
    $falso = correioSmtpFalso();
    try {
        [$rc, $saida, $erro] = correioConferirEnvelope($priv, $falso, true);
        igual(0, $rc, 'tudo aceito: rc 0');
        contem("auth: sim\n", $saida, 'imprime auth: sim');
        contem("remetente: sim\n", $saida, 'imprime remetente: sim');
        contem("destinatario: sim\n", $saida, 'imprime destinatario: sim');
        naoContem(CORREIO_LOGIN_SINTETICO, $saida . $erro, 'o login nunca sai na saída');
        naoContem(CORREIO_SENHA_SINTETICA, $saida . $erro, 'a senha nunca sai na saída');
        $conversa = (string) correioConversaFinal($falso);
        verdadeiro($conversa !== '', 'o CLI conectou ao SMTP falso');
        $linhas = explode("\r\n", $conversa);
        $posAuth = array_search('AUTH PLAIN ' . base64_encode(chr(0) . CORREIO_LOGIN_SINTETICO . chr(0) . CORREIO_SENHA_SINTETICA), $linhas, true);
        $posMail = array_search('MAIL FROM:<' . D26_REMETENTE . '>', $linhas, true);
        $posRcpt = array_search('RCPT TO:<' . D26_REMETENTE . '>', $linhas, true);
        $posQuit = array_search('QUIT', $linhas, true);
        verdadeiro($posAuth !== false, 'AUTH PLAIN com o login do arquivo');
        verdadeiro($posMail !== false && $posRcpt !== false && $posQuit !== false, 'MAIL FROM, RCPT TO e QUIT enviados com o remetente');
        verdadeiro($posAuth < $posMail && $posMail < $posRcpt && $posRcpt < $posQuit, 'ordem: AUTH, MAIL FROM, RCPT TO, QUIT');
        igual(1, substr_count($conversa, 'MAIL FROM'), 'um único MAIL FROM');
        igual(1, substr_count($conversa, 'RCPT TO'), 'um único RCPT TO');
        verdadeiro(!in_array('DATA', $linhas, true), 'nunca DATA: nenhuma mensagem existe');
        naoContem('RSET', $conversa, 'sem RSET (o QUIT sem DATA já descarta a transação)');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E19v conferir-smtp --envelope com 553 no MAIL FROM e, em outro caso, no RCPT TO: rótulo não, código 553, rc 1; nem a saída nem o log levam o login ou o texto da recusa', function (): void {
    correioCarregar();
    $textoRecusa = 'recusado para ' . CORREIO_LOGIN_SINTETICO . ' caixa autenticada';
    $casos = [
        'mail' => ['mail', ['remetente: não', 'destinatario: não', 'etapa: remetente'], false],
        'rcpt' => ['rcpt', ['remetente: sim', 'destinatario: não', 'etapa: destinatario'], true],
    ];
    foreach ($casos as $caso => [$chave, $esperadas, $mailAceito]) {
        $priv = correioPriv();
        $falso = correioSmtpFalso([$chave => ['553 5.7.1 ' . $textoRecusa]]);
        try {
            [$rc, $saida, $erro] = correioConferirEnvelope($priv, $falso, true);
            igual(1, $rc, "$caso: rc 1");
            contem("auth: sim\n", $saida, "$caso: a autenticação passou");
            foreach ($esperadas as $linha) {
                contem($linha . "\n", $saida, "$caso: imprime '$linha'");
            }
            contem("codigo: 553\n", $saida, "$caso: imprime o código 553");
            foreach ([$saida . $erro, correioErrosLog($priv)] as $onde) {
                naoContem(CORREIO_LOGIN_SINTETICO, $onde, "$caso: o login não está na saída nem no log");
                naoContem('caixa autenticada', $onde, "$caso: o texto da recusa não está na saída nem no log");
                naoContem('recusado para', $onde, "$caso: o texto da recusa não está na saída nem no log (início)");
                naoContem('5.7.1', $onde, "$caso: o código estendido do texto da recusa não está na saída nem no log");
            }
            $conversa = (string) correioConversaFinal($falso);
            igual(1, substr_count($conversa, 'MAIL FROM'), "$caso: MAIL FROM enviado");
            igual($mailAceito ? 1 : 0, substr_count($conversa, 'RCPT TO'), "$caso: RCPT TO só se o MAIL FROM foi aceito");
            naoContem("DATA\r\n", $conversa, "$caso: nunca DATA");
        } finally {
            correioFecharSmtpFalso($falso);
        }
    }
}, false);

teste('e-mail: E19w conferir-smtp --envelope com 535 no AUTH: auth não, código 535, envelope não tentado e nunca impresso como sim; sem o login na saída', function (): void {
    correioCarregar();
    $priv = correioPriv();
    $falso = correioSmtpFalso(['auth' => ['535 5.7.8 credenciais recusadas para ' . CORREIO_LOGIN_SINTETICO]]);
    try {
        [$rc, $saida, $erro] = correioConferirEnvelope($priv, $falso, true);
        igual(1, $rc, '535: rc 1');
        contem("auth: não\n", $saida, '535: imprime auth: não');
        contem("codigo: 535\n", $saida, '535: imprime o código');
        contem("etapa: auth\n", $saida, '535: imprime a etapa');
        naoContem('remetente: sim', $saida, '535: o envelope nunca aparece como sim');
        naoContem('destinatario: sim', $saida, '535: o envelope nunca aparece como sim');
        naoContem(CORREIO_LOGIN_SINTETICO, $saida . $erro . correioErrosLog($priv), '535: o login não está na saída nem no log');
        naoContem('credenciais recusadas', $saida . $erro . correioErrosLog($priv), '535: o texto do servidor não está na saída nem no log');
        $conversa = (string) correioConversaFinal($falso);
        naoContem('MAIL FROM', $conversa, '535: sem MAIL FROM');
        naoContem('RCPT TO', $conversa, '535: sem RCPT TO');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E19x toda linha que o CLI imprime, com e sem --envelope, começa por um rótulo permitido; sem --envelope nada do envelope aparece', function (): void {
    correioCarregar();
    $textoRecusa = '5.7.1 recusado para ' . CORREIO_LOGIN_SINTETICO;
    // (a) sem --envelope, tudo aceito: os cinco rótulos de sempre, nada do envelope.
    $priv = correioPriv();
    $falso = correioSmtpFalso();
    try {
        [$rc, $saida, $erro] = correioConferirEnvelope($priv, $falso, false);
        igual(0, $rc, '(a) rc 0');
        correioSoRotulosPermitidos($saida, '(a) sem --envelope');
        contem('auth: ', $saida, '(a) controle positivo: a saída tem o rótulo auth');
        naoContem('remetente', $saida, '(a) sem --envelope não há linha de remetente');
        naoContem('destinatario', $saida, '(a) sem --envelope não há linha de destinatario');
        igual('', $erro, '(a) nada em stderr');
    } finally {
        correioFecharSmtpFalso($falso);
    }
    // (b) com --envelope, tudo aceito.
    $priv = correioPriv();
    $falso = correioSmtpFalso();
    try {
        [$rc, $saida, $erro] = correioConferirEnvelope($priv, $falso, true);
        igual(0, $rc, '(b) rc 0');
        correioSoRotulosPermitidos($saida, '(b) com --envelope');
        contem('auth: ', $saida, '(b) controle positivo: a saída tem o rótulo auth');
        contem('remetente: ', $saida, '(b) a saída tem o rótulo remetente');
        contem('destinatario: ', $saida, '(b) a saída tem o rótulo destinatario');
        igual('', $erro, '(b) nada em stderr');
    } finally {
        correioFecharSmtpFalso($falso);
    }
    // (c) com --envelope e a recusa trazendo o login no texto: só rótulos.
    foreach (['mail', 'rcpt', 'auth'] as $chave) {
        $priv = correioPriv();
        $falso = correioSmtpFalso([$chave => [($chave === 'auth' ? '535 ' : '553 ') . $textoRecusa]]);
        try {
            [$rc, $saida, $erro] = correioConferirEnvelope($priv, $falso, true);
            igual(1, $rc, "(c) $chave: rc 1");
            correioSoRotulosPermitidos($saida, "(c) recusa em $chave");
            contem('auth: ', $saida, "(c) $chave: controle positivo: a saída tem o rótulo auth");
            naoContem(CORREIO_LOGIN_SINTETICO, $saida . $erro, "(c) $chave: o login não sai");
            igual('', $erro, "(c) $chave: nada em stderr");
        } finally {
            correioFecharSmtpFalso($falso);
        }
    }
}, false);
