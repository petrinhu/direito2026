<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Armazenamento em JSON. Invariante: dois processos nunca gravam o mesmo
 * arquivo ao mesmo tempo (flock exclusivo num .lock próprio) e quem lê nunca
 * vê arquivo pela metade (escrita em temporário + rename atômico).
 */

/**
 * Falha de armazenamento (I/O, JSON, trava, estado inconsistente). Quem decide
 * é o preâmbulo (inicio.php): vira 503 `indisponivel`, nunca um 500 genérico.
 * Fail-closed: quem não consegue ler o estado não autoriza nada.
 */
final class D26Indisponivel extends RuntimeException
{
}

/** @param array<mixed> $padrao devolvido só quando o arquivo não existe */
function d26_ler_json(string $arquivo, array $padrao): array
{
    if (!is_file($arquivo)) {
        return $padrao;
    }
    $texto = @file_get_contents($arquivo);
    if ($texto === false) {
        throw new D26Indisponivel('falha ao ler ' . basename($arquivo));
    }
    try {
        $dados = json_decode($texto, true, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new D26Indisponivel('JSON inválido em ' . basename($arquivo), 0, $e);
    }
    if (!is_array($dados)) {
        throw new D26Indisponivel('conteúdo inesperado em ' . basename($arquivo));
    }
    return $dados;
}

/**
 * Trava exclusiva do arquivo (num .lock próprio) SEM espera infinita: tenta
 * LOCK_NB em laço até D26_LOCK_TETO_MS e então levanta D26Indisponivel. Um lock
 * preso por um processo travado não pode pendurar todos os workers do servidor.
 * Devolve o handle; quem chamou o libera com d26_destravar.
 *
 * @return resource
 */
function d26_travar(string $arquivo)
{
    $trava = $arquivo . '.lock';
    $h = @fopen($trava, 'c');
    if ($h === false) {
        throw new D26Indisponivel('falha ao abrir trava de ' . basename($arquivo));
    }
    @chmod($trava, 0600);
    $limite = microtime(true) + D26_LOCK_TETO_MS / 1000;
    while (true) {
        $bloqueado = 0;
        if (flock($h, LOCK_EX | LOCK_NB, $bloqueado)) {
            return $h;
        }
        if ($bloqueado !== 1 || microtime(true) >= $limite) {
            fclose($h);
            throw new D26Indisponivel('trava ocupada de ' . basename($arquivo));
        }
        usleep(10000);
    }
}

/** @param resource $h */
function d26_destravar($h): void
{
    flock($h, LOCK_UN);
    fclose($h);
}

/**
 * Lê o arquivo SOB o lock (instantâneo consistente, nunca no meio de uma
 * gravação). Não cria nada: arquivo ausente devolve $padrao.
 *
 * @param array<mixed> $padrao
 * @return array<mixed>
 */
function d26_ler_json_travado(string $arquivo, array $padrao): array
{
    $h = d26_travar($arquivo);
    try {
        return d26_ler_json($arquivo, $padrao);
    } finally {
        d26_destravar($h);
    }
}

/**
 * Lê, deixa $fn alterar por referência, e grava só se mudou, tudo sob lock.
 * Devolve o que $fn devolver. JSON corrompido levanta erro (não zera dados).
 * $exigirExistente: arquivo já provisionado; ausente é D26Indisponivel (não
 * recomeça do padrão, o que apagaria limites sem ninguém perceber).
 * $criarAusente=false: só ler/alterar; arquivo ausente continua ausente (não
 * "provisiona" contas por acidente).
 *
 * @param array<mixed> $padrao
 * @param callable(array<mixed>&): mixed $fn
 */
function d26_atualizar_json(string $arquivo, array $padrao, callable $fn, bool $exigirExistente = false, bool $criarAusente = true): mixed
{
    $h = d26_travar($arquivo);
    try {
        if ($exigirExistente && !is_file($arquivo)) {
            throw new D26Indisponivel('arquivo provisionado ausente: ' . basename($arquivo));
        }
        $dados = d26_ler_json($arquivo, $padrao);
        $original = $dados;
        $resultado = $fn($dados);
        if ($dados !== $original || ($criarAusente && !is_file($arquivo))) {
            d26_gravar_atomico($arquivo, $dados);
        }
        return $resultado;
    } finally {
        d26_destravar($h);
    }
}

/** @param array<mixed> $dados */
function d26_gravar_atomico(string $arquivo, array $dados): void
{
    try {
        $json = json_encode($dados, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (JsonException $e) {
        throw new D26Indisponivel('JSON não serializável para ' . basename($arquivo), 0, $e);
    }
    d26_escrever_atomico($arquivo, $json);
}

/**
 * Escreve $conteudo num temporário de nome próprio NO MESMO diretório (fopen 'x':
 * nunca cai no TMPDIR do sistema nem reaproveita nome) e renomeia por cima.
 */
function d26_escrever_atomico(string $arquivo, string $conteudo): void
{
    $tmp = dirname($arquivo) . '/.tmp-' . bin2hex(random_bytes(8));
    $h = @fopen($tmp, 'xb');
    if ($h === false) {
        throw new D26Indisponivel('falha ao criar temporário para ' . basename($arquivo));
    }
    try {
        if (fwrite($h, $conteudo) !== strlen($conteudo) || !fflush($h)) {
            throw new D26Indisponivel('falha ao gravar ' . basename($arquivo));
        }
        @fsync($h);
        fclose($h);
        $h = null;
        if (!@chmod($tmp, 0600) || !@rename($tmp, $arquivo)) {
            throw new D26Indisponivel('falha ao renomear ' . basename($arquivo));
        }
    } catch (Throwable $e) {
        if (is_resource($h)) {
            fclose($h);
        }
        @unlink($tmp);
        throw $e;
    }
}

/**
 * Segredo do HMAC do CSRF pré-login (PRIV/segredo.key, 600, 64 hex). O CLI o cria;
 * se faltar, é criado aqui sob flock numa trava própria (nunca dois segredos
 * diferentes em corrida). Conteúdo inválido é erro, jamais um fallback fraco.
 */
function d26_segredo(string $priv): string
{
    $arquivo = $priv . '/segredo.key';
    $ler = static function () use ($arquivo): ?string {
        if (!is_file($arquivo)) {
            return null;
        }
        $t = trim((string) file_get_contents($arquivo));
        if (preg_match('/^[0-9a-f]{64}$/D', $t) !== 1) {
            throw new D26Indisponivel('segredo.key inválido');
        }
        return $t;
    };
    $s = $ler();
    if ($s !== null) {
        return $s;
    }
    $h = d26_travar($arquivo);
    try {
        $s = $ler();
        if ($s === null) {
            $s = bin2hex(random_bytes(32));
            d26_escrever_atomico($arquivo, $s . "\n");
        }
        return $s;
    } finally {
        d26_destravar($h);
    }
}

/** Cria o diretório privado e subpastas (700). Usado pelo CLI; o web nunca cria. */
function d26_garantir_estrutura(string $priv): void
{
    foreach ([$priv, $priv . '/sessoes', $priv . '/conteudo'] as $d) {
        if (!is_dir($d) && !mkdir($d, 0700, true)) {
            throw new RuntimeException('não consegui criar ' . basename($d));
        }
        chmod($d, 0700);
    }
    foreach ([$priv . '/tentativas.json', $priv . '/erros.log'] as $f) {
        if (!file_exists($f)) {
            file_put_contents($f, $f === $priv . '/erros.log' ? '' : '{"u":[],"ip":[],"c":[]}');
        }
        chmod($f, 0600);
    }
    d26_segredo($priv);
}
