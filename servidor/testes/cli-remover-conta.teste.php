<?php
declare(strict_types=1);

require_once __DIR__ . '/cli-apoio.php';

teste('cli remover-conta: remove só o login pedido, e as outras contas ficam iguais', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false], 'bia' => ['admin' => false]]);
    $antes = cliContasPorLogin($priv);
    [$rc, $out, $err] = rodarCliScript('remover-conta.php', [$priv, 'bia'], '');
    igual(0, $rc, "saída: $out $err");
    $depois = cliContasPorLogin($priv);
    igual(['petrus', 'ana'], array_keys($depois), 'só bia saiu');
    igual($antes['petrus'], $depois['petrus'], 'petrus intacto');
    igual($antes['ana'], $depois['ana'], 'ana intacta');
    naoContem((string) $antes['bia']['uid'], $out . $err, 'uid não impresso');
    apagarArvore($dir);
}, false);

teste('cli remover-conta: recusa tirar o último admin ativo e não grava nada', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false]]);
    $antes = cliContasPorLogin($priv);
    [$rc, , $err] = rodarCliScript('remover-conta.php', [$priv, 'petrus'], '');
    verdadeiro($rc !== 0, 'último admin recusado');
    contem('remover-conta:', $err, 'a recusa vem do próprio CLI');
    contem('nenhum administrador', $err, 'a mensagem diz o motivo');
    igual($antes, cliContasPorLogin($priv), 'nada removido');
    apagarArvore($dir);
}, false);

teste('cli remover-conta: login inexistente, login inválido e argumento extra são recusados sem gravar', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false]]);
    $antes = cliContasPorLogin($priv);
    $casos = [[$priv, 'fantasma'], [$priv, 'a b'], [$priv], [$priv, 'ana', 'extra']];
    foreach ($casos as $args) {
        [$rc, , $err] = rodarCliScript('remover-conta.php', $args, '');
        verdadeiro($rc !== 0, 'recusado: ' . implode(' ', array_slice($args, 1)));
        contem('remover-conta:', $err, 'a recusa vem do próprio CLI');
    }
    igual($antes, cliContasPorLogin($priv), 'nada removido');
    apagarArvore($dir);
}, false);

teste('cli remover-conta (servidor): a sessão da conta removida deixa de valer e o login dela não entra mais', function (): void {
    $a = Ambiente::novo(['admin' => true]);
    $a->semearUsuario('bia', 'SenhaBia1234567890', false, false);
    $c = $a->entrar('bia', 'SenhaBia1234567890');
    igual(true, $c->get('/api/sessao.php')->json()['autenticado'], 'sessão aberta antes da remoção');
    igual(0, rodarCliScript('remover-conta.php', [$a->priv, 'bia'], '')[0], 'remoção');
    igual(false, $c->get('/api/sessao.php')->json()['autenticado'], 'sessão da conta removida não vale mais');
    $r = $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'bia', 'senha' => 'SenhaBia1234567890']);
    verdadeiro($r->status !== 200, 'login da conta removida recusado');
});
