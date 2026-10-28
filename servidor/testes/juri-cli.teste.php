<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

/**
 * CLI da Júri (servidor/cli/juri-instalar.php): instala a conta única a partir da
 * credencial gerada pela ferramenta local. Os testes rodam o processo de verdade,
 * sem senha nem AUTH em argumento. Fixtures sintéticas: nenhum dado do caso.
 */

/** @return array{int, string, string} [código, stdout, stderr] */
function juriCliRodar(array $args): array
{
    $p = proc_open(
        array_merge([PHP_BINARY, RAIZ_REPO . '/servidor/cli/juri-instalar.php'], $args),
        [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes
    );
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    $rc = proc_close($p);
    return [$rc, (string) $out, (string) $err];
}

/** Diretório temporário da suíte (apagado pelo próprio teste, prefixo d26-testes-). */
function juriCliDir(): string
{
    $dir = rtrim(getenv('TMPDIR') ?: '/var/tmp', '/') . '/d26-testes-' . bin2hex(random_bytes(6));
    mkdir($dir, 0700, true);
    return $dir;
}

/** Salt de fixture: 16 bytes em base64 padrão, derivado de $semente. */
function juriCliSalt(string $semente = 'cli-salt', int $bytes = 16): string
{
    return base64_encode(substr(hash('sha256', $semente, true), 0, $bytes));
}

/** AUTH de fixture diferente do de juriAuthTeste(): base64url canônico de 32 bytes. */
function juriCliAuthNovo(): string
{
    return rtrim(strtr(base64_encode(hash('sha256', 'auth-cli-novo', true)), '+/', '-_'), '=');
}

/** Embrulho de fixture no formato v1: iv 12 B, ct 48 B, em base64 padrão. */
function juriCliEmbrulho(string $semente = 'cli'): array
{
    return [
        'v' => 1,
        'iv' => base64_encode(substr(hash('sha256', 'iv-' . $semente, true), 0, 12)),
        'ct' => base64_encode(hash('sha256', 'ct-' . $semente, true) . substr(hash('sha256', 'tag-' . $semente, true), 0, 16)),
    ];
}

/** Credencial válida (login, salt, auth, embrulho), com alterações e remoções opcionais. @return array<string, mixed> */
function juriCliCredencial(array $alterar = [], array $remover = []): array
{
    $cred = [
        'login' => JURI_LOGIN_TESTE,
        'salt' => juriCliSalt(),
        'auth' => juriAuthTeste(),
        'embrulho' => juriCliEmbrulho(),
    ];
    return array_diff_key(array_replace($cred, $alterar), array_flip($remover));
}

/** Grava $conteudo (texto cru) em $dir/$nome, 600, e devolve o caminho. */
function juriCliEscrever(string $dir, string $nome, string $conteudo): string
{
    $arq = $dir . '/' . $nome;
    file_put_contents($arq, $conteudo);
    chmod($arq, 0600);
    return $arq;
}

/** Grava a credencial como JSON em $dir/$nome e devolve o caminho. @param array<string, mixed> $cred */
function juriCliGravarCredencial(string $dir, array $cred, string $nome = 'credencial-admin.json'): string
{
    return juriCliEscrever($dir, $nome, json_encode($cred, JSON_THROW_ON_ERROR));
}

/** @return array<string, mixed> usuarios.json de $dir, lido como o servidor lê */
function juriCliLerUsuarios(string $dir): array
{
    return json_decode((string) file_get_contents($dir . '/usuarios.json'), true, 16, JSON_THROW_ON_ERROR);
}

teste('juri (cli): instala a conta com salt e embrulho da credencial, Argon2id(AUTH), admin, troca obrigatória, 700/600 e pastas da Júri', function (): void {
    $base = juriCliDir();
    $dir = $base . '/privado';
    $cred = juriCliGravarCredencial($base, juriCliCredencial());
    [$rc, $out, $err] = juriCliRodar([$dir, $cred]);
    igual(0, $rc, "saída: $out $err");
    igual(0700, fileperms($dir) & 0777, 'raiz 700');
    foreach (['sessoes', 'conteudo', 'imagens'] as $sub) {
        verdadeiro(is_dir("$dir/$sub"), "$sub/ existe (imagens/ só sai com D26_AREA juri antes do núcleo)");
        igual(0700, fileperms("$dir/$sub") & 0777, "$sub/ 700");
    }
    foreach (['tentativas.json', 'erros.log', 'segredo.key'] as $f) {
        verdadeiro(is_file("$dir/$f"), "$f existe");
        igual(0600, fileperms("$dir/$f") & 0777, "$f 600");
    }
    igual(0600, fileperms("$dir/usuarios.json") & 0777, 'usuarios.json 600');

    $d = juriCliLerUsuarios($dir);
    igual(1, count($d['usuarios']), 'uma conta só');
    $u = $d['usuarios'][0];
    $chaves = array_keys($u);
    sort($chaves);
    igual(
        ['admin', 'aparelhos', 'ativo', 'criadoEm', 'deveTrocarSenha', 'embrulho', 'hash', 'salt', 'uid', 'ultimoLogin', 'usuario', 'versaoSessao'],
        $chaves,
        'campos exatos da conta (nada além do que o servidor lê)'
    );
    igual(JURI_LOGIN_TESTE, $u['usuario'], 'login da credencial');
    igual(true, $u['admin'], 'admin');
    igual(true, $u['ativo'], 'ativo');
    igual(true, $u['deveTrocarSenha'], 'troca obrigatória no primeiro acesso');
    verdadeiro(str_starts_with((string) $u['hash'], '$argon2id$'), 'hash Argon2id');
    verdadeiro(password_verify(juriAuthTeste(), (string) $u['hash']), 'hash é Argon2id(AUTH), a string de 43 caracteres');
    igual(juriCliSalt(), $u['salt'], 'salt da credencial, em base64');
    igual(juriCliEmbrulho(), $u['embrulho'], 'embrulho da credencial, exato');
    apagarArvore($base);
}, false);

teste('juri (cli): o login real (sal.php e entrar.php) aceita o mesmo AUTH, devolve o salt e o embrulho da credencial e exige troca', function (): void {
    $a = Ambiente::novo(['admin' => false]);
    $cred = juriCliGravarCredencial($a->raiz, juriCliCredencial());
    [$rc, $out, $err] = juriCliRodar([$a->priv, $cred]);
    igual(0, $rc, "saída: $out $err");

    $c = juriAnonimo($a);
    $sal = $c->post('/api/juri/sal.php', ['usuario' => JURI_LOGIN_TESTE]);
    igual(200, $sal->status, 'sal.php');
    igual(juriCliSalt(), $sal->json()['salt'], 'sal.php devolve o salt da credencial');

    $r = $c->post('/api/juri/entrar.php', juriCorpoLogin());
    igual(200, $r->status, 'entrar.php com o AUTH da credencial');
    igual(true, $r->json()['deveTrocarSenha'], 'deveTrocarSenha true');
    igual(juriCliEmbrulho(), $r->json()['embrulho'], 'entrar.php devolve o embrulho da credencial');
    igual(403, $c->get('/api/juri/conteudo.php')->status, 'troca pendente bloqueia o conteúdo');
});

teste('juri (cli): recusa se usuarios.json existe sem --substituir, e o arquivo fica byte a byte igual', function (): void {
    $base = juriCliDir();
    $dir = $base . '/privado';
    [$rc0, $out0, $err0] = juriCliRodar([$dir, juriCliGravarCredencial($base, juriCliCredencial())]);
    igual(0, $rc0, "primeira instalação: $out0 $err0");
    $antes = (string) file_get_contents($dir . '/usuarios.json');

    $outra = juriCliGravarCredencial($base, juriCliCredencial(['salt' => juriCliSalt('outro'), 'auth' => juriCliAuthNovo()]), 'outra.json');
    [$rc, $out, $err] = juriCliRodar([$dir, $outra]);
    verdadeiro($rc !== 0, 'segunda instalação recusada');
    contem('juri-instalar:', $err, 'a recusa vem do CLI, não de falha do PHP');
    contem('--substituir', $err, 'mensagem orienta o flag');
    igual($antes, (string) file_get_contents($dir . '/usuarios.json'), 'usuarios.json intocado');

    [$rc2, $out2, $err2] = juriCliRodar([$dir, $outra, '--substituir']);
    igual(0, $rc2, "--substituir aceita: $out2 $err2");
    $d = juriCliLerUsuarios($dir);
    igual(1, count($d['usuarios']), 'continua uma conta só');
    igual(juriCliSalt('outro'), $d['usuarios'][0]['salt'], 'com --substituir, o salt novo entra');
    verdadeiro(password_verify(juriCliAuthNovo(), (string) $d['usuarios'][0]['hash']), 'o AUTH novo confere');
    verdadeiro(!password_verify(juriAuthTeste(), (string) $d['usuarios'][0]['hash']), 'o AUTH antigo não confere mais');
    igual(0600, fileperms($dir . '/usuarios.json') & 0777, 'usuarios.json 600 depois de substituir');
    apagarArvore($base);
}, false);

teste('juri (cli): credencial malformada recusa e não cria usuarios.json (fail-closed, cada campo)', function (): void {
    $casos = [
        'arquivo inexistente' => null,
        'JSON inválido' => '{nao e json',
        'lista em vez de objeto' => '[]',
        'objeto vazio' => '{}',
        'campo a mais (senha)' => json_encode(juriCliCredencial(['senha' => 'SenhaProibida123']), JSON_THROW_ON_ERROR),
        'campo faltando (auth)' => json_encode(juriCliCredencial([], ['auth']), JSON_THROW_ON_ERROR),
        'login inválido' => json_encode(juriCliCredencial(['login' => 'a b']), JSON_THROW_ON_ERROR),
        'login não é texto' => json_encode(juriCliCredencial(['login' => 7]), JSON_THROW_ON_ERROR),
        'salt de 15 bytes' => json_encode(juriCliCredencial(['salt' => juriCliSalt('x', 15)]), JSON_THROW_ON_ERROR),
        'salt não é texto' => json_encode(juriCliCredencial(['salt' => 1234]), JSON_THROW_ON_ERROR),
        'auth de 42 caracteres' => json_encode(juriCliCredencial(['auth' => substr(juriAuthTeste(), 0, 42)]), JSON_THROW_ON_ERROR),
        'auth com padding' => json_encode(juriCliCredencial(['auth' => juriAuthTeste() . '=']), JSON_THROW_ON_ERROR),
        'auth com alfabeto padrão (+ /)' => json_encode(juriCliCredencial(['auth' => str_repeat('+', 43)]), JSON_THROW_ON_ERROR),
        'embrulho com v 2' => json_encode(juriCliCredencial(['embrulho' => ['v' => 2] + juriCliEmbrulho()]), JSON_THROW_ON_ERROR),
        'embrulho com iv de 11 bytes' => json_encode(juriCliCredencial(['embrulho' => ['iv' => base64_encode(str_repeat('a', 11))] + juriCliEmbrulho()]), JSON_THROW_ON_ERROR),
        'embrulho com campo extra' => json_encode(juriCliCredencial(['embrulho' => juriCliEmbrulho() + ['x' => 1]]), JSON_THROW_ON_ERROR),
        'embrulho sem ct' => json_encode(juriCliCredencial(['embrulho' => array_diff_key(juriCliEmbrulho(), ['ct' => 1])]), JSON_THROW_ON_ERROR),
    ];
    foreach ($casos as $nome => $conteudo) {
        $base = juriCliDir();
        $dir = $base . '/privado';
        $cred = $conteudo === null
            ? $base . '/inexistente.json'
            : juriCliEscrever($base, 'credencial-admin.json', $conteudo);
        [$rc, , $err] = juriCliRodar([$dir, $cred]);
        verdadeiro($rc !== 0, "recusa: $nome");
        contem('juri-instalar:', $err, "mensagem do CLI: $nome");
        verdadeiro(!is_file($dir . '/usuarios.json'), "nenhum usuarios.json: $nome");
        apagarArvore($base);
    }
}, false);

teste('juri (cli): argumentos faltando ou flag desconhecida falham sem criar usuarios.json', function (): void {
    $base = juriCliDir();
    $dir = $base . '/privado';
    $cred = juriCliGravarCredencial($base, juriCliCredencial());
    foreach ([[], [$dir], [$cred], [$dir, $cred, '--forcar']] as $args) {
        [$rc, , $err] = juriCliRodar($args);
        verdadeiro($rc !== 0, 'recusa: ' . json_encode($args));
        contem('juri-instalar:', $err, 'mensagem do CLI');
    }
    verdadeiro(!is_file($dir . '/usuarios.json'), 'nenhum usuarios.json criado');
    apagarArvore($base);
}, false);

teste('juri (cli): a saída do processo (stdout e stderr) nunca contém AUTH, hash, salt, embrulho nem o valor rejeitado', function (): void {
    $base = juriCliDir();
    $dir = $base . '/privado';
    $cred = juriCliCredencial();

    [$rc, $out, $err] = juriCliRodar([$dir, juriCliGravarCredencial($base, $cred)]);
    igual(0, $rc, "instalação: $out $err");
    $saida = $out . $err;
    foreach ([juriAuthTeste(), $cred['salt'], $cred['embrulho']['iv'], $cred['embrulho']['ct'], '$argon2id$'] as $segredo) {
        naoContem($segredo, $saida, 'sucesso não ecoa segredo');
    }

    [$rc2, $out2, $err2] = juriCliRodar([$dir, juriCliGravarCredencial($base, $cred, 'de-novo.json')]);
    verdadeiro($rc2 !== 0, 'recusa sem --substituir');
    foreach ([juriAuthTeste(), $cred['salt'], $cred['embrulho']['ct'], '$argon2id$'] as $segredo) {
        naoContem($segredo, $out2 . $err2, 'recusa não ecoa segredo');
    }

    $valorRejeitado = 'ZZ-rejeitado-' . str_repeat('q', 30);
    $ruim = juriCliEscrever($base, 'ruim.json', json_encode(juriCliCredencial(['auth' => $valorRejeitado]), JSON_THROW_ON_ERROR));
    [$rc3, $out3, $err3] = juriCliRodar([$base . '/outro', $ruim]);
    verdadeiro($rc3 !== 0, 'credencial malformada recusada');
    naoContem($valorRejeitado, $out3 . $err3, 'o valor rejeitado não volta na mensagem');
    naoContem(juriAuthTeste(), $out3 . $err3, 'AUTH válido de outra credencial não aparece');
    apagarArvore($base);
}, false);
