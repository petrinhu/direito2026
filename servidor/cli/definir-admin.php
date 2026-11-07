<?php
declare(strict_types=1);

/**
 * Define quem administra a área restrita.
 *
 * Uso:
 *   php definir-admin.php <dir-privado> --unico=<login>
 *       torna <login> o ÚNICO admin; todos os outros viram comuns.
 *   php definir-admin.php <dir-privado> <login> 0|1
 *       liga (1) ou desliga (0) o papel de admin de UM login (rollback).
 *
 * Não toca em senha, uid, versão de sessão nem aparelho, e não derruba sessão:
 * o papel é lido do arquivo a cada pedido. Recusa login inexistente ou inativo,
 * e recusa deixar o sistema sem admin ativo. Em recusa, nada é gravado.
 * No servidor, onde o núcleo não está ao lado deste arquivo, aponte-o por
 * D26_NUCLEO=<pasta api/nucleo publicada>.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

require __DIR__ . '/apoio/cli.php';
require __DIR__ . '/apoio/admin.php';

$cmd = 'definir-admin';
$uso = 'uso: php definir-admin.php <dir-privado> --unico=<login>   ou   <dir-privado> <login> 0|1';
d26_cli_protegido($cmd);
d26_cli_carregar_nucleo($cmd, ['config', 'armazenamento', 'contas']);

[$pos, $opcoes] = d26_cli_separar($cmd, array_slice($argv, 1), ['unico']);

if (array_key_exists('unico', $opcoes)) {
    if (count($pos) !== 1) {
        d26_cli_falha($cmd, $uso);
    }
    $priv = d26_cli_privado($cmd, $pos[0]);
    $login = $opcoes['unico'];
    d26_cli_login($cmd, $login);
    $r = d26_admin_cli_unico($priv, $login);
    if ($r['status'] === 'nao-encontrado') {
        d26_cli_falha($cmd, 'conta não encontrada; nada foi alterado');
    }
    if ($r['status'] === 'inativo') {
        d26_cli_falha($cmd, 'conta inativa; ative-a antes de torná-la admin; nada foi alterado');
    }
    echo "Administrador único: $login. Contas rebaixadas: {$r['rebaixadas']}.\n";
    exit(0);
}

if (count($pos) !== 3 || !in_array($pos[2], ['0', '1'], true)) {
    d26_cli_falha($cmd, $uso);
}
$priv = d26_cli_privado($cmd, $pos[0]);
$login = $pos[1];
d26_cli_login($cmd, $login);
$admin = $pos[2] === '1';
$status = d26_admin_cli_definir($priv, $login, $admin);
match ($status) {
    'ok' => print("Papel de admin de $login: " . ($admin ? '1' : '0') . ".\n"),
    'nao-encontrado' => d26_cli_falha($cmd, 'conta não encontrada; nada foi alterado'),
    'inativo' => d26_cli_falha($cmd, 'conta inativa; nada foi alterado'),
    default => d26_cli_falha($cmd, 'esta ação deixaria o sistema sem nenhum administrador ativo; nada foi alterado'),
};
