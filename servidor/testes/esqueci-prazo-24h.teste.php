<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once RAIZ_REPO . '/public/api/nucleo/esqueci.php'; // D26_ESQUECI_VALIDADE (86400 s)

// ---- ESQUECI-24H-TESTE: o link do "Esqueci a senha" vale 24 h (R18, D26_ESQUECI_VALIDADE = 86400) ----
// Tempo injetado: o instante entra como argumento ($agora) em d26_convite_registro, d26_convite_classificar
// e d26_contas_consumir_convite. Nenhum teste espera 24 h nem mexe no relógio do processo.

const ESQUECI_EM_23H59 = 86340; // 23 h 59 min depois do pedido: ainda no prazo
const ESQUECI_EM_24H01 = 86460; // 24 h 01 min depois do pedido: fora do prazo

/** Pasta de contas de teste com um usuarios.json de uma conta "ana" com link de "Esqueci a senha" pendente. */
function esqueciPrivComLink(string $token, int $agora): string
{
    $priv = dirTemporario() . '/privado';
    mkdir($priv, 0700, true);
    file_put_contents($priv . '/erros.log', '');
    chmod($priv . '/erros.log', 0600);
    $conta = [
        'usuario' => 'ana',
        'uid' => 'uid-ana-24h',
        'ativo' => true,
        'admin' => false,
        'email' => 'ana@example.com',
        'hash' => password_hash('senha-antiga-do-teste', PASSWORD_DEFAULT),
        'deveTrocarSenha' => true,
        'versaoSessao' => 1,
        'aparelhos' => [],
        'convite' => d26_convite_registro($token, $agora, D26_ESQUECI_VALIDADE),
    ];
    file_put_contents($priv . '/usuarios.json', json_encode(['usuarios' => [$conta]], JSON_PRETTY_PRINT));
    return $priv;
}

teste('esqueci-24h: o prazo do link é 24 h exatas (86400 s), o mesmo valor que o pedido grava', function (): void {
    $agora = 1_700_000_000;
    $registro = d26_convite_registro(str_repeat('a', 64), $agora, D26_ESQUECI_VALIDADE);
    igual(86400, D26_ESQUECI_VALIDADE, 'a constante do esqueci é 24 h');
    igual($agora + 86400, $registro['expiraEm'], 'o link gravado vence 24 h depois do pedido');
}, false);

teste('esqueci-24h: o link ainda vale com 23 h 59 min depois do pedido', function (): void {
    $agora = 1_700_000_000;
    $token = bin2hex(random_bytes(32));
    $contas = [['usuario' => 'ana', 'convite' => d26_convite_registro($token, $agora, D26_ESQUECI_VALIDADE)]];
    $classe = d26_convite_classificar($contas, $token, $agora + ESQUECI_EM_23H59);
    igual('valido', $classe['estado'], 'a 23 h 59 o link é aceito pela página');
    igual('ana', $classe['conta']['usuario'] ?? null, 'a página acha a conta do link');
}, false);

teste('esqueci-24h: o link é recusado com 24 h 01 min depois do pedido', function (): void {
    $agora = 1_700_000_000;
    $token = bin2hex(random_bytes(32));
    $contas = [['usuario' => 'ana', 'convite' => d26_convite_registro($token, $agora, D26_ESQUECI_VALIDADE)]];
    $classe = d26_convite_classificar($contas, $token, $agora + ESQUECI_EM_24H01);
    igual('vencido', $classe['estado'], 'a 24 h 01 o link vence na página (nunca vira valido)');
}, false);

teste('esqueci-24h: a gravação da senha aceita o link com 23 h 59 min e recusa com 24 h 01 min', function (): void {
    $agora = 1_700_000_000;
    $token = bin2hex(random_bytes(32));
    $hashConvite = hash('sha256', $token);

    $privNoPrazo = esqueciPrivComLink($token, $agora);
    igual(
        'ok',
        d26_contas_consumir_convite($privNoPrazo, 'ana', 'uid-ana-24h', $hashConvite, password_hash('nova-senha-do-teste', PASSWORD_DEFAULT), $agora + ESQUECI_EM_23H59),
        'a 23 h 59 a senha nova é gravada'
    );

    $privVencido = esqueciPrivComLink($token, $agora);
    $antes = hash_file('sha256', $privVencido . '/usuarios.json');
    igual(
        'divergente',
        d26_contas_consumir_convite($privVencido, 'ana', 'uid-ana-24h', $hashConvite, password_hash('nova-senha-do-teste', PASSWORD_DEFAULT), $agora + ESQUECI_EM_24H01),
        'a 24 h 01 a gravação é recusada'
    );
    igual($antes, hash_file('sha256', $privVencido . '/usuarios.json'), 'a recusa a 24 h 01 não grava nada no usuarios.json');
}, false);
