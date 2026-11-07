<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';
require_once __DIR__ . '/apoio/imagensSinteticas.php';

/**
 * Formato do acervo depois da unificação (plano do CTO do login único, seção 5.2):
 * índice com id, tipo, bytes e sha256, sem kid. A ferramenta que grava o acervo
 * (scripts/juri/acervo.ts) muda na F4; estes testes provam o lado do servidor com o
 * formato novo. O teste da ferramenta com a credencial antiga saiu com a cifra.
 */

teste('juri (acervo): índice no formato novo serve a imagem em claro pelo login único, com o tipo do índice', function (): void {
    $a = juriAmbiente();
    $bytes = "\xFF\xD8\xFF" . random_bytes(128);
    $id = imagensSinteticasSemear($a, $bytes, 'jpeg');
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
    igual(200, $r->status, 'status');
    igual($bytes, $r->corpo, 'bytes em claro, sem decifrar');
    igual('image/jpeg', $r->cabecalho('content-type'), 'Content-Type jpeg, do índice');
});

teste('juri (acervo): kid de cifra antiga sobrando no índice é ignorado: o índice vale sem ele', function (): void {
    $a = juriAmbiente();
    $bytes = 'imagem sintética com kid antigo';
    $id = imagensSinteticasSemear($a, $bytes, 'png');
    $arq = $a->priv . '/acervo.json';
    $acervo = json_decode((string) file_get_contents($arq), true, 16, JSON_THROW_ON_ERROR);
    $acervo['kid'] = bin2hex(random_bytes(16));
    file_put_contents($arq, json_encode($acervo, JSON_THROW_ON_ERROR));
    $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
    igual(200, $r->status, 'status com kid sobrando');
    igual($bytes, $r->corpo, 'bytes do índice');
});

teste('juri (acervo): tipo fora da lista fechada (jpeg, png, webp), em maiúsculas ou como MIME, responde 503 e não entrega', function (): void {
    foreach (['PNG', 'image/png', 'gif'] as $tipo) {
        $a = juriAmbiente();
        $bytes = "conteúdo sintético tipo $tipo";
        $id = imagensSinteticasSemear($a, $bytes, $tipo);
        $r = juriCliente($a)->get('/api/juri/imagem.php?id=' . $id);
        igual(503, $r->status, "tipo '$tipo': status");
        igual('indisponivel', $r->json()['erro'] ?? null, "tipo '$tipo': código do erro");
        naoContem($bytes, $r->corpo, "tipo '$tipo': nenhum byte sai");
    }
});
