<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Presença de sessão aberta por conta (ADM-F3, plano P4 v2, seção 2). Um arquivo por conta em PRIV/presenca/, com
 * quatro chaves: m (sha256 do marcador de sessão única), v (versão da sessão), a (última atividade gravada) e c
 * (criação da sessão). Sem IP, sem id de sessão e sem histórico. O LED "Sessão aberta" é a regra de
 * d26_sessao_avaliar aplicada a esse arquivo e à conta: conta ativa e sem bloqueio, mesma versão, marcador
 * conferindo, dentro da ociosidade (D26_SESSAO_OCIOSIDADE) e da validade (D26_SESSAO_VALIDADE).
 *
 * O web nunca cria a pasta: só o CLI provisiona (D26_SUBPASTAS). Sem a pasta, nada é gravado, a leitura dá null e a
 * falha vai uma vez por dia (America/Recife), por frase, para o erros.log. Este arquivo é carregado por sessao.php (e pelo CLI de remoção),
 * nunca pela lista de inicio.php, por causa da janela do rsync (plano, seção 3).
 */

/** Intervalo mínimo entre duas gravações de atividade na mesma sessão (segundos). */
const D26_PRESENCA_GRAVACAO = 60;
/** Presença mais velha que isso é apagada pela faxina do login (13 h). */
const D26_PRESENCA_FAXINA = 46800;
/** Intervalo mínimo entre duas passagens da faxina, em qualquer atividade ou na abertura do painel (segundos). */
const D26_PRESENCA_FAXINA_JANELA = 600;
/** Temporário da escrita atômica mais velho que isto (segundos) é órfão e a faxina apaga. Escrita em curso dura ms. */
const D26_PRESENCA_TMP_ORFAO = 300;

/** Caminho do arquivo de presença da conta. O nome traz o hash do login, não o login. */
function d26_presenca_arquivo(string $priv, string $login): string
{
    return $priv . '/presenca/' . hash('sha256', 'presenca' . "\0" . $login) . '.json';
}

/** Hash do marcador de sessão única, o que a presença guarda no lugar do marcador. */
function d26_presenca_marcador(string $marcador): string
{
    return hash('sha256', $marcador);
}

/** Grava a presença. Sem a pasta (o CLI não provisionou), não grava e registra uma vez por dia. */
function d26_presenca_gravar(string $priv, string $login, string $m, int $versao, int $criada, int $agora): void
{
    if (!is_dir($priv . '/presenca')) {
        d26_presenca_avisar_ausente($priv);
        return;
    }
    $arq = d26_presenca_arquivo($priv, $login);
    $dados = json_encode(['m' => $m, 'v' => $versao, 'a' => $agora, 'c' => $criada], JSON_THROW_ON_ERROR);
    // Escrita atômica: o temporário nasce com 600 antes de receber o conteúdo, e o rename troca tudo de uma vez.
    // Assim o leitor nunca vê arquivo parcial, e a presença final nunca sai com permissão mais aberta.
    // Falha de disco não derruba o login (ADM-F6d): cada retorno é conferido e a falha entra uma vez no erros.log.
    $tmp = $arq . '.' . bin2hex(random_bytes(6)) . '.tmp';
    $ok = @touch($tmp)
        && @chmod($tmp, 0600)
        && @file_put_contents($tmp, $dados, LOCK_EX) === strlen($dados);
    if ($ok) {
        d26_teste_pausar('presenca-antes-rename', $login); // no-op em produção (ADM-F6f)
        $ok = @rename($tmp, $arq);
    }
    if (!$ok) {
        @unlink($tmp);
        d26_presenca_avisar($priv, 'gravação da presença falhou');
    }
}

/**
 * Faxina oportunista (ADM-F6b): roda numa atividade qualquer (sessão reavaliada, login, abertura do painel), no máximo
 * uma vez a cada D26_PRESENCA_FAXINA_JANELA segundos. O marcador .faxina guarda a última passagem no mtime. Não é
 * JSON, então o glob da faxina não o apaga nem o lê.
 */
function d26_presenca_faxina_oportunista(string $priv, int $agora): void
{
    $pasta = $priv . '/presenca';
    if (!is_dir($pasta)) {
        return;
    }
    $marcador = $pasta . '/.faxina';
    clearstatcache(true, $marcador);
    if (is_file($marcador) && $agora - (int) filemtime($marcador) < D26_PRESENCA_FAXINA_JANELA) {
        return;
    }
    // Sem o marcador a faxina segue assim mesmo (ADM-F6d): a retenção de 13 h vale mais que varrer a pasta a cada pedido.
    if (!@touch($marcador, $agora)) {
        d26_presenca_avisar($priv, 'faxina da presença falhou (marcador)');
    }
    d26_presenca_faxina($priv, $agora);
}

/**
 * Uma linha por frase e por dia (America/Recife), nunca uma a cada pedido: a falha não pode encher o erros.log. A dedupe
 * casa a LINHA INTEIRA "presenca <frase>" do dia de hoje, nunca um pedaço de frase: a frase nova não pode dar por já
 * registrado o "(rename)" de uma versão antiga. A marca estática evita reler o arquivo no mesmo processo, e vai
 * chaveada por pasta e dia, para não valer no dia seguinte num processo de longa duração.
 */
function d26_presenca_avisar(string $priv, string $frase): void
{
    static $avisadas = [];
    $hoje = d26_presenca_dia(time());
    $chave = $priv . "\0" . $hoje . "\0" . $frase;
    if (isset($avisadas[$chave])) {
        return;
    }
    $avisadas[$chave] = true;
    if (d26_presenca_ja_avisada_hoje($priv, $frase, $hoje)) {
        return;
    }
    d26_log_erro_em($priv, 'presenca', $frase);
}

