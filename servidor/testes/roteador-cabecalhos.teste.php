<?php
declare(strict_types=1);

/**
 * Cache-Control dos 400, 403 e 404 que o próprio roteador de dev responde (plano do CTO do login
 * único, seção 1.6; LU-F2.4 e LU-F2.6; revisão de segurança, achado BAIXO). Mesmo valor que o
 * portão e a API mandam: private, no-store. Os 200 de arquivo público, servidos pelo próprio php -S,
 * ficam fora deste teste de propósito (o .htaccess de produção não marca cache neles).
 */
teste('roteador de dev: 400, 403 e 404 próprios saem com Cache-Control private, no-store', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $casos = [
        '/api/nucleo/config.php' => 403,
        '/api/nao-existe.php' => 404,
        '/api/juri/nao-existe.php' => 404,
        '/%2e%2e/x' => 400,
    ];
    foreach ($casos as $caminho => $status) {
        $r = $c->get($caminho);
        igual($status, $r->status, "$caminho: status");
        igual('private, no-store', $r->cabecalho('cache-control'), "$caminho: Cache-Control");
    }
});

/**
 * LU-F2.6-N1: os erros de api/ que o .htaccess devolve (o 403 de api/nucleo e o 404 do resto de api/)
 * também saem sem cache no roteador de dev, com as mesmas formas de caminho que o Apache casa sem
 * diferenciar maiúsculas (NC) e com a barra final ou sem ela.
 */
teste('LU-F2.6-N1: roteador de dev, erros de api/ do mesmo conjunto do .htaccess saem com private, no-store', function (): void {
    $c = Ambiente::novo()->cliente();
    $casos = [
        '/api' => 404,
        '/api/' => 404,
        '/API/nao-existe.php' => 404,
        '/api/nucleo' => 403,
        '/api/nucleo/' => 403,
        '/API/NUCLEO/config.php' => 403,
    ];
    foreach ($casos as $caminho => $status) {
        $r = $c->get($caminho);
        igual($status, $r->status, "$caminho: status");
        igual('private, no-store', $r->cabecalho('cache-control'), "$caminho: Cache-Control");
    }
});

/**
 * LU-F2.6-N1, lado de produção. O roteador de dev não lê .htaccess, então a prova aqui é estática:
 * as duas regras de erro de api/ marcam E=API_ERRO, a regra que deixa passar os endpoints .php não
 * marca nada, a lista de regras não mudou (nenhuma negação afrouxada) e o cabeçalho só sai com a
 * marca. A prova real, em LiteSpeed, é o curl da V4 (ver a nota de limite no TODO, LU-F2.6-N1).
 */
teste('LU-F2.6-N1: .htaccess marca só os dois erros de api/ e o cabeçalho sai só com a marca', function (): void {
    $t = (string) file_get_contents(RAIZ_REPO . '/public/.htaccess');
    preg_match_all('#^RewriteRule .+$#m', $t, $regras);
    igual(6, count($regras[0]), 'quantidade de RewriteRule igual à de antes: nenhuma regra nova, nenhuma removida');
    contem('RewriteRule ^api/nucleo(/|$) - [NC,F,L,E=API_ERRO:1]', $t, 'negação de api/nucleo continua [NC,F,L] e marca o erro');
    contem('RewriteRule ^api(/|$) - [NC,R=404,L,E=API_ERRO:1]', $t, '404 do resto de api/ continua [NC,R=404,L] e marca o erro');
    contem('RewriteRule ^api/[a-z0-9/-]+\.php$ - [L]', $t, 'endpoints .php passam sem marca alguma');
    igual(2, preg_match_all('#E=API_ERRO:1#', $t), 'E=API_ERRO:1 só nas duas regras de erro');
    igual(1, preg_match_all('#^\s*Header always set Cache-Control "private, no-store" env=API_ERRO$#m', $t), 'um cabeçalho de cache de erro, com a condição');
    verdadeiro(strpos($t, 'Header always set Cache-Control "private, no-store" env=API_ERRO') > strpos($t, '<IfModule mod_headers.c>'), 'o cabeçalho está dentro de IfModule mod_headers');
    igual(0, preg_match_all('#^\s*Header\s+always\s+set\s+Cache-Control(?![^\n]*env=API_ERRO)#m', $t), 'nenhum Cache-Control "always" sem a condição: o cabeçalho não sai em todas as respostas');
});
