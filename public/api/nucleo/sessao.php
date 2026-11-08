<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Sessão server-side em PRIV/sessoes (pasta própria, não a compartilhada).
 * Configurada só por funções de sessão e pelo array de opções (sem ini_set,
 * que o servidor restringe). Invariantes: (1) só existe sessão em disco para
 * quem entrou: visita anônima nunca chama session_start (o CSRF dela vive no
 * cookie __Host-d26pre, ver csrf.php); (2) sessão autenticada só vale enquanto
 * a conta existe, está ativa, uid e versaoSessao conferem e o marcador de sessão única
 * (sessaoVigente da conta, vigente da sessão) confere: um login novo da conta derruba as
 * sessões anteriores (ver d26_marcador_confere).
 */
function d26_sessao_configurar(string $priv): void
{
    session_name(D26_SESSAO_NOME);
    session_save_path($priv . '/sessoes');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

/**
 * @return bool true se a sessão foi aberta. Com $somenteLeitura, a trava do arquivo
 * sai logo (read_and_close): quem só lê não serializa os pedidos da mesma sessão.
 */
function d26_sessao_abrir(bool $somenteLeitura = false): bool
{
    return session_start([
        'use_strict_mode' => 1,
        'use_only_cookies' => 1,
        'use_trans_sid' => 0,
        'cache_limiter' => '',
        'gc_maxlifetime' => D26_SESSAO_VALIDADE + 3600,
    ] + ($somenteLeitura ? ['read_and_close' => true] : []));
}

function d26_cookie_sessao_expirar(): void
{
    setcookie(D26_SESSAO_NOME, '', [
        'expires' => 1,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

/** Devolve a conta da sessão válida, ou null (anônimo: nenhuma sessão é aberta nem criada). */
function d26_sessao_iniciar(string $priv): ?array
{
    $id = $_COOKIE[D26_SESSAO_NOME] ?? null;
    if ($id === null) {
        return null;
    }
    // Cookie malformado ou de sessão que não existe em disco: descarta sem criar arquivo.
    if (!is_string($id) || preg_match('/^[A-Za-z0-9,-]{22,128}$/D', $id) !== 1 || !is_file($priv . '/sessoes/sess_' . $id)) {
        d26_cookie_sessao_expirar();
        return null;
    }
    d26_sessao_configurar($priv);
    if (!d26_sessao_abrir()) {
        throw new D26Indisponivel('session_start falhou');
    }
    $agora = time();
    $conta = d26_sessao_conta_valida($priv, $agora);
    if ($conta === null) {
        d26_sessao_encerrar();
        return null;
    }
    $_SESSION['atividade'] = $agora;
    return $conta;
}

/**
 * Conta da sessão já aberta, se a sessão ainda vale. Não grava nada.
 */
function d26_sessao_conta_valida(string $priv, int $agora): ?array
{
    $conta = isset($_SESSION['usuario']) && is_string($_SESSION['usuario'])
        ? d26_contas_buscar($priv, $_SESSION['usuario'])
        : null;
    $valida = $conta !== null
        && is_string($conta['uid'] ?? null) && $conta['uid'] !== ''
        && $conta['ativo'] === true
        && hash_equals((string) ($conta['uid'] ?? ''), is_string($_SESSION['uid'] ?? null) ? $_SESSION['uid'] : "\0")
        && (int) $conta['versaoSessao'] === (int) ($_SESSION['versao'] ?? -1)
        && d26_marcador_confere($conta['sessaoVigente'] ?? null, $_SESSION['vigente'] ?? null)
        && $agora - (int) ($_SESSION['atividade'] ?? 0) <= D26_SESSAO_OCIOSIDADE
        && $agora - (int) ($_SESSION['criada'] ?? 0) <= D26_SESSAO_VALIDADE;
    return $valida ? $conta : null;
}

/** Atividade mais velha que isto (segundos) é regravada, com trava: o resto é leitura. */
const D26_SESSAO_ATIVIDADE_GRAVACAO = 60;

/**
 * Leitura de sessão do portão (A4): abre com read_and_close, então a trava sai logo e
 * nada é gravado. Só reabre com trava quando a atividade passou de
 * D26_SESSAO_ATIVIDADE_GRAVACAO segundos, para gravar a atividade nova. Anônimo: null,
 * sem sessão criada e sem arquivo novo.
 */
function d26_sessao_ler(string $priv): ?array
{
    $id = $_COOKIE[D26_SESSAO_NOME] ?? null;
    if (!is_string($id) || preg_match('/^[A-Za-z0-9,-]{22,128}$/D', $id) !== 1 || !is_file($priv . '/sessoes/sess_' . $id)) {
        return null;
    }
    d26_sessao_configurar($priv);
    if (!d26_sessao_abrir(true)) {
        throw new D26Indisponivel('session_start falhou');
    }
    $agora = time();
    if ($agora - (int) ($_SESSION['atividade'] ?? 0) > D26_SESSAO_ATIVIDADE_GRAVACAO) {
        return d26_sessao_iniciar($priv);
    }
    return d26_sessao_conta_valida($priv, $agora);
}

/**
 * Login ou troca de senha: id novo (anti-fixação), csrf novo, versão da conta.
 * No login ainda não há sessão: é aqui que ela passa a existir em disco.
 * $vigente é o marcador de sessão única da conta (sessaoVigente) no momento da entrada;
 * null (conta sem marcador, formato antigo) não grava chave nenhuma na sessão.
 */
function d26_sessao_autenticar(string $priv, string $usuario, string $uid, int $versao, bool $novaValidade, ?string $vigente): void
{
    $agora = time();
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
    } else {
        d26_sessao_configurar($priv);
        if (!d26_sessao_abrir()) {
            throw new D26Indisponivel('session_start falhou');
        }
        d26_sessao_faxina($priv . '/sessoes', $agora);
    }
    $_SESSION['usuario'] = $usuario;
    $_SESSION['uid'] = $uid;
    $_SESSION['versao'] = $versao;
    if ($vigente === null) {
        unset($_SESSION['vigente']);
    } else {
        $_SESSION['vigente'] = $vigente;
    }
    if ($novaValidade || !isset($_SESSION['criada'])) {
        $_SESSION['criada'] = $agora;
    }
    $_SESSION['atividade'] = $agora;
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function d26_sessao_encerrar(): void
{
    d26_cookie_sessao_expirar();
    if (session_status() === PHP_SESSION_ACTIVE) {
        $_SESSION = [];
        session_destroy();
    }
}

/** Apaga, de vez em quando, arquivos de sessão mais velhos que a validade absoluta. */
function d26_sessao_faxina(string $pasta, int $agora): void
{
    if (random_int(1, 50) !== 1) {
        return;
    }
    foreach (glob($pasta . '/sess_*') ?: [] as $f) {
        $m = @filemtime($f);
        if ($m !== false && $m < $agora - D26_SESSAO_VALIDADE - 3600) {
            @unlink($f);
        }
    }
}

/** Ponto único das regras de acesso. Devolve a conta ou encerra com 401/403. */
function d26_exigir_conta(?array $conta, bool $liberarTrocaPendente = false): array
{
    if ($conta === null) {
        d26_erro(401, 'sem-sessao', 'É preciso entrar para continuar.');
    }
    if (!$liberarTrocaPendente && $conta['deveTrocarSenha'] !== false) { // tipos já validados; só false estrito libera
        d26_erro(403, 'troca-obrigatoria', 'É preciso trocar a senha antes de continuar.');
    }
    return $conta;
}
