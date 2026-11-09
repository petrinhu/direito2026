<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/*
 * Cliente SMTP mínimo (EM-B2, plano-sessao-unica.md 8.1.6). Nenhum teste aqui abre conexão para
 * fora de 127.0.0.1: o envio recebe o transporte por parâmetro, sempre tcp://127.0.0.1:<porta> do
 * SMTP falso (apoio/smtpFalso.php). Os endereços são @example.com, salvo o remetente fixo.
 */

const CORREIO_SENHA_SINTETICA = 'SenhaSmtpSintetica-EM-B2-7731';
const CORREIO_CORPO_PADRAO = "Olá.\n\nAbra o link abaixo.\nhttps://direito2026.drpetrus.top/api/convite.php?t="
    . 'abababababababababababababababababababababababababababababababab' . "\n\nNão responda.\n";

/** Carrega o módulo novo só dentro do teste: sem o arquivo, o teste falha (Red), não o runner. */
function correioCarregar(): void
{
    $arquivo = RAIZ_REPO . '/public/api/nucleo/correio.php';
    if (!is_file($arquivo)) {
        falhar('correio.php ainda não existe (Red esperado)');
    }
    require_once $arquivo;
}

/** Privado temporário com smtp.senha sintético (modo 600 por padrão). @return string caminho do privado */
function correioPriv(string $senha = CORREIO_SENHA_SINTETICA, int $modo = 0600): string
{
    $priv = dirTemporario() . '/privado';
    mkdir($priv, 0700, true);
    file_put_contents($priv . '/smtp.senha', $senha);
    chmod($priv . '/smtp.senha', $modo);
    return $priv;
}

/**
 * SMTP falso em processo próprio. Retorna o processo, a porta e o caminho do arquivo de conversa.
 *
 * @param array<string, mixed> $roteiro
 * @return array{proc: resource, pipes: array<int, resource>, porta: int, conversa: string, dir: string}
 */
function correioSmtpFalso(array $roteiro = []): array
{
    $dir = dirTemporario();
    $arqRoteiro = $dir . '/roteiro.json';
    $conversa = $dir . '/conversa.bin';
    file_put_contents($arqRoteiro, json_encode($roteiro, JSON_THROW_ON_ERROR));
    $pipes = [];
    $proc = proc_open(
        [PHP_BINARY, RAIZ_REPO . '/servidor/testes/apoio/smtpFalso.php', $arqRoteiro, $conversa],
        [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['file', $dir . '/falso.err', 'w']],
        $pipes
    );
    if (!is_resource($proc)) {
        falhar('smtp falso não iniciou');
    }
    $linha = fgets($pipes[1]);
    $porta = $linha === false ? 0 : (int) trim($linha);
    if ($porta <= 0) {
        falhar('smtp falso não informou a porta: ' . (string) @file_get_contents($dir . '/falso.err'));
    }
    return ['proc' => $proc, 'pipes' => $pipes, 'porta' => $porta, 'conversa' => $conversa, 'dir' => $dir];
}

/** @param array{proc: resource, pipes: array<int, resource>} $falso */
function correioFecharSmtpFalso(array $falso): void
{
    foreach ($falso['pipes'] as $pipe) {
        if (is_resource($pipe)) {
            fclose($pipe);
        }
    }
    if (is_resource($falso['proc'])) {
        proc_terminate($falso['proc']);
        proc_close($falso['proc']);
    }
}

/**
 * Espera o SMTP falso terminar (ele sai depois do QUIT ou ao fechar a conexão) e devolve a conversa
 * inteira. Null se nenhuma conexão chegou (arquivo de conversa nunca criado).
 *
 * @param array{proc: resource, conversa: string} $falso
 */
function correioConversaFinal(array $falso, float $segundos = 10.0): ?string
{
    $limite = microtime(true) + $segundos;
    while (proc_get_status($falso['proc'])['running'] && microtime(true) < $limite) {
        usleep(20000);
    }
    return is_file($falso['conversa']) ? (string) file_get_contents($falso['conversa']) : null;
}

