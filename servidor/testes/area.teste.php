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
 * Sobe apoio/area.php num PHP novo, para provar a fiação real do núcleo (cookies,
 * privado e estrutura) por caso, sem depender de constante de outro processo.
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

teste('area: D26_AREA deixou de mudar o perfil: com ou sem D26_AREA=juri, cookies e privado são os mesmos', function (): void {
    [$codigoSem, $saidaSem, $erroSem] = areaRodarProcesso('AUSENTE');
    igual(0, $codigoSem, "processo sem D26_AREA: $erroSem");
    $sem = areaDecodificar($saidaSem);

    [$codigoJuri, $saidaJuri, $erroJuri] = areaRodarProcesso('juri');
    igual(0, $codigoJuri, "processo com D26_AREA=juri: $erroJuri");

    igual(
        ['sessao' => '__Host-d26', 'pre' => '__Host-d26pre', 'disp' => '__Host-d26disp', 'privado' => '/a/b/direito2026_privado'],
        $sem,
        'valores fixos do Interdisciplinar, sem D26_AREA'
    );
    igual($sem, areaDecodificar($saidaJuri), 'D26_AREA=juri não troca nenhum valor');
}, false);

teste('area: estrutura única do privado: direito2026_privado tem sessoes, conteudo e imagens (700), com ou sem D26_AREA', function (): void {
    $raiz = dirTemporario();
    try {
        foreach (['AUSENTE' => 'padrao', 'juri' => 'juri'] as $area => $pasta) {
            [$codigo, $saida, $erro] = areaRodarProcesso($area, $raiz . '/' . $pasta);
            igual(0, $codigo, "processo $area: $erro");
            igual(['conteudo', 'imagens', 'sessoes'], areaDecodificar($saida)['subpastas'] ?? null, "$area: subpastas");
            igual(0700, fileperms($raiz . '/' . $pasta . '/imagens') & 0777, "$area: imagens/ fica 700");
        }
    } finally {
        apagarArvore($raiz);
    }
}, false);

teste('area: juri/conteudo.php e juri/imagem.php não definem D26_AREA nem carregam nucleo/juri.php', function (): void {
    foreach (['conteudo.php', 'imagem.php'] as $arquivo) {
        $codigo = (string) file_get_contents(RAIZ_REPO . '/public/api/juri/' . $arquivo);
        naoContem('D26_AREA', $codigo, "$arquivo: sem D26_AREA");
        naoContem('nucleo/juri.php', $codigo, "$arquivo: sem nucleo/juri.php");
        naoContem('d26_juri_conta_validar', $codigo, "$arquivo: sem validação de salt e embrulho");
    }
}, false);

teste('area: juri/conteudo.php lê conteudo/juri.json do direito2026_privado, no layout de produção', function (): void {
    $a = Ambiente::novo(['layout' => 'producao']);
    $json = '{"titulo":"fixture sintética de área"}';
    file_put_contents($a->priv . '/conteudo/juri.json', $json);
    $r = $a->entrar()->get('/api/juri/conteudo.php');
    igual(200, $r->status, 'status com a sessão unificada');
    igual(['ok' => true, 'conteudo' => json_decode($json, true)], $r->json(), 'conteúdo lido do privado unificado');
});
