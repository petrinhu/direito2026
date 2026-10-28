<?php
declare(strict_types=1);

/**
 * Unidades do núcleo da Júri (sem servidor): formato do AUTH, salt falso, campos
 * salt/embrulho da conta e a recusa fechada da conta quebrada. O arquivo
 * nucleo/juri.php só é carregado dentro de cada teste: se faltar, o teste
 * reprova com mensagem clara, e o runner não morre.
 */

function juriNucleoCarregar(): void
{
    $arq = RAIZ_REPO . '/public/api/nucleo/juri.php';
    if (!is_file($arq)) {
        falhar('nucleo/juri.php ausente');
    }
    require_once $arq;
}

/** true se $f lançar D26Indisponivel (recusa fechada). @param callable(): mixed $f */
function juriLancaIndisponivel(callable $f): bool
{
    try {
        $f();
    } catch (D26Indisponivel) {
        return true;
    }
    return false;
}

/** Conta mínima válida da Júri, sem salt nem embrulho (quem acrescenta é o teste). @return array<string, mixed> */
function juriContaBase(): array
{
    return [
        'usuario' => 'admin',
        'uid' => str_repeat('0', 32),
        'hash' => '$argon2id$v=19$m=65536,t=4,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        'admin' => true,
        'ativo' => true,
        'deveTrocarSenha' => false,
        'versaoSessao' => 5,
        'criadoEm' => '2026-10-28T00:00:00+00:00',
        'ultimoLogin' => null,
    ];
}

/** Salt e embrulho válidos de tamanho exato (16 B; v 1, iv 12 B, ct 48 B). @return array<string, mixed> */
function juriCamposValidos(): array
{
    return [
        'salt' => base64_encode(str_repeat("\x01", 16)),
        'embrulho' => [
            'v' => 1,
            'iv' => base64_encode(str_repeat("\x02", 12)),
            'ct' => base64_encode(str_repeat("\x03", 48)),
        ],
    ];
}

teste('juri (unidade): d26_conta_validar aceita salt e embrulho opcionais e recusa tipo errado (503 fechado)', function (): void {
    $ok = juriContaBase() + ['salt' => 'x'] + ['embrulho' => ['v' => 1]];
    igual($ok, d26_conta_validar($ok), 'com salt string e embrulho array: aceita');
    igual(juriContaBase(), d26_conta_validar(juriContaBase()), 'sem os campos da Júri: continua aceita (Interdisciplinar)');
    verdadeiro(juriLancaIndisponivel(static fn () => d26_conta_validar(juriContaBase() + ['salt' => 123])), 'salt número recusado');
    verdadeiro(juriLancaIndisponivel(static fn () => d26_conta_validar(juriContaBase() + ['salt' => null])), 'salt nulo recusado');
    verdadeiro(juriLancaIndisponivel(static fn () => d26_conta_validar(juriContaBase() + ['embrulho' => 'x'])), 'embrulho texto recusado');
}, false);

teste('juri (unidade): d26_juri_auth_valido aceita só base64url canônico de 32 bytes', function (): void {
    juriNucleoCarregar();
    verdadeiro(d26_juri_auth_valido(str_repeat('A', 43)), '43 caracteres "A" = 32 bytes zero, canônico');
    verdadeiro(d26_juri_auth_valido(rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=')), 'base64url aleatório de 32 bytes');
    foreach ([
        'curto' => str_repeat('A', 42),
        'longo' => str_repeat('A', 44),
        'padding' => str_repeat('A', 43) . '=',
        'alfabeto padrão' => str_repeat('+', 43),
        'não canônico' => str_repeat('A', 42) . 'B',
        'espaço' => str_repeat('A', 42) . ' ',
        'vazio' => '',
    ] as $nome => $auth) {
        verdadeiro(!d26_juri_auth_valido($auth), "$nome recusado");
    }
    foreach ([123, null, ['A'], true] as $tipo) {
        verdadeiro(!d26_juri_auth_valido($tipo), 'tipo não texto recusado: ' . gettype($tipo));
    }
}, false);

teste('juri (unidade): d26_juri_salt_falso tem 16 B, é estável, depende do login e do segredo da área', function (): void {
    juriNucleoCarregar();
    $dir = dirTemporario();
    $outro = dirTemporario();
    try {
        $ana = d26_juri_salt_falso($dir, 'ana');
        igual(16, strlen($ana), 'tamanho');
        igual($ana, d26_juri_salt_falso($dir, 'ana'), 'estável');
        verdadeiro($ana !== d26_juri_salt_falso($dir, 'bia'), 'login diferente, salt diferente');
        verdadeiro($ana !== d26_juri_salt_falso($outro, 'ana'), 'segredo de outra área, salt diferente');
    } finally {
        apagarArvore($dir);
        apagarArvore($outro);
    }
}, false);

teste('juri (unidade): d26_juri_conta_validar aceita salt de 16 B e embrulho exato, e recusa qualquer desvio (D26Indisponivel)', function (): void {
    juriNucleoCarregar();
    $ok = juriContaBase() + juriCamposValidos();
    igual($ok, d26_juri_conta_validar($ok), 'conta completa e válida');

    // array_replace: o valor da DIREITA vence (com "+" a esquerda venceria e o desvio nunca entraria).
    $desvios = [
        'sem salt' => array_diff_key($ok, ['salt' => true]),
        'salt de 15 B' => array_replace($ok, ['salt' => base64_encode(str_repeat("\x01", 15))]),
        'salt sem padding canônico' => array_replace($ok, ['salt' => rtrim(base64_encode(str_repeat("\x01", 16)), '=')]),
        'sem embrulho' => array_diff_key($ok, ['embrulho' => true]),
        'versão do embrulho 2' => array_replace($ok, ['embrulho' => ['v' => 2] + $ok['embrulho']]),
        'iv de 11 B' => array_replace($ok, ['embrulho' => ['iv' => base64_encode(str_repeat("\x02", 11))] + $ok['embrulho']]),
        'ct de 47 B' => array_replace($ok, ['embrulho' => ['ct' => base64_encode(str_repeat("\x03", 47))] + $ok['embrulho']]),
        'campo extra no embrulho' => array_replace($ok, ['embrulho' => $ok['embrulho'] + ['x' => 1]]),
    ];
    verdadeiro($desvios['salt de 15 B']['salt'] !== $ok['salt'], 'o desvio de fato troca o salt');
    foreach ($desvios as $nome => $conta) {
        verdadeiro(juriLancaIndisponivel(static fn () => d26_juri_conta_validar($conta)), "$nome: recusada com D26Indisponivel");
    }
}, false);
