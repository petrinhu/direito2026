<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/**
 * LGPD-LIMITE (ordem do líder de 25/11/2026): poda de 90 dias das linhas limite-conta do erros.log.
 * Interruptor: poda-lgpd.json no privado, criado à mão pelo líder (é a assinatura). Sem ele, nada sai.
 */

const LP_DIA = 86400;
const LP_LINHA_NOVA_MAIOR = 'limite-conta';

/** Linha no formato real de d26_log_erro_em: data UTC ISO, contexto, detalhe, quebra de linha. */
function lpLinha(int $t, string $contexto, string $detalhe): string
{
    return gmdate('c', $t) . ' ' . $contexto . ' ' . $detalhe . "\n";
}

/** Privado mínimo com erros.log (600) e, opcionalmente, o interruptor da poda. */
function lpPrivado(?int $publicadoEm, ?string $assinatura = 'Assinatura de teste'): string
{
    $priv = dirTemporario() . '/privado';
    mkdir($priv, 0700, true);
    if ($publicadoEm !== null) {
        $estado = ['publicado_em' => $publicadoEm];
        if ($assinatura !== null) {
            $estado['assinatura'] = $assinatura;
        }
        file_put_contents($priv . '/poda-lgpd.json', json_encode($estado));
        chmod($priv . '/poda-lgpd.json', 0600);
    }
    return $priv;
}

function lpEscreverLog(string $priv, string $conteudo): void
{
    file_put_contents($priv . '/erros.log', $conteudo);
    chmod($priv . '/erros.log', 0600);
}

function lpLerLog(string $priv): string
{
    return (string) file_get_contents($priv . '/erros.log');
}

const LP_AGORA = 1_800_000_000;

teste('LGPD-LIMITE: linha limite-conta de 91 dias sai do erros.log e a de 89 dias fica, byte a byte', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA);
    $l91 = lpLinha($agora - 91 * LP_DIA, 'limite-conta', 'conta=chefe tentativas=10 janela=900s');
    $l89 = lpLinha($agora - 89 * LP_DIA, 'limite-conta', 'conta=chefe tentativas=10 janela=900s');
    lpEscreverLog($priv, $l91 . $l89);
    d26_poda_erros($priv, $agora);
    igual($l89, lpLerLog($priv), 'só a linha de 89 dias fica, com o mesmo texto');
}, false);

teste('LGPD-LIMITE: a linha de 91 dias vai para a quarentena de 600, inteira, antes de sair', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA);
    $l91 = lpLinha($agora - 91 * LP_DIA, 'limite-conta', 'conta=chefe tentativas=10 janela=900s');
    lpEscreverLog($priv, $l91);
    d26_poda_erros($priv, $agora);
    $arquivos = glob($priv . '/poda-quarentena/*.log') ?: [];
    igual(1, count($arquivos), 'uma cópia de quarentena');
    igual($l91, (string) file_get_contents($arquivos[0]), 'a cópia tem a linha inteira');
    igual(0600, fileperms($arquivos[0]) & 0777, 'a cópia é 600');
    igual(0700, fileperms($priv . '/poda-quarentena') & 0777, 'a pasta da quarentena é 700');
}, false);

teste('LGPD-LIMITE: poda sem nenhuma linha vencida não muda o erros.log e não cria cópia', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA);
    $l89 = lpLinha($agora - 89 * LP_DIA, 'limite-conta', 'conta=chefe tentativas=10 janela=900s');
    lpEscreverLog($priv, $l89);
    $antes = lpLerLog($priv);
    d26_poda_erros($priv, $agora);
    igual($antes, lpLerLog($priv), 'bytes iguais');
    verdadeiro(!is_dir($priv . '/poda-quarentena'), 'sem pasta de quarentena quando não houve nada a tirar');
}, false);

teste('LGPD-LIMITE: a poda roda sem linha nova no erros.log (não depende de gravação)', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA);
    lpEscreverLog($priv, lpLinha($agora - 91 * LP_DIA, 'limite-conta', 'conta=x tentativas=10 janela=900s'));
    $tamanhoAntes = filesize($priv . '/erros.log');
    d26_poda_erros($priv, $agora);
    verdadeiro(filesize($priv . '/erros.log') < $tamanhoAntes, 'a linha vencida saiu, sem que nada fosse gravado');
    igual('', lpLerLog($priv), 'o arquivo ficou vazio: nenhuma linha nova entrou');
}, false);

teste('LGPD-LIMITE: linha marcada como incidente vai ao registro de incidente e não é apagada', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA);
    $t = $agora - 120 * LP_DIA;
    $incidente = lpLinha($t, 'limite-conta', 'conta=chefe tentativas=10 janela=900s');
    $comum = lpLinha($agora - 91 * LP_DIA, 'limite-conta', 'conta=outra tentativas=10 janela=900s');
    lpEscreverLog($priv, $incidente . $comum);
    file_put_contents($priv . '/incidentes-linhas.txt', gmdate('c', $t) . "\n");
    d26_poda_erros($priv, $agora);
    igual('', lpLerLog($priv), 'a linha de incidente sai do erros.log');
    igual($incidente, (string) file_get_contents($priv . '/incidentes.log'), 'ela vai inteira ao registro de incidente');
    verdadeiro(!str_contains(implode('', array_map('file_get_contents', glob($priv . '/poda-quarentena/*.log') ?: [])), gmdate('c', $t)), 'a linha de incidente não entra na quarentena que será purgada');
}, false);

