<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

/** Rota da troca de senha da Júri. */
const TROCA_ROTA = '/api/juri/trocar-senha.php';

/** AUTH novo de fixture: base64url canônico de 32 B, de texto inventado (diferente do AUTH atual). */
function trocaAuthNovo(): string
{
    return rtrim(strtr(base64_encode(hash('sha256', 'auth-novo-juri', true)), '+/', '-_'), '=');
}

/** Salt novo de fixture: base64 padrão de 16 B. */
function trocaSaltNovo(): string
{
    return base64_encode(substr(hash('sha256', 'salt-novo-juri', true), 0, 16));
}

/** Salt de fixture diferente do novo (para simular conta mudada no meio da troca). */
function trocaSaltOutro(): string
{
    return base64_encode(substr(hash('sha256', 'salt-outro-juri', true), 0, 16));
}

/**
 * Embrulho de fixture no formato v1: {v: 1, iv: 12 B, ct: 48 B}, só esses três campos.
 *
 * @return array{v: int, iv: string, ct: string}
 */
function trocaEmbrulhoNovo(string $semente = 'novo'): array
{
    return [
        'v' => 1,
        'iv' => base64_encode(substr(hash('sha256', 'iv-' . $semente . '-juri', true), 0, 12)),
        'ct' => base64_encode(hash('sha256', 'ct-' . $semente . '-juri', true) . substr(hash('sha256', 'tag-' . $semente . '-juri', true), 0, 16)),
    ];
}

/**
 * Corpo válido da troca. $alterar troca ou acrescenta campos; $remover tira chaves.
 *
 * @param array<string, mixed> $alterar
 * @param list<string> $remover
 * @return array<string, mixed>
 */
function trocaCorpo(array $alterar = [], array $remover = []): array
{
    $corpo = [
        'authAtual' => juriAuthTeste(),
        'salt' => trocaSaltNovo(),
        'auth' => trocaAuthNovo(),
        'embrulho' => trocaEmbrulhoNovo(),
    ];
    return array_diff_key(array_replace($corpo, $alterar), array_flip($remover));
}

/** Estado em disco da conta da Júri, byte a byte: prova de que nada foi gravado. */
function trocaFotoDisco(Ambiente $a): string
{
    return (string) file_get_contents($a->privJuri . '/usuarios.json');
}

/** Contador de tentativas em disco, byte a byte: prova de que a recusa não reservou vaga. */
function trocaFotoTentativas(Ambiente $a): string
{
    return (string) file_get_contents($a->privJuri . '/tentativas.json');
}

teste('juri: trocar-senha com a senha certa responde 200 com EXATAMENTE csrf novo, sem salt, embrulho nem hash na resposta', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $csrfAntes = $c->csrf;
    $idAntes = $c->cookies['__Host-juri'] ?? '';
    $r = $c->post(TROCA_ROTA, trocaCorpo());
    igual(200, $r->status, 'status');
    igual(['csrf'], juriChaves($r->json()), 'chaves exatas: só csrf');
    verdadeiro(is_string($r->json()['csrf']) && $r->json()['csrf'] !== $csrfAntes, 'csrf novo');
    verdadeiro(($c->cookies['__Host-juri'] ?? '') !== $idAntes, 'id de sessão novo (anti-fixação)');
    naoContem(trocaAuthNovo(), $r->corpo, 'o AUTH novo não volta');
    naoContem(trocaSaltNovo(), $r->corpo, 'o salt não volta');
    naoContem('"ct"', $r->corpo, 'o embrulho não volta');
    igual(true, $c->get('/api/juri/sessao.php')->json()['autenticado'], 'segue autenticado');
});

