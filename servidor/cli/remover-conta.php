<?php
declare(strict_types=1);

/**
 * Remove UMA conta de usuarios.json (rollback e desfazer a criação da conta
 * inicial, na virada do login único).
 *
 * Uso:  php remover-conta.php <dir-privado> <login>
 *
 * Não toca nas outras contas. Recusa login inexistente e recusa remover o último
 * admin ativo: para isso, promova outro admin antes com definir-admin.php. Em
 * recusa, nada é gravado. Quem estava logado com essa conta perde a sessão, e o
 * login dela deixa de entrar. No servidor, aponte o núcleo por
 * D26_NUCLEO=<pasta api/nucleo publicada>.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

require __DIR__ . '/apoio/cli.php';
require __DIR__ . '/apoio/admin.php';

$cmd = 'remover-conta';
d26_cli_protegido($cmd);
d26_cli_carregar_nucleo($cmd, ['config', 'armazenamento', 'contas']);

[$pos] = d26_cli_separar($cmd, array_slice($argv, 1), []);
if (count($pos) !== 2) {
    d26_cli_falha($cmd, 'uso: php remover-conta.php <dir-privado> <login>');
}
$priv = d26_cli_privado($cmd, $pos[0]);
$login = $pos[1];
d26_cli_login($cmd, $login);

$status = d26_admin_cli_remover($priv, $login);
match ($status) {
    'ok' => print("Conta removida: $login.\n"),
    'nao-encontrado' => d26_cli_falha($cmd, 'conta não encontrada; nada foi alterado'),
    default => d26_cli_falha($cmd, 'esta ação deixaria o sistema sem nenhum administrador ativo; promova outro admin com definir-admin.php antes; nada foi alterado'),
};
