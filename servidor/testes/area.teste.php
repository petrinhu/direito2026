<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/** Diretório do núcleo real, o que os endpoints carregam. */
function areaNucleoReal(): string
{
    $nucleo = realpath(RAIZ_REPO . '/public/api/nucleo');
    if ($nucleo === false) {
        falhar('núcleo não encontrado em public/api/nucleo');
    }
    return $nucleo;
}

/**
 * Sobe apoio/area.php num PHP novo: D26_AREA é constante de processo, então a
 * fiação real só se prova com um processo por caso.
 *
 * @return array{int, string, string} [código, stdout, stderr]
 */
function areaRodarProcesso(string $area, string $priv = '-'): array
{
    $p = proc_open(
        [PHP_BINARY, __DIR__ . '/apoio/area.php', $area, areaNucleoReal(), $priv],
        [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes
    );
    if (!is_resource($p)) {
        falhar('não consegui iniciar apoio/area.php');
    }
    $saida = (string) stream_get_contents($pipes[1]);
    $erro = (string) stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    return [proc_close($p), $saida, $erro];
}

/** @return array<string, mixed> */
function areaDecodificar(string $saida): array
{
    $dados = json_decode($saida, true);
    if (!is_array($dados)) {
        falhar('saída do processo não é JSON: ' . substr($saida, 0, 200));
    }
    return $dados;
}

/** @return list<string> subpastas diretas, ordenadas */
function areaSubpastas(string $dir): array
{
    $itens = [];
    foreach (scandir($dir) ?: [] as $item) {
        if ($item !== '.' && $item !== '..' && is_dir($dir . '/' . $item)) {
            $itens[] = $item;
        }
    }
    sort($itens);
    return $itens;
}

teste('area: sem D26_AREA, os 4 valores são os de sempre (Interdisciplinar, literal byte a byte)', function (): void {
    igual('__Host-d26', D26_SESSAO_NOME, 'cookie de sessão');
    igual('__Host-d26pre', D26_PRE_NOME, 'cookie de pré-sessão');
    igual('__Host-d26disp', D26_DISP_NOME, 'cookie de dispositivo');
    igual(
        '/a/b/direito2026_privado',
        d26_dir_privado('/a/b/public_html/direito2026/api/nucleo', 'litespeed', null),
        'diretório privado'
    );

    [$codigo, $saida, $erro] = areaRodarProcesso('AUSENTE');
    igual(0, $codigo, "processo sem D26_AREA: $erro");
    igual(
        ['sessao' => '__Host-d26', 'pre' => '__Host-d26pre', 'disp' => '__Host-d26disp', 'privado' => '/a/b/direito2026_privado'],
        areaDecodificar($saida),
        'processo sem D26_AREA'
    );
}, false);

teste('area: D26_AREA=juri troca os 4 valores (cookies __Host-juri*, juri2026_privado irmão do privado)', function (): void {
    [$codigo, $saida, $erro] = areaRodarProcesso('juri');
    igual(0, $codigo, "processo com D26_AREA=juri: $erro");
    igual(
        ['sessao' => '__Host-juri', 'pre' => '__Host-juripre', 'disp' => '__Host-juridisp', 'privado' => '/a/b/juri2026_privado'],
        areaDecodificar($saida),
        'processo com D26_AREA=juri'
    );
}, false);

teste('area: valor desconhecido de D26_AREA falha fechado, nunca cai no Interdisciplinar em silêncio', function (): void {
    foreach (['d26', 'JURI', ' juri', 'outra', ''] as $ruim) {
        try {
            d26_perfil_area($ruim);
        } catch (InvalidArgumentException) {
            continue;
        }
        falhar("d26_perfil_area aceitou '$ruim'");
    }
    foreach (['outra', ''] as $ruim) {
        [$codigo, $saida, $erro] = areaRodarProcesso($ruim);
        verdadeiro($codigo !== 0, "processo com D26_AREA='$ruim' devia falhar (código $codigo)");
        contem('área desconhecida', $saida . $erro, "D26_AREA='$ruim' falha pelo motivo certo");
        naoContem('__Host-', $saida . $erro, "D26_AREA='$ruim' não pode vazar nome de cookie");
    }
}, false);

teste('area: estrutura da Júri cria imagens/ (700) e a do Interdisciplinar não cria', function (): void {
    $raiz = dirTemporario();
    try {
        d26_garantir_estrutura($raiz . '/padrao');
        igual(['conteudo', 'sessoes'], areaSubpastas($raiz . '/padrao'), 'Interdisciplinar sem imagens/');

        [$codigo, $saida, $erro] = areaRodarProcesso('juri', $raiz . '/juri');
        igual(0, $codigo, "processo com D26_AREA=juri: $erro");
        igual(['conteudo', 'imagens', 'sessoes'], areaDecodificar($saida)['subpastas'] ?? null, 'Júri com imagens/');
        igual(0700, fileperms($raiz . '/juri/imagens') & 0777, 'imagens/ fica 700');
    } finally {
        apagarArvore($raiz);
    }
}, false);
