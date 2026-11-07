<?php
declare(strict_types=1);

require_once __DIR__ . '/cli-apoio.php';

teste('cli criar-admin --adicionar: cria o login novo sem tocar em nenhuma conta nem na chave de sessão', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false]]);
    $antes = cliContasPorLogin($priv);
    $chaveAntes = (string) file_get_contents($priv . '/segredo.key');
    [$rc, $out, $err] = rodarCliScript('criar-admin.php', [$priv, 'petrus.novo', '--adicionar'], "SenhaNova1234567890\n");
    igual(0, $rc, "saída: $out $err");
    $depois = cliContasPorLogin($priv);
    igual(['petrus', 'ana', 'petrus.novo'], array_keys($depois), 'o login novo entra no fim, sem remover ninguém');
    igual($antes['petrus'], $depois['petrus'], 'conta petrus intacta (hash, uid e versão de sessão)');
    igual($antes['ana'], $depois['ana'], 'conta ana intacta');
    igual($chaveAntes, (string) file_get_contents($priv . '/segredo.key'), 'chave do CSRF pré-login intacta');
    igual(true, $depois['petrus.novo']['admin'], 'nasce admin, como antes');
    igual(true, $depois['petrus.novo']['deveTrocarSenha'], 'nasce com troca obrigatória');
    verdadeiro(password_verify('SenhaNova1234567890', (string) $depois['petrus.novo']['hash']), 'senha lida do STDIN');
    naoContem('SenhaNova1234567890', $out . $err, 'senha não ecoada');
    naoContem('$argon2', $out . $err, 'hash não impresso');
    naoContem((string) $depois['petrus.novo']['uid'], $out . $err, 'uid não impresso');
    apagarArvore($dir);
}, false);

teste('cli criar-admin --adicionar: recusa login que já existe e não grava nada', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true]]);
    $antes = cliContasPorLogin($priv);
    [$rc, $out, $err] = rodarCliScript('criar-admin.php', [$priv, 'petrus', '--adicionar'], "OutraSenha1234567\n");
    verdadeiro($rc !== 0, 'login existente recusado');
    contem('criar-admin:', $err, 'a recusa vem do próprio CLI, não de falha de carga');
    contem('nada foi alterado', $err, 'a mensagem diz que nada mudou');
    igual($antes, cliContasPorLogin($priv), 'nenhuma conta mudou (hash e versão de sessão incluídos)');
    naoContem('OutraSenha1234567', $out . $err, 'senha não ecoada na recusa');
    apagarArvore($dir);
}, false);

teste('cli criar-admin --adicionar: junto com --substituir é recusado, e nenhuma conta é apagada', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false]]);
    $antes = cliContasPorLogin($priv);
    [$rc, , $err] = rodarCliScript('criar-admin.php', [$priv, 'petrus.novo', '--adicionar', '--substituir'], "SenhaNova1234567890\n");
    verdadeiro($rc !== 0, 'flags excludentes recusadas');
    contem('criar-admin:', $err, 'a recusa vem do próprio CLI');
    igual($antes, cliContasPorLogin($priv), 'nenhuma conta apagada');
    apagarArvore($dir);
}, false);

teste('cli criar-admin: opção desconhecida é recusada e o valor dela nunca é ecoado (senha em --opção não entra em silêncio)', function (): void {
    [$dir, $priv] = cliPrivComContas([]);
    [$rc, $out, $err] = rodarCliScript('criar-admin.php', [$priv, 'adm.teste', '--senha=SegredoQueNaoPodeSair'], "SenhaNova1234567890\n");
    verdadeiro($rc !== 0, 'opção desconhecida recusada');
    contem('criar-admin:', $err, 'a recusa vem do próprio CLI');
    naoContem('SegredoQueNaoPode', $out . $err, 'valor da opção não ecoado');
    verdadeiro(!is_file($priv . '/usuarios.json'), 'nenhuma conta criada');
    apagarArvore($dir);
}, false);

teste('cli criar-admin: senha escrita como argumento posicional é recusada sem eco', function (): void {
    [$dir, $priv] = cliPrivComContas([]);
    [$rc, $out, $err] = rodarCliScript('criar-admin.php', [$priv, 'adm.teste', 'SenhaEmArgumento123'], "SenhaNova1234567890\n");
    verdadeiro($rc !== 0, 'argumento a mais recusado');
    naoContem('SenhaEmArgumento123', $out . $err, 'senha em argumento não ecoada');
    verdadeiro(!is_file($priv . '/usuarios.json'), 'nenhuma conta criada');
    apagarArvore($dir);
}, false);
