<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Defesa de POST (CSRF): Content-Type application/json (não é um tipo que
 * formulário cross-site consiga enviar sem preflight), Origin e
 * Sec-Fetch-Site quando vierem, e token em X-CSRF-Token. O cookie
 * SameSite=Strict é a camada extra, não a única.
 *
 * Token: com sessão (quem já entrou) é o da sessão. Sem sessão (anônimo,
 * antes do login) é o HMAC-SHA256 de um nonce guardado no cookie
 * __Host-d26pre, com o segredo de PRIV/segredo.key: nada é gravado no
 * servidor por visita (uma hospedagem compartilhada não aguenta um arquivo
 * de sessão por visitante anônimo).
 */
function d26_csrf_pre_token(string $nonce, string $segredo): string
{
    return hash_hmac('sha256', 'pre|' . $nonce, $segredo);
}

/** Nonce do cookie pré-login, ou '' se ausente ou malformado. */
function d26_pre_nonce(): string
{
    $n = $_COOKIE[D26_PRE_NOME] ?? '';
    return is_string($n) && preg_match('/^[0-9a-f]{32}$/D', $n) === 1 ? $n : '';
}

function d26_pre_emitir(): string
{
    $nonce = bin2hex(random_bytes(16));
    setcookie(D26_PRE_NOME, $nonce, [
        'expires' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    return $nonce;
}

/** Token que o cliente deve devolver em X-CSRF-Token; emite o cookie pré se faltar. */
function d26_csrf_token(string $priv): string
{
    if (session_status() === PHP_SESSION_ACTIVE && is_string($_SESSION['csrf'] ?? null)) {
        return $_SESSION['csrf'];
    }
    $nonce = d26_pre_nonce();
    if ($nonce === '') {
        $nonce = d26_pre_emitir();
    }
    return d26_csrf_pre_token($nonce, d26_segredo($priv));
}

/** O que a requisição deveria trazer em X-CSRF-Token; '' = nada a comparar. */
function d26_csrf_esperado(): string
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        $t = $_SESSION['csrf'] ?? '';
        return is_string($t) ? $t : '';
    }
    $nonce = d26_pre_nonce();
    return $nonce === '' ? '' : d26_csrf_pre_token($nonce, d26_segredo(d26_priv()));
}

function d26_origem_propria(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
    return ($https ? 'https' : 'http') . '://' . strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
}

function d26_exigir_post_seguro(): void
{
    $tipo = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    if ($tipo !== 'application/json') {
        d26_erro(400, 'tipo-conteudo', 'Requisição inválida.');
    }
    if (isset($_SERVER['HTTP_ORIGIN']) && strtolower((string) $_SERVER['HTTP_ORIGIN']) !== d26_origem_propria()) {
        d26_erro(403, 'origem', 'Origem não permitida.');
    }
    if (isset($_SERVER['HTTP_SEC_FETCH_SITE']) && $_SERVER['HTTP_SEC_FETCH_SITE'] !== 'same-origin') {
        d26_erro(403, 'origem', 'Origem não permitida.');
    }
    $esperado = d26_csrf_esperado();
    $enviado = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($esperado === '' || !hash_equals($esperado, $enviado)) {
        d26_erro(403, 'csrf', 'Sessão inválida. Recarregue a página e tente de novo.');
    }
}
