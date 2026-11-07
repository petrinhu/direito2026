<?php
declare(strict_types=1);

/**
 * Origin e Sec-Fetch-Site no formulário (plano do CTO do login único, seções 1.4 e 1.5; LU-F2.5).
 * acesso.php e troca.php passam por d26_exigir_formulario_seguro, que recusa Origin alheio e
 * Sec-Fetch-Site diferente de same-origin. csrf.teste.php cobre só entrar.php (JSON): sem estes
 * casos, tirar a checagem do formulário não quebrava teste nenhum (M7 da revisão de segurança).
 * Sintético: senha só pelo Ambiente.
 */

/** POST de formulário com os campos dados; cabeçalhos extras sobrepõem os padrões (null remove). */
function cfEnviarFormulario(Cliente $c, string $caminho, array $campos, array $cabecalhos): Resposta
{
    return $c->enviar('POST', $caminho, http_build_query($campos), array_merge(
        ['Content-Type' => 'application/x-www-form-urlencoded', 'X-CSRF-Token' => null],
        $cabecalhos
    ));
}

/** Origens que o formulário tem de recusar, com o nome de cada caso. */
function cfOrigensAlheias(Ambiente $a): array
{
    return [
        'alheia' => 'http://evil.example',
        'null' => 'null',
        'loopback de outra porta' => 'http://127.0.0.1:1',
        'mesmo host, esquema https' => 'https://' . parse_url($a->base, PHP_URL_HOST) . ':' . $a->porta,
    ];
}

teste('formulário de acesso: Origin alheio, "null" ou de outra origem é 403 origem, sem conferir senha', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    foreach (cfOrigensAlheias($a) as $nome => $origem) {
        $r = cfEnviarFormulario($c, '/api/acesso.php', [
            'usuario' => Ambiente::LOGIN_ADMIN,
            'senha' => Ambiente::SENHA_ADMIN,
            'csrf' => $token,
            'destino' => '/',
        ], ['Origin' => $origem]);
        igual(403, $r->status, "$nome: status");
        igual('origem', $r->json()['erro'], "$nome: erro");
    }
    igual(0, count($a->verificacoes()), 'a senha certa nunca chegou à conferência');
});

teste('formulário de acesso: Sec-Fetch-Site cross-site e same-site é 403 origem; origem própria, same-origin e ausente chegam à senha', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    $campos = ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'senha-errada-1', 'csrf' => $token, 'destino' => '/'];
    foreach (['cross-site', 'same-site'] as $sfs) {
        $r = cfEnviarFormulario($c, '/api/acesso.php', $campos, ['Sec-Fetch-Site' => $sfs]);
        igual(403, $r->status, "Sec-Fetch-Site $sfs");
        igual('origem', $r->json()['erro'], "Sec-Fetch-Site $sfs: erro");
    }
    $passam = [
        'Origin próprio' => ['Origin' => $a->base],
        'Sec-Fetch-Site same-origin' => ['Sec-Fetch-Site' => 'same-origin'],
        'sem Sec-Fetch-Site nem Origin' => ['Sec-Fetch-Site' => null, 'Origin' => null],
    ];
    foreach ($passam as $nome => $cabecalhos) {
        $r = cfEnviarFormulario($c, '/api/acesso.php', $campos, $cabecalhos);
        igual(401, $r->status, "$nome: chega à conferência e recebe a frase");
        contem(ACESSO_FRASE, $r->corpo, "$nome: frase");
    }
    igual(3, count($a->verificacoes()), 'só os três que passam conferiram a senha');
});

teste('formulário de troca: Origin alheio é 403 origem e a senha atual certa não troca nada', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = trocaTelaEntrar($a);
    $token = acessoCampo($c->get('/', PORTAO_NAVEGACAO)->corpo, 'csrf');
    $antes = count($a->verificacoes());
    foreach (cfOrigensAlheias($a) as $nome => $origem) {
        $r = cfEnviarFormulario($c, '/api/troca.php', [
            'senhaAtual' => Ambiente::SENHA_ADMIN,
            'senhaNova' => TROCA_NOVA_VALIDA,
            'csrf' => $token,
        ], ['Origin' => $origem]);
        igual(403, $r->status, "$nome: status");
        igual('origem', $r->json()['erro'], "$nome: erro");
    }
    igual($antes, count($a->verificacoes()), 'nenhuma senha foi conferida na troca recusada');
});

teste('formulário de troca: Sec-Fetch-Site cross-site e same-site é 403 origem; origem própria e same-origin chegam à senha atual', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = trocaTelaEntrar($a);
    $token = acessoCampo($c->get('/', PORTAO_NAVEGACAO)->corpo, 'csrf');
    $campos = ['senhaAtual' => 'senha-errada-x', 'senhaNova' => TROCA_NOVA_VALIDA, 'csrf' => $token];
    $antes = count($a->verificacoes());
    foreach (['cross-site', 'same-site'] as $sfs) {
        $r = cfEnviarFormulario($c, '/api/troca.php', $campos, ['Sec-Fetch-Site' => $sfs]);
        igual(403, $r->status, "Sec-Fetch-Site $sfs");
        igual('origem', $r->json()['erro'], "Sec-Fetch-Site $sfs: erro");
    }
    igual($antes, count($a->verificacoes()), 'as recusas por origem não conferem senha');
    foreach (['Origin próprio' => ['Origin' => $a->base], 'same-origin' => ['Sec-Fetch-Site' => 'same-origin']] as $nome => $cabecalhos) {
        igual(401, cfEnviarFormulario($c, '/api/troca.php', $campos, $cabecalhos)->status, "$nome: chega à senha atual e recebe 401");
    }
    igual($antes + 2, count($a->verificacoes()), 'os dois que passam conferiram a senha atual');
});
