<?php
declare(strict_types=1);

/**
 * LU-F2.7-N3: auditar-contas, remover-conta, definir-admin, conferir-smtp e
 * conferir-portao carregam a pasta apoio/ ao lado deles. Copiados sozinhos (sem apoio/), precisam recusar com uma
 * mensagem clara, e não com o erro fatal do PHP, que mostra caminhos internos.
 */

/** Roda uma cópia solta de um CLI, a partir de $dir. @return array{int, string, string} [código, stdout, stderr] */
function rodarCopiaSolta(string $dir, string $script, array $args): array
{
    $p = proc_open(
        array_merge([PHP_BINARY, $dir . '/' . $script], $args),
        [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes
    );
    fclose($pipes[0]);
    $out = (string) stream_get_contents($pipes[1]);
    $err = (string) stream_get_contents($pipes[2]);
    return [proc_close($p), $out, $err];
}

/** @return list<array{string, string, list<string>}> [arquivo, comando, argumentos depois do privado] */
function ferramentasComApoio(): array
{
    return [
        ['auditar-contas.php', 'auditar-contas', []],
        ['remover-conta.php', 'remover-conta', ['SENTINELA-LOGIN']],
        ['definir-admin.php', 'definir-admin', ['--unico=SENTINELA-LOGIN']],
        ['conferir-smtp.php', 'conferir-smtp', []],
        ['conferir-portao.php', 'conferir-portao', []],
    ];
}

foreach (ferramentasComApoio() as [$script, $cmd, $resto]) {
    teste("cli $script sem apoio/: recusa com mensagem clara, sem erro fatal do PHP", function () use ($script, $cmd, $resto): void {
        $dir = dirTemporario();
        copy(RAIZ_REPO . '/servidor/cli/' . $script, $dir . '/' . $script);
        [$rc, $out, $err] = rodarCopiaSolta($dir, $script, [$dir . '/privado', ...$resto]);
        igual(1, $rc, "código de saída; stderr: $err");
        igual('', $out, 'nada na saída padrão');
        contem("$cmd:", $err, 'a mensagem traz o nome do comando');
        contem('apoio/cli.php', $err, 'a mensagem diz qual arquivo falta');
        contem('servidor/cli/', $err, 'a mensagem diz o que copiar');
        naoContem('Fatal error', $out . $err, 'sem erro fatal do PHP');
        naoContem('Failed opening', $out . $err, 'sem falha de require');
        naoContem('Warning', $out . $err, 'sem aviso do PHP');
        naoContem('SENTINELA-LOGIN', $out . $err, 'argumento não é ecoado');
        apagarArvore($dir);
    }, false);
}

teste('cli remover-conta e definir-admin: com apoio/cli.php mas sem apoio/admin.php, recusa e nomeia o arquivo que falta', function (): void {
    foreach (['remover-conta' => 'remover-conta.php', 'definir-admin' => 'definir-admin.php'] as $cmd => $script) {
        $dir = dirTemporario();
        copy(RAIZ_REPO . '/servidor/cli/' . $script, $dir . '/' . $script);
        mkdir($dir . '/apoio', 0700);
        copy(RAIZ_REPO . '/servidor/cli/apoio/cli.php', $dir . '/apoio/cli.php');
        [$rc, $out, $err] = rodarCopiaSolta($dir, $script, [$dir . '/privado', 'SENTINELA-LOGIN']);
        igual(1, $rc, "$cmd: código de saída; stderr: $err");
        contem("$cmd:", $err, "$cmd: a mensagem traz o nome do comando");
        contem('apoio/admin.php', $err, "$cmd: a mensagem diz qual arquivo falta");
        naoContem('Fatal error', $out . $err, "$cmd: sem erro fatal do PHP");
        naoContem('SENTINELA-LOGIN', $out . $err, "$cmd: argumento não é ecoado");
        apagarArvore($dir);
    }
}, false);