/**
 * Envio pelo SMTP falso. O transporte é sempre 127.0.0.1: a guarda abaixo reprova qualquer outro
 * destino antes de a rede ser tocada (TE2).
 *
 * @param array{destinatario: string, assunto: string, corpo: string} $envio
 * @param array{proc: resource, porta: int} $falso
 * @param array<string, mixed> $ajustes
 */
function correioEnviar(array $envio, string $priv, array $falso, array $ajustes = []): void
{
    // Em `+` a esquerda vence: os ajustes vêm primeiro para sobrescrever os padrões.
    $transporte = $ajustes + ['endereco' => 'tcp://127.0.0.1:' . $falso['porta'], 'tls' => false, 'prazoLeituraS' => 3, 'prazoTotalS' => 10];
    if (preg_match('#^tcp://127\.0\.0\.1:\d+$#', (string) $transporte['endereco']) !== 1) {
        falhar('a guarda de teste recusou um destino que não é o SMTP falso');
    }
    d26_correio_enviar($envio, $priv, $transporte);
}

/** Exige a falha de envio e a devolve para inspeção. */
function correioEsperarFalha(callable $fn): D26EnvioFalhou
{
    try {
        $fn();
    } catch (D26EnvioFalhou $e) {
        return $e;
    }
    falhar('esperava D26EnvioFalhou, mas o envio terminou sem falha');
}

/** Conteúdo do erros.log do privado, ou vazio se não existe. */
function correioErrosLog(string $priv): string
{
    return is_file($priv . '/erros.log') ? (string) file_get_contents($priv . '/erros.log') : '';
}

/** Mensagem como chegou ao fio, sem o ponto final, com o ponto de linha desfeito. @return array{string, string} [cabeçalhos, corpo codificado] */
function correioDesmontarFio(string $conversa): array
{
    $inicio = strpos($conversa, "DATA\r\n");
    if ($inicio === false) {
        falhar('a conversa não tem DATA');
    }
    $dados = substr($conversa, $inicio + 6);
    $corte = strpos($dados, "\r\n.\r\n");
    if ($corte === false) {
        falhar('a conversa não tem o ponto final da mensagem');
    }
    $fio = substr($dados, 0, $corte + 2);
    $mensagem = preg_replace('/^\.\./m', '.', $fio);
    [$cabecalhos, $corpo] = explode("\r\n\r\n", (string) $mensagem, 2) + ['', ''];
    return [$cabecalhos, $corpo];
}

/** Valor do cabeçalho pelo nome, ou null. */
function correioCabecalho(string $cabecalhos, string $nome): ?string
{
    foreach (explode("\r\n", $cabecalhos) as $linha) {
        if (str_starts_with($linha, $nome . ': ')) {
            return substr($linha, strlen($nome) + 2);
        }
    }
    return null;
}

