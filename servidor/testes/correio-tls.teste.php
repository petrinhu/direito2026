<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/apoio/certificadosTeste.php';

/*
 * Handshake TLS do cliente SMTP (EM-B2, plano 8.1.6), contra servidor TLS local com CA de teste. Antes desta
 * suíte, nenhum teste fazia handshake de verdade: o contexto era conferido só como array (E16t). Aqui o
 * cliente de produção fala com um servidor que tem certificado de verdade, e a prova é o resultado do
 * handshake, não o array. Só 127.0.0.1. Os helpers de envio (correioEnviar etc.) são de correio.teste.php.
 */

teste('e-mail: E20t handshake com nome certo e CA de teste: passa, e o AUTH só aparece depois do TLS', function (): void {
    correioCarregar();
    $certs = certificadosDeTeste(dirTemporario());
    $desfazer = certificadosConfiarCa($certs['ca']);
    $priv = correioPriv();
    $falso = correioSmtpFalso(['tls' => $certs['bom']]);
    try {
        $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'TLS', 'corpo' => "Oi.\n"];
        correioEnviar($envio, $priv, $falso, ['tls' => true]);
        $conversa = (string) correioConversaFinal($falso);
        // A conversa só existe se o servidor completou o handshake: tudo nela já é pós-TLS.
        verdadeiro($conversa !== '', 'o servidor TLS completou o handshake com o nome certo');
        $posEhlo = strpos($conversa, 'EHLO ');
        $posAuth = strpos($conversa, 'AUTH PLAIN ');
        verdadeiro($posEhlo !== false && $posAuth !== false && $posEhlo < $posAuth, 'EHLO e depois AUTH PLAIN, na conversa pós-TLS');
        contem("MAIL FROM:<nao-responda@drpetrus.top>\r\n", $conversa, 'o envio seguiu depois do AUTH');
    } finally {
        $desfazer();
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E21t nome errado no certificado falha em tls e nenhuma linha SMTP chega ao servidor', function (): void {
    correioCarregar();
    $certs = certificadosDeTeste(dirTemporario());
    $desfazer = certificadosConfiarCa($certs['ca']);
    $priv = correioPriv();
    $falso = correioSmtpFalso(['tls' => $certs['errado']]);
    try {
        $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'TLS', 'corpo' => "Oi.\n"];
        $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso, ['tls' => true]));
        igual('tls', $e->etapa, 'nome errado: etapa tls');
        // Critério: nenhuma linha SMTP chegou ao servidor. Não é "arquivo ausente": medido, o servidor pode
        // criar a conversa vazia quando o cliente recusa o certificado depois de recebê-lo.
        igual('', (string) correioConversaFinal($falso), 'nome errado: nenhuma linha SMTP chegou ao servidor');
    } finally {
        $desfazer();
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E22t certificado autoassinado falha em tls mesmo com nome certo e nenhuma linha SMTP chega ao servidor', function (): void {
    correioCarregar();
    $certs = certificadosDeTeste(dirTemporario());
    $desfazer = certificadosConfiarCa($certs['ca']);
    $priv = correioPriv();
    $falso = correioSmtpFalso(['tls' => $certs['auto']]);
    try {
        $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'TLS', 'corpo' => "Oi.\n"];
        $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso, ['tls' => true]));
        igual('tls', $e->etapa, 'autoassinado: etapa tls');
        igual('', (string) correioConversaFinal($falso), 'autoassinado: nenhuma linha SMTP chegou ao servidor');
    } finally {
        $desfazer();
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E23t servidor de texto puro falha em tls sem receber EHLO nem AUTH', function (): void {
    correioCarregar();
    $certs = certificadosDeTeste(dirTemporario());
    $desfazer = certificadosConfiarCa($certs['ca']);
    $priv = correioPriv();
    // Sem roteiro `tls`: o servidor responde 220 em texto puro logo ao aceitar, como um SMTP sem TLS.
    $falso = correioSmtpFalso();
    try {
        $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'TLS', 'corpo' => "Oi.\n"];
        $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso, ['tls' => true]));
        igual('tls', $e->etapa, 'texto puro: etapa tls');
        $recebido = (string) correioConversaFinal($falso);
        naoContem('EHLO', $recebido, 'texto puro: nenhum EHLO chegou ao servidor');
        naoContem('AUTH', $recebido, 'texto puro: nenhum AUTH chegou ao servidor');
    } finally {
        $desfazer();
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E24t alvo de produção (litespeed e fpm) é TLS: tls === true, e o teste de loopback não o desliga', function (): void {
    correioCarregar();
    foreach (['litespeed', 'fpm-fcgi'] as $sapi) {
        $alvo = d26_correio_alvo($sapi, null);
        igual(true, $alvo['tls'], "$sapi sem teste: tls verdadeiro");
        $alvo = d26_correio_alvo($sapi, 'tcp://127.0.0.1:2525');
        igual(true, $alvo['tls'], "$sapi com D26_SMTP_TESTE de loopback: tls verdadeiro");
    }
}, false);
