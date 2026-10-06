<?php
declare(strict_types=1);

/**
 * Cria a estrutura privada da área restrita e o primeiro admin.
 *
 * Uso:  php criar-admin.php <dir-privado> <login> [--substituir]
 * A senha provisória vem do STDIN (uma linha; sem eco quando STDIN é
 * terminal). O admin nasce com deveTrocarSenha=true. Recusa se
 * usuarios.json já existe, salvo --substituir (troca TODOS os usuários).
 *
 * No servidor, onde o núcleo não está ao lado deste arquivo, aponte-o por
 * D26_NUCLEO=<pasta api/nucleo publicada>. Nenhum login nem senha mora
 * no repositório.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

function falha(string $mensagem): never
{
    fwrite(STDERR, "criar-admin: $mensagem\n");
    exit(1);
}

$nucleo = getenv('D26_NUCLEO') ?: __DIR__ . '/../../public/api/nucleo';
define('D26_API', true);
foreach (['config', 'armazenamento', 'contas'] as $modulo) {
    $arquivo = rtrim($nucleo, '/') . "/$modulo.php";
    if (!is_file($arquivo)) {
        falha('núcleo não encontrado; defina D26_NUCLEO com a pasta api/nucleo');
    }
    require_once $arquivo;
}
umask(0077);

$args = array_slice($argv, 1);
$substituir = in_array('--substituir', $args, true);
$posicionais = array_values(array_filter($args, static fn (string $a): bool => !str_starts_with($a, '--')));
if (count($posicionais) !== 2) {
    falha('uso: php criar-admin.php <dir-privado> <login> [--substituir]');
}
[$priv, $login] = $posicionais;
if (!d26_login_valido($login)) {
    falha('login inválido (3 a 32 caracteres: letras, números, ponto, hífen, sublinhado)');
}
$arquivoUsuarios = rtrim($priv, '/') . '/usuarios.json';
if (is_file($arquivoUsuarios) && !$substituir) {
    falha('usuarios.json já existe; use --substituir para trocar todos os usuários por este admin');
}

$terminal = function_exists('stream_isatty') && stream_isatty(STDIN);
$eco = false;
if ($terminal) {
    fwrite(STDERR, 'Senha provisória: ');
    $stty = @proc_open(['stty', '-echo'], [0 => STDIN, 1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $p);
    $eco = $stty === false || proc_close($stty) !== 0;
    if ($eco) {
        fwrite(STDERR, "\n(aviso: não consegui desligar o eco do terminal)\n");
    }
}
$linha = fgets(STDIN);
if ($terminal) {
    if (!$eco) {
        @proc_close(@proc_open(['stty', 'echo'], [0 => STDIN, 1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $p2));
    }
    fwrite(STDERR, "\n");
}
if ($linha === false) {
    falha('senha ausente no STDIN');
}
$senha = rtrim($linha, "\r\n");
if (!d26_senha_provisoria_valida($senha)) {
    falha('senha inválida (1 a 128 caracteres, UTF-8)');
}

d26_garantir_estrutura($priv);
$hash = d26_hash_senha($senha);
if ($substituir && is_file($arquivoUsuarios)) {
    unlink($arquivoUsuarios);
}
if (d26_contas_criar($priv, $login, $hash, true) !== 'ok') {
    falha('não foi possível criar o usuário');
}
echo "Admin criado: $login (deve trocar a senha no primeiro acesso)\n";
