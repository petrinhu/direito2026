<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

/**
 * Bloqueio de integração: o transporte compartilhado do navegador
 * (src/app/restrito/transporte.ts) recusa qualquer resposta de sucesso cujo corpo
 * não traga ok === true. Logo, todo 200 JSON da Júri tem de sair com ok: true, ou o
 * login real falha. imagem.php é binário e fica fora desta conferência.
 */

/** Confere 200 e ok === true no corpo. @return array<string, mixed> */
function juriCorpoOk(Resposta $r, string $nome): array
{
    igual(200, $r->status, "$nome: status");
    $j = $r->json();
    igual(true, $j['ok'] ?? null, "$nome: ok === true (o transporte recusa sem isso)");
    return $j;
}

teste('juri ok: sal.php 200 (conta real e salt falso) traz ok === true', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    juriCorpoOk($c->post('/api/juri/sal.php', ['usuario' => JURI_LOGIN_TESTE]), 'sal real');
    juriCorpoOk($c->post('/api/juri/sal.php', ['usuario' => 'fantasma']), 'sal falso');
});

teste('juri ok: sessao.php 200, anônimo e logado, traz ok === true', function (): void {
    $a = juriAmbiente();
    $c = $a->cliente();
    juriCorpoOk($c->get('/api/juri/sessao.php'), 'sessao anônimo');
    juriCorpoOk($c->post('/api/juri/entrar.php', juriCorpoLogin()), 'entrar (pré-condição da sessão logada)');
    juriCorpoOk($c->get('/api/juri/sessao.php'), 'sessao logado');
});

teste('juri ok: entrar.php 200 traz ok === true', function (): void {
    $a = juriAmbiente();
    juriCorpoOk(juriAnonimo($a)->post('/api/juri/entrar.php', juriCorpoLogin()), 'entrar');
});

teste('juri ok: destravar.php 200 traz ok === true', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    juriCorpoOk($c->post('/api/juri/destravar.php', ['auth' => juriAuthTeste()]), 'destravar');
});

teste('juri ok: trocar-senha.php 200 traz ok === true', function (): void {
    $a = juriAmbiente();
    $c = juriCliente($a);
    juriCorpoOk($c->post('/api/juri/trocar-senha.php', trocaCorpo()), 'trocar-senha');
});

teste('juri ok: conteudo.php 200 traz ok === true', function (): void {
    $a = juriAmbiente();
    juriSemearConteudo($a, '{"versao":1}');
    juriCorpoOk(juriCliente($a)->get('/api/juri/conteudo.php'), 'conteudo');
});

teste('juri ok: sair.php 200 traz ok === true', function (): void {
    $a = juriAmbiente();
    juriCorpoOk(juriCliente($a)->post('/api/juri/sair.php', []), 'sair');
});