teste('e-mail: E10t envio bem-sucedido: EHLO, AUTH PLAIN, MAIL FROM, um RCPT, cabeçalhos, assunto e corpo iguais, link inteiro numa linha', function (): void {
    correioCarregar();
    $senha = CORREIO_SENHA_SINTETICA;
    $priv = correioPriv($senha);
    $falso = correioSmtpFalso();
    try {
        $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'Crie a sua senha de acesso', 'corpo' => CORREIO_CORPO_PADRAO];
        correioEnviar($envio, $priv, $falso);
        $conversa = correioConversaFinal($falso);
        verdadeiro($conversa !== null, 'o SMTP falso recebeu a conexão');

        verdadeiro(preg_match('/^EHLO \S+\r\n/m', $conversa) === 1, 'EHLO no início da sessão');
        $linhas = explode("\r\n", $conversa);
        $auth = null;
        foreach ($linhas as $linha) {
            if (str_starts_with($linha, 'AUTH PLAIN ')) {
                $auth = substr($linha, 11);
            }
        }
        verdadeiro($auth !== null, 'AUTH PLAIN enviado');
        // Remetente pela constante, sem literal: o portão de e-mail lê "\0nao-..." como outro token (0nao-...).
        igual(chr(0) . D26_REMETENTE . chr(0) . $senha, base64_decode((string) $auth), 'AUTH PLAIN com usuário e senha do arquivo');
        igual(1, substr_count($conversa, "MAIL FROM:<nao-responda@drpetrus.top>\r\n"), 'MAIL FROM exato, uma vez');
        igual(1, substr_count($conversa, "RCPT TO:<pessoa@example.com>\r\n"), 'um único RCPT TO');
        igual(1, count(array_filter(explode("\r\n", $conversa), static fn (string $l): bool => $l === 'DATA')), 'DATA uma vez, como linha própria');

        [$cabecalhos, $corpoFio] = correioDesmontarFio($conversa);
        igual('nao-responda@drpetrus.top', correioCabecalho($cabecalhos, 'From'), 'From exato, sem nome de exibição');
        igual('pessoa@example.com', correioCabecalho($cabecalhos, 'To'), 'To');
        $assuntoCodificado = correioCabecalho($cabecalhos, 'Subject') ?? '';
        verdadeiro(preg_match('#^=\?UTF-8\?B\?([A-Za-z0-9+/=]+)\?=$#', $assuntoCodificado, $m) === 1, 'Subject em encoded-word UTF-8 base64');
        igual('Crie a sua senha de acesso', base64_decode($m[1]), 'Subject decodificado igual ao enviado');
        verdadeiro(preg_match('/^<[0-9a-f]{32}@drpetrus\.top>$/', (string) correioCabecalho($cabecalhos, 'Message-ID')) === 1, 'Message-ID aleatório no domínio do remetente');
        verdadeiro(correioCabecalho($cabecalhos, 'Date') !== null, 'Date presente');
        igual('1.0', correioCabecalho($cabecalhos, 'MIME-Version'), 'MIME-Version');
        igual('text/plain; charset=UTF-8', correioCabecalho($cabecalhos, 'Content-Type'), 'Content-Type');
        igual('quoted-printable', correioCabecalho($cabecalhos, 'Content-Transfer-Encoding'), 'Content-Transfer-Encoding');
        igual('auto-generated', correioCabecalho($cabecalhos, 'Auto-Submitted'), 'Auto-Submitted (RFC 3834)');

        $corpoDecodificado = quoted_printable_decode($corpoFio);
        igual(str_replace("\n", "\r\n", CORREIO_CORPO_PADRAO), $corpoDecodificado, 'corpo decodificado igual, byte a byte (LF do envio vira CRLF na mensagem)');
        $link = 'https://direito2026.drpetrus.top/api/convite.php?t=' . str_repeat('ab', 32);
        verdadeiro(in_array($link, explode("\r\n", $corpoDecodificado), true), 'o link inteiro numa linha depois de decodificar');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E11t linha do corpo que começa com ponto chega duplicada no fio e volta simples ao decodificar', function (): void {
    correioCarregar();
    $priv = correioPriv();
    $falso = correioSmtpFalso();
    try {
        // Texto ASCII de propósito: acento vira =C3=AD no quoted-printable e a asserção do fio perderia a forma.
        $corpo = "Primeira linha.\n.Ponto no inicio\n..Dois pontos\n.\nfim\n";
        correioEnviar(['destinatario' => 'pessoa@example.com', 'assunto' => 'Pontos', 'corpo' => $corpo], $priv, $falso);
        $conversa = correioConversaFinal($falso);
        verdadeiro($conversa !== null, 'o SMTP falso recebeu a conexão');
        verdadeiro(str_contains($conversa, "\r\n..Ponto no inicio\r\n"), 'linha com ponto inicial duplicada no fio');
        verdadeiro(str_contains($conversa, "\r\n...Dois pontos\r\n"), 'linha com dois pontos iniciais ganha mais um ponto no fio');
        verdadeiro(str_contains($conversa, "\r\n..\r\n"), 'linha que é só ponto vira dois pontos no fio, antes do ponto final');
        [, $corpoFio] = correioDesmontarFio($conversa);
        igual(str_replace("\n", "\r\n", $corpo), quoted_printable_decode($corpoFio), 'ao decodificar, cada ponto volta simples');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E12t resposta de várias linhas é lida inteira; só AUTH LOGIN anunciado faz LOGIN', function (): void {
    correioCarregar();
    $senha = CORREIO_SENHA_SINTETICA;
    $priv = correioPriv($senha);
    $falso = correioSmtpFalso([
        'ehlo' => ['250-smtp.falso.teste', '250-SIZE 35882577', '250 AUTH LOGIN'],
    ]);
    try {
        correioEnviar(['destinatario' => 'pessoa@example.com', 'assunto' => 'Login', 'corpo' => "Oi.\n"], $priv, $falso);
        $conversa = correioConversaFinal($falso);
        verdadeiro($conversa !== null, 'o SMTP falso recebeu a conexão');
        naoContem('AUTH PLAIN', $conversa, 'sem AUTH PLAIN, porque não foi anunciado');
        contem("AUTH LOGIN\r\n", $conversa, 'AUTH LOGIN enviado');
        contem(base64_encode('nao-responda@drpetrus.top') . "\r\n", $conversa, 'usuário em base64 na linha seguinte');
        contem(base64_encode($senha) . "\r\n", $conversa, 'senha em base64 na linha seguinte');
        contem("MAIL FROM:<nao-responda@drpetrus.top>\r\n", $conversa, 'envio seguiu depois da resposta de várias linhas');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E13t falhas de 535, 550, conexão fechada no DATA e servidor mudo dão a etapa e o código; erros.log sem endereço nem texto do servidor', function (): void {
    correioCarregar();
    $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'Falha', 'corpo' => "Oi.\n"];

    // (a) 535 na autenticação.
    $priv = correioPriv();
    $falso = correioSmtpFalso(['auth' => ['535 5.7.8 credenciais recusadas']]);
    try {
        $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso));
        igual('auth', $e->etapa, '535: etapa auth');
        igual(535, $e->codigo, '535: código');
        contem('etapa=auth codigo=535', correioErrosLog($priv), '535: erros.log com etapa e código');
        naoContem(CORREIO_SENHA_SINTETICA, correioErrosLog($priv), '535: senha nunca no erros.log');
    } finally {
        correioFecharSmtpFalso($falso);
    }

    // (b) 550 no destinatário, com o endereço e o texto do servidor na resposta.
    $priv = correioPriv();
    $falso = correioSmtpFalso(['rcpt' => ['550 5.1.1 <pessoa@example.com>: usuario desconhecido']]);
    try {
        $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso));
        igual('destinatario', $e->etapa, '550: etapa destinatario');
        igual(550, $e->codigo, '550: código');
        $log = correioErrosLog($priv);
        contem('etapa=destinatario codigo=550', $log, '550: erros.log com etapa e código');
        naoContem('pessoa@example.com', $log, '550: o endereço não vai ao erros.log');
        naoContem('usuario desconhecido', $log, '550: o texto do servidor não vai ao erros.log');
    } finally {
        correioFecharSmtpFalso($falso);
    }

    // (c) conexão fechada no meio do DATA.
    $priv = correioPriv();
    $falso = correioSmtpFalso(['fecharNoData' => true]);
    try {
        $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso));
        igual('dados', $e->etapa, 'conexão fechada no DATA: etapa dados');
        igual(null, $e->codigo, 'conexão fechada: sem código');
    } finally {
        correioFecharSmtpFalso($falso);
    }

    // (d) servidor mudo depois do MAIL FROM: o prazo de leitura vence e a falha sai no prazo.
    $priv = correioPriv();
    $falso = correioSmtpFalso(['mudoEm' => 'MAIL FROM']);
    try {
        $inicio = microtime(true);
        $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso, ['prazoLeituraS' => 1, 'prazoTotalS' => 3]));
        igual('remetente', $e->etapa, 'mudo: etapa do MAIL FROM');
        igual(null, $e->codigo, 'mudo: sem código');
        verdadeiro(microtime(true) - $inicio < 5.0, 'mudo: a falha sai no prazo, sem pendurar o worker');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E14t destinatário, assunto ou cabeçalho com CR, LF ou NUL recusa antes de conectar', function (): void {
    correioCarregar();
    $priv = correioPriv();
    $falso = correioSmtpFalso();
    try {
        $casos = [
            ['destinatario' => "pessoa@example.com\r", 'assunto' => 'Oi', 'corpo' => 'x'],
            ['destinatario' => "pessoa@example.com\n", 'assunto' => 'Oi', 'corpo' => 'x'],
            ['destinatario' => "pessoa@example.com\0", 'assunto' => 'Oi', 'corpo' => 'x'],
            ['destinatario' => 'pessoa@example.com', 'assunto' => "Oi\r\nBcc: outra@example.com", 'corpo' => 'x'],
            ['destinatario' => 'pessoa@example.com', 'assunto' => "Oi\0", 'corpo' => 'x'],
        ];
        foreach ($casos as $envio) {
            $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso));
            igual('cabecalho', $e->etapa, 'CR, LF ou NUL: recusa com etapa cabecalho');
        }
        igual(null, correioConversaFinal($falso, 1.0), 'nenhum caso abriu conexão com o SMTP falso');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E15t smtp.senha ausente, vazio, com 257 bytes ou com modo 644 recusa, classe smtp-senha, sem conteúdo no log', function (): void {
    correioCarregar();
    $envio = ['destinatario' => 'pessoa@example.com', 'assunto' => 'Senha', 'corpo' => 'x'];
    $falso = correioSmtpFalso();
    try {
        $sem = correioPriv();
        unlink($sem . '/smtp.senha');
        $vazio = correioPriv('');
        $grande = correioPriv(str_repeat('Q', 257));
        $modo644 = correioPriv('QuatroQuatroQuatro', 0644);
        foreach (['ausente' => $sem, 'vazio' => $vazio, '257 bytes' => $grande, 'modo 644' => $modo644] as $caso => $priv) {
            $e = correioEsperarFalha(fn () => correioEnviar($envio, $priv, $falso));
            igual('smtp-senha', $e->etapa, "$caso: etapa smtp-senha");
            $log = correioErrosLog($priv);
            contem('etapa=smtp-senha', $log, "$caso: classe no erros.log");
            naoContem('QQQQ', $log, "$caso: sem conteúdo da senha no log");
            naoContem('Quatro', $log, "$caso: sem conteúdo da senha no log (modo 644)");
        }
        igual(null, correioConversaFinal($falso, 1.0), 'nenhuma recusa de senha abriu conexão');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E16t contexto TLS de produção: verify_peer, verify_peer_name, peer_name e allow_self_signed como no plano', function (): void {
    correioCarregar();
    $ctx = d26_correio_contexto_tls();
    verdadeiro(isset($ctx['ssl']) && is_array($ctx['ssl']), 'contexto com a seção ssl');
    $ssl = $ctx['ssl'];
    igual(true, $ssl['verify_peer'] ?? null, 'verify_peer');
    igual(true, $ssl['verify_peer_name'] ?? null, 'verify_peer_name');
    igual('smtp.hostinger.com', $ssl['peer_name'] ?? null, 'peer_name');
    igual(false, $ssl['allow_self_signed'] ?? null, 'allow_self_signed');
    igual(
        STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT,
        $ssl['crypto_method'] ?? null,
        'só TLS 1.2 ou 1.3, nada de TLS antigo'
    );
    igual('smtp.hostinger.com', D26_SMTP_HOST, 'host de produção');
    igual(465, D26_SMTP_PORTA, 'porta de produção (TLS implícito)');
    igual('tcp://smtp.hostinger.com:465', d26_correio_alvo('litespeed', 'tcp://127.0.0.1:2525')['endereco'], 'produção ignora o teste fora do cli-server');
}, false);

