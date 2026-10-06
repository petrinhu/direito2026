<?php
declare(strict_types=1);

/**
 * Zera os contadores de limite de tentativas de UMA conta (socorro do admin
 * trancado por um atacante distribuído; ver docs/publicacao.md).
 *
 * Uso:  php desbloquear.php <dir-privado> <login>
 * Remove a chave de conta e as chaves usuário+IP daquele login em
 * tentativas.json. Não toca nas chaves de IP nem nas outras contas, não cria
 * pasta nem arquivo, não imprime IP.
 *
 * No servidor, onde o núcleo não está ao lado deste arquivo, aponte-o por
 * D26_NUCLEO=<pasta api/nucleo publicada>.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

function falha(string $mensagem): never
{
    fwrite(STDERR, "desbloquear: $mensagem\n");
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
    falha('uso: php desbloquear.php <dir-privado> <login>');
}
[$priv, $login] = $args;
$priv = rtrim($priv, '/');
if (!is_dir($priv)) {
    falha('diretório privado não encontrado');
}
if (!d26_login_valido($login)) {
    falha('login inválido (3 a 32 caracteres: letras, números, ponto, hífen, sublinhado)');
}

$n = d26_limite_desbloquear_conta($priv, $login);
echo "Contadores zerados para $login ($n entrada(s) removida(s)).\n";
