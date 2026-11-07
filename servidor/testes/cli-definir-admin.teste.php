<?php
declare(strict_types=1);

require_once __DIR__ . '/cli-apoio.php';

teste('cli definir-admin --unico: o alvo vira o único admin, os outros viram comuns, e ninguém perde senha, uid nem sessão', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => true], 'bia' => ['admin' => false]]);
    $antes = cliContasPorLogin($priv);
    [$rc, $out, $err] = rodarCliScript('definir-admin.php', [$priv, '--unico=bia'], '');
    igual(0, $rc, "saída: $out $err");
    $depois = cliContasPorLogin($priv);
    igual([true, false, false], [$depois['bia']['admin'], $depois['petrus']['admin'], $depois['ana']['admin']], 'só bia é admin');
    foreach (['petrus', 'ana', 'bia'] as $login) {
        foreach (['hash', 'uid', 'versaoSessao', 'deveTrocarSenha', 'ativo'] as $campo) {
            igual($antes[$login][$campo], $depois[$login][$campo], "$login.$campo intacto");
        }
    }
    naoContem('$argon2', $out . $err, 'hash não impresso');
    naoContem((string) $antes['petrus']['uid'], $out . $err, 'uid não impresso');
    apagarArvore($dir);
}, false);

teste('cli definir-admin --unico: recusa login inexistente ou inativo e não grava nada', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false, 'ativo' => false]]);
    $antes = cliContasPorLogin($priv);
    [$rc1, , $err1] = rodarCliScript('definir-admin.php', [$priv, '--unico=fantasma'], '');
    verdadeiro($rc1 !== 0, 'inexistente recusado');
    contem('definir-admin:', $err1, 'a recusa vem do próprio CLI');
    [$rc2, , $err2] = rodarCliScript('definir-admin.php', [$priv, '--unico=ana'], '');
    verdadeiro($rc2 !== 0, 'inativo recusado');
    contem('inativa', $err2, 'a mensagem diz o motivo');
    igual($antes, cliContasPorLogin($priv), 'nada gravado');
    apagarArvore($dir);
}, false);

teste('cli definir-admin --unico: quando o alvo já é o único admin, sai 0 e não regrava o arquivo', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false]]);
    $antes = (string) file_get_contents($priv . '/usuarios.json');
    igual(0, rodarCliScript('definir-admin.php', [$priv, '--unico=petrus'], '')[0]);
    igual($antes, (string) file_get_contents($priv . '/usuarios.json'), 'arquivo byte a byte igual');
    apagarArvore($dir);
}, false);

teste('cli definir-admin <login> 0: nega tirar o último admin ativo; com outro admin ativo, tira', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false]]);
    $antes = cliContasPorLogin($priv);
    [$rc, , $err] = rodarCliScript('definir-admin.php', [$priv, 'petrus', '0'], '');
    verdadeiro($rc !== 0, 'último admin não sai');
    contem('definir-admin:', $err, 'a recusa vem do próprio CLI');
    contem('nenhum administrador', $err, 'a mensagem diz que o sistema ficaria sem admin');
    igual($antes, cliContasPorLogin($priv), 'nada gravado');
    igual(0, rodarCliScript('definir-admin.php', [$priv, 'ana', '1'], '')[0], 'ana vira admin');
    igual(0, rodarCliScript('definir-admin.php', [$priv, 'petrus', '0'], '')[0], 'agora petrus pode sair');
    $d = cliContasPorLogin($priv);
    igual([false, true], [$d['petrus']['admin'], $d['ana']['admin']]);
    apagarArvore($dir);
}, false);

teste('cli definir-admin <login> 1: é o rollback, reabilita só o login pedido e não rebaixa ninguém', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'bia' => ['admin' => false]]);
    igual(0, rodarCliScript('definir-admin.php', [$priv, '--unico=bia'], '')[0], 'passo da virada');
    igual(0, rodarCliScript('definir-admin.php', [$priv, 'petrus', '1'], '')[0], 'rollback');
    $d = cliContasPorLogin($priv);
    igual([true, true], [$d['petrus']['admin'], $d['bia']['admin']], 'os dois são admin depois do rollback');
    apagarArvore($dir);
}, false);

teste('cli definir-admin <login> 0|1: recusa login inexistente ou inativo, sem gravar', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false, 'ativo' => false]]);
    $antes = cliContasPorLogin($priv);
    verdadeiro(rodarCliScript('definir-admin.php', [$priv, 'fantasma', '1'], '')[0] !== 0, 'inexistente com 1');
    verdadeiro(rodarCliScript('definir-admin.php', [$priv, 'ana', '1'], '')[0] !== 0, 'inativo com 1');
    igual($antes, cliContasPorLogin($priv), 'nada gravado');
    apagarArvore($dir);
}, false);

teste('cli definir-admin: forma inválida, valor fora de 0|1, argumento extra, opção desconhecida ou senha em argumento são recusados sem gravar nem ecoar', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'bia' => ['admin' => false]]);
    $antes = cliContasPorLogin($priv);
    $casos = [
        [$priv],
        [$priv, 'bia'],
        [$priv, 'bia', '2'],
        [$priv, '--unico=bia', 'extra'],
        [$priv, '--unico='],
        [$priv, '--unico=bia', '--admin=1'],
        [$priv, 'bia', 'SenhaEmArgumento123'],
    ];
    foreach ($casos as $args) {
        [$rc, $out, $err] = rodarCliScript('definir-admin.php', $args, '');
        verdadeiro($rc !== 0, 'recusado: ' . implode(' ', array_slice($args, 1)));
        contem('definir-admin:', $err, 'a recusa vem do próprio CLI (não de falha de carga)');
        naoContem('SenhaEmArgumento123', $out . $err, 'senha em argumento não ecoada');
    }
    igual($antes, cliContasPorLogin($priv), 'nenhum caso gravou');
    apagarArvore($dir);
}, false);