teste('juri: trocar-senha grava salt, verificador, embrulho e zera deveTrocarSenha numa mesma mutação', function (): void {
    $a = juriAmbiente(['deveTrocar' => true]);
    $c = juriCliente($a);
    $antes = juriLerConta($a);
    igual(200, $c->post(TROCA_ROTA, trocaCorpo())->status, 'status');
    $d = juriLerConta($a);
    verdadeiro(password_verify(trocaAuthNovo(), $d['hash']), 'o verificador é o Argon2id do AUTH novo');
    verdadeiro(!password_verify(juriAuthTeste(), $d['hash']), 'o AUTH antigo não confere mais');
    igual(trocaSaltNovo(), $d['salt'], 'salt novo gravado');
    igual(trocaEmbrulhoNovo(), $d['embrulho'], 'embrulho novo gravado, só v, iv e ct');
    igual(false, $d['deveTrocarSenha'], 'troca pendente zerada');
    igual((int) $antes['versaoSessao'] + 1, (int) $d['versaoSessao'], 'versaoSessao sobe 1 (derruba sessões)');
    igual($antes['uid'], $d['uid'], 'mesma conta (uid), não recriada');
    igual(1, count($d['aparelhos']), 'aparelhos: só o aparelho desta troca');
    verdadeiro($d['aparelhos'] !== $antes['aparelhos'], 'aparelhos antigos descartados');
});

teste('juri: depois da troca, sal.php devolve o salt novo, entrar com o AUTH novo devolve o embrulho novo e o AUTH antigo vira 401', function (): void {
    $a = juriAmbiente();
    igual(200, juriCliente($a)->post(TROCA_ROTA, trocaCorpo())->status, 'troca');
    $sal = juriAnonimo($a)->post('/api/juri/sal.php', ['usuario' => JURI_LOGIN_TESTE])->json();
    igual(trocaSaltNovo(), $sal['salt'] ?? null, 'sal.php devolve o salt novo');
    $ok = juriAnonimo($a)->post('/api/juri/entrar.php', juriCorpoLogin([], JURI_LOGIN_TESTE, trocaAuthNovo()));
    igual(200, $ok->status, 'entrar com o AUTH novo');
    igual(trocaEmbrulhoNovo(), $ok->json()['embrulho'] ?? null, 'entrar devolve o embrulho novo');
    igual(401, juriAnonimo($a)->post('/api/juri/entrar.php', juriCorpoLogin())->status, 'o AUTH antigo não entra mais');
});

teste('juri: trocar-senha derruba as outras sessões da conta: a antiga responde 401, o id antigo não autentica e a troca pendente sai', function (): void {
    $a = juriAmbiente(['deveTrocar' => true]);
    juriSemearConteudo($a, '{"versao":1}');
    $c1 = juriCliente($a);
    $c2 = juriCliente($a);
    $idAntigo = $c2->cookies['__Host-juri'] ?? '';
    igual(200, $c1->post(TROCA_ROTA, trocaCorpo())->status, 'c1 troca');
    igual(200, $c1->get('/api/juri/conteudo.php')->status, 'c1 libera o conteúdo depois da troca');
    igual(false, $c2->get('/api/juri/sessao.php')->json()['autenticado'], 'c2 perdeu a sessão');
    igual(401, $c2->get('/api/juri/conteudo.php')->status, 'c2 sem conteúdo');
    $atacante = $a->cliente();
    $atacante->cookies['__Host-juri'] = $idAntigo;
    igual(false, $atacante->get('/api/juri/sessao.php')->json()['autenticado'], 'o id antigo de c2 não autentica');
});

