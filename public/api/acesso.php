<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';
require_once __DIR__ . '/nucleo/portao.php';

/**
 * Entrada pelo formulário da tela (plano do CTO do login único, seções 1.4 e 1.5; LU-F2.5).
 * Sucesso: 303 para o destino validado, com Clear-Site-Data "cache". Falha: a mesma tela,
 * com a frase, em 401; limite de tentativas: a tela com a frase e os segundos, em 429.
 * Erro de formato, origem ou token: JSON de erro, como nos demais endpoints.
 */
d26_metodo(['POST']);
$priv = d26_priv();
d26_sessao_iniciar($priv); // só abre sessão se já houver uma em disco
d26_exigir_formulario_seguro($priv);

$usuario = is_string($_POST['usuario'] ?? null) ? $_POST['usuario'] : '';
$senha = is_string($_POST['senha'] ?? null) ? $_POST['senha'] : '';
$destino = d26_destino_seguro($_POST['destino'] ?? null);

$r = d26_login_executar($priv, $usuario, $senha);
if ($r['estado'] === 'entrou') {
    d26_portao_vazio(303, ['Location' => $destino, 'Clear-Site-Data' => D26_CLEAR_SITE_DATA]);
}

$token = d26_csrf_pre_atual($priv);
if ($r['estado'] === 'espera') {
    d26_portao_tela(429, d26_tela_entrada($token, $destino, d26_frase_espera((int) $r['segundos'])), PORTAO_CSP_TELA);
}
d26_portao_tela(401, d26_tela_entrada($token, $destino, D26_FRASE_RECUSA), PORTAO_CSP_TELA);
