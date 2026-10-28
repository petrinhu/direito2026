<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

/** Corpo do login com AUTH de fixture; $extra acrescenta ou troca campos. @param array<string, mixed> $extra */
function juriCorpoLogin(array $extra = [], string $login = JURI_LOGIN_TESTE, ?string $auth = null): array
{
    return ['usuario' => $login, 'auth' => $auth ?? juriAuthTeste()] + $extra;
}

/** Ordena as chaves de um array para comparar conjunto de campos sem depender da ordem. @param array<mixed> $a @return list<mixed> */
function juriChaves(array $a): array
{
    $chaves = array_keys($a);
    sort($chaves);
    return $chaves;
}

teste('juri: login certo responde 200 com EXATAMENTE usuario, deveTrocarSenha, csrf e embrulho; embrulho é o gravado', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $csrfAntes = $c->csrf;
    $r = $c->post('/api/juri/entrar.php', juriCorpoLogin());
    igual(200, $r->status, 'status');
    $j = $r->json();
    igual(['csrf', 'deveTrocarSenha', 'embrulho', 'ok', 'usuario'], juriChaves($j), 'chaves exatas da resposta');
    igual(JURI_LOGIN_TESTE, $j['usuario'], 'usuario');
    igual(false, $j['deveTrocarSenha'], 'deveTrocarSenha');
    igual(juriLerConta($a)['embrulho'], $j['embrulho'], 'embrulho idêntico ao gravado');
    verdadeiro(is_string($j['csrf']) && $j['csrf'] !== $csrfAntes, 'csrf novo no login');
    igual(true, $c->get('/api/juri/sessao.php')->json()['autenticado'], 'sessão aberta');
});

teste('juri: login com troca de senha pendente responde 200 com deveTrocarSenha true e o embrulho', function (): void {
    $a = juriAmbiente(['deveTrocar' => true]);
    $r = juriAnonimo($a)->post('/api/juri/entrar.php', juriCorpoLogin());
    igual(200, $r->status, 'status');
    igual(true, $r->json()['deveTrocarSenha'], 'deveTrocarSenha');
    igual(juriLerConta($a)['embrulho'], $r->json()['embrulho'], 'embrulho entregue para a troca');
});

teste('juri: login emite o aparelho confiável da Júri (__Host-juridisp) e não o do Interdisciplinar', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    verdadeiro(isset($c->cookies['__Host-juridisp']), 'cookie __Host-juridisp');
    verdadeiro(!isset($c->cookies['__Host-d26disp']), 'nenhum __Host-d26disp');
});

teste('juri: corpo com a senha responde 400 mesmo com AUTH certo, sem entrar e sem reservar tentativa', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $antes = (string) file_get_contents($a->privJuri . '/tentativas.json');
    foreach ([['senha' => 'ProvisoriaTeste1'], ['senha' => null]] as $extra) {
        $r = $c->post('/api/juri/entrar.php', juriCorpoLogin($extra));
        igual(400, $r->status, 'senha presente: 400');
        igual('senha-no-corpo', $r->json()['erro'] ?? null, 'código dedicado');
        naoContem(juriAuthTeste(), $r->corpo, 'o AUTH não volta na resposta');
    }
    igual($antes, (string) file_get_contents($a->privJuri . '/tentativas.json'), 'tentativas.json igual');
    igual(false, $c->get('/api/juri/sessao.php')->json()['autenticado'], 'nenhuma sessão aberta');
});

