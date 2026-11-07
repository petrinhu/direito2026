<?php
declare(strict_types=1);

/**
 * Imagens SINTÉTICAS dos testes da Júri (plano do CTO do login único, seção 5.2):
 * bytes inventados, nunca foto real (L-28). Grava PRIV/imagens/<id> (sem extensão,
 * modo 600) e acrescenta ao PRIV/acervo.json a entrada {id, tipo, bytes, sha256}.
 * O índice não tem kid: esse campo era da cifra e saiu do formato.
 */

/** Grava a imagem e a entrada do índice com um id dado (o caller escolhe o id, p. ex. em maiúsculas). */
function imagensSinteticasGravar(Ambiente $a, string $id, string $bytes, string $tipo): void
{
    $dir = $a->priv . '/imagens';
    if (!is_dir($dir)) {
        mkdir($dir, 0700);
    }
    $arqImagem = $dir . '/' . $id;
    file_put_contents($arqImagem, $bytes);
    chmod($arqImagem, 0600);

    $arq = $a->priv . '/acervo.json';
    $acervo = is_file($arq)
        ? json_decode((string) file_get_contents($arq), true, 16, JSON_THROW_ON_ERROR)
        : ['indice' => []];
    $acervo['indice'][] = ['id' => $id, 'tipo' => $tipo, 'bytes' => strlen($bytes), 'sha256' => hash('sha256', $bytes)];
    file_put_contents($arq, json_encode($acervo, JSON_THROW_ON_ERROR));
    chmod($arq, 0600);
}

/** Semeia uma imagem sintética com id novo (32 hex minúsculos) e devolve o id. */
function imagensSinteticasSemear(Ambiente $a, string $bytes, string $tipo = 'png'): string
{
    $id = bin2hex(random_bytes(16));
    imagensSinteticasGravar($a, $id, $bytes, $tipo);
    return $id;
}
