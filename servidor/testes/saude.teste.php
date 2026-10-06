<?php
declare(strict_types=1);

teste('saude.php devolve exatamente {"ok":true}', function (): void {
    $a = Ambiente::novo();
    $r = $a->cliente()->get('/api/saude.php');
    igual(200, $r->status);
    igual(['ok' => true], $r->json());
});

teste('sessao.php anônima traz autenticado=false e um csrf', function (): void {
    $a = Ambiente::novo();
    $r = $a->cliente()->get('/api/sessao.php');
    igual(200, $r->status);
    $j = $r->json();
    igual(true, $j['ok']);
    igual(false, $j['autenticado']);
    verdadeiro(is_string($j['csrf']) && strlen($j['csrf']) >= 32, 'csrf com pelo menos 32 caracteres');
});
