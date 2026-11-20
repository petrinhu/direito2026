<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/**
 * Padrão de Referrer-Policy do PHP (V17-R1, REF-POL-PHP): as respostas do portão, das telas de entrada e troca, do
 * esqueci e da API JSON saem com strict-origin-when-cross-origin, o mesmo que o .htaccess serve no ar. O convite
 * continua com strict-origin (D1: o token ia na URL até a C1, e o fragmento ainda pede a política restrita).
 * Na caixa o php -S não passa pelo .htaccess, então o cabeçalho que o teste lê é o do próprio PHP.
 * Nome de teste começa com "referrer-php:" (filtro do rodar.php).
 */

const REFERRER_PHP_PADRAO = 'strict-origin-when-cross-origin';

teste('referrer-php: R1 entrada, troca, esqueci e API JSON saem com strict-origin-when-cross-origin, uma vez só', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $pontos = [
        'entrada' => $c->get('/', PORTAO_NAVEGACAO),
        'troca' => $c->get('/api/troca.php', PORTAO_NAVEGACAO),
        'esqueci' => $c->get('/api/esqueci.php', PORTAO_NAVEGACAO),
        'API JSON' => $c->get('/api/sessao.php', ['Sec-Fetch-Mode' => 'cors']),
    ];
    foreach ($pontos as $nome => $r) {
        igual(REFERRER_PHP_PADRAO, $r->cabecalho('referrer-policy'), "$nome: Referrer-Policy do padrão novo");
        igual(1, count($r->cabecalhos['referrer-policy'] ?? []), "$nome: um cabeçalho Referrer-Policy só");
    }
});

teste('referrer-php: R1 o convite segue com strict-origin, não com o padrão novo (D1)', function (): void {
    $a = Ambiente::novo();
    $r = $a->cliente()->get('/api/convite.php', PORTAO_NAVEGACAO);
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'convite: strict-origin');
});
