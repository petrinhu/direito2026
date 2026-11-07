<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

/**
 * Lacuna da B2: nenhum teste afirmava Cache-Control em TODOS os endpoints da área.
 * Cada caso confere o status esperado (para o caso ser o que diz) e o cabeçalho
 * EXATO no-store, em sucesso e em erro. Igualdade exata, não contém: uma troca
 * para "private" ou para um valor composto tem de quebrar aqui. Depois da
 * unificação (F2.2) a área tem dois endpoints: conteudo.php e imagem.php.
 */
teste('juri: os endpoints da área respondem Cache-Control exato no-store, em sucesso e em erro', function (): void {
    $a = juriAmbiente();
    juriSemearConteudo($a, '{"versao":1}');
    $idImagem = juriSemearImagem($a, 'bytes-sinteticos-juri');
    $casos = [
        'conteudo 200' => [200, juriCliente($a)->get('/api/juri/conteudo.php')],
        'conteudo 401' => [401, juriAnonimo($a)->get('/api/juri/conteudo.php')],
        'imagem 200' => [200, juriCliente($a)->get('/api/juri/imagem.php?id=' . $idImagem)],
        'imagem 401' => [401, juriAnonimo($a)->get('/api/juri/imagem.php?id=' . $idImagem)],
        'imagem 404' => [404, juriCliente($a)->get('/api/juri/imagem.php?id=' . str_repeat('0', 32))],
    ];
    foreach ($casos as $nome => [$esperado, $r]) {
        igual($esperado, $r->status, "$nome: status");
        igual('no-store', $r->cabecalho('cache-control'), "$nome: Cache-Control");
    }
});
