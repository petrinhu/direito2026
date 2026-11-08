<?php
declare(strict_types=1);

/**
 * Confere, no PHP do servidor, o app publicado contra o manifesto dele (plano do CTO do login único,
 * 7.1 b; LU-F4.3). Sem HTTP e sem conta: para cada caminho do manifesto, o arquivo existe, é legível,
 * tem o bytes e o md5 que o manifesto diz. O manifesto passa pelo mesmo validador do portão
 * (d26_portao_manifesto), então o que este CLI aceita é o que o portão aceita.
 *
 * Com --privado <pasta-privada> (LU-C1), confere também o acervo da Júri: cada id de acervo.json tem
 * imagens/<id> de arquivo comum, sem link, com o tamanho que o índice diz, e imagens/ não tem sobra.
 * acervo.json ausente é índice vazio, como em api/juri/imagem.php; imagens/ tem de existir. Só nome e
 * tamanho entram na conferência: nenhum byte de imagem é lido.
 *
 * Uso:  php conferir-portao.php <pasta-atual-do-app> [--privado <pasta-privada>]
 * Ex.:  php conferir-portao.php ~/domains/drpetrus.top/direito2026_app/atual --privado ~/domains/drpetrus.top/direito2026_privado
 *
 * Saída: uma linha por falha, com o caminho e a razão (nunca conteúdo), a linha
 * `encontrados=N analisados=N falharam=N` do app e, com --privado, a linha
 * `acervo: encontrados=N analisados=N falharam=N`. Sai 1 se houver falha, se o manifesto for
 * recusado ou se o acervo não conferir.
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
$privado = null;
$posicao = array_search('--privado', $argumentos, true);
if ($posicao !== false) {
    $privado = rtrim((string) ($argumentos[$posicao + 1] ?? ''), '/');
    array_splice($argumentos, $posicao, 2);
    if ($privado === '') {
        d26_cli_falha($cmd, 'uso: --privado exige a pasta privada');
    }
}
if (count($argumentos) !== 1 || $argumentos[0] === '') {
    d26_cli_falha($cmd, 'uso: php conferir-portao.php <pasta-atual-do-app> [--privado <pasta-privada>]');
}
$atual = rtrim($argumentos[0], '/');
if (!is_dir($atual)) {
    d26_cli_falha($cmd, 'pasta do app ausente');
}
if ($privado !== null && !is_dir($privado)) {
    d26_cli_falha($cmd, 'pasta privada ausente');
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

/**
 * Entradas de acervo.json no contrato claro, ou null se o arquivo não bate com ele. Campos exatos
 * (id, tipo, bytes, sha256) e tipo da lista fechada: campo a mais ou a menos reprova, como em
 * scripts/juri/indice.ts.
 *
 * @return list<array{id: string, tipo: string, bytes: int, sha256: string}>|null
 */
function lerEntradasAcervo(string $arquivo): ?array
{
    $dados = json_decode((string) file_get_contents($arquivo), true);
    if (!is_array($dados) || array_keys($dados) !== ['indice'] || !is_array($dados['indice'])) {
        return null;
    }
    $entradas = [];
    $ids = [];
    foreach ($dados['indice'] as $item) {
        if (!is_array($item)) {
            return null;
        }
        $chaves = array_keys($item);
        sort($chaves);
        if ($chaves !== ['bytes', 'id', 'sha256', 'tipo']) {
            return null;
        }
        $id = $item['id'];
        $tipo = $item['tipo'];
        $bytes = $item['bytes'];
        $sha256 = $item['sha256'];
        if (!is_string($id) || preg_match('/^[0-9a-f]{32}$/D', $id) !== 1 || isset($ids[$id])) {
            return null;
        }
        if (!is_string($tipo) || !in_array($tipo, ['jpeg', 'png', 'webp'], true)) {
            return null;
        }
        if (!is_int($bytes) || $bytes <= 0) {
            return null;
        }
        if (!is_string($sha256) || preg_match('/^[0-9a-f]{64}$/D', $sha256) !== 1) {
            return null;
        }
        $ids[$id] = true;
        $entradas[] = ['id' => $id, 'tipo' => $tipo, 'bytes' => $bytes, 'sha256' => $sha256];
    }
    return $entradas;
}

/**
 * Razão da falha para um id do acervo, ou '' se imagens/<id> é arquivo comum do tamanho do índice.
 *
 * @param array{id: string, tipo: string, bytes: int, sha256: string} $entrada
 */
function conferirImagemAcervo(string $pasta, array $entrada): string
{
    $arquivo = $pasta . '/' . $entrada['id'];
    if (is_link($arquivo)) {
        return 'é link simbólico, não arquivo';
    }
    if (!is_file($arquivo)) {
        return 'ausente em imagens/';
    }
    if (filesize($arquivo) !== $entrada['bytes']) {
        return 'tamanho em disco difere do acervo.json';
    }
    return '';
}

/**
 * Confere o acervo da Júri em $privado. Cada entrada conta em encontrados e em analisados; cada
 * falha (id ausente ou de tamanho errado, sobra em imagens/, pasta imagens/ ausente) conta em
 * falharam. Acervo recusado: encontrados=0, analisados=0, falharam=1.
 *
 * @return array{encontrados: int, analisados: int, falharam: int}
 */
function conferirAcervoPrivado(string $privado): array
{
    $entradas = [];
    $arquivoAcervo = $privado . '/acervo.json';
    if (file_exists($arquivoAcervo)) {
        $lidas = lerEntradasAcervo($arquivoAcervo);
        if ($lidas === null) {
            fwrite(STDERR, "conferir-portao: [FALHOU] acervo.json: ilegível ou fora do contrato (id, tipo, bytes, sha256)\n");
            return ['encontrados' => 0, 'analisados' => 0, 'falharam' => 1];
        }
        $entradas = $lidas;
    }
    $pasta = $privado . '/imagens';
    $falharam = 0;
    $nomes = is_dir($pasta) ? array_values(array_diff(scandir($pasta) ?: [], ['.', '..'])) : null;
    if ($nomes === null) {
        $falharam++;
        fwrite(STDERR, "conferir-portao: [FALHOU] acervo: pasta imagens/ ausente\n");
        $nomes = [];
    }
    foreach ($entradas as $entrada) {
        $motivo = conferirImagemAcervo($pasta, $entrada);
        if ($motivo !== '') {
            $falharam++;
            fwrite(STDERR, "conferir-portao: [FALHOU] acervo imagens/{$entrada['id']}: $motivo\n");
        }
    }
    $sobras = count(array_diff($nomes, array_column($entradas, 'id')));
    if ($sobras > 0) {
        $falharam++;
        fwrite(STDERR, "conferir-portao: [FALHOU] acervo: sobra em imagens/: $sobras arquivo(s) fora do índice\n");
    }
    $total = count($entradas);
    return ['encontrados' => $total, 'analisados' => $total, 'falharam' => $falharam];
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
$acervoConfere = true;
if ($privado !== null) {
    $acervo = conferirAcervoPrivado($privado);
    echo "acervo: encontrados={$acervo['encontrados']} analisados={$acervo['analisados']} falharam={$acervo['falharam']}\n";
    $acervoConfere = $acervo['falharam'] === 0 && $acervo['analisados'] === $acervo['encontrados'];
}
exit($falharam === 0 && $analisados === $encontrados && $acervoConfere ? 0 : 1);
