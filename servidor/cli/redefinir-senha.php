<?php
declare(strict_types=1);

/**
 * Redefine a senha de UMA conta existente (socorro de senha esquecida).
 *
 * Uso:  php redefinir-senha.php <dir-privado> <login>
 * A senha provisória vem do STDIN (uma linha; sem eco quando STDIN é
 * terminal), de 1 a 128 caracteres: a troca no próximo acesso é obrigatória.
 * Grava o novo hash Argon2id, marca deveTrocarSenha, incrementa versaoSessao
 * (derruba as sessões abertas) e esvazia os aparelhos confiáveis; depois zera
 * os contadores de tentativa daquele login. Não muda ativo nem admin, não toca
 * nas outras contas, não imprime hash nem senha.
 *
 * No servidor, onde o núcleo não está ao lado deste arquivo, aponte-o por
 * D26_NUCLEO=<pasta api/nucleo publicada>.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

function falha(string $mensagem): never
{
    fwrite(STDERR, "redefinir-senha: $mensagem\n");
    exit(1);
}

$nucleo = getenv('D26_NUCLEO') ?: __DIR__ . '/../../public/api/nucleo';
define('D26_API', true);
foreach (['config', 'armazenamento', 'respostas', 'contas', 'limite'] as $modulo) {
    $arquivo = rtrim($nucleo, '/') . "/$modulo.php";
    if (!is_file($arquivo)) {
        falha('núcleo não encontrado; defina D26_NUCLEO com a pasta api/nucleo');
    }
    require_once $arquivo;
}
umask(0077);

$args = array_slice($argv, 1);
if (count($args) !== 2) {
    falha('uso: php redefinir-senha.php <dir-privado> <login>');
}
[$priv, $login] = $args;
$priv = rtrim($priv, '/');
if (!is_dir($priv) || !is_file(d26_contas_arquivo($priv))) {
    falha('diretório privado ou usuarios.json não encontrado');
}
if (!d26_login_valido($login)) {
    falha('login inválido (3 a 32 caracteres: letras, números, ponto, hífen, sublinhado)');
}
if (d26_contas_buscar($priv, $login) === null) {
    falha('conta não encontrada (o login diferencia maiúsculas de minúsculas)');
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

if (d26_contas_redefinir($priv, $login, d26_hash_senha($senha)) !== 'ok') {
    falha('conta não encontrada (o login diferencia maiúsculas de minúsculas)');
}
try {
    d26_limite_desbloquear_conta($priv, $login);
} catch (Throwable) {
    fwrite(STDERR, "redefinir-senha: aviso: senha redefinida, mas não consegui zerar os contadores (tentativas.json ausente ou ilegível); use desbloquear.php\n");
}
echo "Senha redefinida: $login (deve trocar no próximo acesso)\n";
