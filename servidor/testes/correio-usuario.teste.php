<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/*
 * Login do SMTP lido do privado (EM-SMTP-APELIDO, adendo-corte-1700.md 22.2 e 22.3; condições O3 e O4 do CISO).
 * O login mora em smtp.usuario, tratado como a senha: recusa antes de conectar, viaja por closure e sai pelo
 * caminho de escrita sigilosa. Os helpers (correioPriv, correioEnviar, correioSmtpFalso) ficam em
 * correio.teste.php; a varredura em base64 (correioNaoVazaSenhaEmBase64) fica em correio-guardas.teste.php.
 * Nenhum teste aqui abre conexão para fora de 127.0.0.1.
 */

/** Porta de loopback sem ninguém escutando: se o código conectasse, a etapa seria conexao, não smtp-usuario. */
const CORREIO_PORTA_SEM_ESCUTA = 1;

/**
 * Socket de teste em stream de wrapper de usuário: lê linhas de um roteiro e faz a N-ésima escrita falhar.
 * Serve para forçar falha de escrita na linha do login no AUTH LOGIN, que um socket real não dá de forma
 * determinística (a primeira escrita depois que o par fecha costuma passar).
 */
final class CorreioSocketRoteirizado
{
    /** @var resource|null */
    public $context;
    /** @var list<string> */
    public static array $leituras = [];
    public static int $falharNaEscrita = 0;
    public static int $escritas = 0;
    private string $buffer = '';

    public function stream_open(string $caminho, string $modo, int $opcoes, ?string &$aberto): bool
    {
        $this->buffer = implode('', self::$leituras);
        return true;
    }

    public function stream_read(int $quantos): string
    {
        $parte = substr($this->buffer, 0, $quantos);
        $this->buffer = (string) substr($this->buffer, strlen($parte));
        return $parte;
    }

    public function stream_eof(): bool
    {
        return $this->buffer === '';
    }

    public function stream_write(string $dados): int
    {
        self::$escritas++;
        return self::$escritas === self::$falharNaEscrita ? 0 : strlen($dados);
    }

    public function stream_set_option(int $opcao, int $arg1, ?int $arg2): bool
    {
        return false;
    }

    public function stream_close(): void
    {
    }
}

/**
 * Sessão SMTP sobre o socket roteirizado. `$leituras` são as respostas que o servidor daria; a escrita de número
 * `$falharNaEscrita` (1 é a primeira) falha.
 *
 * @param list<string> $leituras
 */
function correioSessaoRoteirizada(array $leituras, int $falharNaEscrita): D26SmtpSessao
{
    if (!in_array('correio-roteirizado', stream_get_wrappers(), true)) {
        stream_wrapper_register('correio-roteirizado', CorreioSocketRoteirizado::class);
    }
    CorreioSocketRoteirizado::$leituras = $leituras;
    CorreioSocketRoteirizado::$falharNaEscrita = $falharNaEscrita;
    CorreioSocketRoteirizado::$escritas = 0;
    $sock = fopen('correio-roteirizado://sessao', 'r+');
    if ($sock === false) {
        falhar('sem socket roteirizado para a prova');
    }
    return new D26SmtpSessao($sock, 3, 10);
}

/**
 * Textos que o rastro de uma exceção expõe: a linha do rastro (getTraceAsString) e cada string, valor ou chave, de
 * cada argumento de cada quadro (getTrace, percorrido por inteiro, inclusive em listas aninhadas). Objeto entra só
 * pela classe: print_r de um Closure mostra a variável capturada (medido em PHP 8.5), e nenhum log do produto
 * faz isso, então introspectar objeto seria falso positivo eterno.
 *
 * @return list<string>
 */
