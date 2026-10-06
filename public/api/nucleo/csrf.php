<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Defesa de POST (CSRF): Content-Type application/json (não é um tipo que
 * formulário cross-site consiga enviar sem preflight), Origin e
 * Sec-Fetch-Site quando vierem, e token por sessão em X-CSRF-Token.
 * O cookie SameSite=Strict é a camada extra, não a única.
 */
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
    $esperado = $_SESSION['csrf'] ?? '';
    $enviado = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!is_string($esperado) || $esperado === '' || !hash_equals($esperado, $enviado)) {
        d26_erro(403, 'csrf', 'Sessão inválida. Recarregue a página e tente de novo.');
    }
}