teste('juri: auth fora do formato (base64url de 32 bytes, sem padding, canônico) responde 400 e não conta como tentativa', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $antes = (string) file_get_contents($a->privJuri . '/tentativas.json');
    $ruins = [
        'vazio' => '',
        'curto (42 caracteres)' => substr(juriAuthTeste(), 0, 42),
        'longo (44 caracteres)' => juriAuthTeste() . 'A',
        'com padding' => juriAuthTeste() . '=',
        'alfabeto padrão (+)' => str_repeat('+', 43),
        'espaço' => str_repeat('A', 42) . ' ',
        'último caractere não canônico' => str_repeat('A', 42) . 'B',
        'número' => 12345,
        'lista' => ['a'],
        'nulo' => null,
    ];
    foreach ($ruins as $nome => $auth) {
        $r = $c->post('/api/juri/entrar.php', ['usuario' => JURI_LOGIN_TESTE, 'auth' => $auth]);
        igual(400, $r->status, "$nome: status");
    }
    foreach (['JSON quebrado' => '{quebrado', 'JSON lista' => '[1,2]'] as $nome => $corpo) {
        igual(400, $c->post('/api/juri/entrar.php', $corpo)->status, "$nome: status");
    }
    igual($antes, (string) file_get_contents($a->privJuri . '/tentativas.json'), 'nenhuma tentativa reservada');
});

teste('juri: AUTH errado, usuário inexistente e login malformado dão a MESMA resposta 401 credenciais', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $errado = $c->post('/api/juri/entrar.php', juriCorpoLogin([], JURI_LOGIN_TESTE, juriAuthErrado()));
    $inexistente = $c->post('/api/juri/entrar.php', juriCorpoLogin([], 'fantasma'));
    $malformado = $c->post('/api/juri/entrar.php', juriCorpoLogin([], "a b\n"));
    igual(401, $errado->status, 'AUTH errado');
    igual('credenciais', $errado->json()['erro'] ?? null, 'código genérico');
    igual($errado->corpo, $inexistente->corpo, 'inexistente: corpo idêntico');
    igual($errado->corpo, $malformado->corpo, 'malformado: corpo idêntico');
    igual(401, $malformado->status, 'malformado: status');
});

teste('juri: conta inexistente gasta UMA verificação de Argon2id (contagem de marcadores em verificacoes.log)', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $n0 = count($a->verificacoes());
    $c->post('/api/juri/entrar.php', juriCorpoLogin([], 'fantasma', juriAuthErrado()));
    $n1 = count($a->verificacoes());
    igual($n0 + 1, $n1, 'inexistente: uma verificação');
    $c->post('/api/juri/entrar.php', juriCorpoLogin([], JURI_LOGIN_TESTE, juriAuthErrado()));
    igual($n1 + 1, count($a->verificacoes()), 'conta real com AUTH errado: uma verificação');
});

teste('juri (R1-C2): conta inexistente leva tempo comparável ao da conta real (sem atalho de tempo, medido como entrar.teste.php:72)', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $medir = static function (string $login) use ($c): float {
        $t = microtime(true);
        $c->post('/api/juri/entrar.php', juriCorpoLogin([], $login, juriAuthErrado()));
        return microtime(true) - $t;
    };
    $real = $medir(JURI_LOGIN_TESTE);
    $fantasma = $medir('fantasma');
    // Sem o Argon2id fictício o inexistente leva poucos ms contra ~150 ms da conta real (M19 medido: 6 ms x 155 ms).
    verdadeiro($fantasma > $real * 0.5, sprintf('inexistente %.3fs vs conta real %.3fs', $fantasma, $real));
});

teste('juri: conta desativada com AUTH certo responde 401 credenciais', function (): void {
    $a = juriAmbiente();
    juriAlterarConta($a, static fn (array $c): array => array_replace($c, ['ativo' => false]));
    $r = juriAnonimo($a)->post('/api/juri/entrar.php', juriCorpoLogin());
    igual(401, $r->status, 'status');
    igual('credenciais', $r->json()['erro'] ?? null, 'código');
});

teste('juri: 5 AUTHs errados e a 6ª, mesmo com AUTH certo, respondem 429 com segundos (teto do limite atual)', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    for ($i = 1; $i <= 5; $i++) {
        igual(401, $c->post('/api/juri/entrar.php', juriCorpoLogin([], JURI_LOGIN_TESTE, juriAuthErrado()))->status, "falha $i");
    }
    $r = $c->post('/api/juri/entrar.php', juriCorpoLogin());
    igual(429, $r->status, '6ª tentativa, com AUTH certo, espera');
    igual('aguarde', $r->json()['erro'] ?? null, 'código');
    verdadeiro(($r->json()['segundos'] ?? 0) >= 1, 'segundos informados');
    igual(false, $c->get('/api/juri/sessao.php')->json()['autenticado'], 'nenhuma sessão aberta durante a espera');
});

