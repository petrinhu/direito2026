<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/** Diretório privado mínimo para o módulo de limite (sem servidor). */
function privadoDeLimite(): string
{
    $priv = dirTemporario() . '/privado';
    mkdir($priv, 0700, true);
    file_put_contents($priv . '/erros.log', '');
    chmod($priv . '/erros.log', 0600);
    return $priv;
}

function limparPrivadoDeLimite(string $priv): void
{
    apagarArvore(dirname($priv));
}

/**
 * Leva a chave de conta de $login a 14 tentativas admitidas de IPs diferentes (respeitando as
 * esperas, que sobem 2, 4, 8, 16 s). Devolve o instante da última; dali a conta espera ~32 s.
 */
function saturarContaEm(string $priv, string $login, int $t): int
{
    $admitidas = 0;
    $ip = 0;
    while ($admitidas < 14) {
        $e = d26_limite_reservar($priv, $login, '203.0.113.' . (++$ip), $t);
        if ($e > 0) {
            $t += $e;
        } else {
            $admitidas++;
        }
    }
    return $t;
}

teste('conta: rajada de IPs diferentes contra o mesmo login leva a 429, com teto curto', function (): void {
    $priv = privadoDeLimite();
    $t = 1_000_000;
    for ($i = 1; $i <= 10; $i++) {
        igual(0, d26_limite_reservar($priv, 'chefe', "203.0.113.$i", $t), "tentativa $i de IP novo passa");
    }
    $espera = d26_limite_reservar($priv, 'chefe', '203.0.113.99', $t);
    verdadeiro($espera >= 1 && $espera <= 60, "11ª tentativa de outro IP espera (veio $espera)");
    // Teto curto: mesmo depois de muitas rodadas a espera nunca passa de 60 s.
    $maior = $espera;
    for ($i = 0; $i < 40; $i++) {
        $t += 61;
        $e = d26_limite_reservar($priv, 'chefe', "198.51.100.$i", $t);
        $maior = max($maior, $e);
    }
    verdadeiro($maior <= 60, "espera da conta nunca passa de 60 s (maior $maior)");
    limparPrivadoDeLimite($priv);
}, false);

teste('conta: depois do teto, login correto de outro IP volta a funcionar (nunca bloqueio definitivo)', function (): void {
    $priv = privadoDeLimite();
    $t = 2_000_000;
    for ($i = 1; $i <= 11; $i++) {
        d26_limite_reservar($priv, 'chefe', "203.0.113.$i", $t);
    }
    verdadeiro(d26_limite_reservar($priv, 'chefe', '192.0.2.50', $t + 1) > 0, 'durante a espera, bloqueado');
    igual(0, d26_limite_reservar($priv, 'chefe', '192.0.2.50', $t + 61), 'passado o teto, o IP novo entra');
    d26_limite_sucesso($priv, 'chefe', '192.0.2.50', $t + 61);
    limparPrivadoDeLimite($priv);
}, false);

teste('conta: sucesso de um IP não zera o contador da conta', function (): void {
    $priv = privadoDeLimite();
    $t = 3_000_000;
    for ($i = 1; $i <= 9; $i++) {
        igual(0, d26_limite_reservar($priv, 'chefe', "203.0.113.$i", $t), "falha $i");
    }
    igual(0, d26_limite_reservar($priv, 'chefe', '192.0.2.7', $t), 'tentativa certa de outro IP');
    d26_limite_sucesso($priv, 'chefe', '192.0.2.7', $t);
    igual(0, d26_limite_reservar($priv, 'chefe', '203.0.113.50', $t), 'a 10ª falha ainda passa (o sucesso devolveu só a própria reserva)');
    verdadeiro(d26_limite_reservar($priv, 'chefe', '203.0.113.51', $t) > 0, 'se o sucesso zerasse a conta, esta passaria');
    limparPrivadoDeLimite($priv);
}, false);

teste('conta: login é exato, case-sensitive (Chefe e chefe têm contadores separados)', function (): void {
    $priv = privadoDeLimite();
    $t = 4_000_000;
    for ($i = 1; $i <= 10; $i++) {
        d26_limite_reservar($priv, 'chefe', "203.0.113.$i", $t);
    }
    verdadeiro(d26_limite_reservar($priv, 'chefe', '203.0.113.200', $t) > 0, 'chefe bloqueado');
    igual(0, d26_limite_reservar($priv, 'Chefe', '203.0.113.200', $t), 'Chefe é outra conta');
    limparPrivadoDeLimite($priv);
}, false);

