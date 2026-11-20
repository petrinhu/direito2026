<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

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
