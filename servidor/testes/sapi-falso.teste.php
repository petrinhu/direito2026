<?php
declare(strict_types=1);

// Prova a chamada real do término (EM-B3, EM-B4): o SAPI falso entra por auto_prepend_file, só nestes testes (opção prepend do Ambiente).

function sapiFalsoConvite(string $stub): void
{
    emailB3Com([], function (Ambiente $a, array $falso): void {
        $token = emailB3SemearConvite($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
        file_put_contents($a->priv . '/pausa-senha-criada-antes-aviso', '*');
        $req = cvb2PostSemEsperar($c, cvb2Campos($token, $csrf, EMB3_SENHA_NOVA));
        pausaEsperarChegada($req, $a, 'senha-criada-antes-aviso');
        clearstatcache(true, $a->priv . '/sinal-sapi-finish');
        verdadeiro(is_file($a->priv . '/sinal-sapi-finish'), 'com o E4 parado, a função do SAPI não foi chamada');
        igual(0, ordemLinhasSincronas($a), 'com o SAPI presente, nenhuma linha envio-sincrono');
        pausaSoltar($a, 'senha-criada-antes-aviso');
        igual(303, cvb2ConcluirPost($req)->status, 'o 303 termina');
    }, ['prepend' => $stub]);
}

function sapiFalsoEsqueci(string $stub): void
{
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        pausaLigar($a, 'esqueci-antes-pedir', 'ana');
        $req = emb4PostAsync($c, $csrf, 'ana');
        pausaEsperarChegada($req, $a, 'esqueci-antes-pedir');
        clearstatcache(true, $a->priv . '/sinal-sapi-finish');
        verdadeiro(is_file($a->priv . '/sinal-sapi-finish'), 'com a busca parada, a função do SAPI não foi chamada');
        igual(0, ordemLinhasSincronas($a), 'com o SAPI presente, nenhuma linha envio-sincrono');
        pausaSoltar($a, 'esqueci-antes-pedir');
        [$status] = emb4Concluir($req);
        igual(200, $status, 'o pedido termina com 200');
    }, ['prepend' => $stub]);
}

teste('e-mail: SAPI falso litespeed convite', fn () => sapiFalsoConvite(RAIZ_REPO . '/servidor/testes/apoio/sapi-litespeed.php'));
teste('e-mail: SAPI falso litespeed esqueci', fn () => sapiFalsoEsqueci(RAIZ_REPO . '/servidor/testes/apoio/sapi-litespeed.php'));
teste('e-mail: SAPI falso fastcgi convite', fn () => sapiFalsoConvite(RAIZ_REPO . '/servidor/testes/apoio/sapi-fastcgi.php'));
teste('e-mail: SAPI falso fastcgi esqueci', fn () => sapiFalsoEsqueci(RAIZ_REPO . '/servidor/testes/apoio/sapi-fastcgi.php'));
