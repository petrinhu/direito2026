<?php
declare(strict_types=1);

/**
 * Cria a estrutura privada da área restrita e o primeiro admin.
 *
 * Uso:  php criar-admin.php <dir-privado> <login> [--substituir | --adicionar] [--email=<e-mail>]
 *   --email: opcional (EM-B1). Sem ele a conta nasce sem e-mail; o admin preenche no painel.
 * A senha provisória vem do STDIN (uma linha; sem eco quando STDIN é
 * terminal). O admin nasce com deveTrocarSenha=true.
 *   --adicionar:  acrescenta o login às contas existentes. Não apaga ninguém e
 *                 recusa login que já existe, sem gravar nada.
 *   --substituir: recusa se usuarios.json já existe; com a opção, TROCA TODOS
 *                 os usuários por este admin (apaga as contas existentes).
 * Qualquer outra opção é recusada sem ecoar o valor. Senha nunca vai em argumento.
 *
 * No servidor, onde o núcleo não está ao lado deste arquivo, aponte-o por
 * D26_NUCLEO=<pasta api/nucleo publicada>. Nenhum login nem senha mora
 * no repositório. Este arquivo é autocontido de propósito: o runbook copia só ele.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

function falha(string $mensagem): never
{
    fwrite(STDERR, "criar-admin: $mensagem\n");
    exit(1);
}

set_exception_handler(static function (Throwable $e): void {
    fwrite(STDERR, "criar-admin: erro interno ao acessar o arquivo de contas (detalhes omitidos de propósito)\n");
    exit(1);
});

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

$substituir = false;
$adicionar = false;
$emailBruto = null;
$posicionais = [];
foreach (array_slice($argv, 1) as $a) {
    if ($a === '--substituir') {
        $substituir = true;
    } elseif ($a === '--adicionar') {
        $adicionar = true;
    } elseif (str_starts_with($a, '--email=')) {
        $emailBruto = substr($a, strlen('--email='));
    } elseif (str_starts_with($a, '--')) {
        falha('opção desconhecida (o valor informado não foi lido nem mostrado)');
    } else {
        $posicionais[] = $a;
    }
}
if ($substituir && $adicionar) {
    falha('--adicionar e --substituir não podem vir juntos');
}
if (count($posicionais) !== 2) {
    falha('uso: php criar-admin.php <dir-privado> <login> [--substituir | --adicionar] [--email=<e-mail>]');
}
[$priv, $login] = $posicionais;
if (!d26_login_valido($login)) {
    falha('login inválido (3 a 32 caracteres: letras, números, ponto, hífen, sublinhado)');
}
// EM-B1: o e-mail é opcional no CLI (socorro). Quando vem, segue as mesmas regras da API; o valor nunca é ecoado.
$email = null;
if ($emailBruto !== null) {
    $email = d26_email_normalizar($emailBruto);
    if ($email === null) {
        falha('e-mail inválido (o valor informado não foi mostrado)');
    }
}
$arquivoUsuarios = rtrim($priv, '/') . '/usuarios.json';
if (is_file($arquivoUsuarios) && !$substituir && !$adicionar) {
    falha('usuarios.json já existe; use --adicionar para acrescentar um admin sem apagar ninguém, ou --substituir para trocar todos os usuários');
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
if ($adicionar) {
    $r = d26_contas_criar($priv, $login, $hash, true, $email);
    if ($r === 'email-em-uso') {
        falha('este e-mail já está em outra conta; nada foi alterado');
    }
    if ($r !== 'ok') {
        falha("login '$login' já existe; nada foi alterado");
    }
    echo "Admin acrescentado: $login (deve trocar a senha no primeiro acesso). As outras contas não foram tocadas.\n";
    exit(0);
}
if ($substituir && is_file($arquivoUsuarios)) {
    unlink($arquivoUsuarios);
}
if (d26_contas_criar($priv, $login, $hash, true, $email) !== 'ok') {
    falha('não foi possível criar o usuário');
}
echo "Admin criado: $login (deve trocar a senha no primeiro acesso)\n";
