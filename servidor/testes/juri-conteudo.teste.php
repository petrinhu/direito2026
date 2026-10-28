<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

teste('juri: conteudo.php sem sessão responde 401 sem-sessao', function (): void {
    $a = Ambiente::novo();
    $r = $a->cliente()->get('/api/juri/conteudo.php');
    igual(401, $r->status, 'status');
    igual('sem-sessao', $r->json()['erro'] ?? null, 'código do erro');
});

teste('juri: conteudo.php com a troca de senha pendente responde 403 troca-obrigatoria e não vaza o conteúdo', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    juriSemearConteudo($a, '{"titulo":"fixture sintética"}');
    $r = juriCliente($a)->get('/api/juri/conteudo.php');
    igual(403, $r->status, 'status');
    igual('troca-obrigatoria', $r->json()['erro'] ?? null, 'código do erro');
    naoContem('fixture sintética', $r->corpo, 'o conteúdo não sai antes da troca');
});

teste('juri: conteudo.php com sessão da Júri responde 200 com o JSON fixo de conteudo/juri.json', function (): void {
    $a = Ambiente::novo();
    $json = '{"titulo":"fixture sintética","perguntas":[1,2]}';
    juriSemearConteudo($a, $json);
    $r = juriCliente($a)->get('/api/juri/conteudo.php');
    igual(200, $r->status, 'status');
    igual(['ok' => true, 'conteudo' => json_decode($json, true)], $r->json(), 'corpo');
    igual('application/json; charset=utf-8', $r->cabecalho('content-type'), 'tipo');
    igual('no-store', $r->cabecalho('cache-control'), 'cache');
});

teste('juri: conteudo.php ignora parâmetros da requisição (arquivo fixo, nunca escolhido pelo cliente)', function (): void {
    $a = Ambiente::novo();
    juriSemearConteudo($a, '{"titulo":"fixture sintética"}');
    $c = juriCliente($a);
    $puro = $c->get('/api/juri/conteudo.php')->corpo;
    $r = $c->get('/api/juri/conteudo.php?arquivo=../../segredo.key&conteudo=../interdisciplinar');
    igual(200, $r->status, 'status');
    igual($puro, $r->corpo, 'mesmo corpo, com ou sem parâmetros');
});

teste('juri: a sessão de uma área não abre a outra (__Host-d26 não serve à Júri, __Host-juri não serve ao Interdisciplinar)', function (): void {
    $a = Ambiente::novo();
    juriSemearConteudo($a, '{"titulo":"fixture sintética"}');
    $inter = $a->entrar();
    $soInter = $a->cliente();
    $soInter->cookies['__Host-d26'] = $inter->cookies['__Host-d26'];
    igual(401, $soInter->get('/api/juri/conteudo.php')->status, 'sessão do Interdisciplinar na Júri');

    $soJuri = $a->cliente();
    $soJuri->cookies['__Host-juri'] = juriCliente($a)->cookies['__Host-juri'];
    igual(401, $soJuri->get('/api/conteudo.php')->status, 'sessão da Júri no Interdisciplinar');
});

teste('juri: /api/juri/ inexistente é 404 e nunca cai na SPA; POST em conteudo.php é 405', function (): void {
    $a = Ambiente::novo(['docroot' => 'copia']);
    $c = $a->cliente();
    foreach (['/api/juri/nao-existe.php', '/api/juri/'] as $caminho) {
        $r = $c->get($caminho);
        igual(404, $r->status, $caminho);
        naoContem('<title>spa</title>', $r->corpo, "$caminho não cai na SPA");
    }
    igual(405, juriCliente($a)->post('/api/juri/conteudo.php', [])->status, 'POST');
});