function correioTextosDoRastro(Throwable $e): array
{
    $textos = [$e->getMessage(), $e->getTraceAsString()];
    $percorrer = static function (mixed $valor) use (&$percorrer, &$textos): void {
        if (is_string($valor)) {
            $textos[] = $valor;
        } elseif (is_array($valor)) {
            foreach ($valor as $chave => $item) {
                $textos[] = (string) $chave;
                $percorrer($item);
            }
        } elseif (is_object($valor)) {
            $textos[] = $valor::class;
        }
    };
    foreach ($e->getTrace() as $quadro) {
        $percorrer($quadro['args'] ?? []);
    }
    $anterior = $e->getPrevious();
    if ($anterior !== null) {
        array_push($textos, ...correioTextosDoRastro($anterior));
    }
    return $textos;
}

/** Falha se $segredo aparece, em claro ou em base64 (três deslocamentos), em algum dos textos. */
function correioNaoVazaEmNenhum(string $segredo, array $textos, string $contexto): void
{
    foreach ($textos as $texto) {
        naoContem($segredo, $texto, "$contexto: em claro");
        correioNaoVazaSenhaEmBase64($segredo, $texto, $contexto);
    }
}

teste('e-mail: E15u smtp.usuario ausente, vazio, curto, grande, com modo errado, com quebra de linha, espaço ou byte fora do ASCII recusa antes de conectar, classe smtp-usuario, sem conteúdo no log', function (): void {
    correioCarregar();
    $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'Usuario', 'corpo' => 'x'];
    // Sem ninguém escutando: se alguma recusa abrisse conexão, a etapa seria conexao. Este teste não abre escuta.
    $semEscuta = ['porta' => CORREIO_PORTA_SEM_ESCUTA];
    // Cada caso viola UMA regra só: conteúdo ou modo, o resto válido. O canário não pode ir ao log.
    $casos = [
        'ausente' => [null, 0600, ''],
        'vazio' => ['', 0600, ''],
        '2 bytes (abaixo do piso de 3)' => ['Qz', 0600, 'Qz'],
        '255 bytes (acima do teto de 254)' => [str_repeat('Q', 255), 0600, 'QQQQ'],
        'modo 644' => ['CanarioModo644@example.com', 0644, 'CanarioModo644'],
        'modo 640' => ['CanarioModo640@example.com', 0640, 'CanarioModo640'],
        'modo 400' => ['CanarioModo400@example.com', 0400, 'CanarioModo400'],
        'LF no fim' => ["CanarioLF@example.com\n", 0600, 'CanarioLF'],
        'CRLF no fim' => ["CanarioCRLF@example.com\r\n", 0600, 'CanarioCRLF'],
        'CR no meio' => ["CanarioCR\r@example.com", 0600, 'CanarioCR'],
        'NUL no meio' => ["CanarioNUL\0@example.com", 0600, 'CanarioNUL'],
        'espaço no meio' => ['CanarioEspaco @example.com', 0600, 'CanarioEspaco'],
        'espaço no início' => [' CanarioEspacoInicio@example.com', 0600, 'CanarioEspacoInicio'],
        'byte fora do ASCII' => ['CanarioAcentoé@example.com', 0600, 'CanarioAcento'],
    ];
    foreach ($casos as $caso => [$conteudo, $modo, $canario]) {
        $priv = correioPriv(CORREIO_SENHA_SINTETICA, 0600, $conteudo, $modo);
        $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $semEscuta));
        igual('smtp-usuario', $e->etapa, "$caso: etapa smtp-usuario, e não conexao (nenhuma conexão foi tentada)");
        igual(null, $e->codigo, "$caso: sem código");
        $log = correioErrosLog($priv);
        contem('etapa=smtp-usuario', $log, "$caso: classe no erros.log");
        if ($canario !== '') {
            naoContem($canario, $log, "$caso: sem conteúdo do arquivo no log");
            naoContem($canario, $e->getMessage() . $e->getTraceAsString(), "$caso: sem conteúdo do arquivo na exceção");
        }
    }

    // Arquivo que é diretório: não é arquivo.
    $priv = correioPriv(CORREIO_SENHA_SINTETICA, 0600, null);
    mkdir($priv . '/smtp.usuario', 0700);
    $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $semEscuta));
    igual('smtp-usuario', $e->etapa, 'smtp.usuario que é diretório: etapa smtp-usuario');

    // O login é lido antes da senha: com os dois ausentes, a classe é a do login.
    $priv = correioPriv(CORREIO_SENHA_SINTETICA, 0600, null);
    unlink($priv . '/smtp.senha');
    $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $semEscuta));
    igual('smtp-usuario', $e->etapa, 'login e senha ausentes: o login é lido primeiro');

    // Controle positivo: com o arquivo válido, a mesma porta sem escuta chega à conexão. É o que torna a prova
    // acima uma prova (sem ele, "etapa smtp-usuario" poderia ser só uma recusa qualquer).
    $priv = correioPriv();
    $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $semEscuta));
    igual('conexao', $e->etapa, 'controle positivo: com smtp.usuario válido o envio tenta conectar e falha na conexão');
}, false);

