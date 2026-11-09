<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Cliente SMTP mínimo do envio de e-mail (EM-B2, plano-sessao-unica.md 8.1.6 e 8.1.8).
 *
 * Sem biblioteca: decisão do orquestrador (R15, a ratificar), para não instalar nada (L-51). Usa só
 * stream_socket_client, quoted_printable_encode, base64_encode e a extensão openssl (K2).
 *
 * Invariantes:
 *  - Antes de qualquer conexão, o envio está validado: cabeçalhos sem CR, LF ou NUL, destinatário em
 *    ASCII, assunto em UTF-8 com até 45 bytes (uma encoded-word, RFC 2047), corpo sem NUL, senha lida.
 *  - Produção fala só TLS verificado com smtp.hostinger.com (sem self-signed, sem texto puro, sem a porta
 *    587). Texto puro existe só para destino de teste em loopback: sob cli-server com D26_SMTP_TESTE, ou
 *    pela opção --destino do CLI conferir-smtp.
 *  - A senha sai só no AUTH. Erro, log e saída não levam senha, texto do servidor nem endereço (TE3).
 *  - Toda leitura tem prazo, e o envio inteiro tem prazo total. Não há leitura sem prazo.
 *
 * Limite declarado: a escrita no socket não tem prazo próprio. A mensagem é pequena (cabeçalhos e texto
 * curto), e o prazo total cobre as leituras que a seguem.
 */

const D26_SMTP_SENHA_ARQUIVO = 'smtp.senha';
const D26_SMTP_SENHA_MAX = 256;
/** Encoded-word RFC 2047: 10 + base64 + 2 caracteres, no máximo 75. Com 45 bytes, base64 tem 60. */
const D26_SMTP_ASSUNTO_MAX = 45;
const D26_SMTP_CORPO_MAX = 65536;
const D26_SMTP_LINHA_MAX = 1024;
const D26_SMTP_RESPOSTA_LINHAS_MAX = 100;
const D26_SMTP_TLS_METODO = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;

/**
 * Falha de envio. `etapa` diz onde parou: alvo, smtp-senha, cabecalho, destino, corpo (antes de conectar);
 * conexao, tls, auth, remetente, destinatario, dados (depois). `codigo` é o código de 3 dígitos do servidor,
 * quando houve resposta. A mensagem leva só a etapa e o código: o texto do servidor nunca entra aqui.
 */
final class D26EnvioFalhou extends RuntimeException
{
    public function __construct(public readonly string $etapa, public readonly ?int $codigo = null)
    {
        parent::__construct('envio falhou na etapa ' . $etapa . ($codigo === null ? '' : ' (código ' . $codigo . ')'));
    }
}

/**
 * Destino da conexão. Função pura, para o teste conferir sem rede. Fora do cli-server, é sempre produção,
 * e D26_SMTP_TESTE é ignorado (H3). Sob cli-server, só tcp://127.0.0.1:<porta> passa; sem ele, recusa.
 *
 * @return array{endereco: string, tls: bool}
 */
function d26_correio_alvo(string $sapi, ?string $envTeste): array
{
    if ($sapi !== 'cli-server') {
        return ['endereco' => 'tcp://' . D26_SMTP_HOST . ':' . D26_SMTP_PORTA, 'tls' => true];
    }
    $loopback = d26_correio_loopback($envTeste);
    if ($loopback === null) {
        throw new D26EnvioFalhou('alvo');
    }
    return ['endereco' => $loopback, 'tls' => false];
}

/** Aceita só tcp://127.0.0.1:<porta>. Qualquer outro valor é recusado: a senha nunca sai da máquina. */
function d26_correio_loopback(?string $valor): ?string
{
    if ($valor === null || preg_match('#^tcp://127\.0\.0\.1:([1-9][0-9]{0,4})$#D', $valor, $m) !== 1) {
        return null;
    }
    return (int) $m[1] <= 65535 ? $valor : null;
}

/**
 * Contexto TLS de produção (plano 8.1.6): certificado verificado contra o nome do servidor, sem self-signed,
 * só TLS 1.2 ou 1.3.
 *
 * @return array{ssl: array<string, mixed>}
 */
function d26_correio_contexto_tls(): array
{
    return ['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => D26_SMTP_HOST,
        'allow_self_signed' => false,
        'SNI_enabled' => true,
        'crypto_method' => D26_SMTP_TLS_METODO,
    ]];
}

