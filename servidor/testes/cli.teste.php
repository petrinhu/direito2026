<?php
declare(strict_types=1);

/** @return array{int, string, string} [código, stdout, stderr] */
function rodarCli(array $args, string $stdin): array
{
    $p = proc_open(
        array_merge([PHP_BINARY, RAIZ_REPO . '/servidor/cli/criar-admin.php'], $args),
        [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes
    );
    fwrite($pipes[0], $stdin);
    fclose($pipes[0]);
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    $rc = proc_close($p);
    return [$rc, (string) $out, (string) $err];
}

teste('cli criar-admin: cria estrutura 700/600, admin=true, deveTrocarSenha=true, hash Argon2id', function (): void {
    $dir = dirTemporarioCli() . '/privado';
    [$rc, $out, $err] = rodarCli([$dir, 'adm.teste'], "SenhaDoCli12345\n");
    igual(0, $rc, "saída: $out $err");
    naoContem('SenhaDoCli12345', $out . $err, 'a senha não é ecoada');
    $arq = $dir . '/usuarios.json';
    verdadeiro(is_file($arq), 'usuarios.json criado');
    igual(0600, fileperms($arq) & 0777, 'usuarios.json 600');
    igual(0700, fileperms($dir) & 0777, 'raiz 700');
    foreach (['sessoes', 'conteudo'] as $sub) {
        verdadeiro(is_dir("$dir/$sub"), "$sub/ existe");
        igual(0700, fileperms("$dir/$sub") & 0777, "$sub/ 700");
    }
    foreach (['tentativas.json', 'erros.log', 'segredo.key'] as $f) {
        verdadeiro(is_file("$dir/$f"), "$f existe");
        igual(0600, fileperms("$dir/$f") & 0777, "$f 600");
    }
    $d = json_decode((string) file_get_contents($arq), true);
    igual(1, count($d['usuarios']));
    $u = $d['usuarios'][0];
    igual('adm.teste', $u['usuario']);
    igual(true, $u['admin']);
    igual(true, $u['deveTrocarSenha']);
    igual(true, $u['ativo']);
    verdadeiro(str_starts_with($u['hash'], '$argon2id$'), 'hash argon2id');
    verdadeiro(password_verify('SenhaDoCli12345', $u['hash']), 'hash confere com a senha lida do STDIN');
    verdadeiro(!password_verify('senhadocli12345', $u['hash']), 'case-sensitive');
    apagarArvore(dirname($dir));
}, false);

teste('cli criar-admin: recusa se usuarios.json existe, salvo --substituir', function (): void {
    $dir = dirTemporarioCli() . '/privado';
    igual(0, rodarCli([$dir, 'primeiro'], "SenhaUm1234567\n")[0]);
    $antes = (string) file_get_contents($dir . '/usuarios.json');
    [$rc, , $err] = rodarCli([$dir, 'segundo'], "SenhaDois1234567\n");
    verdadeiro($rc !== 0, 'segunda execução recusada');
    contem('--substituir', $err, 'mensagem orienta o flag');
    igual($antes, (string) file_get_contents($dir . '/usuarios.json'), 'arquivo intocado');
    igual(0, rodarCli([$dir, 'segundo', '--substituir'], "SenhaDois1234567\n")[0], '--substituir aceita');
    $d = json_decode((string) file_get_contents($dir . '/usuarios.json'), true);
    igual(['segundo'], array_column($d['usuarios'], 'usuario'));
    igual(0600, fileperms($dir . '/usuarios.json') & 0777);
    apagarArvore(dirname($dir));
}, false);

teste('cli criar-admin: login inválido, senha vazia ou argumentos faltando falham sem criar usuário', function (): void {
    $dir = dirTemporarioCli() . '/privado';
    verdadeiro(rodarCli([$dir, 'a b'], "SenhaUm1234567\n")[0] !== 0, 'login inválido');
    verdadeiro(rodarCli([$dir, 'valido'], "\n")[0] !== 0, 'senha vazia');
    verdadeiro(rodarCli([$dir, 'valido'], '')[0] !== 0, 'sem STDIN');
    verdadeiro(rodarCli([$dir], "x\n")[0] !== 0, 'sem login');
    verdadeiro(rodarCli([], "x\n")[0] !== 0, 'sem argumentos');
    verdadeiro(!is_file($dir . '/usuarios.json'), 'nenhum usuarios.json criado');
    apagarArvore(dirname($dir));
}, false);

teste('cli criar-admin: senha provisória curta é aceita (obriga troca) e o admin entra pela API', function (): void {
    $a = Ambiente::novo(['admin' => false]);
    [$rc, $out, $err] = rodarCli([$a->priv, 'adm.teste', '--substituir'], "Curta\n");
    igual(0, $rc, "$out $err");
    $c = $a->clienteComSessao();
    $r = $c->post('/api/entrar.php', ['usuario' => 'adm.teste', 'senha' => 'Curta']);
    igual(200, $r->status);
    igual(true, $r->json()['admin']);
    igual(true, $r->json()['deveTrocarSenha']);
    igual(403, $c->get('/api/conteudo.php')->status, 'bloqueado até trocar');
});

function dirTemporarioCli(): string
{
    $dir = rtrim(getenv('TMPDIR') ?: '/var/tmp', '/') . '/d26-testes-' . bin2hex(random_bytes(6));
    mkdir($dir, 0700, true);
    return $dir;
}

teste('cli criar-admin: continua aceitando provisória curta do líder (a API exige 8, o CLI não)', function (): void {
    $dir = dirTemporarioCli() . '/privado';
    [$rc, $out, $err] = rodarCli([$dir, 'adm.curto'], "Admin\n");
    igual(0, $rc, "saída: $out $err");
    apagarArvore(dirname($dir));
}, false);
