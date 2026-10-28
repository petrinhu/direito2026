<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

teste('juri: sair.php responde 200 {ok: true} e a sessão da Júri deixa de valer', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $r = $c->post('/api/juri/sair.php', []);
    igual(200, $r->status, 'status');
    igual(['ok'], array_keys($r->json()), 'chaves exatas');
    igual(true, $r->json()['ok'], 'ok');
    igual(false, $c->get('/api/juri/sessao.php')->json()['autenticado'], 'sessão encerrada');
    igual(401, $c->get('/api/juri/conteudo.php')->status, 'conteúdo fechado depois de sair');
});

teste('juri: sair sem X-CSRF-Token responde 403 e a sessão continua aberta', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $csrf = $c->csrf;
    $c->csrf = null;
    igual(403, $c->post('/api/juri/sair.php', [])->status, 'sem CSRF');
    $c->csrf = $csrf;
    igual(true, $c->get('/api/juri/sessao.php')->json()['autenticado'], 'a sessão não caiu');
});

teste('juri: sair.php só aceita POST (GET = 405)', function (): void {
    $a = juriAmbiente();
    igual(405, juriCliente($a)->get('/api/juri/sair.php')->status, 'GET');
});

teste('juri: sair.php sem sessão responde 200 {ok: true} e não abre sessão', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $r = $c->post('/api/juri/sair.php', []);
    igual(200, $r->status, 'status');
    igual(true, $r->json()['ok'], 'ok');
    igual(false, $c->get('/api/juri/sessao.php')->json()['autenticado'], 'continua anônimo');
});