teste('juri: trocar-senha com a conta mudada entre a conferência e a gravação responde 409 e não grava nada (corrida por pausa)', function (): void {
    $casos = [
        'versaoSessao' => static fn (array $c): array => array_replace($c, ['versaoSessao' => (int) $c['versaoSessao'] + 1]),
        'salt' => static fn (array $c): array => array_replace($c, ['salt' => trocaSaltOutro()]),
        'embrulho' => static fn (array $c): array => array_replace($c, ['embrulho' => trocaEmbrulhoNovo('outro')]),
    ];
    foreach ($casos as $campo => $mudar) {
        $a = juriAmbiente(['deveTrocar' => true]);
        $c = juriCliente($a);
        pausaLigar($a, 'juri-troca-antes-gravar', JURI_LOGIN_TESTE);
        $req = postSemEsperar($c, TROCA_ROTA, trocaCorpo());
        pausaEsperarChegada($req, $a, 'juri-troca-antes-gravar');
        juriAlterarConta($a, $mudar);
        $alterado = trocaFotoDisco($a);
        pausaSoltar($a, 'juri-troca-antes-gravar');
        [$status, $corpo] = postConcluir($req);
        igual(409, $status, "$campo: status");
        igual('conta-alterada', $corpo['erro'] ?? null, "$campo: código");
        igual($alterado, trocaFotoDisco($a), "$campo: a troca em voo não gravou nada (salt, verificador e embrulho ficaram os da mudança)");
        naoContem(trocaAuthNovo(), trocaFotoDisco($a), "$campo: o AUTH novo não foi gravado");
    }
});

teste('juri: trocar-senha com authAtual errado responde 401 senha-atual e não grava nada', function (): void {
    $a = juriAmbiente(['deveTrocar' => true]);
    $c = juriCliente($a);
    $antes = trocaFotoDisco($a);
    $r = $c->post(TROCA_ROTA, trocaCorpo(['authAtual' => juriAuthErrado()]));
    igual(401, $r->status, 'status');
    igual('senha-atual', $r->json()['erro'] ?? null, 'código');
    naoContem(juriAuthErrado(), $r->corpo, 'nada do AUTH na resposta');
    igual($antes, trocaFotoDisco($a), 'conta intacta');
});

teste('juri: trocar-senha usa o MESMO limite do login: falhas de entrar e de trocar contam juntas, e a certa espera (429) sem gravar', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a); // login certo zera o contador
    $anonimo = juriAnonimo($a);
    for ($i = 1; $i <= 3; $i++) {
        igual(401, $anonimo->post('/api/juri/entrar.php', juriCorpoLogin([], JURI_LOGIN_TESTE, juriAuthErrado()))->status, "entrar errado $i");
    }
    for ($i = 1; $i <= 2; $i++) {
        igual(401, $c->post(TROCA_ROTA, trocaCorpo(['authAtual' => juriAuthErrado()]))->status, "trocar errado $i");
    }
    $antes = trocaFotoDisco($a);
    $r = $c->post(TROCA_ROTA, trocaCorpo());
    igual(429, $r->status, '6ª falha no conjunto, com authAtual certo, espera');
    igual('aguarde', $r->json()['erro'] ?? null, 'código');
    igual($antes, trocaFotoDisco($a), 'nada gravado durante a espera');
});

teste('juri: trocar-senha com campo ausente, chave extra ou formato errado responde 400 invalido, sem tocar o limite nem o disco', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $casos = [
        'sem authAtual' => [[], ['authAtual']],
        'sem salt' => [[], ['salt']],
        'sem auth' => [[], ['auth']],
        'sem embrulho' => [[], ['embrulho']],
        'chave extra no corpo' => [['x' => 1], []],
        'authAtual curto (42)' => [['authAtual' => substr(juriAuthTeste(), 0, 42)], []],
        'authAtual com padding' => [['authAtual' => juriAuthTeste() . '='], []],
        'auth no alfabeto padrão (+)' => [['auth' => str_repeat('+', 43)], []],
        'auth não canônico' => [['auth' => str_repeat('A', 42) . 'B'], []],
        'auth numérico' => [['auth' => 12345], []],
        'salt de 15 B' => [['salt' => base64_encode(str_repeat('s', 15))], []],
        'salt de 17 B' => [['salt' => base64_encode(str_repeat('s', 17))], []],
        'salt não canônico' => [['salt' => str_repeat('A', 21) . 'B=='], []],
        'embrulho com v 2' => [['embrulho' => ['v' => 2] + trocaEmbrulhoNovo()], []],
        'embrulho com campo extra' => [['embrulho' => trocaEmbrulhoNovo() + ['x' => 1]], []],
        'embrulho com iv de 11 B' => [['embrulho' => ['iv' => base64_encode(str_repeat('i', 11))] + trocaEmbrulhoNovo()], []],
        'embrulho com ct de 47 B' => [['embrulho' => ['ct' => base64_encode(str_repeat('c', 47))] + trocaEmbrulhoNovo()], []],
        'embrulho como texto' => [['embrulho' => 'abc'], []],
        'embrulho como lista vazia' => [['embrulho' => []], []],
    ];
    $tentativas = trocaFotoTentativas($a);
    $disco = trocaFotoDisco($a);
    foreach ($casos as $nome => [$alterar, $remover]) {
        $r = $c->post(TROCA_ROTA, trocaCorpo($alterar, $remover));
        igual(400, $r->status, "$nome: status");
        igual('invalido', $r->json()['erro'] ?? null, "$nome: código");
    }
    igual($tentativas, trocaFotoTentativas($a), 'nenhuma tentativa reservada');
    igual($disco, trocaFotoDisco($a), 'conta intacta');
});

