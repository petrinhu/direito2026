<?php
declare(strict_types=1);

/**
 * Apoio dos testes de servidor/cli. Não termina em .teste.php: o runner não o
 * carrega sozinho; cada cli-*.teste.php inclui este arquivo por require_once.
 */

/** Roda um script de servidor/cli com argumentos e STDIN dados. @return array{int, string, string} [código, stdout, stderr] */
function rodarCliScript(string $script, array $args, string $stdin): array
{
    $p = proc_open(
        array_merge([PHP_BINARY, RAIZ_REPO . '/servidor/cli/' . $script], $args),
        [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes
    );
    fwrite($pipes[0], $stdin);
    fclose($pipes[0]);
    $out = (string) stream_get_contents($pipes[1]);
    $err = (string) stream_get_contents($pipes[2]);
    return [proc_close($p), $out, $err];
}

/**
 * Contas do usuarios.json indexadas por login (leitura de teste, nunca de produção).
 *
 * @return array<string, array<string, mixed>>
 */
function cliContasPorLogin(string $priv): array
{
    $d = json_decode((string) file_get_contents($priv . '/usuarios.json'), true, 512, JSON_THROW_ON_ERROR);
    $mapa = [];
    foreach ($d['usuarios'] as $c) {
        $mapa[$c['usuario']] = $c;
    }
    return $mapa;
}

/**
 * Privado temporário com as contas dadas, na ordem em que vêm. Cada valor é
 * ['admin' => bool, 'ativo' => bool] (ativo padrão true). Senha de todas: SenhaTeste123456.
 *
 * @param array<string, array{admin: bool, ativo?: bool}> $contas
 * @return array{string, string} [dir, priv]
 */
function cliPrivComContas(array $contas): array
{
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    d26_garantir_estrutura($priv);
    $hash = Ambiente::hashPadrao('SenhaTeste123456');
    foreach ($contas as $login => $c) {
        igual('ok', d26_contas_criar($priv, (string) $login, $hash, $c['admin']));
        if (($c['ativo'] ?? true) === false) {
            d26_contas_definir_ativo($priv, (string) $login, false);
        }
    }
    return [$dir, $priv];
}
