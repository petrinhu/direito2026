<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Faxina oportunista (ADM-F6b): roda numa atividade qualquer (sessão reavaliada, login, abertura do painel), no máximo
 * uma vez a cada D26_PRESENCA_FAXINA_JANELA segundos. O marcador .faxina guarda a última passagem no mtime. Não é
 * JSON, então o glob da faxina não o apaga nem o lê.
 */
function d26_presenca_faxina_oportunista(string $priv, int $agora): void
{
    $pasta = $priv . '/presenca';
    if (!is_dir($pasta)) {
        return;
    }
    $marcador = $pasta . '/.faxina';
    clearstatcache(true, $marcador);
    if (is_file($marcador) && $agora - (int) filemtime($marcador) < D26_PRESENCA_FAXINA_JANELA) {
        return;
    }
    // Sem o marcador a faxina segue assim mesmo (ADM-F6d): a retenção de 13 h vale mais que varrer a pasta a cada pedido.
    if (!@touch($marcador, $agora)) {
        d26_presenca_avisar($priv, 'faxina da presença falhou (marcador)');
    }
    d26_presenca_faxina($priv, $agora);
}

/** Faxina do login: apaga presença com mais de D26_PRESENCA_FAXINA segundos, e a ilegível. */
function d26_presenca_faxina(string $priv, int $agora): void
{
    if (!is_dir($priv . '/presenca')) {
        return;
    }
    foreach (glob($priv . '/presenca/*.json') ?: [] as $arq) {
        $d = json_decode((string) @file_get_contents($arq), true);
        if (!is_array($d) || !is_int($d['a'] ?? null) || $agora - $d['a'] > D26_PRESENCA_FAXINA) {
            @unlink($arq);
        }
    }
    // Temporário da escrita atômica mais velho que D26_PRESENCA_TMP_ORFAO é órfão: o processo morreu antes do rename.
    foreach (glob($priv . '/presenca/*.tmp') ?: [] as $tmp) {
        if ($agora - (int) @filemtime($tmp) > D26_PRESENCA_TMP_ORFAO) {
            @unlink($tmp);
        }
    }
}