/**
 * Valida tudo o que vai ao fio antes de abrir conexão. Cabeçalho com CR, LF ou NUL é recusado aqui,
 * porque sem isso um destinatário ou um assunto abriria cabeçalho novo (injeção).
 *
 * @param array{destinatario: string, assunto: string, corpo: string} $envio
 */
function d26_correio_validar(array $envio): void
{
    foreach ([$envio['destinatario'], $envio['assunto']] as $valor) {
        if (preg_match('/[\r\n\0]/', $valor) === 1) {
            throw new D26EnvioFalhou('cabecalho');
        }
    }
    if (preg_match('/^[\x21-\x7E]+$/', $envio['destinatario']) !== 1
        || filter_var($envio['destinatario'], FILTER_VALIDATE_EMAIL) === false) {
        throw new D26EnvioFalhou('destino');
    }
    if ($envio['assunto'] === '' || preg_match('//u', $envio['assunto']) !== 1
        || strlen($envio['assunto']) > D26_SMTP_ASSUNTO_MAX) {
        throw new D26EnvioFalhou('cabecalho');
    }
    if (str_contains($envio['corpo'], "\0") || strlen($envio['corpo']) > D26_SMTP_CORPO_MAX) {
        throw new D26EnvioFalhou('corpo');
    }
}

/**
 * Lê a senha da caixa do privado. Recusa (etapa smtp-senha) se o arquivo faltar, estiver vazio, passar de
 * 256 bytes, tiver quebra de linha ou NUL, ou não for modo 600. Nunca devolve nem registra o conteúdo.
 */
function d26_correio_senha(string $priv): string
{
    $arquivo = $priv . '/' . D26_SMTP_SENHA_ARQUIVO;
    $tamanho = is_file($arquivo) ? filesize($arquivo) : false;
    if ($tamanho === false || $tamanho < 1 || $tamanho > D26_SMTP_SENHA_MAX || (fileperms($arquivo) & 0777) !== 0600) {
        throw new D26EnvioFalhou('smtp-senha');
    }
    $senha = file_get_contents($arquivo);
    if (!is_string($senha) || strlen($senha) !== $tamanho || preg_match('/[\r\n\0]/', $senha) === 1) {
        throw new D26EnvioFalhou('smtp-senha');
    }
    return $senha;
}

/**
 * Mensagem completa em CRLF, sem o ponto final do DATA. Texto puro em quoted-printable. Remetente exato,
 * sem nome de exibição; Message-ID aleatório no domínio do remetente; Auto-Submitted contra resposta
 * automática (RFC 3834).
 *
 * @param array{destinatario: string, assunto: string, corpo: string} $envio
 */
function d26_correio_montar(array $envio): string
{
    $dominio = substr((string) strrchr(D26_REMETENTE, '@'), 1);
    $corpo = str_replace("\n", "\r\n", str_replace(["\r\n", "\r"], "\n", $envio['corpo']));
    $codificado = quoted_printable_encode($corpo);
    if (!str_ends_with($codificado, "\r\n")) {
        $codificado .= "\r\n";
    }
    $cabecalhos = [
        'Date: ' . gmdate('D, d M Y H:i:s') . ' +0000',
        'From: ' . D26_REMETENTE,
        'To: ' . $envio['destinatario'],
        'Subject: =?UTF-8?B?' . base64_encode($envio['assunto']) . '?=',
        'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $dominio . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        'Auto-Submitted: auto-generated',
    ];
    return implode("\r\n", $cabecalhos) . "\r\n\r\n" . $codificado;
}

/** Mensagem como vai ao fio do DATA: ponto no início de linha vira dois pontos; fecha com ".". RFC 5321, 4.5.2. */
function d26_correio_fio(string $mensagem): string
{
    return (string) preg_replace('/^\./m', '..', $mensagem) . ".\r\n";
}

/**
 * Uma conversa SMTP com prazo. Cada leitura ou escrita respeita o menor entre o prazo por linha e o que
 * sobra do prazo total. Fechar é idempotente.
 */
final class D26SmtpSessao
{
    /** @var resource */
    private $sock;
    private readonly float $fim;

    /** @param resource $sock */
    public function __construct($sock, private readonly int $prazoLeituraS, int $prazoTotalS)
    {
        $this->sock = $sock;
        $this->fim = microtime(true) + $prazoTotalS;
    }

    /** Ajusta o prazo do próximo passo. Com o total esgotado, falha na etapa dada. */
    public function prazo(string $etapa): void
    {
        $restante = $this->fim - microtime(true);
        if ($restante <= 0.0) {
            throw new D26EnvioFalhou($etapa);
        }
        $segundos = min((float) $this->prazoLeituraS, $restante);
        $inteiro = (int) floor($segundos);
        stream_set_timeout($this->sock, $inteiro, max(1000, (int) (($segundos - $inteiro) * 1000000)));
    }

