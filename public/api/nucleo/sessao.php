<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Sessão server-side em PRIV/sessoes (pasta própria, não a compartilhada).
 * Configurada só por funções de sessão e pelo array de opções (sem ini_set,
 * que o servidor restringe). Invariante: sessão autenticada só vale enquanto
 * a conta existe, está ativa e a versaoSessao confere.
 */
function d26_sessao_iniciar(string $priv): ?array
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
    $ok = session_start([
        'use_strict_mode' => 1,
        'use_only_cookies' => 1,
        'use_trans_sid' => 0,
        'cache_limiter' => '',
        'gc_maxlifetime' => D26_SESSAO_VALIDADE + 3600,
    ]);
    if (!$ok) {
        throw new RuntimeException('session_start falhou');
    }
    $agora = time();
    if (!isset($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['criada'] = $agora;
        d26_sessao_faxina($priv . '/sessoes', $agora);
    }
    if (!isset($_SESSION['usuario'])) {
        return null;
    }
    $conta = d26_contas_buscar($priv, (string) $_SESSION['usuario']);
    $valida = $conta !== null
        && $conta['ativo'] === true
        && (int) $conta['versaoSessao'] === (int) ($_SESSION['versao'] ?? -1)
        && $agora - (int) ($_SESSION['atividade'] ?? 0) <= D26_SESSAO_OCIOSIDADE
        && $agora - (int) ($_SESSION['criada'] ?? 0) <= D26_SESSAO_VALIDADE;
    if (!$valida) {
        unset($_SESSION['usuario'], $_SESSION['versao'], $_SESSION['atividade']);
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['criada'] = $agora;
        return null;
    }
    $_SESSION['atividade'] = $agora;
    return $conta;
}

/** Login ou troca de senha: id novo (anti-fixação), csrf novo, versão da conta. */
function d26_sessao_autenticar(string $usuario, int $versao, bool $novaValidade): void
{
    session_regenerate_id(true);
    $agora = time();
    $_SESSION['usuario'] = $usuario;
    $_SESSION['versao'] = $versao;
    if ($novaValidade) {
        $_SESSION['criada'] = $agora;
    }
    $_SESSION['atividade'] = $agora;
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function d26_sessao_encerrar(): void
{
    $_SESSION = [];
    setcookie(D26_SESSAO_NOME, '', [
        'expires' => 1,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_destroy();
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
    if (!$liberarTrocaPendente && $conta['deveTrocarSenha'] === true) {
        d26_erro(403, 'troca-obrigatoria', 'É preciso trocar a senha antes de continuar.');
    }
    return $conta;
}
