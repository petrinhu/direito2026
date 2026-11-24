<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';
require_once __DIR__ . '/nucleo/portao.php';

/**
 * Entrada pelo formulário da tela (plano do CTO do login único, seções 1.4 e 1.5; LU-F2.5).
 * Sucesso: 303 para o destino validado, com Clear-Site-Data "cache". Falha: a mesma tela,
 * com a frase, em 401; limite de tentativas: a tela com a frase e os segundos, em 429.
 * Erro de formato ou origem: JSON de erro, como nos demais endpoints. Token que não casa (página vencida):
 * a tela de entrada de novo, com par novo e aviso curto; o login não é tentado.
 */
d26_metodo(['POST']);
$priv = d26_priv();
d26_sessao_iniciar($priv, false); // só abre sessão se já houver uma em disco; a queda aqui não avisa (SU-B2)
d26_aviso_consumir();
d26_exigir_formulario_tipo_e_origem();

$usuario = is_string($_POST['usuario'] ?? null) ? $_POST['usuario'] : '';
$destino = d26_destino_seguro($_POST['destino'] ?? null);
// Página vencida (outra visita à tela trocou o cookie pré): nada é conferido, nem a senha. A tela volta
// com um par novo de cookie e token, o usuário digitado e o aviso; a senha nunca volta.
if (!d26_formulario_token_confere($priv)) {
    d26_portao_tela(403, d26_tela_entrada(d26_formulario_renovar($priv), $destino, null, D26_TEXTO_PAGINA_VENCIDA, $usuario), PORTAO_CSP_TELA);
}

$senha = is_string($_POST['senha'] ?? null) ? $_POST['senha'] : '';

$r = d26_login_executar($priv, $usuario, $senha);
if ($r['estado'] === 'entrou') {
    d26_portao_vazio(303, ['Location' => $destino, 'Clear-Site-Data' => D26_CLEAR_SITE_DATA]);
}

$token = d26_csrf_pre_atual($priv);
// BL-B1: senha certa numa conta bloqueada por uso simultâneo: 403 com o texto do bloqueio, sem sessão.
if ($r['estado'] === 'bloqueada') {
    d26_portao_tela(403, d26_tela_entrada($token, $destino, null, D26_TEXTO_BLOQUEIO), PORTAO_CSP_TELA);
}
if ($r['estado'] === 'espera') {
    d26_portao_tela(429, d26_tela_entrada($token, $destino, d26_frase_espera((int) $r['segundos'])), PORTAO_CSP_TELA);
}
d26_portao_tela(401, d26_tela_entrada($token, $destino, D26_FRASE_RECUSA), PORTAO_CSP_TELA);