    public function escrever(string $dados, string $etapa): void
    {
        $this->prazo($etapa);
        if (fwrite($this->sock, $dados) !== strlen($dados)) {
            throw new D26EnvioFalhou($etapa);
        }
    }

    /**
     * Lê uma resposta completa: uma linha, ou várias (`250-` até `250 `). Linha sem fim, sem código ou
     * depois do prazo falha na etapa dada, sem texto do servidor na exceção.
     *
     * @return array{int, list<string>} [código, textos das linhas]
     */
    public function resposta(string $etapa): array
    {
        $linhas = [];
        for ($i = 0; $i < D26_SMTP_RESPOSTA_LINHAS_MAX; $i++) {
            $this->prazo($etapa);
            $linha = fgets($this->sock, D26_SMTP_LINHA_MAX);
            if ($linha === false || !str_ends_with($linha, "\n")) {
                throw new D26EnvioFalhou($etapa);
            }
            if (preg_match('/^(\d{3})([ -])(.*)\r?\n$/', $linha, $m) !== 1) {
                throw new D26EnvioFalhou($etapa);
            }
            $linhas[] = $m[3];
            if ($m[2] === ' ') {
                return [(int) $m[1], $linhas];
            }
        }
        throw new D26EnvioFalhou($etapa);
    }

    /** @return list<string> textos da resposta, se o código for o esperado */
    public function esperar(string $etapa, int $codigo): array
    {
        [$recebido, $linhas] = $this->resposta($etapa);
        if ($recebido !== $codigo) {
            throw new D26EnvioFalhou($etapa, $recebido);
        }
        return $linhas;
    }

    /** QUIT, sem falhar por causa da resposta: quem chama já sabe o resultado da conversa. */
    public function sair(): void
    {
        try {
            $this->escrever("QUIT\r\n", 'conexao');
            $this->resposta('conexao');
        } catch (D26EnvioFalhou) {
            // Sem resposta ao QUIT o resultado não muda: o envio ou a conferência já estava decidido.
        }
    }

    public function fechar(): void
    {
        if (is_resource($this->sock)) {
            fclose($this->sock);
        }
    }
}

/**
 * Abre a conexão do alvo. Com TLS, o handshake usa o contexto verificado. As etapas são separadas: conexao
 * (TCP e saudação) e tls (certificado ou protocolo). Em qualquer falha, o socket é fechado.
 *
 * @param array{endereco: string, tls: bool} $alvo
 */
function d26_correio_abrir(array $alvo, int $prazoLeituraS, int $prazoTotalS): D26SmtpSessao
{
    $contexto = stream_context_create($alvo['tls'] ? d26_correio_contexto_tls() : []);
    $sock = @stream_socket_client($alvo['endereco'], $numero, $texto, $prazoLeituraS, STREAM_CLIENT_CONNECT, $contexto);
    if ($sock === false) {
        throw new D26EnvioFalhou('conexao');
    }
    $sessao = new D26SmtpSessao($sock, $prazoLeituraS, $prazoTotalS);
    try {
        if ($alvo['tls']) {
            $sessao->prazo('tls');
            if (@stream_socket_enable_crypto($sock, true, D26_SMTP_TLS_METODO) !== true) {
                throw new D26EnvioFalhou('tls');
            }
        }
        $sessao->esperar('conexao', 220);
    } catch (Throwable $e) {
        $sessao->fechar();
        throw $e;
    }
    return $sessao;
}

/** EHLO e leitura dos mecanismos de AUTH anunciados. @return list<string> */
function d26_correio_ehlo(D26SmtpSessao $sessao): array
{
    $host = (string) parse_url(D26_ORIGEM, PHP_URL_HOST);
    $sessao->escrever('EHLO ' . $host . "\r\n", 'conexao');
    $mecanismos = [];
    foreach ($sessao->esperar('conexao', 250) as $linha) {
        if (preg_match('/^AUTH[ =](.*)$/i', $linha, $m) === 1) {
            foreach (preg_split('/\s+/', trim($m[1])) ?: [] as $nome) {
                $mecanismos[] = strtoupper($nome);
            }
        }
    }
    return $mecanismos;
}

/**
 * AUTH PLAIN quando anunciado; senão AUTH LOGIN; senão recusa (etapa auth, sem código). A senha só sai aqui.
 *
 * @param list<string> $mecanismos
 */