teste('e-mail: E17t D26_SMTP_TESTE fora do cli-server é ignorado; sob cli-server sem ele o envio recusa sem conectar', function (): void {
    correioCarregar();
    // Destino puro: fora do cli-server, o teste é ignorado, mesmo apontado para loopback.
    foreach (['cli', 'litespeed', 'fpm-fcgi'] as $sapi) {
        igual('tcp://smtp.hostinger.com:465', d26_correio_alvo($sapi, 'tcp://127.0.0.1:2525')['endereco'], "$sapi ignora D26_SMTP_TESTE");
    }
    // Sob cli-server, só loopback passa. Sem o teste, recusa.
    $e = correioEsperarFalha(fn () => d26_correio_alvo('cli-server', null));
    igual('alvo', $e->etapa, 'cli-server sem D26_SMTP_TESTE recusa');
    $e = correioEsperarFalha(fn () => d26_correio_alvo('cli-server', 'tcp://smtp.hostinger.com:465'));
    igual('alvo', $e->etapa, 'cli-server com destino que não é loopback recusa');
    igual('tcp://127.0.0.1:2525', d26_correio_alvo('cli-server', 'tcp://127.0.0.1:2525')['endereco'], 'cli-server com loopback usa o teste');

    // Prova real sob php -S: a sonda envia pelo próprio processo do servidor embutido.
    // Sem D26_SMTP_TESTE o servidor recusa e o SMTP falso não recebe nada.
    $falso = correioSmtpFalso();
    $a = null;
    try {
        putenv('D26_SMTP_TESTE=');
        $a = correioAmbienteSonda();
        $r = $a->cliente()->get('/api/correio-sonda.php');
        igual('falhou etapa=alvo', $r->corpo, 'php -S sem D26_SMTP_TESTE recusa');
        igual(null, correioConversaFinal($falso, 1.0), 'php -S sem D26_SMTP_TESTE não abre conexão com o SMTP falso');
    } finally {
        putenv('D26_SMTP_TESTE=');
        $a?->parar();
        correioFecharSmtpFalso($falso);
    }
}, false);

