<?php
declare(strict_types=1);

/**
 * Roteador do servidor embutido do PHP (`php -S`), só para desenvolvimento e
 * testes. Reproduz o que o .htaccess de produção faz:
 *  - /api/nucleo/* é negado (404);
 *  - /api/<arquivo>.php existente é executado; qualquer outro /api/... é 404
 *    (nunca cai na SPA);
 *  - arquivo estático existente é servido; o resto cai em index.html (SPA),
 *    ou 404 quando o docroot não tem index.html.
 *
 * Uso: php -S 127.0.0.1:8080 -t dist servidor/dev/roteador.php
 */

/**
 * Cabeçalhos de segurança, os mesmos de public/.htaccess (a API emite os
 * próprios e não passa por aqui). Só para o QA local enxergar o efeito.
 * $pagina: index.html, 404.html e sw.js também recebem a CSP das páginas.
 */
function d26_dev_cabecalhos(bool $pagina): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header('Strict-Transport-Security: max-age=31536000');
    if ($pagina) { // a CSP só vai nas páginas, como o FilesMatch do .htaccess
        header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    }
}

$raiz = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
$caminho = rawurldecode((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH));

if (str_contains($caminho, "\0") || str_contains($caminho, '..')) {
    http_response_code(400);
    return true;
}

if ($caminho === '/api' || str_starts_with($caminho, '/api/')) {
    if (str_starts_with($caminho, '/api/nucleo')) {
        http_response_code(404);
        return true;
    }
    if (preg_match('#^/api/[a-z0-9-]+\.php$#D', $caminho) === 1 && is_file($raiz . $caminho)) {
        return false;
    }
    http_response_code(404);
    return true;
}

// O servidor embutido descarta cabeçalhos de quem devolve "false" (arquivo estático),
// então as páginas que o .htaccess cobre com a CSP são servidas por aqui mesmo.
$paginas = ['/index.html' => 'text/html; charset=utf-8', '/404.html' => 'text/html; charset=utf-8', '/sw.js' => 'text/javascript; charset=utf-8'];
if (isset($paginas[$caminho]) && is_file($raiz . $caminho)) {
    header('Content-Type: ' . $paginas[$caminho]);
    d26_dev_cabecalhos(true);
    readfile($raiz . $caminho);
    return true;
}

if ($caminho !== '/' && is_file($raiz . $caminho)) {
    return false;
}

$indice = $raiz . '/index.html';
if (is_file($indice)) {
    header('Content-Type: text/html; charset=utf-8');
    d26_dev_cabecalhos(true);
    readfile($indice);
    return true;
}

http_response_code(404);
return true;
