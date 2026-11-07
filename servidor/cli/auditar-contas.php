<?php
declare(strict_types=1);

/**
 * Auditoria de contas: só totais e booleanos. Não imprime hash, uid, versão de
 * sessão nem nome de conta (sem --login).
 *
 * Uso:  php auditar-contas.php <dir-privado> [--login=<login>]
 *
 * Sem --login: contas, ativas, admins, admins_ativos e troca_pendente.
 * Com --login: existe_<login>, e para a conta, admin_, ativo_, troca_pendente_,
 * aparelhos_ (quantidade), nunca_logou_ e ultimo_login_ha_segundos_ (tempo desde
 * o último login, em segundos). Login inexistente é resposta de auditoria
 * (existe_<login>=0, sai 0), não erro. Pasta sem usuarios.json sai com erro,
 * para não dizer zero contas.
 * No servidor, aponte o núcleo por D26_NUCLEO=<pasta api/nucleo publicada>.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

require __DIR__ . '/apoio/cli.php';

$cmd = 'auditar-contas';
d26_cli_protegido($cmd);
d26_cli_carregar_nucleo($cmd, ['config', 'armazenamento', 'contas']);

[$pos, $opcoes] = d26_cli_separar($cmd, array_slice($argv, 1), ['login']);
if (count($pos) !== 1) {
    d26_cli_falha($cmd, 'uso: php auditar-contas.php <dir-privado> [--login=<login>]');
}
$priv = d26_cli_privado($cmd, $pos[0]);

$contas = d26_contas_listar($priv);
$ativas = array_filter($contas, static fn (array $c): bool => $c['ativo'] === true);
$admins = array_filter($contas, static fn (array $c): bool => $c['admin'] === true);
$adminsAtivos = array_filter($admins, static fn (array $c): bool => $c['ativo'] === true);
$trocaPendente = array_filter($contas, static fn (array $c): bool => $c['deveTrocarSenha'] === true);

echo 'contas=' . count($contas) . "\n";
echo 'ativas=' . count($ativas) . "\n";
echo 'admins=' . count($admins) . "\n";
echo 'admins_ativos=' . count($adminsAtivos) . "\n";
echo 'troca_pendente=' . count($trocaPendente) . "\n";

if (array_key_exists('login', $opcoes)) {
    $login = $opcoes['login'];
    d26_cli_login($cmd, $login);
    $c = d26_contas_buscar($priv, $login);
    if ($c === null) {
        echo "existe_$login=0\n";
        exit(0);
    }
    echo "existe_$login=1\n";
    echo 'admin_' . $login . '=' . ($c['admin'] ? 1 : 0) . "\n";
    echo 'ativo_' . $login . '=' . ($c['ativo'] ? 1 : 0) . "\n";
    echo 'troca_pendente_' . $login . '=' . ($c['deveTrocarSenha'] ? 1 : 0) . "\n";
    echo 'aparelhos_' . $login . '=' . count($c['aparelhos'] ?? []) . "\n";
    if ($c['ultimoLogin'] === null) {
        echo "nunca_logou_$login=1\n";
    } else {
        $quando = strtotime((string) $c['ultimoLogin']);
        if ($quando === false) {
            d26_cli_falha($cmd, 'data do último login ilegível; auditoria interrompida');
        }
        echo "nunca_logou_$login=0\n";
        echo 'ultimo_login_ha_segundos_' . $login . '=' . max(0, time() - $quando) . "\n";
    }
}
