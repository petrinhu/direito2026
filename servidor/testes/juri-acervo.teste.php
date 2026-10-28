<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

/**
 * Ponta a ponta da ferramenta do acervo com o servidor de verdade: a CLI Node
 * (scripts/juri/acervo.ts) gera a credencial a partir de uma imagem sintética,
 * o juri-instalar.php a grava, e o login real aceita o AUTH que este teste deriva
 * em PHP a partir da senha impressa pela ferramenta. A derivação em PHP é uma
 * SEGUNDA implementação (hash_pbkdf2 + hash_hkdf), não o módulo TypeScript: se as
 * duas divergem, o login nunca entra. Fixtures sintéticas, sem dado real.
 */

/** Roda um comando com cwd e devolve [código, stdout, stderr]. @param list<string> $cmd */
function juriAcervoRodar(array $cmd, string $cwd): array
{
    $p = proc_open(
        $cmd,
        [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes,
        $cwd
    );
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    $rc = proc_close($p);
    return [$rc, (string) $out, (string) $err];
}

/** PNG 2x2 RGB sintético com tEXt de sentinela (CRC padrão, zlib). */
function juriAcervoPng(): string
{
    $bloco = static function (string $tipo, string $dados): string {
        return pack('N', strlen($dados)) . $tipo . $dados . pack('N', crc32($tipo . $dados));
    };
    $pixels = "\x00\xff\x00\x00\xff\x00\x00\x00\x00\xff\xff\xff\xff";
    return "\x89PNG\r\n\x1a\n"
        . $bloco('IHDR', pack('NNCCCCC', 2, 2, 8, 2, 0, 0, 0))
        . $bloco('tEXt', "Author\0AUTOR-SINTETICO-PHP")
        . $bloco('IDAT', gzcompress($pixels))
        . $bloco('IEND', '');
}

teste('juri (ferramenta): a senha impressa pela ferramenta, derivada em PHP, entra pelo login real e devolve o embrulho', function (): void {
    $a = Ambiente::novo(['admin' => false]);
    $origem = $a->raiz . '/originais';
    mkdir($origem, 0700);
    file_put_contents($origem . '/foto.png', juriAcervoPng());
    chmod($origem . '/foto.png', 0600);
    $saida = $a->raiz . '/saida';

    [$rc, $out, $err] = juriAcervoRodar(
        ['node', '--import', 'tsx', RAIZ_REPO . '/scripts/juri/acervo.ts', 'iniciar', '--originais', $origem, '--saida', $saida],
        RAIZ_REPO
    );
    igual(0, $rc, "iniciar: $err");
    $senha = rtrim($out, "\n");
    igual(1, preg_match('/^[A-Za-z2-9]{20}$/', $senha), 'stdout é só a senha provisória de 20 caracteres');

    $cred = json_decode((string) file_get_contents($saida . '/credencial-admin.json'), true, 16, JSON_THROW_ON_ERROR);
    $salt = base64_decode((string) $cred['salt'], true);
    igual(16, is_string($salt) ? strlen($salt) : -1, 'salt de 16 bytes');

    // Segunda implementação da derivação: PBKDF2-HMAC-SHA256 (600000) e HKDF com o rótulo do AUTH.
    $mestre = hash_pbkdf2('sha256', $senha, $salt, 600000, 32, true);
    $auth = rtrim(strtr(base64_encode(hash_hkdf('sha256', $mestre, 32, 'juri-auth-v1', '')), '+/', '-_'), '=');
    igual($cred['auth'], $auth, 'AUTH derivado em PHP é o mesmo que a ferramenta gravou');

    [$rc2, $out2, $err2] = juriAcervoInstalar($a, $saida . '/credencial-admin.json');
    igual(0, $rc2, "juri-instalar: $out2 $err2");

    $c = juriAnonimo($a);
    $sal = $c->post('/api/juri/sal.php', ['usuario' => JURI_LOGIN_TESTE]);
    igual(200, $sal->status, 'sal.php');
    igual($cred['salt'], $sal->json()['salt'], 'sal.php devolve o salt da credencial');

    $r = $c->post('/api/juri/entrar.php', ['usuario' => JURI_LOGIN_TESTE, 'auth' => $auth]);
    igual(200, $r->status, 'entrar.php aceita o AUTH derivado em PHP');
    igual(true, $r->json()['deveTrocarSenha'], 'troca obrigatória no primeiro acesso');
    igual($cred['embrulho'], $r->json()['embrulho'], 'entrar.php devolve o embrulho da credencial, exato');

    $errado = juriAnonimo($a);
    igual(401, $errado->post('/api/juri/entrar.php', ['usuario' => JURI_LOGIN_TESTE, 'auth' => juriAuthErrado()])->status, 'AUTH de outra senha: 401');
});

/** juri-instalar.php sobre a credencial gerada pela ferramenta, no diretório privado da Júri do ambiente. @return array{int, string, string} */
function juriAcervoInstalar(Ambiente $a, string $credencial): array
{
    $p = proc_open(
        [PHP_BINARY, RAIZ_REPO . '/servidor/cli/juri-instalar.php', $a->privJuri, $credencial],
        [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes
    );
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    $rc = proc_close($p);
    return [$rc, (string) $out, (string) $err];
}
