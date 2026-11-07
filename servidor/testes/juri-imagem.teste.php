<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';
require_once __DIR__ . '/apoio/imagensSinteticas.php';

/**
 * Imagem da Júri em claro, servida só com sessão válida e troca feita (plano do
 * CTO do login único, seção 5.2). Bytes sintéticos, nunca foto real (L-28).
 */

teste('juri: imagem.php sem sessão responde 401, mesmo com id que existe no índice', function (): void {
    $a = juriAmbiente();
    $id = imagensSinteticasSemear($a, "\x00\xff" . random_bytes(64));
    $r = $a->cliente()->get('/api/juri/imagem.php?id=' . $id);
    igual(401, $r->status, 'status');
    igual('sem-sessao', $r->json()['erro'] ?? null, 'código do erro');
});

teste('juri: imagem.php com a troca de senha pendente responde 403 e não entrega bytes', function (): void {
    $a = juriAmbiente(['deveTrocar' => true]);
    $bytes = "\x00\xff" . random_bytes(64);
    $id = imagensSinteticasSemear($a, $bytes);
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
    igual(403, $r->status, 'status');
    igual('troca-obrigatoria', $r->json()['erro'] ?? null, 'código do erro');
    naoContem($bytes, $r->corpo, 'nenhum byte da imagem antes da troca');
});

teste('juri: imagem.php entrega os bytes em claro com Content-Type do índice, nosniff, private, no-store sozinho, CORP same-origin e inline', function (): void {
    $a = juriAmbiente();
    $bytes = "\x89PNG\r\n\x1a\n" . random_bytes(256) . "\r\n\0";
    $id = imagensSinteticasSemear($a, $bytes, 'png');
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
    igual(200, $r->status, 'status');
    igual($bytes, $r->corpo, 'bytes idênticos, sem transformar');
    igual('image/png', $r->cabecalho('content-type'), 'Content-Type vem do índice');
    igual(1, count($r->cabecalhos['cache-control'] ?? []), 'um único Cache-Control');
    igual('private, no-store', $r->cabecalho('cache-control'), 'Cache-Control exato: private, no-store, sozinho');
    igual('nosniff', $r->cabecalho('x-content-type-options'), 'nosniff');
    igual('same-origin', $r->cabecalho('cross-origin-resource-policy'), 'Cross-Origin-Resource-Policy same-origin');
    igual('inline', $r->cabecalho('content-disposition'), 'Content-Disposition inline');
    igual((string) strlen($bytes), $r->cabecalho('content-length'), 'Content-Length exato');
});

teste('juri: imagem.php usa o tipo do índice, nunca o do pedido (tipo= e extensão do pedido não mudam nada)', function (): void {
    $a = juriAmbiente();
    $id = imagensSinteticasSemear($a, 'bytes sintéticos de webp', 'webp');
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id . '&tipo=image/png&ext=.html');
    igual(200, $r->status, 'status');
    igual('image/webp', $r->cabecalho('content-type'), 'o índice manda: webp, nunca o pedido');
});

teste('juri: imagem.php recusa índice com tipo fora da lista (503 indisponivel), sem entregar bytes', function (): void {
    $a = juriAmbiente();
    $bytes = 'conteúdo sintético que não é imagem';
    $id = imagensSinteticasSemear($a, $bytes, 'html');
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
    igual(503, $r->status, 'status');
    igual('indisponivel', $r->json()['erro'] ?? null, 'código do erro');
    naoContem($bytes, $r->corpo, 'nenhum byte sai com tipo fora da lista');
});

