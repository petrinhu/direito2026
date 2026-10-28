<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

/**
 * Lacuna da B2: nenhum teste afirmava Cache-Control em TODOS os endpoints da área.
 * Cada caso confere o status esperado (para o caso ser o que diz) e o cabeçalho
 * EXATO no-store, em sucesso e em erro. Igualdade exata, não contém: uma troca
 * para "private" ou para um valor composto tem de quebrar aqui.
 */
teste('juri: todos os endpoints da área respondem Cache-Control exato no-store, em sucesso e em erro', function (): void {
    $a = juriAmbiente();
    juriSemearConteudo($a, '{"versao":1}');
    $idImagem = juriSemearImagem($a, 'bytes-sinteticos-juri');
    // Ordem importa: o último caso troca a senha, então todo login anterior usa o AUTH atual.
    $casos = [
        'sal 200' => [200, juriAnonimo($a)->post('/api/juri/sal.php', ['usuario' => JURI_LOGIN_TESTE])],
        'sal 400' => [400, juriAnonimo($a)->post('/api/juri/sal.php', [])],
        'sessao GET' => [200, juriAnonimo($a)->get('/api/juri/sessao.php')],
        'entrar 200' => [200, juriAnonimo($a)->post('/api/juri/entrar.php', juriCorpoLogin())],
        'entrar 401' => [401, juriAnonimo($a)->post('/api/juri/entrar.php', juriCorpoLogin([], JURI_LOGIN_TESTE, juriAuthErrado()))],
        'destravar 200' => [200, juriCliente($a)->post('/api/juri/destravar.php', ['auth' => juriAuthTeste()])],
        'destravar 401' => [401, juriAnonimo($a)->post('/api/juri/destravar.php', ['auth' => juriAuthTeste()])],
        'conteudo 200' => [200, juriCliente($a)->get('/api/juri/conteudo.php')],
        'conteudo 401' => [401, juriAnonimo($a)->get('/api/juri/conteudo.php')],
        'imagem 200' => [200, juriCliente($a)->get('/api/juri/imagem.php?id=' . $idImagem)],
        'imagem 404' => [404, juriCliente($a)->get('/api/juri/imagem.php?id=' . str_repeat('0', 32))],
        'sair 200' => [200, juriCliente($a)->post('/api/juri/sair.php', [])],
        'trocar-senha 401' => [401, juriAnonimo($a)->post('/api/juri/trocar-senha.php', trocaCorpo())],
        'trocar-senha 200' => [200, juriCliente($a)->post('/api/juri/trocar-senha.php', trocaCorpo())],
    ];
    foreach ($casos as $nome => [$esperado, $r]) {
        igual($esperado, $r->status, "$nome: status");
        igual('no-store', $r->cabecalho('cache-control'), "$nome: Cache-Control");
    }
});
