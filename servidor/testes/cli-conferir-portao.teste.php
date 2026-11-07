<?php
declare(strict_types=1);

require_once __DIR__ . '/cli-apoio.php';

/**
 * conferir-portao (LU-F4.3, plano 7.1 b): no PHP do servidor, sem HTTP e sem conta, confere que cada
 * caminho do manifesto do app resolve para um arquivo legível com o bytes e o md5 certos. Usa o
 * mesmo validador do portão (d26_portao_manifesto). App sintético, conteúdo sintético.
 */

/** App sintético em $dir/atual, com manifesto no formato do separador ({versao, arquivos}). @return string pasta atual */
function appSinteticoConferir(string $dir): string
{
    $atual = $dir . '/atual';
    mkdir($atual . '/assets', 0700, true);
    file_put_contents($atual . '/index.html', '<!doctype html><p>CONTEUDO-SINTETICO-HTML</p>');
    file_put_contents($atual . '/assets/app.js', 'var x = "CONTEUDO-SINTETICO-JS";');
    $arquivos = [];
    foreach (['index.html', 'assets/app.js'] as $caminho) {
        $arquivos[$caminho] = [
            'tipo' => str_ends_with($caminho, '.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8',
            'bytes' => filesize($atual . '/' . $caminho),
            'md5' => md5_file($atual . '/' . $caminho),
        ];
    }
    file_put_contents($atual . '/manifesto.json', json_encode(['versao' => '0.0.0.0', 'arquivos' => $arquivos], JSON_THROW_ON_ERROR));
    return $atual;
}

teste('conferir-portao: app íntegro passa, com encontrados = analisados e falharam=0', function (): void {
    $dir = dirTemporario();
    $atual = appSinteticoConferir($dir);
    [$rc, $out, $err] = rodarCliScript('conferir-portao.php', [$atual], '');
    igual(0, $rc, "saída: $out $err");
    contem('encontrados=2 analisados=2 falharam=0', $out, 'contagem');
    naoContem('CONTEUDO-SINTETICO', $out . $err, 'conteúdo do app não é impresso');
    apagarArvore($dir);
}, false);

teste('conferir-portao: arquivo do manifesto ausente reprova e nomeia o caminho', function (): void {
    $dir = dirTemporario();
    $atual = appSinteticoConferir($dir);
    unlink($atual . '/assets/app.js');
    [$rc, $out, $err] = rodarCliScript('conferir-portao.php', [$atual], '');
    verdadeiro($rc !== 0, 'reprovado');
    contem('[FALHOU] assets/app.js', $err, 'razão nomeada');
    contem('falharam=1', $out . $err, 'contagem');
    naoContem('CONTEUDO-SINTETICO', $out . $err, 'conteúdo não impresso');
    apagarArvore($dir);
}, false);

teste('conferir-portao: md5 trocado no disco reprova, mesmo com o bytes igual', function (): void {
    $dir = dirTemporario();
    $atual = appSinteticoConferir($dir);
    $tamanho = filesize($atual . '/assets/app.js');
    file_put_contents($atual . '/assets/app.js', str_repeat('Z', $tamanho));
    [$rc, $out, $err] = rodarCliScript('conferir-portao.php', [$atual], '');
    verdadeiro($rc !== 0, 'reprovado');
    contem('[FALHOU] assets/app.js: md5 do disco difere do manifesto', $err, 'razão nomeada');
    apagarArvore($dir);
}, false);

teste('conferir-portao: manifesto no formato antigo (mapa plano, sem arquivos) reprova pelo validador do portão', function (): void {
    $dir = dirTemporario();
    $atual = appSinteticoConferir($dir);
    file_put_contents($atual . '/manifesto.json', json_encode(['index.html' => ['tipo' => 'text/html', 'bytes' => 1, 'md5' => 'x']], JSON_THROW_ON_ERROR));
    [$rc, $out, $err] = rodarCliScript('conferir-portao.php', [$atual], '');
    verdadeiro($rc !== 0, 'reprovado');
    contem('manifesto recusado pelo portão', $err, 'a recusa vem do validador do portão');
    apagarArvore($dir);
}, false);

teste('conferir-portao: caminho com .. no manifesto reprova; sem argumento ou pasta ausente também', function (): void {
    $dir = dirTemporario();
    $atual = appSinteticoConferir($dir);
    $manifesto = json_decode((string) file_get_contents($atual . '/manifesto.json'), true, 512, JSON_THROW_ON_ERROR);
    $manifesto['arquivos']['../fora.js'] = ['tipo' => 'text/javascript', 'bytes' => 1, 'md5' => 'x'];
    file_put_contents($atual . '/manifesto.json', json_encode($manifesto, JSON_THROW_ON_ERROR));
    [$rc] = rodarCliScript('conferir-portao.php', [$atual], '');
    verdadeiro($rc !== 0, 'caminho com .. recusado');

    [$rc2, , $err2] = rodarCliScript('conferir-portao.php', [], '');
    verdadeiro($rc2 !== 0, 'sem argumento recusa');
    contem('conferir-portao: uso:', $err2, 'uso');

    [$rc3, , $err3] = rodarCliScript('conferir-portao.php', [$dir . '/nao-existe'], '');
    verdadeiro($rc3 !== 0, 'pasta ausente recusa');
    contem('conferir-portao:', $err3, 'a falha vem do próprio CLI');
    apagarArvore($dir);
}, false);
