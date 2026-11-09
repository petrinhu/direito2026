<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';
require_once __DIR__ . '/nucleo/portao.php';
require_once __DIR__ . '/nucleo/correio.php'; // o E2 sai daqui, depois da resposta (EM-B4)
require_once __DIR__ . '/nucleo/esqueci.php';

/**
 * Página "Esqueci a senha" (EM-B4, plano 8.1.3). GET mostra o formulário. POST, nesta ordem: formulário seguro
 * (G8); corpo vazio volta o formulário com a frase de erro (400); limite por IP (429, sem nada enviado); resposta
 * única (200) enviada antes de qualquer leitura de conta; depois, a busca e o E2 (d26_esqueci_sequencia).
 */
d26_metodo(['GET', 'POST']);
$priv = d26_priv();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    d26_portao_tela(200, d26_tela_esqueci(d26_csrf_pre_atual($priv)), PORTAO_CSP_TELA);
}

d26_exigir_formulario_seguro($priv);
$token = d26_csrf_pre_atual($priv);
$pedido = is_string($_POST['usuario'] ?? null) ? $_POST['usuario'] : '';
if (trim($pedido) === '') {
    d26_portao_tela(400, d26_tela_esqueci($token, D26_ESQUECI_ERRO_VAZIO), PORTAO_CSP_TELA);
}
$agora = time();
if (!d26_limite_envio_ip($priv, (string) ($_SERVER['REMOTE_ADDR'] ?? ''), $agora)) {
    d26_portao_tela(429, d26_tela_esqueci($token, d26_frase_espera(D26_ENVIO_JANELA_CURTA)), PORTAO_CSP_TELA);
}

d26_esqueci_sequencia(
    $priv,
    static function (): void {
        $corpo = d26_tela_esqueci_enviado();
        d26_portao_cabecalhos(200, 'text/html; charset=utf-8', PORTAO_CSP_TELA, strlen($corpo), 'same-origin');
        echo $corpo;
        while (ob_get_level() > 0) {
            ob_end_flush();
        }
        flush();
    },
    static fn (): bool => d26_terminar_resposta(),
    static fn () => d26_esqueci_tratar($priv, $pedido, $agora)
);
exit;