teste('e-mail: E10u smtp.usuario igual ao remetente envia (plano B sem código novo); 3 e 254 bytes são aceitos', function (): void {
    correioCarregar();
    $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'Plano B', 'corpo' => "Oi.\n"];
    $logins = [
        'igual ao remetente' => D26_REMETENTE,
        'no piso, 3 bytes' => 'a@b',
        'no teto, 254 bytes' => str_repeat('a', 254),
    ];
    foreach ($logins as $caso => $login) {
        $priv = correioPriv(CORREIO_SENHA_SINTETICA, 0600, $login);
        $falso = correioSmtpFalso();
        try {
            correioEnviar($envio, $priv, $falso);
            $conversa = correioConversaFinal($falso);
            verdadeiro($conversa !== null, "$caso: o SMTP falso recebeu a conexão");
            $auth = null;
            foreach (explode("\r\n", $conversa) as $linha) {
                if (str_starts_with($linha, 'AUTH PLAIN ')) {
                    $auth = substr($linha, 11);
                }
            }
            verdadeiro($auth !== null, "$caso: AUTH PLAIN enviado");
            igual(chr(0) . $login . chr(0) . CORREIO_SENHA_SINTETICA, base64_decode((string) $auth), "$caso: o AUTH leva o login do arquivo");
            contem("MAIL FROM:<nao-responda@drpetrus.top>\r\n", $conversa, "$caso: o MAIL FROM leva o remetente");
        } finally {
            correioFecharSmtpFalso($falso);
        }
    }
}, false);

teste('e-mail: E27u login e senha nunca em arquivo do privado (fora dos dois de origem) nem no log de erro do PHP, em claro ou em base64, depois de um envio que dá certo e de um que falha', function (): void {
    correioCarregar();
    $login = 'LoginCanarioApelido-EM-AP@example.com';
    $senha = 'SenhaCanarioApelido-EM-AP-5519';
    $priv = correioPriv($senha, 0600, $login);
    $dirLog = dirTemporario();
    $logPhp = $dirLog . '/php-erros.log';
    $anteriorLog = (string) ini_get('error_log');
    $anteriorLogar = (string) ini_get('log_errors');
    ini_set('error_log', $logPhp);
    ini_set('log_errors', '1');
    try {
        // Controle do canal: o log de erro do PHP do teste existe e recebe escrita.
        error_log('canario-do-canal-de-log');
        verdadeiro(str_contains((string) @file_get_contents($logPhp), 'canario-do-canal-de-log'), 'prova válida: o log de erro do PHP do teste recebe escrita');

        $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'Varredura', 'corpo' => "Oi.\n"];
        // (a) envio que dá certo; controle positivo: o login do arquivo é o que viajou no AUTH.
        $falso = correioSmtpFalso();
        try {
            correioEnviar($envio, $priv, $falso);
            $conversa = (string) correioConversaFinal($falso);
            contem(base64_encode(chr(0) . $login . chr(0) . $senha), $conversa, 'controle positivo: o login e a senha do arquivo foram usados no AUTH');
        } finally {
            correioFecharSmtpFalso($falso);
        }
        // (b) envio que falha (535).
        $falso = correioSmtpFalso(['auth' => ['535 5.7.8 credenciais recusadas']]);
        try {
            $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso));
            igual(535, $e->codigo, 'o envio que falha deu 535');
        } finally {
            correioFecharSmtpFalso($falso);
        }

        // Varredura: todo arquivo do privado, menos os dois de origem (por nome exato), e o log de erro do PHP.
        $varridos = 0;
        $alvos = [];
        $iterador = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($priv, FilesystemIterator::SKIP_DOTS));
        foreach ($iterador as $arquivo) {
            if ($arquivo->isFile() && !in_array($arquivo->getFilename(), ['smtp.usuario', 'smtp.senha'], true)) {
                $alvos[] = $arquivo->getPathname();
            }
        }
        $alvos[] = $logPhp;
        foreach ($alvos as $alvo) {
            $conteudo = (string) file_get_contents($alvo);
            correioNaoVazaEmNenhum($login, [$conteudo], 'login em ' . basename($alvo));
            correioNaoVazaEmNenhum($senha, [$conteudo], 'senha em ' . basename($alvo));
            $varridos++;
        }
        echo "      [E27u] arquivos varridos: $varridos (" . implode(', ', array_map('basename', $alvos)) . ")\n";
        verdadeiro($varridos >= 2, 'piso de varredura: ao menos o erros.log e o log de erro do PHP foram varridos');
        contem('etapa=auth codigo=535', correioErrosLog($priv), 'o erros.log varrido tem a falha que o teste provocou');
    } finally {
        ini_set('error_log', $anteriorLog);
        ini_set('log_errors', $anteriorLogar);
    }
}, false);

