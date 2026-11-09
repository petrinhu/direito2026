<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/*
 * Guardas do cliente SMTP (EM-B2): transporte sem TLS só em loopback (D3), senha fora de rastro de exceção
 * (D4), exceção inesperada vira falha genérica (D4), e destinatário ASCII sem quebra de linha final (D5).
 * Os helpers de envio (correioEnviar etc.) ficam em correio.teste.php. Nenhum teste aqui abre conexão para
 * fora de 127.0.0.1: as guardas são testadas como funções puras, antes de qualquer rede.
 */

teste('e-mail: E26t transporte sem TLS só existe em 127.0.0.1 com porta; host real, outro loopback, nome e IPv6 são recusados', function (): void {
    correioCarregar();
    $recusados = [
        'tcp://smtp.hostinger.com:465',
        'tcp://127.0.0.2:25',
        'tcp://localhost:25',
        'tcp://[::1]:25',
        'tcp://127.0.0.1',
        'tcp://127.0.0.1:0',
    ];
    foreach ($recusados as $endereco) {
        igual(false, d26_correio_transporte_permitido(['endereco' => $endereco, 'tls' => false]), "tls=false em $endereco é recusado");
    }
    igual(true, d26_correio_transporte_permitido(['endereco' => 'tcp://127.0.0.1:2525', 'tls' => false]), 'tls=false em tcp://127.0.0.1:<porta> passa');
    igual(true, d26_correio_transporte_permitido(['endereco' => 'tcp://smtp.hostinger.com:465', 'tls' => true]), 'com TLS, o alvo segue a regra de produção');
}, false);

teste('e-mail: E27t rastro da exceção do envio não leva a senha, nem em texto puro nem em base64', function (): void {
    correioCarregar();
    $senha = 'SenhaCanarioRastro-EM-B2';
    $priv = correioPriv($senha);
    $ignorarArgs = (string) ini_get('zend.exception_ignore_args');
    $tamanhoArgs = (string) ini_get('zend.exception_string_param_max_len');
    // Liga o rastro com argumentos e sem corte: se a senha estiver ali, o teste a enxerga.
    ini_set('zend.exception_ignore_args', '0');
    ini_set('zend.exception_string_param_max_len', '200');
    try {
        igual('0', (string) ini_get('zend.exception_ignore_args'), 'prova válida: o rastro com argumentos ficou ligado');
        // (a) Servidor que não responde ao AUTH: a falha sai dentro da leitura da resposta.
        $falso = correioSmtpFalso(['auth' => []]);
        try {
            $e = correioEsperarFalha(fn () => correioEnviar(
                ['destinatario' => 'pessoa@example.com', 'assunto' => 'Rastro', 'corpo' => "Oi.\n"],
                $priv,
                $falso,
                ['prazoLeituraS' => 1, 'prazoTotalS' => 3]
            ));
            $rastro = $e->getTraceAsString();
            naoContem($senha, $rastro, '(a) a senha em texto puro não aparece no rastro');
            naoContem(base64_encode($senha), $rastro, '(a) a senha em base64 não aparece no rastro');
        } finally {
            correioFecharSmtpFalso($falso);
        }

        // (b) A escrita da linha de AUTH falha (peer já fechado). A linha leva a senha em base64, que é a
        // mesma informação: nenhum argumento do caminho de escrita pode carregá-la.
        $par = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
        if ($par === false) {
            falhar('sem par de sockets para a prova (b)');
        }
        [$lado, $outro] = $par;
        fclose($outro);
        $sessao = new D26SmtpSessao($lado, 3, 10);
        try {
            $e = correioEsperarFalha(fn () => d26_correio_autenticar($sessao, ['PLAIN'], D26_SMTP_USUARIO, static fn (): string => $senha));
            $rastro = $e->getTraceAsString();
            contem('escrever', $rastro, '(b) a falha veio do caminho de escrita da linha de AUTH');
            naoContem(base64_encode($senha), $rastro, '(b) a senha em base64 não aparece no rastro da escrita');
            naoContem($senha, $rastro, '(b) a senha em texto puro não aparece no rastro da escrita');
        } finally {
            $sessao->fechar();
        }
    } finally {
        ini_set('zend.exception_ignore_args', $ignorarArgs);
        ini_set('zend.exception_string_param_max_len', $tamanhoArgs);
    }
}, false);

teste('e-mail: E28t falha que não é D26EnvioFalhou vira falha genérica interna: sem exceção anterior, sem senha no rastro nem no log', function (): void {
    correioCarregar();
    $senha = 'SenhaCanarioInterno-EM-B2';
    $priv = correioPriv($senha);
    $ignorarArgs = (string) ini_get('zend.exception_ignore_args');
    ini_set('zend.exception_ignore_args', '0');
    try {
        // Endereço não-string: o TypeError do strict_types escapa de qualquer caminho que não o capture.
        $e = correioEsperarFalha(fn () => d26_correio_enviar(
            ['destinatario' => 'pessoa@example.com', 'assunto' => 'Interno', 'corpo' => "Oi.\n"],
            $priv,
            ['endereco' => 12345, 'tls' => false]
        ));
        igual('interno', $e->etapa, 'exceção inesperada vira a etapa interno');
        igual(null, $e->getPrevious(), 'sem exceção anterior, para a causa original não ir junto no rastro');
        naoContem($senha, $e->getTraceAsString(), 'o rastro não traz a senha');
        $log = correioErrosLog($priv);
        contem('etapa=interno', $log, 'erros.log registra a etapa interna');
        naoContem($senha, $log, 'erros.log não traz a senha');
    } finally {
        ini_set('zend.exception_ignore_args', $ignorarArgs);
    }
}, false);

teste('e-mail: E30t destinatário ASCII: quebra de linha no fim não passa, nem espaço', function (): void {
    correioCarregar();
    igual(true, d26_correio_destino_ascii('pessoa@example.com'), 'endereço comum passa');
    igual(false, d26_correio_destino_ascii("pessoa@example.com\n"), 'LF no fim não passa: \z, não $, que aceitaria antes do LF');
    igual(false, d26_correio_destino_ascii('pessoa@example.com '), 'espaço não passa');
}, false);
