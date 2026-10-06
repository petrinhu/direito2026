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

if ($caminho !== '/' && is_file($raiz . $caminho)) {
    return false;
}

$indice = $raiz . '/index.html';
if (is_file($indice)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($indice);
    return true;
}

http_response_code(404);
return true;
