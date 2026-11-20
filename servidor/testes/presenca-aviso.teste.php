<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';
require_once __DIR__ . '/apoio/presenca.php';

/**
 * Presença: aviso no erros.log (uma linha por frase por dia, dia de Recife).
 * Nome de teste começa com "presença:" (filtro do rodar.php).
 */

teste('presença: a linha antiga "gravação da presença falhou (rename)" não impede o aviso novo', function (): void {
    $a = Ambiente::novo();
    presencaFalharGravacao($a);
    // Linha de hoje no formato real de d26_log_erro_em (respostas.php:123), com o texto da versão antiga.
    file_put_contents($a->priv . '/erros.log', gmdate('c') . ' presenca gravação da presença falhou (rename)' . "\n");
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(1, presencaAvisosNoLog($a, 'gravação da presença falhou'), 'o aviso novo entra mesmo com a linha antiga no log');
});

teste('presença: a mesma frase no mesmo dia gera uma linha só, mesmo com dois logins', function (): void {
    $a = Ambiente::novo();
    presencaFalharGravacao($a);
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(1, presencaAvisosNoLog($a, 'gravação da presença falhou'), 'uma linha por frase por dia');
});

teste('presença: a mesma frase de um dia anterior não impede a linha de hoje', function (): void {
    $a = Ambiente::novo();
    presencaFalharGravacao($a);
    // Último segundo de ontem em America/Recife. Em UTC ele já cai no dia de hoje, por isso o carimbo sai com gmdate.
    $ontem = (new DateTimeImmutable('today', new DateTimeZone('America/Recife')))->modify('-1 second')->getTimestamp();
    file_put_contents($a->priv . '/erros.log', gmdate('c', $ontem) . ' presenca gravação da presença falhou' . "\n");
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(2, presencaAvisosNoLog($a, 'gravação da presença falhou'), 'a linha de ontem fica e a de hoje entra');
});

teste('presença: a dedupe usa o dia de Recife, não o UTC', function (): void {
    $a = Ambiente::novo();
    presencaFalharGravacao($a);
    // Dois ramos, escolhidos pelo relógio: D é o dia de Recife e U é o dia UTC agora. Juntos cobrem os dois lados da
    // meia-noite de Recife, e um mutante que compare o dia em UTC morre nos dois, a qualquer hora do dia.
    // - D == U (00h a 21h de Recife): a semente é 1 s antes da meia-noite de Recife de hoje. Em Recife é ontem; em UTC
    //   cai no dia D. O correto acrescenta a linha de hoje (total 2). O mutante vê "hoje" na semente e não acrescenta (total 1).
    // - D != U (21h a 24h de Recife): a semente é a própria meia-noite de Recife de hoje. Em Recife é hoje; em UTC ainda
    //   é o dia D, diferente de U. O correto não acrescenta (total 1). O mutante acrescenta (total 2).
    // Janela de corrida: se o relógio cruzar 21h ou a meia-noite de Recife entre a leitura de $meia e o login (milissegundos),
    // o ramo sai errado.
    $meia = new DateTimeImmutable('today', new DateTimeZone('America/Recife'));
    $mesmoDia = $meia->format('Y-m-d') === gmdate('Y-m-d');
    $t = $mesmoDia ? $meia->getTimestamp() - 1 : $meia->getTimestamp();
    file_put_contents($a->priv . '/erros.log', gmdate('c', $t) . ' presenca gravação da presença falhou' . "\n");
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(
        $mesmoDia ? 2 : 1,
        presencaAvisosNoLog($a, 'gravação da presença falhou'),
        ($mesmoDia ? 'ramo D == U' : 'ramo D != U') . ': a dedupe compara o dia de Recife, não o UTC'
    );
});