teste('e-mail: E27v falha de escrita no AUTH (PLAIN e LOGIN): o login não está na mensagem, na exceção anterior, nos argumentos do rastro nem no erros.log', function (): void {
    correioCarregar();
    $login = 'LoginCanarioRastro-EM-AP@example.com';
    $senha = 'SenhaCanarioRastro-EM-AP-8821';
    $ignorarArgs = (string) ini_get('zend.exception_ignore_args');
    $tamanhoArgs = (string) ini_get('zend.exception_string_param_max_len');
    // Rastro com argumentos e sem corte: se o login estiver em algum argumento, a varredura enxerga.
    ini_set('zend.exception_ignore_args', '0');
    ini_set('zend.exception_string_param_max_len', '4096');
    try {
        igual('0', (string) ini_get('zend.exception_ignore_args'), 'prova válida: o rastro com argumentos ficou ligado');
        $usuarioFn = static fn (): string => $login;
        $senhaFn = static fn (): string => $senha;

        // (a) AUTH PLAIN: a primeira escrita (a linha AUTH) falha.
        $sessao = correioSessaoRoteirizada([], 1);
        $e = correioEsperarFalha(fn () => d26_correio_autenticar($sessao, ['PLAIN'], $usuarioFn, $senhaFn));
        $textos = correioTextosDoRastro($e);
        contem('PLAIN', implode("\n", $textos), 'prova válida: a varredura enxerga um argumento conhecido do rastro (a lista de mecanismos)');
        contem('escreverSigiloso', $e->getTraceAsString(), '(a) a falha veio do caminho de escrita sigilosa');
        correioNaoVazaEmNenhum($login, $textos, '(a) PLAIN, login');
        correioNaoVazaEmNenhum($senha, $textos, '(a) PLAIN, senha');
        correioNaoVazaEmNenhum(base64_encode("\0" . $login . "\0" . $senha), $textos, '(a) PLAIN, linha AUTH inteira');

        // (b) AUTH LOGIN: "AUTH LOGIN" sai, o servidor pede o usuário (334) e a escrita da linha do login falha.
        $sessao = correioSessaoRoteirizada(["334 VXNlcm5hbWU6\r\n"], 2);
        $e = correioEsperarFalha(fn () => d26_correio_autenticar($sessao, ['LOGIN'], $usuarioFn, $senhaFn));
        igual(2, CorreioSocketRoteirizado::$escritas, '(b) a segunda escrita (a linha do login) foi a que falhou');
        $textos = correioTextosDoRastro($e);
        contem('LOGIN', implode("\n", $textos), 'prova válida (b): a varredura enxerga um argumento conhecido do rastro');
        contem('escreverSigiloso', $e->getTraceAsString(), '(b) a linha do login sai pela escrita sigilosa');
        correioNaoVazaEmNenhum($login, $textos, '(b) LOGIN, login');
        correioNaoVazaEmNenhum($senha, $textos, '(b) LOGIN, senha');

        // (c) pelo envio inteiro: servidor que não responde ao AUTH. Mensagem, anterior, rastro e erros.log sem o login.
        $priv = correioPriv($senha, 0600, $login);
        $falso = correioSmtpFalso(['mudoEm' => 'AUTH']);
        try {
            $e = correioEsperarFalha(fn () => correioEnviar(
                ['destinatario' => 'pessoa@example.com', 'assunto' => 'Rastro', 'corpo' => "Oi.\n"],
                $priv,
                $falso,
                ['prazoLeituraS' => 1, 'prazoTotalS' => 3]
            ));
            igual('auth', $e->etapa, '(c) a falha é da etapa auth');
            $textos = correioTextosDoRastro($e);
            contem($priv, implode("\n", $textos), 'prova válida (c): a varredura enxerga um argumento conhecido (o caminho do privado)');
            correioNaoVazaEmNenhum($login, $textos, '(c) envio, login');
            correioNaoVazaEmNenhum($senha, $textos, '(c) envio, senha');
            correioNaoVazaEmNenhum($login, [correioErrosLog($priv)], '(c) erros.log, login');
            contem('etapa=auth', correioErrosLog($priv), '(c) o erros.log tem a falha que o teste provocou');
        } finally {
            correioFecharSmtpFalso($falso);
        }
    } finally {
        ini_set('zend.exception_ignore_args', $ignorarArgs);
        ini_set('zend.exception_string_param_max_len', $tamanhoArgs);
    }
}, false);

