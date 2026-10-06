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

/** @param array<mixed> $padrao devolvido só quando o arquivo não existe */
function d26_ler_json(string $arquivo, array $padrao): array
{
    if (!is_file($arquivo)) {
        return $padrao;
    }
    $texto = file_get_contents($arquivo);
    if ($texto === false) {
        throw new RuntimeException('falha ao ler ' . basename($arquivo));
    }
    $dados = json_decode($texto, true, 64, JSON_THROW_ON_ERROR);
    if (!is_array($dados)) {
        throw new RuntimeException('conteúdo inesperado em ' . basename($arquivo));
    }
    return $dados;
}

/**
 * Lê, deixa $fn alterar por referência, e grava só se mudou, tudo sob lock.
 * Devolve o que $fn devolver. JSON corrompido levanta erro (não zera dados).
 *
 * @param array<mixed> $padrao
 * @param callable(array<mixed>&): mixed $fn
 */
function d26_atualizar_json(string $arquivo, array $padrao, callable $fn): mixed
{
    $trava = $arquivo . '.lock';
    $h = fopen($trava, 'c');
    if ($h === false) {
        throw new RuntimeException('falha ao abrir trava de ' . basename($arquivo));
    }
    @chmod($trava, 0600);
    try {
        if (!flock($h, LOCK_EX)) {
            throw new RuntimeException('falha ao obter trava de ' . basename($arquivo));
        }
        $dados = d26_ler_json($arquivo, $padrao);
        $original = $dados;
        $resultado = $fn($dados);
        if ($dados !== $original || !is_file($arquivo)) {
            d26_gravar_atomico($arquivo, $dados);
        }
        return $resultado;
    } finally {
        flock($h, LOCK_UN);
        fclose($h);
    }
}

/** @param array<mixed> $dados */
function d26_gravar_atomico(string $arquivo, array $dados): void
{
    $json = json_encode($dados, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $tmp = tempnam(dirname($arquivo), '.tmp-');
    if ($tmp === false) {
        throw new RuntimeException('falha ao criar temporário para ' . basename($arquivo));
    }
    try {
        $h = fopen($tmp, 'wb');
        if ($h === false || fwrite($h, $json) !== strlen($json) || !fflush($h)) {
            throw new RuntimeException('falha ao gravar ' . basename($arquivo));
        }
        fsync($h);
        fclose($h);
        chmod($tmp, 0600);
        if (!rename($tmp, $arquivo)) {
            throw new RuntimeException('falha ao renomear ' . basename($arquivo));
        }
    } catch (Throwable $e) {
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
            throw new RuntimeException('segredo.key inválido');
        }
        return $t;
    };
    $s = $ler();
    if ($s !== null) {
        return $s;
    }
    $h = fopen($arquivo . '.lock', 'c');
    if ($h === false) {
        throw new RuntimeException('falha ao abrir trava de segredo.key');
    }
    @chmod($arquivo . '.lock', 0600);
    try {
        if (!flock($h, LOCK_EX)) {
            throw new RuntimeException('falha ao obter trava de segredo.key');
        }
        $s = $ler();
        if ($s === null) {
            $s = bin2hex(random_bytes(32));
            $tmp = tempnam(dirname($arquivo), '.tmp-');
            if ($tmp === false || file_put_contents($tmp, $s . "\n") === false || !chmod($tmp, 0600) || !rename($tmp, $arquivo)) {
                throw new RuntimeException('falha ao gravar segredo.key');
            }
        }
        return $s;
    } finally {
        flock($h, LOCK_UN);
        fclose($h);
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
