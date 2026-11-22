<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

// ---- EM-SMTP-TETO-TOTAL (decisão do líder, 21/11/2026): no "Esqueci a senha", 1 e-mail por conta em 24 h ----
// "Apenas um e-mail é mandado por dia, por senha esquecida, por usuário." Acima disso, silêncio com a mesma frase.

teste('esqueci por conta: 1 e-mail em 24 h; o 2º pedido da mesma conta não sai, mesmo 15 min depois', function (): void {
    $priv = privadoDeLimite();
    $agora = 1_700_000_000;
    verdadeiro(d26_limite_envio_conta($priv, 'ana', $agora), 'o 1º pedido sai');
    verdadeiro(!d26_limite_envio_conta($priv, 'ana', $agora + 900), 'o 2º pedido, 15 min depois, não sai');
    verdadeiro(!d26_limite_envio_conta($priv, 'ana', $agora + 3600 * 23), 'o pedido 23 h depois ainda não sai');
    limparPrivadoDeLimite($priv);
}, false);

teste('esqueci por conta: depois de 24 h do 1º envio, a conta volta a receber um e-mail', function (): void {
    $priv = privadoDeLimite();
    $agora = 1_700_000_000;
    verdadeiro(d26_limite_envio_conta($priv, 'ana', $agora), 'o 1º pedido sai');
    verdadeiro(!d26_limite_envio_conta($priv, 'ana', $agora + 86399), 'a 1 s do fim da janela ainda não sai');
    verdadeiro(d26_limite_envio_conta($priv, 'ana', $agora + 86400), 'na 24 h exatas, sai de novo');
    limparPrivadoDeLimite($priv);
}, false);

teste('esqueci por conta: o limite é por conta; outra conta não é afetada', function (): void {
    $priv = privadoDeLimite();
    $agora = 1_700_000_000;
    verdadeiro(d26_limite_envio_conta($priv, 'ana', $agora), 'ana: 1º pedido sai');
    verdadeiro(d26_limite_envio_conta($priv, 'beto', $agora), 'beto: 1º pedido sai no mesmo instante');
    limparPrivadoDeLimite($priv);
}, false);