function d26_correio_autenticar(D26SmtpSessao $sessao, array $mecanismos, string $usuario, string $senha): void
{
    if (in_array('PLAIN', $mecanismos, true)) {
        $sessao->escrever('AUTH PLAIN ' . base64_encode("\0" . $usuario . "\0" . $senha) . "\r\n", 'auth');
        $sessao->esperar('auth', 235);
        return;
    }
    if (in_array('LOGIN', $mecanismos, true)) {
        $sessao->escrever("AUTH LOGIN\r\n", 'auth');
        $sessao->esperar('auth', 334);
        $sessao->escrever(base64_encode($usuario) . "\r\n", 'auth');
        $sessao->esperar('auth', 334);
        $sessao->escrever(base64_encode($senha) . "\r\n", 'auth');
        $sessao->esperar('auth', 235);
        return;
    }
    throw new D26EnvioFalhou('auth');
}

/**
 * Envia uma mensagem de texto pela caixa nao-responda. Valida e lê a senha antes de conectar, fala TLS
 * verificado em produção e registra no erros.log do privado só a etapa e o código da falha.
 *
 * @param array{destinatario: string, assunto: string, corpo: string} $envio
 * @param array{endereco: string, tls: bool, prazoLeituraS?: int, prazoTotalS?: int}|null $transporte
 *        null em produção (destino pelo ambiente). Os testes passam o SMTP falso em loopback.
 */
function d26_correio_enviar(array $envio, string $priv, ?array $transporte = null): void
{
    $sessao = null;
    try {
        d26_correio_validar($envio);
        $senha = d26_correio_senha($priv);
        $alvo = $transporte ?? d26_correio_alvo(PHP_SAPI, getenv('D26_SMTP_TESTE') ?: null);
        $mensagem = d26_correio_montar($envio);
        $sessao = d26_correio_abrir(
            $alvo,
            (int) ($alvo['prazoLeituraS'] ?? D26_SMTP_PRAZO_LEITURA_S),
            (int) ($alvo['prazoTotalS'] ?? D26_SMTP_PRAZO_TOTAL_S)
        );
        d26_correio_autenticar($sessao, d26_correio_ehlo($sessao), D26_SMTP_USUARIO, $senha);
        $sessao->escrever('MAIL FROM:<' . D26_REMETENTE . ">\r\n", 'remetente');
        $sessao->esperar('remetente', 250);
        $sessao->escrever('RCPT TO:<' . $envio['destinatario'] . ">\r\n", 'destinatario');
        $sessao->esperar('destinatario', 250);
        $sessao->escrever("DATA\r\n", 'dados');
        $sessao->esperar('dados', 354);
        $sessao->escrever(d26_correio_fio($mensagem), 'dados');
        $sessao->esperar('dados', 250);
        $sessao->sair();
    } catch (D26EnvioFalhou $e) {
        d26_log_erro_em($priv, 'envio', 'etapa=' . $e->etapa . ($e->codigo === null ? '' : ' codigo=' . $e->codigo));
        throw $e;
    } finally {
        $sessao?->fechar();
    }
}

/**
 * Conferência do SMTP da caixa, sem enviar nada: abre (com TLS, em produção), faz EHLO e AUTH e sai. Nunca
 * manda MAIL FROM. Não lança: devolve o resultado para o CLI imprimir.
 *
 * @param array{endereco: string, tls: bool} $alvo
 * @return array{tls: bool, auth: bool, codigo: ?int, etapa: ?string, mecanismos: list<string>}
 */
function d26_correio_conferir(string $priv, array $alvo): array
{
    $resultado = ['tls' => false, 'auth' => false, 'codigo' => null, 'etapa' => null, 'mecanismos' => []];
    $sessao = null;
    try {
        $senha = d26_correio_senha($priv);
        $sessao = d26_correio_abrir($alvo, D26_SMTP_PRAZO_LEITURA_S, D26_SMTP_PRAZO_TOTAL_S);
        $resultado['tls'] = $alvo['tls'];
        $resultado['mecanismos'] = d26_correio_ehlo($sessao);
        d26_correio_autenticar($sessao, $resultado['mecanismos'], D26_SMTP_USUARIO, $senha);
        $resultado['auth'] = true;
        $sessao->sair();
    } catch (D26EnvioFalhou $e) {
        $resultado['etapa'] = $e->etapa;
        $resultado['codigo'] = $e->codigo;
    } finally {
        $sessao?->fechar();
    }
    return $resultado;
}