/** Ambiente php -S com a sonda de envio no webroot copiado (só do teste). */
function correioAmbienteSonda(): Ambiente
{
    $a = Ambiente::novo(['docroot' => 'copia', 'admin' => false]);
    file_put_contents($a->priv . '/smtp.senha', CORREIO_SENHA_SINTETICA);
    chmod($a->priv . '/smtp.senha', 0600);
    file_put_contents($a->docroot . '/api/correio-sonda.php', <<<'PHP'
<?php
declare(strict_types=1);
define('D26_API', true);
require __DIR__ . '/nucleo/config.php';
require __DIR__ . '/nucleo/respostas.php';
require __DIR__ . '/nucleo/correio.php';
header('Content-Type: text/plain; charset=utf-8');
try {
    d26_correio_enviar(['destinatario' => 'pessoa@example.com', 'assunto' => 'Sonda', 'corpo' => 'Corpo.'], d26_priv());
    echo 'enviado';
} catch (D26EnvioFalhou $e) {
    echo 'falhou etapa=' . $e->etapa;
}
PHP);
    return $a;
}

teste('e-mail: E18t D26_ORIGEM e o host do .htaccess são o mesmo', function (): void {
    $htaccess = (string) file_get_contents(RAIZ_REPO . '/public/.htaccess');
    verdadeiro(preg_match('/RewriteCond %\{HTTP_HOST\} !\^([^$\s]+)\$/', $htaccess, $m) === 1, '.htaccess tem a regra de host');
    $hostHtaccess = str_replace('\\.', '.', $m[1]);
    $hostOrigem = parse_url(D26_ORIGEM, PHP_URL_HOST);
    igual($hostHtaccess, $hostOrigem, 'host do .htaccess igual ao host de D26_ORIGEM');
    igual('https://' . $hostHtaccess, D26_ORIGEM, 'origem é https e sem caminho');
}, false);

