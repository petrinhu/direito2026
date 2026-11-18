<?php
declare(strict_types=1);

/**
 * Força, no privado SINTÉTICO do teste do portão, o estado de limite ou de bloqueio de uma conta (SE-F3).
 * Uso: php limiteForcado.php <dir-privado> <conta|ip|bloqueada> <login> [<ip>...]
 *  - conta: 20 falhas na conta e 15 no usuário+IP de cada <ip>. As marcas ficam 5 min no futuro, então a espera
 *    (60 s da conta, 900 s do usuário+IP) não vence durante o fluxo do teste;
 *  - ip: 30 falhas no IP de cada <ip> (barra o login de qualquer conta daquele IP por 15 min);
 *  - bloqueada: a conta fica com o bloqueio de uso simultâneo (contas.php, d26_bloqueio_valido).
 * As chaves saem das funções do próprio núcleo (limite.php), nunca de uma cópia delas.
 */

if (PHP_SAPI !== 'cli' || $argc < 4) {
    fwrite(STDERR, "uso: php limiteForcado.php <dir-privado> <conta|ip|bloqueada> <login> [<ip>...]\n");
    exit(2);
}

[, $priv, $modo, $login] = $argv;
$ips = array_slice($argv, 4);

if (!in_array($modo, ['conta', 'ip', 'bloqueada'], true) || !is_dir($priv)) {
    fwrite(STDERR, "limiteForcado: modo ou dir-privado inválido\n");
    exit(2);
}

// O núcleo sai com 404 e exit silencioso quando D26_API não está definida (guarda de acesso direto).
define('D26_API', true);
$raiz = dirname(__DIR__, 3);
foreach (['config.php', 'armazenamento.php', 'limite.php'] as $arquivo) {
    require_once $raiz . '/public/api/nucleo/' . $arquivo;
}
if (!function_exists('d26_limite_chave_conta')) {
    fwrite(STDERR, "limiteForcado: o núcleo não carregou (função de chave ausente)\n");
    exit(1);
}

if ($modo === 'bloqueada') {
    $arqUsuarios = $priv . '/usuarios.json';
    $dados = json_decode((string) file_get_contents($arqUsuarios), true, 512, JSON_THROW_ON_ERROR);
    $achou = false;
    foreach ($dados['usuarios'] as $i => $conta) {
        if (($conta['usuario'] ?? null) === $login) {
            $dados['usuarios'][$i]['bloqueada'] = ['em' => time(), 'motivo' => 'uso-simultaneo'];
            $achou = true;
        }
    }
    if (!$achou) {
        fwrite(STDERR, "limiteForcado: conta ausente no privado\n");
        exit(1);
    }
    file_put_contents($arqUsuarios, json_encode($dados, JSON_THROW_ON_ERROR));
    chmod($arqUsuarios, 0600);
    exit(0);
}

$agora = time() + 300;
$arqTentativas = $priv . '/tentativas.json';
$tentativas = json_decode((string) file_get_contents($arqTentativas), true, 512, JSON_THROW_ON_ERROR);
$tentativas += ['u' => [], 'ip' => [], 'c' => []];

if ($modo === 'conta') {
    $tentativas['c'][d26_limite_chave_conta($login)] = ['f' => array_fill(0, 20, $agora)];
}
foreach ($ips as $ip) {
    $grupo = d26_limite_ip_agrupado($ip);
    if ($modo === 'ip') {
        $tentativas['ip'][d26_limite_chave_ip($grupo)] = ['f' => array_fill(0, 30, $agora)];
    } else {
        $tentativas['u'][d26_limite_chave_usuario($login, $grupo)] = [
            'n' => 15,
            'ult' => $agora,
            'l' => d26_limite_chave_conta($login)
        ];
    }
}

file_put_contents($arqTentativas, json_encode($tentativas, JSON_THROW_ON_ERROR));
chmod($arqTentativas, 0600);
