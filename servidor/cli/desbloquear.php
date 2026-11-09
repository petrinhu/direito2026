<?php
declare(strict_types=1);

/**
 * Desbloqueia UMA conta (socorro do admin trancado; ver docs/publicacao.md), em dois arquivos:
 *  - tentativas.json: remove a chave de conta e as chaves usuário+IP daquele login (limite de tentativas);
 *  - usuarios.json: apaga o bloqueio por uso simultâneo (bloqueada e quedaContadaPara) e zera usoSimultaneo
 *    (BL-B1, paridade com o botão Desbloquear do painel).
 * Não toca nas chaves de IP nem nas outras contas, não troca senha nem versão de sessão, não cria pasta nem
 * arquivo, não imprime IP.
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

// Erro inesperado sai em uma linha: a pilha de chamadas mostra argumentos, e nenhum deles deve sair no terminal.
set_exception_handler(static function (Throwable $e): void {
    fwrite(STDERR, "desbloquear: erro interno ao acessar os arquivos de contas e contadores (detalhes omitidos de propósito)\n");
    exit(1);
});

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

// BL-B1: só a conta alvo. Conta inexistente não grava nada em usuarios.json.
$uso = d26_contas_mutar($priv, $login, static function (array &$c): string {
    unset($c['bloqueada'], $c['quedaContadaPara']);
    $c['usoSimultaneo'] = 0;
    return 'ok';
});
echo $uso === 'ok'
    ? "Bloqueio por uso simultâneo removido para $login.\n"
    : "Conta $login não encontrada em usuarios.json; nada foi alterado ali.\n";
