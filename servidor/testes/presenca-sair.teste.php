<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';
require_once __DIR__ . '/apoio/presenca.php';

/**
 * Presença: exclusão e sair (sair, excluir pelo painel e pelo CLI, desativar).
 * Nome de teste começa com "presença:" (filtro do rodar.php).
 */

teste('presença: sair dá conectado false na listagem', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'conectada antes de sair');
    igual(200, $ana->post('/api/sair.php', [])->status, 'saiu');
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'depois de sair, sem sessão aberta');
});

teste('presença: login em outro aparelho segue conectada, e sair do aparelho velho não apaga a presença nova', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $velho = $a->entrar('ana', PRESENCA_SENHA_ANA);
    $novo = $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'conectada pelo aparelho novo');
    $velho->post('/api/sair.php', []);
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'sair do aparelho velho não apaga a presença nova');
    igual(true, $novo->get('/api/sessao.php')->json()['autenticado'] ?? null, 'o aparelho novo segue entrado');
});

teste('presença: excluir a conta pelo painel apaga o arquivo de presença', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    verdadeiro(is_file(presencaArquivo($a, 'ana')), 'o arquivo existe antes');
    $r = $adm->post('/api/usuarios.php', ['acao' => 'excluir', 'usuario' => 'ana']);
    igual(200, $r->status, 'excluída pelo painel');
    clearstatcache(); // o arquivo mudou em outro processo (o servidor): sem limpar, is_file lê o cache de stat
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'o arquivo sai junto com a conta');
});

teste('presença: excluir pelo CLI apaga o arquivo de presença da conta removida, e as outras ficam', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false], 'bia' => ['admin' => false]]);
    @mkdir($priv . '/presenca', 0700);
    $arqAna = $priv . '/presenca/' . hash('sha256', 'presenca' . "\0" . 'ana') . '.json';
    $arqBia = $priv . '/presenca/' . hash('sha256', 'presenca' . "\0" . 'bia') . '.json';
    file_put_contents($arqAna, json_encode(['m' => str_repeat('a', 64), 'v' => 1, 'a' => time(), 'c' => time()], JSON_THROW_ON_ERROR));
    file_put_contents($arqBia, json_encode(['m' => str_repeat('b', 64), 'v' => 1, 'a' => time(), 'c' => time()], JSON_THROW_ON_ERROR));
    [$rc, $out, $err] = rodarCliScript('remover-conta.php', [$priv, 'ana'], '');
    igual(0, $rc, "saída: $out $err");
    clearstatcache();
    verdadeiro(!is_file($arqAna), 'a presença de ana sai com a conta');
    verdadeiro(is_file($arqBia), 'a presença de bia fica');
    apagarArvore($dir);
}, false);

teste('presença: desativar a conta pelo painel apaga o arquivo de presença', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    verdadeiro(is_file(presencaArquivo($a, 'ana')), 'o arquivo existe antes');
    $r = $adm->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => 'ana']);
    igual(200, $r->status, 'desativada pelo painel');
    clearstatcache();
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'desativar a conta tira a presença: sem sessão aberta para uma conta inativa');
});

teste('presença: sair apaga o arquivo de presença da própria conta (não só o LED)', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    verdadeiro(is_file(presencaArquivo($a, 'ana')), 'o arquivo existe antes de sair');
    igual(200, $ana->post('/api/sair.php', [])->status, 'saiu');
    clearstatcache();
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'sair tira o registro de presença');
});