teste('juri: conta da Júri sem salt, ou sem embrulho, responde 503 indisponivel com AUTH certo, nunca 200 sem embrulho', function (): void {
    foreach (['embrulho', 'salt'] as $campo) {
        $a = juriAmbiente();
        juriAlterarConta($a, static fn (array $c): array => array_diff_key($c, [$campo => true]));
        $r = juriAnonimo($a)->post('/api/juri/entrar.php', juriCorpoLogin());
        igual(503, $r->status, "sem $campo: status");
        igual('indisponivel', $r->json()['erro'] ?? null, "sem $campo: código");
    }
});

teste('juri: login regenera o id de sessão e o id antigo deixa de valer (fixação)', function (): void {
    $a = Ambiente::novo(['layout' => 'producao']);
    juriSemearConta($a);
    $c = juriCliente($a);
    $antigo = $c->cookies['__Host-juri'] ?? '';
    verdadeiro(preg_match('/^[A-Za-z0-9,-]{22,128}$/D', $antigo) === 1, 'a Júri criou a sessão');
    igual(200, $c->post('/api/juri/entrar.php', juriCorpoLogin())->status, 'novo login com sessão ativa');
    verdadeiro(($c->cookies['__Host-juri'] ?? '') !== $antigo, 'id mudou');
    $atacante = $a->cliente();
    $atacante->cookies['__Host-juri'] = $antigo;
    igual(false, $atacante->get('/api/juri/sessao.php')->json()['autenticado'], 'id antigo não autentica');
});

teste('juri: login grava ultimoLogin recente na conta da Júri', function (): void {
    $a = juriAmbiente();
    juriCliente($a);
    $ultimo = juriLerConta($a)['ultimoLogin'];
    verdadeiro(is_string($ultimo) && strtotime($ultimo) > time() - 60, 'ultimoLogin recente');
});

teste('juri: corpo que não é objeto JSON com usuario e auth responde 400', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    foreach (['vazio' => [], 'só usuario' => ['usuario' => JURI_LOGIN_TESTE], 'só auth' => ['auth' => juriAuthTeste()], 'campo extra' => juriCorpoLogin(['x' => 1])] as $nome => $corpo) {
        igual(400, $c->post('/api/juri/entrar.php', $corpo)->status, $nome);
    }
});

teste('juri (R1-A1): entrar.php sem X-CSRF-Token responde 403 e não abre sessão, mesmo com AUTH certo', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $c->csrf = null;
    $r = $c->post('/api/juri/entrar.php', juriCorpoLogin());
    igual(403, $r->status, 'status');
    igual('csrf', $r->json()['erro'] ?? null, 'código');
    igual(false, $c->get('/api/juri/sessao.php')->json()['autenticado'], 'não entrou');
});

teste('juri (R1-A1, R1-C3): entrar.php recusa Content-Type fora de application/json, Origin estranha e Sec-Fetch-Site cross-site, e não entra', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $corpo = json_encode(juriCorpoLogin(), JSON_THROW_ON_ERROR);
    $casos = [
        'text/plain' => [['Content-Type' => 'text/plain'], 400, 'tipo-conteudo'],
        'form-urlencoded' => [['Content-Type' => 'application/x-www-form-urlencoded'], 400, 'tipo-conteudo'],
        'Origin de outro site' => [['Origin' => 'http://evil.example'], 403, 'origem'],
        'Sec-Fetch-Site cross-site' => [['Sec-Fetch-Site' => 'cross-site'], 403, 'origem'],
    ];
    foreach ($casos as $nome => [$cabecalhos, $status, $erro]) {
        $r = $c->post('/api/juri/entrar.php', $corpo, $cabecalhos);
        igual($status, $r->status, "$nome: status");
        igual($erro, $r->json()['erro'] ?? null, "$nome: código");
    }
    igual(false, $c->get('/api/juri/sessao.php')->json()['autenticado'], 'nenhum caso entrou');
});