teste('e-mail: E19y as recusas do smtp.usuario valem também na conferência (CLI): auth não, etapa smtp-usuario, rc 1 e o SMTP falso sem conexão', function (): void {
    correioCarregar();
    $falso = correioSmtpFalso();
    try {
        $casos = [
            'ausente' => [null, 0600, ''],
            'vazio' => ['', 0600, ''],
            '2 bytes' => ['Qz', 0600, 'Qz'],
            '255 bytes' => [str_repeat('Q', 255), 0600, 'QQQQ'],
            'modo 644' => ['CanarioModo644@example.com', 0644, 'CanarioModo644'],
            'LF no fim' => ["CanarioLF@example.com\n", 0600, 'CanarioLF'],
            'espaço' => ['CanarioEspaco @example.com', 0600, 'CanarioEspaco'],
        ];
        foreach ($casos as $caso => [$conteudo, $modo, $canario]) {
            $priv = correioPriv(CORREIO_SENHA_SINTETICA, 0600, $conteudo, $modo);
            [$rc, $saida, $erro] = rodarCliScript('conferir-smtp.php', [$priv, '--destino=tcp://127.0.0.1:' . $falso['porta']], '');
            igual(1, $rc, "$caso: rc 1");
            contem('auth: não', $saida, "$caso: imprime auth: não");
            contem('etapa: smtp-usuario', $saida, "$caso: imprime a etapa smtp-usuario");
            if ($canario !== '') {
                naoContem($canario, $saida . $erro, "$caso: o conteúdo do arquivo não sai");
            }
        }
        igual(null, correioConversaFinal($falso, 1.0), 'nenhuma recusa de login abriu conexão com o SMTP falso');

        // Controle positivo: com o arquivo válido o mesmo CLI conecta (o SMTP falso recebe a conversa).
        $priv = correioPriv();
        [$rc, $saida] = rodarCliScript('conferir-smtp.php', [$priv, '--destino=tcp://127.0.0.1:' . $falso['porta']], '');
        igual(0, $rc, 'controle positivo: com smtp.usuario válido, rc 0');
        contem('auth: sim', $saida, 'controle positivo: auth: sim');
        verdadeiro(correioConversaFinal($falso) !== null, 'controle positivo: o SMTP falso recebeu a conexão do CLI');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);