teste('conta: alerta uma vez em erros.log ao cruzar o limiar, sem senha nem IP', function (): void {
    $priv = privadoDeLimite();
    $t = 5_000_000;
    for ($i = 1; $i <= 14; $i++) {
        d26_limite_reservar($priv, 'chefe', "203.0.113.$i", $t);
    }
    $log = (string) file_get_contents($priv . '/erros.log');
    igual(1, substr_count($log, 'limite-conta'), 'uma linha de alerta: ' . $log);
    contem('chefe', $log);
    naoContem('203.0.113', $log, 'o alerta não grava IP');
    limparPrivadoDeLimite($priv);
}, false);

teste('IPv6: dois endereços do mesmo /64 compartilham a chave; /64 diferente não', function (): void {
    $priv = privadoDeLimite();
    $t = 6_000_000;
    for ($i = 1; $i <= 6; $i++) {
        d26_limite_reservar($priv, 'ana.silva', "2001:db8:1:2::$i", $t);
    }
    verdadeiro(d26_limite_reservar($priv, 'ana.silva', '2001:db8:1:2:ffff:eeee:dddd:1', $t) > 0, 'mesmo /64 herda o bloqueio usuário+IP');
    igual(0, d26_limite_reservar($priv, 'ana.silva', '2001:db8:1:3::1', $t), 'outro /64 não é afetado');
    limparPrivadoDeLimite($priv);
}, false);

teste('IPv6: chave só-IP também agrupa por /64 (30 falhas de logins diferentes)', function (): void {
    $priv = privadoDeLimite();
    $t = 7_000_000;
    for ($i = 1; $i <= 30; $i++) {
        igual(0, d26_limite_reservar($priv, "alvo$i", "2001:db8:9:9:$i::1", $t), "falha $i");
    }
    verdadeiro(d26_limite_reservar($priv, 'outro', '2001:db8:9:9:abcd::1', $t) > 800, '/64 inteiro bloqueado ~15 min');
    limparPrivadoDeLimite($priv);
}, false);

teste('IP agrupado: IPv4 inteiro, IPv6 em /64, IPv4-mapeado como IPv4, lixo preservado', function (): void {
    igual('203.0.113.7', d26_limite_ip_agrupado('203.0.113.7'));
    igual(d26_limite_ip_agrupado('2001:db8:1:2::1'), d26_limite_ip_agrupado('2001:db8:1:2:aaaa:bbbb:cccc:dddd'));
    verdadeiro(d26_limite_ip_agrupado('2001:db8:1:2::1') !== d26_limite_ip_agrupado('2001:db8:1:3::1'), '/64 diferentes');
    verdadeiro(d26_limite_ip_agrupado('::ffff:1.2.3.4') !== d26_limite_ip_agrupado('::ffff:5.6.7.8'), 'IPv4-mapeados distintos não colapsam em um só');
    igual(d26_limite_ip_agrupado('1.2.3.4'), d26_limite_ip_agrupado('::ffff:1.2.3.4'));
    igual('', d26_limite_ip_agrupado(''));
    igual('nao-e-ip', d26_limite_ip_agrupado('nao-e-ip'));
}, false);

teste('reserva atômica: 16 processos disputando a mesma chave deixam passar no máximo 5 (mais 1 por segundo decorrido)', function (): void {
    $priv = privadoDeLimite();
    $inicio = microtime(true);
    $ps = [];
    for ($i = 0; $i < 16; $i++) {
        $ps[] = proc_open(
            [PHP_BINARY, __DIR__ . '/apoio/reservar.php', $priv, 'chefe', '203.0.113.1', '3'],
            [1 => ['pipe', 'w'], 2 => ['file', '/dev/null', 'w']],
            $pipes[$i]
        );
    }
    $passaram = 0;
    foreach ($ps as $i => $p) {
        $passaram += (int) stream_get_contents($pipes[$i][1]);
        proc_close($p);
    }
    $permitidas = 5 + (int) ceil(microtime(true) - $inicio); // cada espera vencida libera mais uma
    verdadeiro($passaram <= $permitidas, "no máximo $permitidas passam, vieram $passaram");
    verdadeiro($passaram >= 1, 'varredura não-vazia: alguma passou');
    limparPrivadoDeLimite($priv);
}, false);