teste('juri: imagem.php recusa travessia, formato inválido e id fora do índice com 404 e sem byte de fora', function (): void {
    $a = juriAmbiente();
    $marca = 'MARCA-FORA-DO-INDICE-' . bin2hex(random_bytes(8));
    $outraImagem = imagensSinteticasSemear($a, 'imagem indexada sintética');
    file_put_contents($a->priv . '/fora', $marca);
    file_put_contents($a->priv . '/conteudo/fora', $marca);
    $c = juriCliente($a);

    $ruins = [
        'travessia' => '../fora',
        'travessia-em-diretorio' => '../conteudo/fora',
        'travessia-codificada' => '..%2Ffora',
        'travessia-profunda' => '../../../../etc/passwd',
        'nulo' => '%00',
        'vazio' => '',
        'maiusculas' => strtoupper($outraImagem),
        'curto' => substr($outraImagem, 0, 31),
        'longo' => $outraImagem . 'a',
        'caminho-com-barra' => $outraImagem . '/../fora',
        'hex-fora-do-indice' => bin2hex(random_bytes(16)),
    ];
    foreach ($ruins as $nome => $id) {
        $r = $c->get('/api/juri/imagem.php?id=' . $id);
        igual(404, $r->status, "$nome: status");
        igual('nao-encontrada', $r->json()['erro'] ?? null, "$nome: código do erro");
        naoContem($marca, $r->corpo, "$nome: nenhum byte de fora da imagens/");
    }
    $vetor = $c->get('/api/juri/imagem.php?id[]=' . $outraImagem);
    igual(404, $vetor->status, 'id como vetor: 404');
    $semParametro = $c->get('/api/juri/imagem.php');
    igual(404, $semParametro->status, 'sem id');
    naoContem($marca, $semParametro->corpo, 'sem id: nada de fora');
});

teste('juri: imagem.php sem acervo.json responde 404 para qualquer id, inclusive o que estava indexado', function (): void {
    $a = juriAmbiente();
    $bytes = 'imagem sintética do acervo';
    $id = imagensSinteticasSemear($a, $bytes);
    $c = juriCliente($a);
    $antes = $c->get('/api/juri/imagem.php?id=' . $id);
    igual(200, $antes->status, 'com o acervo, o id indexado é entregue (o teste prova o endpoint vivo)');
    igual($bytes, $antes->corpo, 'bytes do acervo');

    unlink($a->priv . '/acervo.json');
    igual(404, $c->get('/api/juri/imagem.php?id=' . $id)->status, 'sem acervo.json, o mesmo id vira 404');
    igual(404, $c->get('/api/juri/imagem.php?id=' . bin2hex(random_bytes(16)))->status, 'e qualquer outro id também');
});

teste('juri: imagem.php com id indexado e arquivo ausente responde 503 indisponivel, nunca 200 vazio', function (): void {
    $a = juriAmbiente();
    $id = imagensSinteticasSemear($a, 'imagem sintética');
    unlink($a->priv . '/imagens/' . $id);
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
    igual(503, $r->status, 'status');
    igual('indisponivel', $r->json()['erro'] ?? null, 'código do erro');
});

teste('juri: imagem.php com acervo.json corrompido responde 503 indisponivel', function (): void {
    $a = juriAmbiente();
    file_put_contents($a->priv . '/acervo.json', '{isto não é json');
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . bin2hex(random_bytes(16)));
    igual(503, $r->status, 'status');
    igual('indisponivel', $r->json()['erro'] ?? null, 'código do erro');
});

teste('juri: imagem.php recusa id com maiúsculas mesmo quando o índice o contém (404), e o id minúsculo indexado sai', function (): void {
    $a = juriAmbiente();
    $bytes = 'imagem sintética de id em maiúsculas';
    $idMinusculo = imagensSinteticasSemear($a, 'imagem sintética de id minúsculo');
    $idMaiusculo = strtoupper(bin2hex(random_bytes(16)));
    imagensSinteticasGravar($a, $idMaiusculo, $bytes, 'png');

    $c = juriCliente($a);
    $r = $c->get('/api/juri/imagem.php?id=' . $idMaiusculo);
    igual(404, $r->status, 'id em maiúsculas, mesmo indexado: 404 (formato estrito de minúsculas)');
    igual('nao-encontrada', $r->json()['erro'] ?? null, 'código do erro');
    naoContem($bytes, $r->corpo, 'nenhum byte sai pelo id em maiúsculas');
    igual(200, $c->get('/api/juri/imagem.php?id=' . $idMinusculo)->status, 'controle: o id minúsculo indexado sai');
});