teste('juri: trocar-senha com a senha no corpo responde 400 senha-no-corpo, sem Argon2id e sem tentativa', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $verificacoes = count($a->verificacoes());
    $tentativas = trocaFotoTentativas($a);
    $r = $c->post(TROCA_ROTA, trocaCorpo(['senha' => 'ProvisoriaTeste1']));
    igual(400, $r->status, 'status');
    igual('senha-no-corpo', $r->json()['erro'] ?? null, 'código dedicado');
    naoContem('ProvisoriaTeste1', $r->corpo, 'a senha não ecoa');
    igual($verificacoes, count($a->verificacoes()), 'nenhuma verificação de senha');
    igual($tentativas, trocaFotoTentativas($a), 'nenhuma tentativa reservada');
});

teste('juri: trocar-senha com auth IGUAL ao authAtual responde 400 senha-repetida, sem Argon2id e sem tentativa', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $verificacoes = count($a->verificacoes());
    $tentativas = trocaFotoTentativas($a);
    $disco = trocaFotoDisco($a);
    $r = $c->post(TROCA_ROTA, trocaCorpo(['auth' => juriAuthTeste()]));
    igual(400, $r->status, 'status');
    igual('senha-repetida', $r->json()['erro'] ?? null, 'código');
    igual($verificacoes, count($a->verificacoes()), 'nenhuma verificação de senha');
    igual($tentativas, trocaFotoTentativas($a), 'nenhuma tentativa reservada');
    igual($disco, trocaFotoDisco($a), 'conta intacta');
});

teste('juri: trocar-senha sem sessão responde 401 sem-sessao e não grava nada', function (): void {
    $a = juriAmbiente();
    $disco = trocaFotoDisco($a);
    $r = juriAnonimo($a)->post(TROCA_ROTA, trocaCorpo());
    igual(401, $r->status, 'status');
    igual('sem-sessao', $r->json()['erro'] ?? null, 'código');
    igual($disco, trocaFotoDisco($a), 'conta intacta');
});

teste('juri: trocar-senha só aceita POST (GET = 405)', function (): void {
    $a = juriAmbiente();
    igual(405, juriCliente($a)->get(TROCA_ROTA)->status, 'GET');
});

teste('juri: trocar-senha com a conta gravada sem embrulho válido responde 503 indisponivel e não troca às cegas', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    juriAlterarConta($a, static fn (array $c): array => array_diff_key($c, ['embrulho' => true]));
    $disco = trocaFotoDisco($a);
    $r = $c->post(TROCA_ROTA, trocaCorpo());
    igual(503, $r->status, 'status');
    igual('indisponivel', $r->json()['erro'] ?? null, 'código');
    igual($disco, trocaFotoDisco($a), 'conta intacta');
});
