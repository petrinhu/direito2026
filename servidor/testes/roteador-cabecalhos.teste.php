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
