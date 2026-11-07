<?php
declare(strict_types=1);

/**
 * Confere, no PHP do servidor, o app publicado contra o manifesto dele (plano do CTO do login único,
 * 7.1 b; LU-F4.3). Sem HTTP e sem conta: para cada caminho do manifesto, o arquivo existe, é legível,
 * tem o bytes e o md5 que o manifesto diz. O manifesto passa pelo mesmo validador do portão
 * (d26_portao_manifesto), então o que este CLI aceita é o que o portão aceita.
 *
 * Uso:  php conferir-portao.php <pasta-atual-do-app>
 * Ex.:  php conferir-portao.php ~/domains/drpetrus.top/direito2026_app/atual
 *
 * Saída: uma linha por falha, com o caminho e a razão (nunca conteúdo), e a linha final
 * `encontrados=N analisados=N falharam=N`. Sai 1 se houver falha e se o manifesto for recusado.
 * No servidor, aponte o núcleo por D26_NUCLEO=<pasta api/nucleo publicada>.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

require __DIR__ . '/apoio/cli.php';

$cmd = 'conferir-portao';
d26_cli_protegido($cmd);
d26_cli_carregar_nucleo($cmd, ['config', 'armazenamento', 'portao']);

$argumentos = array_slice($argv, 1);
if (count($argumentos) !== 1 || $argumentos[0] === '') {
    d26_cli_falha($cmd, 'uso: php conferir-portao.php <pasta-atual-do-app>');
}
$atual = rtrim($argumentos[0], '/');
if (!is_dir($atual)) {
    d26_cli_falha($cmd, 'pasta do app ausente');
}

try {
    $manifesto = d26_portao_manifesto($atual);
} catch (D26Indisponivel $e) {
    d26_cli_falha($cmd, 'manifesto recusado pelo portão (' . $e->getMessage() . ')');
}

/**
 * Razão da falha para uma entrada do manifesto, ou '' se confere.
 *
 * @param array<string, mixed> $entrada
 */
function conferirEntradaPortao(string $atual, string $caminho, array $entrada): string
{
    $arquivo = $atual . '/' . $caminho;
    if (!is_file($arquivo) || !is_readable($arquivo)) {
        return 'ausente ou ilegível no disco';
    }
    $bytes = $entrada['bytes'] ?? null;
    $md5 = $entrada['md5'] ?? null;
    if (!is_int($bytes) || !is_string($md5) || $md5 === '') {
        return 'entrada do manifesto sem bytes e md5';
    }
    if (filesize($arquivo) !== $bytes) {
        return 'tamanho do disco difere do manifesto';
    }
    if (md5_file($arquivo) !== $md5) {
        return 'md5 do disco difere do manifesto';
    }
    return '';
}

$encontrados = count($manifesto);
$analisados = 0;
$falharam = 0;
foreach ($manifesto as $caminho => $entrada) {
    $analisados++;
    $motivo = conferirEntradaPortao($atual, (string) $caminho, is_array($entrada) ? $entrada : []);
    if ($motivo !== '') {
        $falharam++;
        fwrite(STDERR, "conferir-portao: [FALHOU] $caminho: $motivo\n");
    }
}

echo "conferir-portao: encontrados=$encontrados analisados=$analisados falharam=$falharam\n";
exit($falharam === 0 && $analisados === $encontrados ? 0 : 1);
