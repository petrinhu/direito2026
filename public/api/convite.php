<?php
declare(strict_types=1);

define('D26_API', true);
// O token vai na URL: nenhuma resposta deste endpoint (tela, 303, 403, 405, 503) envia o Referer (CV-B2).
define('D26_REFERRER_API', 'no-referrer');
require __DIR__ . '/nucleo/inicio.php';
require_once __DIR__ . '/nucleo/portao.php';

/**
 * Página pública do convite (CV-B2, decisão do líder de 08/11/2026): a pessoa abre o link de 48 h, cria a
 * própria senha e já entra. GET mostra a tela e não grava nada (a pré-visualização de mensageiro não consome
 * o link). POST consome o link num compare-and-swap e entra. Todo pedido passa pelo limite por IP, e só a falha
 * de token conta (plano 7.1.6): um link válido devolve a reserva. Todas as respostas saem com "no-referrer".
 * O sucesso do POST (senha criada) expira o cookie de aviso de outro aparelho que veio no pedido (plano 1.2);
 * o convite nunca emite esse cookie (C21). Decisão do orquestrador (plano 1.2, revisão rev-cv-b2.md).
 */
d26_metodo(['GET', 'POST']);
$priv = d26_priv();
$postagem = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');

if ($postagem) {
    // Só troca a sessão de quem já tinha uma (a outra conta sai deste navegador). Sem aviso: é a própria ação.
    d26_sessao_iniciar($priv, false);
    d26_exigir_formulario_seguro($priv);
}

// Reserva do IP antes de olhar o token: sem formato de login, só a chave de IP é tocada (plano 7.1.6).
$reserva = time();
$limite = d26_limite_reservar_detalhado($priv, '', $ip, $reserva);
if ($limite['espera'] > 0) {
    d26_portao_tela(429, d26_tela_mensagem(d26_frase_espera((int) $limite['espera'])), PORTAO_CSP_TELA, 'no-referrer');
}

$token = d26_convite_token_recebido($postagem ? ($_POST['t'] ?? null) : ($_GET['t'] ?? null));
$consulta = $token === null
    ? ['estado' => 'nao-vale', 'conta' => null]
    : d26_convite_classificar(d26_contas_listar($priv), $token, $reserva);
if ($consulta['estado'] !== 'valido' || $token === null || !is_array($consulta['conta'])) {
    d26_convite_recusar($consulta['estado']);
}
// Token válido não é falha: devolve a reserva do IP (só falha de token conta).
d26_limite_sucesso($priv, '', $ip, $reserva, false);
$conta = $consulta['conta'];
$login = (string) $conta['usuario'];

if (!$postagem) {
    d26_portao_tela(200, d26_tela_convite($login, $token, d26_csrf_pre_atual($priv)), PORTAO_CSP_TELA, 'no-referrer');
}

$csrf = d26_csrf_pre_atual($priv);
$nova = is_string($_POST['senhaNova'] ?? null) ? $_POST['senhaNova'] : '';
$repetida = is_string($_POST['senhaRepetida'] ?? null) ? $_POST['senhaRepetida'] : '';
// A validação vem antes do Argon2id: erro de senha não gasta custo caro e não consome o link.
$motivo = d26_validar_senha_nova($nova, $login, '') ?? ($nova === $repetida ? null : D26_CONVITE_REPETICAO);
if ($motivo !== null) {
    d26_portao_tela(400, d26_tela_convite($login, $token, $csrf, $motivo), PORTAO_CSP_TELA, 'no-referrer');
}

// Argon2id fora de qualquer lock; o gancho de pausa dos testes também fica fora (no-op em produção).
$hashNovo = d26_hash_senha($nova);
d26_teste_pausar('convite-antes-gravar', $login);
$gravou = d26_contas_consumir_convite(
    $priv,
    $login,
    (string) $conta['uid'],
    (string) $conta['convite']['hash'],
    $hashNovo,
    time()
);
if ($gravou !== 'ok') {
    // Outro POST ganhou a corrida, ou o link venceu entre a leitura e a gravação: a mensagem sai do estado atual.
    d26_convite_recusar(d26_convite_classificar(d26_contas_listar($priv), $token, time())['estado']);
}

// Senha criada (CAS ok): o aviso de outro aparelho que veio no pedido sai do navegador, no 303 e na tela sem entrada.
d26_aviso_consumir();

// A senha já está criada. Entrar é o mesmo caminho do login (limite, aparelho, sessão única, cookies).
$entrada = d26_login_executar($priv, $login, $nova);
if ($entrada['estado'] === 'entrou') {
    d26_portao_vazio(303, ['Location' => '/', 'Clear-Site-Data' => D26_CLEAR_SITE_DATA], 'no-referrer');
}
d26_portao_tela(200, d26_tela_criada(), PORTAO_CSP_TELA, 'no-referrer');

/** Link recusado: M1 (vencido) e M2 (já usado) com 410; M3 (qualquer outro caso) com 404. Sem formulário. */
function d26_convite_recusar(string $estado): never
{
    if ($estado === 'vencido') {
        d26_portao_tela(410, d26_tela_mensagem(D26_CONVITE_M1), PORTAO_CSP_TELA, 'no-referrer');
    }
    if ($estado === 'usado') {
        d26_portao_tela(410, d26_tela_mensagem(D26_CONVITE_M2), PORTAO_CSP_TELA, 'no-referrer');
    }
    d26_portao_tela(404, d26_tela_mensagem(D26_CONVITE_M3), PORTAO_CSP_TELA, 'no-referrer');
}
