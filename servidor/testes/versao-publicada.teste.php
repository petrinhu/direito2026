<?php
declare(strict_types=1);

/**
 * versao.json pelo portão (AV-F6, plano de aviso de versão, decisões D1 e D5). Só teste: nada
 * em public/api/** muda. App sintético no layout de produção (atual é link relativo para
 * versoes/<v>), e a versão publicada é o arquivo versao.json da própria versão, que o
 * manifesto declara como application/json. Conta sintética, conteúdo sintético (L-28).
 *
 * Cenários: anônimo sem corpo; com sessão, JSON com no-store; troca de senha pendente dá 403;
 * trocar o ponteiro atual faz a MESMA sessão receber a versão nova (AV-F6b: causa é o cache de
 * realpath do processo; o portão limpa o cache com clearstatcache(true)).
 */

/** Uma versão sintética: index.html, versao.json e o manifesto que declara os dois. */
function versaoPubSemearVersao(Ambiente $a, string $pasta, string $versao, string $marca): void
{
    $dir = $a->app . '/versoes/' . $pasta;
    mkdir($dir, 0700, true);
    file_put_contents($dir . '/index.html', '<!doctype html><title>app sintético</title><p>' . $marca . '</p>');
    file_put_contents($dir . '/versao.json', json_encode([
        'versao' => $versao,
        'historico' => [['versao' => $versao, 'novidades' => ['Melhoria técnica']]],
    ], JSON_THROW_ON_ERROR));
    file_put_contents($dir . '/manifesto.json', json_encode([
        'versao' => $versao,
        'arquivos' => [
            'index.html' => ['tipo' => 'text/html; charset=utf-8'],
            'versao.json' => ['tipo' => 'application/json'],
        ],
    ], JSON_THROW_ON_ERROR));
}

/** Aponta o ponteiro atual para uma versão (troca atômica não importa para o teste). */
function versaoPubApontar(Ambiente $a, string $pasta): void
{
    $link = $a->app . '/atual';
    if (is_link($link) || is_file($link)) {
        unlink($link);
    }
    symlink('versoes/' . $pasta, $link);
}

teste('versao.json: anônimo não recebe a versão, só 401 sem corpo', function (): void {
    $a = Ambiente::novo();
    versaoPubSemearVersao($a, 'v1', '1.0.0.0', 'MARCA-V1');
    versaoPubApontar($a, 'v1');
    $r = $a->cliente()->get('/versao.json');
    igual(401, $r->status, 'anônimo: status');
    igual('', $r->corpo, 'anônimo: sem corpo');
});

teste('versao.json: com sessão, sai como application/json com no-store e a versão declarada', function (): void {
    $a = Ambiente::novo();
    versaoPubSemearVersao($a, 'v1', '1.0.0.0', 'MARCA-V1');
    versaoPubApontar($a, 'v1');
    $c = $a->entrar();
    $r = $c->get('/versao.json');
    igual(200, $r->status, 'com sessão: status');
    contem('application/json', (string) $r->cabecalho('content-type'), 'com sessão: tipo');
    contem('no-store', (string) $r->cabecalho('cache-control'), 'com sessão: cache-control');
    igual('1.0.0.0', $r->json()['versao'] ?? null, 'com sessão: versão');
});

teste('versao.json: troca de senha pendente dá 403 sem corpo', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    versaoPubSemearVersao($a, 'v1', '1.0.0.0', 'MARCA-V1');
    versaoPubApontar($a, 'v1');
    $c = $a->entrar();
    $r = $c->get('/versao.json');
    igual(403, $r->status, 'troca pendente: status');
    igual('', $r->corpo, 'troca pendente: sem corpo');
});

teste('versao.json: trocar o ponteiro atual faz a MESMA sessão receber a versão nova', function (): void {
    $a = Ambiente::novo();
    versaoPubSemearVersao($a, 'v1', '1.0.0.0', 'MARCA-V1');
    versaoPubSemearVersao($a, 'v2', '2.0.0.0', 'MARCA-V2');
    versaoPubApontar($a, 'v1');
    $c = $a->entrar();
    igual('1.0.0.0', $c->get('/versao.json')->json()['versao'] ?? null, 'antes da troca: versão');

    versaoPubApontar($a, 'v2');

    igual('2.0.0.0', $c->get('/versao.json')->json()['versao'] ?? null, 'depois da troca: versão');
    contem('MARCA-V2', $c->get('/index.html')->corpo, 'depois da troca: index.html da versão nova');
});