teste('e-mail: E19t conferir-smtp contra o SMTP falso: auth sim sem MAIL FROM; 535 dá auth não e rc 1; senha nunca na saída', function (): void {
    correioCarregar();
    $senha = 'SenhaCanarioConferencia-EM-B2';
    // (a) autenticação aceita: sai com 0, sem MAIL FROM.
    $priv = correioPriv($senha);
    $falso = correioSmtpFalso();
    try {
        [$rc, $saida, $erro] = rodarCliScript('conferir-smtp.php', [$priv, '--destino=tcp://127.0.0.1:' . $falso['porta']], '');
        igual(0, $rc, 'auth aceita: rc 0');
        contem('auth: sim', $saida, 'auth aceita: imprime auth: sim');
        naoContem($senha, $saida . $erro, 'a senha nunca sai na saída');
        $conversa = correioConversaFinal($falso);
        verdadeiro($conversa !== null, 'o CLI conectou ao SMTP falso');
        contem('AUTH PLAIN ', $conversa, 'conferência faz AUTH');
        naoContem('MAIL FROM', $conversa, 'conferência nunca manda MAIL FROM');
        naoContem('RCPT TO', $conversa, 'conferência nunca manda RCPT TO');
    } finally {
        correioFecharSmtpFalso($falso);
    }

    // (b) 535: auth não, rc 1, sem senha na saída.
    $priv = correioPriv($senha);
    $falso = correioSmtpFalso(['auth' => ['535 5.7.8 credenciais recusadas']]);
    try {
        [$rc, $saida, $erro] = rodarCliScript('conferir-smtp.php', [$priv, '--destino=tcp://127.0.0.1:' . $falso['porta']], '');
        igual(1, $rc, '535: rc 1');
        contem('auth: não', $saida, '535: imprime auth: não');
        naoContem($senha, $saida . $erro, '535: a senha nunca sai na saída');
        naoContem('MAIL FROM', (string) correioConversaFinal($falso), '535: sem MAIL FROM');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);

teste('e-mail: E29t escrita do DATA tem prazo: servidor que para de ler depois do 354 falha em dados no prazo, sem pendurar', function (): void {
    correioCarregar();
    $priv = correioPriv();
    // 'é' em quoted-printable vira =C3=A9 (6 bytes no fio): 32768 'é' dão ~196 KB, bem acima do buffer do socket.
    $corpo = str_repeat('é', 32768);
    $falso = correioSmtpFalso(['mudoAposData' => true]);
    try {
        $inicio = microtime(true);
        $e = correioEsperarFalha(fn () => correioEnviar(
            ['destinatario' => 'pessoa@example.com', 'assunto' => 'Escrita', 'corpo' => $corpo],
            $priv,
            $falso,
            ['prazoLeituraS' => 1, 'prazoTotalS' => 3]
        ));
        igual('dados', $e->etapa, 'escrita parada depois do 354: etapa dados');
        verdadeiro(microtime(true) - $inicio < 5.0, 'escrita parada: a falha sai no prazo, não nos 60 s do padrão do PHP');
    } finally {
        correioFecharSmtpFalso($falso);
    }
}, false);
