<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Uma linha por frase e por dia (America/Recife), nunca uma a cada pedido: a falha não pode encher o erros.log. A dedupe
 * casa a LINHA INTEIRA "presenca <frase>" do dia de hoje, nunca um pedaço de frase: a frase nova não pode dar por já
 * registrado o "(rename)" de uma versão antiga. A marca estática evita reler o arquivo no mesmo processo, e vai
 * chaveada por pasta e dia, para não valer no dia seguinte num processo de longa duração.
 */
function d26_presenca_avisar(string $priv, string $frase): void
{
    static $avisadas = [];
    $hoje = d26_presenca_dia(time());
    $chave = $priv . "\0" . $hoje . "\0" . $frase;
    if (isset($avisadas[$chave])) {
        return;
    }
    $avisadas[$chave] = true;
    if (d26_presenca_ja_avisada_hoje($priv, $frase, $hoje)) {
        return;
    }
    d26_log_erro_em($priv, 'presenca', $frase);
}

/** Dia (Y-m-d) de um instante no fuso de Recife, sem mexer no fuso global do processo (como correio.php:702). */
function d26_presenca_dia(int $instante): string
{
    return (new DateTimeImmutable('@' . $instante))->setTimezone(new DateTimeZone('America/Recife'))->format('Y-m-d');
}

/**
 * Há no erros.log uma linha "presenca <frase>" cujo carimbo cai no dia $hoje? Carimbo que não decodifica não conta, e a
 * linha vira só uma linha a mais, nunca um bloqueio. strtotime devolve false sem aviso, então a leitura não lança.
 */
function d26_presenca_ja_avisada_hoje(string $priv, string $frase, string $hoje): bool
{
    foreach (explode("\n", (string) @file_get_contents($priv . '/erros.log')) as $linha) {
        $partes = explode(' ', $linha, 2);
        if (count($partes) !== 2 || $partes[1] !== 'presenca ' . $frase) {
            continue;
        }
        $instante = strtotime($partes[0]);
        if ($instante !== false && d26_presenca_dia($instante) === $hoje) {
            return true;
        }
    }
    return false;
}

/** Pasta ausente: a frase de sempre, com a mesma dedupe de d26_presenca_avisar. */
function d26_presenca_avisar_ausente(string $priv): void
{
    d26_presenca_avisar($priv, 'pasta presenca/ ausente: a presença não é gravada até o CLI provisionar a pasta');
}
