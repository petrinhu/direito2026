<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

teste('juri: imagem.php sem sessão responde 401, mesmo com id que existe no índice', function (): void {
    $a = juriAmbiente();
    $id = juriSemearImagem($a, "\x00\xff" . random_bytes(64));
    $r = $a->cliente()->get('/api/juri/imagem.php?id=' . $id);
    igual(401, $r->status, 'status');
    igual('sem-sessao', $r->json()['erro'] ?? null, 'código do erro');
});

teste('juri: imagem.php com a troca de senha pendente responde 403 e não entrega bytes', function (): void {
    $a = juriAmbiente(['deveTrocar' => true]);
    $bytes = "\x00\xff" . random_bytes(64);
    $id = juriSemearImagem($a, $bytes);
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
    igual(403, $r->status, 'status');
    igual('troca-obrigatoria', $r->json()['erro'] ?? null, 'código do erro');
    naoContem($bytes, $r->corpo, 'nenhum byte da imagem antes da troca');
});

teste('juri: imagem.php entrega os bytes do índice com cabeçalhos exatos (octet-stream, no-store sozinho, nosniff, sem Content-Disposition)', function (): void {
    $a = juriAmbiente();
    $bytes = "\x00\xff" . random_bytes(256) . "\r\n\0";
    $id = juriSemearImagem($a, $bytes);
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
    igual(200, $r->status, 'status');
    igual($bytes, $r->corpo, 'bytes idênticos, sem transformar');
    igual('application/octet-stream', $r->cabecalho('content-type'), 'Content-Type exato');
    igual(1, count($r->cabecalhos['cache-control'] ?? []), 'um único Cache-Control');
    igual('no-store', $r->cabecalho('cache-control'), 'Cache-Control exato: no-store, sozinho');
    igual('nosniff', $r->cabecalho('x-content-type-options'), 'nosniff');
    igual(null, $r->cabecalho('content-disposition'), 'sem Content-Disposition');
    igual((string) strlen($bytes), $r->cabecalho('content-length'), 'Content-Length exato');
});

teste('juri: imagem.php recusa travessia, formato inválido e id fora do índice com 404 e sem byte de fora', function (): void {
    $a = juriAmbiente();
    $marca = 'MARCA-FORA-DO-INDICE-' . bin2hex(random_bytes(8));
    $outraImagem = juriSemearImagem($a, 'imagem indexada sintética');
    file_put_contents($a->privJuri . '/fora.juri', $marca);
    file_put_contents($a->privJuri . '/conteudo/fora.juri', $marca);
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
        'array' => '',
    ];
    foreach ($ruins as $nome => $id) {
        $caminho = $nome === 'array'
            ? '/api/juri/imagem.php?id[]=' . $outraImagem
            : '/api/juri/imagem.php?id=' . $id;
        $r = $c->get($caminho);
        igual(404, $r->status, "$nome: status");
        igual('nao-encontrada', $r->json()['erro'] ?? null, "$nome: código do erro");
        naoContem($marca, $r->corpo, "$nome: nenhum byte de fora da imagens/");
    }
    $semParametro = $c->get('/api/juri/imagem.php');
    igual(404, $semParametro->status, 'sem id');
    naoContem($marca, $semParametro->corpo, 'sem id: nada de fora');
});

teste('juri: imagem.php sem acervo.json responde 404 para qualquer id, inclusive o que estava indexado', function (): void {
    $a = juriAmbiente();
    $bytes = 'imagem sintética do acervo';
    $id = juriSemearImagem($a, $bytes);
    $c = juriCliente($a);
    $antes = $c->get('/api/juri/imagem.php?id=' . $id);
    igual(200, $antes->status, 'com o acervo, o id indexado é entregue (o teste prova o endpoint vivo)');
    igual($bytes, $antes->corpo, 'bytes do acervo');

    unlink($a->privJuri . '/acervo.json');
    igual(404, $c->get('/api/juri/imagem.php?id=' . $id)->status, 'sem acervo.json, o mesmo id vira 404');
    igual(404, $c->get('/api/juri/imagem.php?id=' . bin2hex(random_bytes(16)))->status, 'e qualquer outro id também');
});

teste('juri: imagem.php com id indexado e arquivo ausente responde 503 indisponivel, nunca 200 vazio', function (): void {
    $a = juriAmbiente();
    $id = juriSemearImagem($a, 'imagem sintética');
    unlink($a->privJuri . '/imagens/' . $id . '.juri');
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
    igual(503, $r->status, 'status');
    igual('indisponivel', $r->json()['erro'] ?? null, 'código do erro');
});

teste('juri: imagem.php com acervo.json corrompido responde 503 indisponivel', function (): void {
    $a = juriAmbiente();
    file_put_contents($a->privJuri . '/acervo.json', '{isto não é json');
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . bin2hex(random_bytes(16)));
    igual(503, $r->status, 'status');
    igual('indisponivel', $r->json()['erro'] ?? null, 'código do erro');
});

teste('juri (R1-C1): imagem.php com conta sem embrulho válido responde 503 e não entrega bytes, mesmo com o id indexado', function (): void {
    $a = juriAmbiente();
    $bytes = "\x00\xff" . random_bytes(64);
    $id = juriSemearImagem($a, $bytes);
    $c = juriCliente($a);
    juriAlterarConta($a, static fn (array $conta): array => array_diff_key($conta, ['embrulho' => 1]));
    $r = $c->get('/api/juri/imagem.php?id=' . $id);
    igual(503, $r->status, 'status');
    igual('indisponivel', $r->json()['erro'] ?? null, 'código do erro');
    naoContem($bytes, $r->corpo, 'nenhum byte da imagem com a conta quebrada');
});
