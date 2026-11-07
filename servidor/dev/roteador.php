<?php
declare(strict_types=1);

/**
 * Roteador do servidor embutido do PHP (`php -S`), só para desenvolvimento e
 * testes. Espelha, na mesma ordem, as regras do public/.htaccess de produção
 * (plano do CTO do login único, seção 1.2). O teste estático compara as listas
 * e o padrão de API com os do .htaccess: mudar um sem o outro reprova.
 *
 *  - /api/nucleo é negado (403, como o [F,L] do .htaccess);
 *  - /api/<arquivo>.php existente é executado; qualquer outro /api/... é 404;
 *  - os públicos sem conteúdo (sw.js, robots.txt, entrada.css, ícone) saem direto,
 *    e, se faltarem, são 404, não portão;
 *  - todo o resto passa pelo portão, api/portao.php.
 *
 * Limite declarado (L-17): o HTTP_HOST do .htaccess (domínio-pai recusado) NÃO é
 * espelhado aqui. php -S não lê .htaccess; a prova real é a da Onda 6, em LiteSpeed.
 *
 * Uso: php -S 127.0.0.1:8080 -t public servidor/dev/roteador.php
 */

// Os 404, 403 e 400 que o próprio roteador responde também não podem dizer a versão do PHP (R1-C6).
header_remove('X-Powered-By');

$raiz = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
$caminho = rawurldecode((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH));

if (str_contains($caminho, "\0") || str_contains($caminho, '..')) {
    http_response_code(400);
    return true;
}

// Mesma forma que o Apache vê: caminho sem a barra inicial. As strings são as do .htaccess.
$relativo = ltrim($caminho, '/');
$publicos = ['sw.js', 'robots.txt', 'entrada.css', 'icones/favicon.svg'];
$padraoApi = '^api/[a-z0-9/-]+\.php$';

if (preg_match('#^api/nucleo(/|$)#D', $relativo) === 1) {
    http_response_code(403);
    return true;
}

if (preg_match('#' . $padraoApi . '#D', $relativo) === 1) {
    if (is_file($raiz . '/' . $relativo)) {
        return false;
    }
    http_response_code(404);
    return true;
}

if (in_array($relativo, $publicos, true)) {
    if (is_file($raiz . '/' . $relativo)) {
        return false;
    }
    http_response_code(404);
    return true;
}

if ($relativo === 'api' || str_starts_with($relativo, 'api/')) {
    http_response_code(404);
    return true;
}

// Todo o resto passa pelo portão: sem sessão válida, nenhum byte do app sai.
require $raiz . '/api/portao.php';
return true;
