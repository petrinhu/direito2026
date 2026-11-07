<?php
declare(strict_types=1);

require_once __DIR__ . '/cli-apoio.php';

/**
 * Arquivo de contas corrompido não pode virar pilha de chamadas no terminal:
 * a pilha mostra argumentos de função, e um hash ou uma senha pode estar lá.
 * Cada CLI dá uma linha curta ("erro interno") e sai com código 1.
 */
function cliPrivCorrompido(): array
{
    [$dir, $priv] = cliPrivComContas([]);
    file_put_contents($priv . '/usuarios.json', '{corrompido');
    return [$dir, $priv];
}

function afirmaErroCurto(string $cmd, int $rc, string $out, string $err): void
{
    verdadeiro($rc !== 0, "$cmd: sai com erro");
    contem("$cmd: erro interno", $err, "$cmd: mensagem curta");
    naoContem('Stack trace', $out . $err, "$cmd: sem pilha de chamadas");
    naoContem('#0', $out . $err, "$cmd: sem quadro de pilha");
    naoContem('SenhaSecretaDoTeste1', $out . $err, "$cmd: senha nunca ecoada");
}

teste('cli corrompido: criar-admin --adicionar dá erro interno curto, sem pilha e sem senha', function (): void {
    [$dir, $priv] = cliPrivCorrompido();
    [$rc, $out, $err] = rodarCliScript('criar-admin.php', [$priv, 'novo.adm', '--adicionar'], "SenhaSecretaDoTeste1\n");
    afirmaErroCurto('criar-admin', $rc, $out, $err);
    apagarArvore($dir);
}, false);

teste('cli corrompido: definir-admin --unico dá erro interno curto, sem pilha e sem senha', function (): void {
    [$dir, $priv] = cliPrivCorrompido();
    [$rc, $out, $err] = rodarCliScript('definir-admin.php', [$priv, '--unico=bia'], '');
    afirmaErroCurto('definir-admin', $rc, $out, $err);
    apagarArvore($dir);
}, false);

teste('cli corrompido: remover-conta dá erro interno curto, sem pilha e sem senha', function (): void {
    [$dir, $priv] = cliPrivCorrompido();
    [$rc, $out, $err] = rodarCliScript('remover-conta.php', [$priv, 'bia'], '');
    afirmaErroCurto('remover-conta', $rc, $out, $err);
    apagarArvore($dir);
}, false);

teste('cli corrompido: auditar-contas dá erro interno curto, sem pilha e sem senha', function (): void {
    [$dir, $priv] = cliPrivCorrompido();
    [$rc, $out, $err] = rodarCliScript('auditar-contas.php', [$priv], '');
    afirmaErroCurto('auditar-contas', $rc, $out, $err);
    apagarArvore($dir);
}, false);

teste('cli corrompido: redefinir-senha dá erro interno curto, sem pilha e sem senha', function (): void {
    [$dir, $priv] = cliPrivCorrompido();
    [$rc, $out, $err] = rodarRedefinir([$priv, 'bia'], "SenhaSecretaDoTeste1\n");
    afirmaErroCurto('redefinir-senha', $rc, $out, $err);
    apagarArvore($dir);
}, false);

teste('cli corrompido: desbloquear dá erro interno curto, sem pilha (contadores corrompidos)', function (): void {
    [$dir, $priv] = cliPrivComContas(['bia' => ['admin' => false]]);
    file_put_contents($priv . '/tentativas.json', '{corrompido');
    [$rc, $out, $err] = rodarCliScript('desbloquear.php', [$priv, 'bia'], '');
    afirmaErroCurto('desbloquear', $rc, $out, $err);
    apagarArvore($dir);
}, false);