teste('LGPD-LIMITE: sem o interruptor (poda-lgpd.json) nada sai, nem linha de 400 dias', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado(null);
    $antes = lpLinha($agora - 400 * LP_DIA, 'limite-conta', 'conta=x tentativas=10 janela=900s');
    lpEscreverLog($priv, $antes);
    d26_poda_erros($priv, $agora);
    igual($antes, lpLerLog($priv), 'erros.log idêntico byte a byte');
}, false);

teste('LGPD-LIMITE: menos de 48 h depois da publicação, a poda não apaga nada', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 47 * 3600);
    $antes = lpLinha($agora - 400 * LP_DIA, 'limite-conta', 'conta=x tentativas=10 janela=900s');
    lpEscreverLog($priv, $antes);
    d26_poda_erros($priv, $agora);
    igual($antes, lpLerLog($priv), 'carência de 48 h não cumprida: nada sai');
}, false);

teste('LGPD-LIMITE: interruptor sem assinatura não arma a poda', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA, null);
    $antes = lpLinha($agora - 400 * LP_DIA, 'limite-conta', 'conta=x tentativas=10 janela=900s');
    lpEscreverLog($priv, $antes);
    d26_poda_erros($priv, $agora);
    igual($antes, lpLerLog($priv), 'sem assinatura nada sai');
}, false);

teste('LGPD-LIMITE: interruptor ilegível não arma a poda (falha fechada)', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado(null);
    file_put_contents($priv . '/poda-lgpd.json', '{quebrado');
    $antes = lpLinha($agora - 400 * LP_DIA, 'limite-conta', 'conta=x tentativas=10 janela=900s');
    lpEscreverLog($priv, $antes);
    d26_poda_erros($priv, $agora);
    igual($antes, lpLerLog($priv), 'JSON inválido: nada sai');
}, false);

teste('LGPD-LIMITE: quarentena é purgada aos 31 dias e mantida aos 29', function (): void {
    $t0 = LP_AGORA;
    $priv = lpPrivado($t0 - 5 * LP_DIA);
    lpEscreverLog($priv, lpLinha($t0 - 91 * LP_DIA, 'limite-conta', 'conta=x tentativas=10 janela=900s'));
    d26_poda_erros($priv, $t0);
    igual(1, count(glob($priv . '/poda-quarentena/*.log') ?: []), 'cópia criada no dia zero');
    d26_poda_erros($priv, $t0 + 29 * LP_DIA);
    igual(1, count(glob($priv . '/poda-quarentena/*.log') ?: []), 'aos 29 dias a cópia ainda existe');
    d26_poda_erros($priv, $t0 + 31 * LP_DIA);
    igual(0, count(glob($priv . '/poda-quarentena/*.log') ?: []), 'aos 31 dias a cópia é purgada');
}, false);

teste('LGPD-LIMITE: linha sem data legível ou com data futura fica (na dúvida, fica)', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA);
    $sem = "lixo limite-conta conta=x tentativas=10 janela=900s\n";
    $futura = lpLinha($agora + 10 * LP_DIA, 'limite-conta', 'conta=x tentativas=10 janela=900s');
    lpEscreverLog($priv, $sem . $futura);
    d26_poda_erros($priv, $agora);
    igual($sem . $futura, lpLerLog($priv), 'nenhuma das duas sai');
}, false);

teste('LGPD-LIMITE: linha de outro contexto com mais de 90 dias fica (escopo: só limite-conta)', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA);
    $outra = lpLinha($agora - 200 * LP_DIA, 'inicio', 'mensagem crua de exceção');
    lpEscreverLog($priv, $outra);
    d26_poda_erros($priv, $agora);
    igual($outra, lpLerLog($priv), 'contexto diferente de limite-conta não entra na poda');
}, false);

teste('LGPD-LIMITE: linha gravada depois da poda vai ao fim do arquivo e nenhuma se perde', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA);
    $l89 = lpLinha($agora - 89 * LP_DIA, 'limite-conta', 'conta=a tentativas=10 janela=900s');
    lpEscreverLog($priv, lpLinha($agora - 91 * LP_DIA, 'limite-conta', 'conta=b tentativas=10 janela=900s') . $l89);
    d26_poda_erros($priv, $agora);
    d26_log_erro_em($priv, 'limite-conta', 'conta=c tentativas=10 janela=900s');
    $depois = lpLerLog($priv);
    igual($l89, substr($depois, 0, strlen($l89)), 'a linha que ficou vem primeiro, intacta');
    igual(2, substr_count($depois, "\n"), 'a linha que ficou e a gravada depois, sem perda');
    contem('conta=c tentativas=10', $depois, 'a linha gravada depois da poda está no arquivo');
}, false);

teste('LGPD-LIMITE: o gancho do login aplica a poda sem linha nova (uma vez por hora no máximo)', function (): void {
    $agora = LP_AGORA;
    $priv = lpPrivado($agora - 5 * LP_DIA);
    lpEscreverLog($priv, lpLinha($agora - 91 * LP_DIA, 'limite-conta', 'conta=x tentativas=10 janela=900s'));
    d26_limite_reservar($priv, 'chefe', '203.0.113.7', $agora);
    igual('', lpLerLog($priv), 'a reserva de login aplicou a poda');
    lpEscreverLog($priv, lpLinha($agora - 91 * LP_DIA, 'limite-conta', 'conta=y tentativas=10 janela=900s'));
    d26_limite_reservar($priv, 'chefe', '203.0.113.7', $agora + 60);
    contem('conta=y', lpLerLog($priv), 'dentro da janela de 1 h a poda não roda de novo');
}, false);
