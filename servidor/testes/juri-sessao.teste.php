<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

teste('juri: sessao.php anônimo responde EXATAMENTE autenticado false, usuario null, deveTrocarSenha null e csrf', function (): void {
    $a = juriAmbiente();
    $r = $a->cliente()->get('/api/juri/sessao.php');
    igual(200, $r->status, 'status');
    $j = $r->json();
    igual(['autenticado', 'csrf', 'deveTrocarSenha', 'usuario'], juriChaves($j), 'chaves exatas');
    igual(false, $j['autenticado'], 'autenticado');
    igual(null, $j['usuario'], 'usuario');
    igual(null, $j['deveTrocarSenha'], 'deveTrocarSenha');
    verdadeiro(is_string($j['csrf']) && $j['csrf'] !== '', 'csrf do pré-login');
});

teste('juri: sessao.php logado responde EXATAMENTE autenticado, usuario, deveTrocarSenha e csrf do login, nunca salt nem embrulho', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    $csrfDoLogin = $c->csrf;
    $r = $c->get('/api/juri/sessao.php');
    $j = $r->json();
    igual(200, $r->status, 'status');
    igual(['autenticado', 'csrf', 'deveTrocarSenha', 'usuario'], juriChaves($j), 'chaves exatas: nada além disso');
    igual(true, $j['autenticado'], 'autenticado');
    igual(JURI_LOGIN_TESTE, $j['usuario'], 'usuario');
    igual(false, $j['deveTrocarSenha'], 'deveTrocarSenha');
    igual($csrfDoLogin, $j['csrf'], 'csrf da sessão, o mesmo do login');
    naoContem('embrulho', $r->corpo, 'nunca devolve embrulho');
    naoContem('salt', $r->corpo, 'nunca devolve salt');
});

teste('juri: sessao.php com troca de senha pendente responde autenticado true e deveTrocarSenha true', function (): void {
    $a = juriAmbiente(['deveTrocar' => true]);
    $j = juriCliente($a)->get('/api/juri/sessao.php')->json();
    igual(true, $j['autenticado'], 'autenticado');
    igual(true, $j['deveTrocarSenha'], 'deveTrocarSenha');
});

teste('juri: sessao.php com conta da Júri sem embrulho válido responde 503 indisponivel, nunca dados parciais', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    juriAlterarConta($a, static fn (array $c): array => array_diff_key($c, ['embrulho' => true]));
    $r = $c->get('/api/juri/sessao.php');
    igual(503, $r->status, 'status');
    igual('indisponivel', $r->json()['erro'] ?? null, 'código');
});

teste('juri: sessao.php só aceita GET (POST = 405)', function (): void {
    $a = juriAmbiente();
    igual(405, juriAnonimo($a)->post('/api/juri/sessao.php', [])->status, 'POST');
});