teste('I-1(a): tentativa recusada durante a espera não conta nem renova a espera da conta', function (): void {
    $priv = privadoDeLimite();
    $t = saturarContaEm($priv, 'chefe', 8_000_000);
    $arq = $priv . '/tentativas.json';
    $antes = (string) file_get_contents($arq);
    $espera = d26_limite_reservar($priv, 'chefe', '192.0.2.1', $t + 1);
    verdadeiro($espera > 1, "em espera (veio $espera)");
    for ($i = 0; $i < 50; $i++) {
        verdadeiro(d26_limite_reservar($priv, 'chefe', "198.51.100.$i", $t + 1 + $i % 3) > 0, "rajada $i recusada");
    }
    igual($antes, (string) file_get_contents($arq), 'recusas não gravam nada: nenhum contador sobe');
    igual($espera - 1, d26_limite_reservar($priv, 'chefe', '192.0.2.1', $t + 2), 'a espera só diminui com o tempo, nunca é renovada');
    limparPrivadoDeLimite($priv);
}, false);

teste('I-1(b): dispositivo confiável passa pela chave de conta, mas não pelas de usuário+IP e de IP', function (): void {
    $priv = privadoDeLimite();
    $t = saturarContaEm($priv, 'chefe', 9_000_000);
    verdadeiro(d26_limite_reservar($priv, 'chefe', '192.0.2.9', $t + 1) > 0, 'sem dispositivo: barrado pela conta');
    igual(0, d26_limite_reservar($priv, 'chefe', '192.0.2.9', $t + 1, true), 'com dispositivo confiável: entra');
    // Não vale como passe livre: as falhas dele contam na chave usuário+IP (5 livres).
    for ($i = 0; $i < 4; $i++) {
        igual(0, d26_limite_reservar($priv, 'chefe', '192.0.2.9', $t + 1, true), "falha $i do dispositivo");
    }
    verdadeiro(d26_limite_reservar($priv, 'chefe', '192.0.2.9', $t + 1, true) > 0, 'usuário+IP ainda freia o dispositivo');
    for ($i = 1; $i <= 30; $i++) {
        d26_limite_reservar($priv, "alvo$i", '192.0.2.77', $t, true);
    }
    verdadeiro(d26_limite_reservar($priv, 'chefe', '192.0.2.77', $t, true) > 800, 'a chave de IP ainda freia o dispositivo');
    limparPrivadoDeLimite($priv);
}, false);

teste('I-1: atacante distribuído; sem dispositivo o admin entra depois de uma espera curta (teto 60 s)', function (): void {
    $priv = privadoDeLimite();
    $t = 10_000_000;
    for ($i = 1; $i <= 40; $i++) {
        d26_limite_reservar($priv, 'chefe', "203.0.113.$i", $t + $i); // atacante insistente
    }
    $fim = $t + 40;
    $espera = d26_limite_reservar($priv, 'chefe', '192.0.2.5', $fim);
    verdadeiro($espera >= 1 && $espera <= 60, "espera curta (veio $espera)");
    igual(0, d26_limite_reservar($priv, 'chefe', '192.0.2.5', $fim + $espera), 'passada a espera, o admin entra');
    limparPrivadoDeLimite($priv);
}, false);

teste('C-5: toda gravação de tentativas.json faz a faxina das entradas expiradas (reserva e sucesso)', function (): void {
    $priv = privadoDeLimite();
    $t = 11_000_000;
    d26_limite_reservar($priv, 'velho', '203.0.113.1', $t);
    d26_limite_reservar($priv, 'velho', '203.0.113.1', $t);
    $arq = $priv . '/tentativas.json';
    $conta = static fn (): int => count(json_decode((string) file_get_contents($arq), true, 16, JSON_THROW_ON_ERROR)['c'] ?? []);
    igual(1, $conta(), 'uma conta registrada');
    d26_limite_sucesso($priv, 'outro', '203.0.113.2', $t + 100_000);
    igual(0, $conta(), 'o sucesso também varre: a conta velha (fora da janela) sumiu');
    $d = json_decode((string) file_get_contents($arq), true, 16, JSON_THROW_ON_ERROR);
    igual([], $d['u'], 'usuário+IP de mais de um dia some');
    igual([], $d['ip'], 'IP expirado some');
    limparPrivadoDeLimite($priv);
}, false);
