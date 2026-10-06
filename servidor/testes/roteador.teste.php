<?php
declare(strict_types=1);

teste('roteador: SPA fallback, estático, /api inexistente é 404 (nunca o index) e nucleo negado', function (): void {
    $a = Ambiente::novo(['docroot' => 'copia']);
    $c = $a->cliente();
    $spa = $c->get('/algum/caminho/da/spa');
    igual(200, $spa->status);
    contem('<title>spa</title>', $spa->corpo, 'rota da SPA devolve o index');
    igual('estatico', $c->get('/arquivo.txt')->corpo, 'arquivo existente é servido');
    foreach (['/api/', '/api/nao-existe.php', '/api/nao-existe', '/api/nucleo/contas.php', '/api/nucleo/'] as $caminho) {
        $r = $c->get($caminho);
        igual(404, $r->status, $caminho);
        naoContem('<title>spa</title>', $r->corpo, "$caminho não cai na SPA");
    }
    igual(['ok' => true], $c->get('/api/saude.php')->json(), 'endpoint existente executa');
});
