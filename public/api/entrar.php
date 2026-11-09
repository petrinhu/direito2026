<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';
require_once __DIR__ . '/nucleo/telas.php'; // D26_TEXTO_BLOQUEIO (BL-B1): o 403 de conta bloqueada

/**
 * Entrada por JSON (suíte de testes e conferência). A tela de entrada usa acesso.php, que
 * tem o mesmo núcleo (nucleo/login.php). Campo ausente ou de tipo errado é falha comum:
 * passa pelo mesmo caminho e recebe a mesma frase, sem atalho de tempo (plano, seção 1.5).
 */
d26_metodo(['POST']);
$priv = d26_priv();
d26_sessao_iniciar($priv, false); // só abre sessão se já houver uma em disco; a queda aqui não avisa (SU-B2)
d26_aviso_consumir();
d26_exigir_post_seguro();

$corpo = d26_corpo_json();
$usuario = is_string($corpo['usuario'] ?? null) ? $corpo['usuario'] : '';
$senha = is_string($corpo['senha'] ?? null) ? $corpo['senha'] : '';

$r = d26_login_executar($priv, $usuario, $senha);
if ($r['estado'] === 'espera') {
    d26_erro(429, 'aguarde', d26_frase_espera((int) $r['segundos']), ['segundos' => (int) $r['segundos']]);
}
// BL-B1: senha certa numa conta bloqueada por uso simultâneo: 403 com o texto do bloqueio, sem sessão.
if ($r['estado'] === 'bloqueada') {
    d26_erro(403, 'bloqueada', D26_TEXTO_BLOQUEIO);
}
if ($r['estado'] !== 'entrou') {
    d26_erro(401, 'credenciais', D26_FRASE_RECUSA);
}

header('Clear-Site-Data: ' . D26_CLEAR_SITE_DATA);
d26_responder(200, [
    'ok' => true,
    'usuario' => $usuario,
    'admin' => $r['conta']['admin'],
    'deveTrocarSenha' => $r['conta']['deveTrocarSenha'],
    'csrf' => $r['csrf'],
]);
