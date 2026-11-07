<?php
declare(strict_types=1);

/**
 * Semeia o privado SINTÉTICO do teste de ponta a ponta do portão (plano do CTO do login único,
 * seção 7.4). Uso: php semear.php <dir-privado>. Grava usuarios.json e tentativas.json com as
 * contas de teste. Nenhuma conta real, nenhuma senha real: os três logins e as senhas são
 * inventados aqui e nunca saem deste arquivo nem dos testes (L-28).
 *
 * O formato segue Ambiente::semearUsuario (servidor/testes/apoio/base.php), que é a referência
 * dos testes PHP. Hash Argon2id com o mesmo custo do núcleo (D26_ARGON).
 */

if (PHP_SAPI !== 'cli' || $argc !== 2) {
    fwrite(STDERR, "uso: php semear.php <dir-privado>\n");
    exit(2);
}

$priv = $argv[1];
if (!is_dir($priv)) {
    fwrite(STDERR, "semear: dir-privado ausente\n");
    exit(2);
}

/** Contas sintéticas. Os textos das senhas são de teste; a troca de senha exige 15 caracteres. */
$contas = [
    ['usuario' => 'admin-sintetico', 'senha' => 'senha-sintetica-admin-1', 'admin' => true, 'deveTrocar' => false],
    ['usuario' => 'comum-sintetico', 'senha' => 'senha-sintetica-comum-1', 'admin' => false, 'deveTrocar' => false],
    ['usuario' => 'troca-sintetica', 'senha' => 'senha-provisoria-1234', 'admin' => false, 'deveTrocar' => true],
];

$usuarios = [];
foreach ($contas as $conta) {
    $usuarios[] = [
        'usuario' => $conta['usuario'],
        'hash' => password_hash($conta['senha'], PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1]),
        'admin' => $conta['admin'],
        'ativo' => true,
        'deveTrocarSenha' => $conta['deveTrocar'],
        'uid' => bin2hex(random_bytes(16)),
        'versaoSessao' => random_int(1 << 20, 1 << 40),
        'criadoEm' => gmdate('c'),
        'ultimoLogin' => null,
    ];
}

foreach (['sessoes', 'conteudo', 'imagens'] as $sub) {
    if (!is_dir($priv . '/' . $sub)) {
        mkdir($priv . '/' . $sub, 0700, true);
    }
}

$arqUsuarios = $priv . '/usuarios.json';
file_put_contents($arqUsuarios, json_encode(['versao' => 1, 'usuarios' => $usuarios], JSON_THROW_ON_ERROR));
chmod($arqUsuarios, 0600);

// Limite de tentativas zerado: como o CLI, tentativas.json existe desde o provisionamento.
$arqTentativas = $priv . '/tentativas.json';
file_put_contents($arqTentativas, '{"u":[],"ip":[],"c":[]}');
chmod($arqTentativas, 0600);

echo "semear: contas=" . count($usuarios) . "\n";
