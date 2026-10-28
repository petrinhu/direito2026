<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

teste('juri: destravar sem sessão responde 401 sem-sessao, mesmo com AUTH certo', function (): void {
    $a = juriAmbiente();
    $r = juriAnonimo($a)->post('/api/juri/destravar.php', ['auth' => juriAuthTeste()]);
    igual(401, $r->status, 'status');
    igual('sem-sessao', $r->json()['erro'] ?? null, 'código');
    naoContem('embrulho', $r->corpo, 'nada de embrulho sem sessão');
});

teste('juri: destravar com sessão e AUTH certo responde 200 com SÓ o embrulho, o mesmo gravado', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $r = $c->post('/api/juri/destravar.php', ['auth' => juriAuthTeste()]);
    igual(200, $r->status, 'status');
    igual(['ok', 'embrulho'], array_keys($r->json()), 'chaves exatas: ok e o embrulho');
    igual(juriLerConta($a)['embrulho'], $r->json()['embrulho'], 'embrulho idêntico ao gravado');
});

teste('juri: destravar com AUTH errado responde 401 credenciais e não devolve embrulho', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $r = $c->post('/api/juri/destravar.php', ['auth' => juriAuthErrado()]);
    igual(401, $r->status, 'status');
    igual('credenciais', $r->json()['erro'] ?? null, 'código');
    naoContem('embrulho', $r->corpo, 'nenhum byte do embrulho');
});

teste('juri: destravar com a senha no corpo responde 400 (nunca a senha ao servidor, nem aqui)', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $r = $c->post('/api/juri/destravar.php', ['auth' => juriAuthTeste(), 'senha' => 'ProvisoriaTeste1']);
    igual(400, $r->status, 'status');
    igual('senha-no-corpo', $r->json()['erro'] ?? null, 'código');
});

teste('juri: destravar com troca de senha pendente responde 200 com o embrulho (a troca precisa dele depois de recarregar)', function (): void {
    $a = juriAmbiente(['deveTrocar' => true]);
    $c = juriCliente($a);
    $r = $c->post('/api/juri/destravar.php', ['auth' => juriAuthTeste()]);
    igual(200, $r->status, 'status');
    igual(juriLerConta($a)['embrulho'], $r->json()['embrulho'], 'embrulho entregue com a troca pendente');
});

teste('juri: destravar usa o MESMO limite do login: falhas de entrar e de destravar contam juntas (429 com AUTH certo)', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a); // login certo zera o contador do usuário+IP
    $anonimo = juriAnonimo($a);
    for ($i = 1; $i <= 3; $i++) {
        igual(401, $anonimo->post('/api/juri/entrar.php', ['usuario' => JURI_LOGIN_TESTE, 'auth' => juriAuthErrado()])->status, "entrar errado $i");
    }
    for ($i = 1; $i <= 2; $i++) {
        igual(401, $c->post('/api/juri/destravar.php', ['auth' => juriAuthErrado()])->status, "destravar errado $i");
    }
    $r = $c->post('/api/juri/destravar.php', ['auth' => juriAuthTeste()]);
    igual(429, $r->status, '6ª falha no conjunto, com AUTH certo, espera');
    igual('aguarde', $r->json()['erro'] ?? null, 'código');
    naoContem('embrulho', $r->corpo, 'nenhum embrulho enquanto espera');
});

teste('juri: destravar com a conta trocada entre a conferência e a leitura responde 409 conta-alterada, sem embrulho', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    pausaLigar($a, 'destravar-antes-ler', JURI_LOGIN_TESTE);
    $req = postSemEsperar($c, '/api/juri/destravar.php', ['auth' => juriAuthTeste()]);
    pausaEsperarChegada($req, $a, 'destravar-antes-ler');
    // Redefinição/rotação chega no meio: a versão da sessão muda, a conta não é a conferida.
    juriAlterarConta($a, static fn (array $c): array => array_replace($c, ['versaoSessao' => (int) $c['versaoSessao'] + 1]));
    pausaSoltar($a, 'destravar-antes-ler');
    [$status, $corpo] = postConcluir($req);
    igual(409, $status, 'status');
    igual('conta-alterada', $corpo['erro'] ?? null, 'código');
    verdadeiro(!array_key_exists('embrulho', $corpo), 'nenhum embrulho para uma conta que mudou');
});

teste('juri (R1-A1): destravar.php sem X-CSRF-Token responde 403 e não devolve o embrulho, mesmo com sessão e AUTH certo', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $c->csrf = null;
    $r = $c->post('/api/juri/destravar.php', ['auth' => juriAuthTeste()]);
    igual(403, $r->status, 'status');
    igual('csrf', $r->json()['erro'] ?? null, 'código');
    naoContem((string) juriLerConta($a)['embrulho']['ct'], $r->corpo, 'o embrulho não sai sem CSRF');
});

teste('juri (R1-A1, R1-C3): destravar.php recusa Content-Type fora de application/json, Origin estranha e Sec-Fetch-Site cross-site, e não devolve o embrulho', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $corpo = json_encode(['auth' => juriAuthTeste()], JSON_THROW_ON_ERROR);
    $casos = [
        'text/plain' => [['Content-Type' => 'text/plain'], 400, 'tipo-conteudo'],
        'Origin de outro site' => [['Origin' => 'http://evil.example'], 403, 'origem'],
        'Sec-Fetch-Site cross-site' => [['Sec-Fetch-Site' => 'cross-site'], 403, 'origem'],
    ];
    foreach ($casos as $nome => [$cabecalhos, $status, $erro]) {
        $r = $c->post('/api/juri/destravar.php', $corpo, $cabecalhos);
        igual($status, $r->status, "$nome: status");
        igual($erro, $r->json()['erro'] ?? null, "$nome: código");
        naoContem((string) juriLerConta($a)['embrulho']['ct'], $r->corpo, "$nome: sem embrulho");
    }
});
