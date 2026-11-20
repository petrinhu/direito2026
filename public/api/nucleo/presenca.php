<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Presença de sessão aberta por conta (ADM-F3, plano P4 v2, seção 2). Um arquivo por conta em PRIV/presenca/, com
 * quatro chaves: m (sha256 do marcador de sessão única), v (versão da sessão), a (última atividade gravada) e c
 * (criação da sessão). Sem IP, sem id de sessão e sem histórico. O LED "Sessão aberta" é a regra de
 * d26_sessao_avaliar aplicada a esse arquivo e à conta: conta ativa e sem bloqueio, mesma versão, marcador
 * conferindo, dentro da ociosidade (D26_SESSAO_OCIOSIDADE) e da validade (D26_SESSAO_VALIDADE).
 *
 * O web nunca cria a pasta: só o CLI provisiona (D26_SUBPASTAS). Sem a pasta, nada é gravado, a leitura dá null e a
 * falha vai uma vez por dia (America/Recife), por frase, para o erros.log. Este arquivo é carregado por sessao.php (e pelo CLI de remoção),
 * nunca pela lista de inicio.php, por causa da janela do rsync (plano, seção 3).
 */

/** Intervalo mínimo entre duas gravações de atividade na mesma sessão (segundos). */
const D26_PRESENCA_GRAVACAO = 60;
/** Presença mais velha que isso é apagada pela faxina do login (13 h). */
const D26_PRESENCA_FAXINA = 46800;
/** Intervalo mínimo entre duas passagens da faxina, em qualquer atividade ou na abertura do painel (segundos). */
const D26_PRESENCA_FAXINA_JANELA = 600;
/** Temporário da escrita atômica mais velho que isto (segundos) é órfão e a faxina apaga. Escrita em curso dura ms. */
const D26_PRESENCA_TMP_ORFAO = 300;

require_once __DIR__ . '/presenca-arquivo.php';
require_once __DIR__ . '/presenca-led.php';
require_once __DIR__ . '/presenca-faxina.php';
require_once __DIR__ . '/presenca-aviso.php';
