<?php
declare(strict_types=1);

/**
 * Roteador do servidor embutido do PHP (`php -S`), só para desenvolvimento e
 * testes. Reproduz o que o .htaccess de produção faz (plano do CTO do login único,
 * seção 1.2):
 *  - /api/nucleo/* é negado (404);
 *  - /api/<arquivo>.php e /api/juri/<arquivo>.php existentes são executados;
 *    qualquer outro /api/... é 404 (nunca cai no portão);
 *  - só os públicos sem conteúdo são servidos direto (sw.js, robots.txt,
 *    entrada.css, ícone): todo o resto passa pelo portão, api/portao.php.
 *
 * Uso: php -S 127.0.0.1:8080 -t public servidor/dev/roteador.php
 */

// Os 404 e 400 que o próprio roteador responde também não podem dizer a versão do PHP (R1-C6).
header_remove('X-Powered-By');

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
    // Subpasta só a da Júri (api/juri/): nucleo/ nunca passa aqui (negado acima).
    if (preg_match('#^/api/(juri/)?[a-z0-9-]+\.php$#D', $caminho) === 1 && is_file($raiz . $caminho)) {
        return false;
    }
    http_response_code(404);
    return true;
}

// Públicos sem conteúdo: o ícone, o matador do service worker, o robots e o CSS de entrada.
$publicos = ['/sw.js', '/robots.txt', '/entrada.css', '/icones/favicon.svg'];
if (in_array($caminho, $publicos, true) && is_file($raiz . $caminho)) {
    return false;
}

// Todo o resto passa pelo portão: sem sessão válida, nenhum byte do app sai.
require $raiz . '/api/portao.php';
return true;
