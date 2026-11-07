<?php
declare(strict_types=1);

/**
 * Concorrência do portão (plano do CTO do login único, F2.4): 30 pedidos de app
 * com a mesma sessão rodam ao mesmo tempo. A prova é determinística: cada pedido
 * para num ponto nomeado depois de ler a sessão (d26_teste_pausar) e espera os
 * outros. Se a leitura segurasse a trava da sessão, só um chegaria ao ponto e o
 * teste falharia. Nada depende de relógio.
 */

teste('paralelo portão: 30 pedidos de app com a mesma sessão, mais de um no ponto de pausa ao mesmo tempo (sem serialização)', function (): void {
    $a = Ambiente::novo(['workers' => 8]);
    mkdir($a->app . '/atual/assets', 0700, true);
    file_put_contents($a->app . '/atual/index.html', '<!doctype html><p>CONTEUDO-SINTETICO-APP</p>');
    file_put_contents($a->app . '/atual/assets/app.js', 'var x = 1;');
    file_put_contents($a->app . '/atual/manifesto.json', json_encode([
        'versao' => 'teste',
        'arquivos' => ['assets/app.js' => ['tipo' => 'text/javascript; charset=utf-8']],
    ], JSON_THROW_ON_ERROR));
    $c = $a->entrar();
    $cookie = [];
    foreach ($c->cookies as $nome => $valor) {
        $cookie[] = "$nome=$valor";
    }

    file_put_contents($a->priv . '/pausa-portao-depois-de-ler', '*');
    $m = curl_multi_init();
    $hs = [];
    for ($i = 0; $i < 30; $i++) {
        $h = curl_init($c->origem() . '/assets/app.js');
        curl_setopt_array($h, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTPHEADER => ['Cookie: ' . implode('; ', $cookie), 'Connection: close'],
        ]);
        curl_multi_add_handle($m, $h);
        $hs[] = $h;
    }

    $arq = $a->priv . '/pausado-portao-depois-de-ler';
    $limite = microtime(true) + 15;
    $chegaram = 0;
    do {
        curl_multi_exec($m, $ativos);
        usleep(20000);
        $chegaram = is_file($arq) ? count(file($arq, FILE_IGNORE_NEW_LINES) ?: []) : 0;
    } while ($chegaram < 2 && microtime(true) < $limite);
    // php -S não garante um número fixo de simultâneos (medido: 7 ou 11 de 8 e 16 workers).
    // O que se prova é mais de um pedido no ponto ao mesmo tempo: com trava de sessão, seria exatamente 1.
    verdadeiro($chegaram >= 2, "pedidos simultâneos no ponto de pausa: $chegaram (serializado daria 1)");

    unlink($a->priv . '/pausa-portao-depois-de-ler');
    do {
        curl_multi_exec($m, $ativos);
        if ($ativos > 0) {
            curl_multi_select($m, 0.2);
        }
    } while ($ativos > 0);
    foreach ($hs as $i => $h) {
        igual(200, (int) curl_getinfo($h, CURLINFO_RESPONSE_CODE), "pedido $i: status");
        curl_multi_remove_handle($m, $h);
        curl_close($h);
    }
    curl_multi_close($m);
});
