<?php
declare(strict_types=1);

/**
 * POSTs simultâneos com curl_multi, cada um com o cookie e o token do seu cliente
 * (clientes distintos não compartilham trava de sessão: o paralelismo é real).
 * @param list<Cliente> $clientes
 * @param list<array<string, mixed>> $corpos
 * @return list<array{int, string}> [status HTTP, corpo] na ordem dos corpos
 */
function postarEmParalelo(array $clientes, string $caminho, array $corpos): array
{
    $multi = curl_multi_init();
    $hs = [];
    foreach ($corpos as $i => $corpo) {
        $c = $clientes[$i];
        $cookie = [];
        foreach ($c->cookies as $n => $v) {
            $cookie[] = "$n=$v";
        }
        $h = curl_init($c->origem() . $caminho);
        curl_setopt_array($h, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($corpo, JSON_THROW_ON_ERROR),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Origin: ' . $c->origem(),
                'X-CSRF-Token: ' . (string) $c->csrf,
                'Cookie: ' . implode('; ', $cookie),
                'Connection: close',
            ],
        ]);
        curl_multi_add_handle($multi, $h);
        $hs[$i] = $h;
    }
    do {
        $estado = curl_multi_exec($multi, $ativos);
        if ($ativos > 0) {
            curl_multi_select($multi, 0.2);
        }
    } while ($ativos > 0 && $estado === CURLM_OK);
    $saida = [];
    foreach ($hs as $i => $h) {
        $saida[$i] = [(int) curl_getinfo($h, CURLINFO_RESPONSE_CODE), (string) curl_multi_getcontent($h)];
        curl_multi_remove_handle($multi, $h);
        curl_close($h);
    }
    curl_multi_close($multi);
    return $saida;
}

/** @param list<array{float, float}> $intervalos */
function maxSimultaneos(array $intervalos): int
{
    $eventos = [];
    foreach ($intervalos as [$ini, $fim]) {
        $eventos[] = [$ini, 1];
        $eventos[] = [$fim, -1];
    }
    usort($eventos, static fn (array $x, array $y): int => [$x[0], $x[1]] <=> [$y[0], $y[1]]);
    $agora = 0;
    $maximo = 0;
    foreach ($eventos as [, $delta]) {
        $agora += $delta;
        $maximo = max($maximo, $agora);
    }
    return $maximo;
}

teste('20 logins errados em paralelo (8 workers): a reserva atômica limita quantos rodam password_verify', function (): void {
    $a = Ambiente::novo(['workers' => 8]);
    $clientes = [];
    for ($i = 0; $i < 20; $i++) {
        $clientes[] = $a->clienteComSessao();
    }
    $corpos = array_fill(0, 20, ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'errada-errada']);
    $respostas = postarEmParalelo($clientes, '/api/entrar.php', $corpos);

    $verificacoes = $a->verificacoes();
    $n401 = count(array_filter($respostas, static fn (array $r): bool => $r[0] === 401));
    $n429 = count(array_filter($respostas, static fn (array $r): bool => $r[0] === 429));
    fwrite(STDERR, sprintf("      [paralelo] verify=%d 401=%d 429=%d simultâneos=%d\n", count($verificacoes), $n401, $n429, maxSimultaneos($verificacoes)));

    verdadeiro(count($verificacoes) >= 2, 'ao menos 2 verificações rodaram (senão não há o que medir)');
    verdadeiro(maxSimultaneos($verificacoes) >= 2, 'paralelismo real: ao menos 2 password_verify sobrepostos (workers ativos)');
    verdadeiro(count($verificacoes) <= 6, 'no máximo 5 livres + 1 rodaram password_verify, vieram ' . count($verificacoes));
    igual(20, $n401 + $n429, 'toda resposta é 401 ou 429');
    igual(count($verificacoes), $n401, 'cada 401 corresponde a uma verificação que rodou');
    igual(20 - count($verificacoes), $n429, 'o resto recebeu 429');
}, true);