/** Dia (Y-m-d) de um instante no fuso de Recife, sem mexer no fuso global do processo (como correio.php:702). */
function d26_presenca_dia(int $instante): string
{
    return (new DateTimeImmutable('@' . $instante))->setTimezone(new DateTimeZone('America/Recife'))->format('Y-m-d');
}

/**
 * Há no erros.log uma linha "presenca <frase>" cujo carimbo cai no dia $hoje? Carimbo que não decodifica não conta, e a
 * linha vira só uma linha a mais, nunca um bloqueio. strtotime devolve false sem aviso, então a leitura não lança.
 */
function d26_presenca_ja_avisada_hoje(string $priv, string $frase, string $hoje): bool
{
    foreach (explode("\n", (string) @file_get_contents($priv . '/erros.log')) as $linha) {
        $partes = explode(' ', $linha, 2);
        if (count($partes) !== 2 || $partes[1] !== 'presenca ' . $frase) {
            continue;
        }
        $instante = strtotime($partes[0]);
        if ($instante !== false && d26_presenca_dia($instante) === $hoje) {
            return true;
        }
    }
    return false;
}

/** Pasta ausente: a frase de sempre, com a mesma dedupe de d26_presenca_avisar. */
function d26_presenca_avisar_ausente(string $priv): void
{
    d26_presenca_avisar($priv, 'pasta presenca/ ausente: a presença não é gravada até o CLI provisionar a pasta');
}

/** Presença da conta, ou null (sem pasta, sem arquivo ou arquivo que não tem a forma certa). */
function d26_presenca_ler(string $priv, string $login): ?array
{
    if (!is_dir($priv . '/presenca')) {
        return null;
    }
    $arq = d26_presenca_arquivo($priv, $login);
    if (!is_file($arq)) {
        return null;
    }
    // Arquivo que some ou não lê dá null, como o ilegível: a listagem não cai em 500 (ADM-F6e).
    $bruto = @file_get_contents($arq);
    if ($bruto === false) {
        return null;
    }
    $d = json_decode($bruto, true);
    if (!is_array($d) || !is_string($d['m'] ?? null) || !is_int($d['v'] ?? null) || !is_int($d['a'] ?? null) || !is_int($d['c'] ?? null)) {
        return null;
    }
    return $d;
}

/**
 * O LED: a conta está com sessão aberta? Mesma regra de d26_sessao_avaliar, aplicada à presença gravada: conta ativa,
 * sem bloqueio, mesma versão, marcador conferindo e dentro das duas janelas.
 *
 * @param array<string, mixed> $conta
 * @param array{m: string, v: int, a: int, c: int}|null $presenca
 */
function d26_presenca_conectada(array $conta, ?array $presenca, int $agora): bool
{
    if ($presenca === null || ($conta['ativo'] ?? null) !== true || array_key_exists('bloqueada', $conta)) {
        return false;
    }
    // Presença com mais de 13 h conta como ausente, mesmo que ainda não tenha sido apagada pela faxina.
    if ($agora - $presenca['a'] > D26_PRESENCA_FAXINA) {
        return false;
    }
    if (!is_string($conta['sessaoVigente'] ?? null) || (int) ($conta['versaoSessao'] ?? -1) !== $presenca['v']) {
        return false;
    }
    if ($agora - $presenca['a'] > D26_SESSAO_OCIOSIDADE || $agora - $presenca['c'] > D26_SESSAO_VALIDADE) {
        return false;
    }
    return hash_equals($presenca['m'], d26_presenca_marcador($conta['sessaoVigente']));
}

/** Atalho da listagem: lê a presença da conta e aplica a regra. */
function d26_presenca_conectada_conta(string $priv, array $conta, int $agora): bool
{
    return d26_presenca_conectada($conta, d26_presenca_ler($priv, (string) $conta['usuario']), $agora);
}

/**
 * Apaga a presença da conta. Com $m, só apaga se a presença ainda for daquele marcador: sair de um aparelho velho não
 * apaga a presença de um aparelho novo. Com $m null (exclusão da conta), apaga de qualquer jeito.
 */
function d26_presenca_apagar(string $priv, string $login, ?string $m): void
{
    $arq = d26_presenca_arquivo($priv, $login);
    if (!is_file($arq)) {
        return;
    }
    if ($m !== null) {
        $p = d26_presenca_ler($priv, $login);
        if ($p === null || !hash_equals($p['m'], $m)) {
            return;
        }
    }
    @unlink($arq);
}

/** Faxina do login: apaga presença com mais de D26_PRESENCA_FAXINA segundos, e a ilegível. */
function d26_presenca_faxina(string $priv, int $agora): void
{
    if (!is_dir($priv . '/presenca')) {
        return;
    }
    foreach (glob($priv . '/presenca/*.json') ?: [] as $arq) {
        $d = json_decode((string) @file_get_contents($arq), true);
        if (!is_array($d) || !is_int($d['a'] ?? null) || $agora - $d['a'] > D26_PRESENCA_FAXINA) {
            @unlink($arq);
        }
    }
    // Temporário da escrita atômica mais velho que D26_PRESENCA_TMP_ORFAO é órfão: o processo morreu antes do rename.
    foreach (glob($priv . '/presenca/*.tmp') ?: [] as $tmp) {
        if ($agora - (int) @filemtime($tmp) > D26_PRESENCA_TMP_ORFAO) {
            @unlink($tmp);
        }
    }
}
