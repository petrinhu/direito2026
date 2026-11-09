<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/*
 * Ordem do envio no endpoint (D-1, revisão L-12 de EM-B3 e EM-B4, rev-em-b34.md). Os testes D2 e E30t provam a
 * ordem dentro da função auxiliar; estes provam a fiação no endpoint: enquanto o trabalho que vem depois da
 * resposta está parado numa pausa do próprio endpoint, o cliente já tem a resposta. Sob php -S não há término de
 * resposta (TE4), então a ordem se prova pela pausa, não pelo tempo. Endereços só @example.com.
 */

/**
 * Pumpa um pedido parado até o código de resposta chegar ao cliente. Devolve 0 se não chegou em $segundos: é o
 * que a mutação mostra, o cliente sem resposta enquanto o trabalho está parado. Não fecha o pedido.
 *
 * @param array{resource, \CurlHandle} $req
 */
function ordemStatusParado(array $req, float $segundos = 5.0): int
{
    [$m, $h] = $req;
    $limite = microtime(true) + $segundos;
    while (true) {
        curl_multi_exec($m, $ativos);
        $status = (int) curl_getinfo($h, CURLINFO_RESPONSE_CODE);
        if ($status > 0 || microtime(true) >= $limite) {
            return $status;
        }
        curl_multi_select($m, 0.05);
    }
}

teste('e-mail: D-1 convite: a resposta (303) é escrita antes do aviso E4; com o E4 parado, a marca da resposta já existe e nenhum SMTP foi aberto', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        $token = emailB3SemearConvite($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
        file_put_contents($a->priv . '/pausa-senha-criada-antes-aviso', '*');
        $req = cvb2PostSemEsperar($c, cvb2Campos($token, $csrf, EMB3_SENHA_NOVA));
        pausaEsperarChegada($req, $a, 'senha-criada-antes-aviso');
        // Sob php -S o convite não dá flush: o cliente só recebe o 303 no fim do script. A prova é o sinal que o
        // convite grava quando a resposta está escrita (d26_teste_sinal, no-op em produção), lido com o E4 parado.
        clearstatcache(true, $a->priv . '/sinal-convite-respondeu');
        verdadeiro(is_file($a->priv . '/sinal-convite-respondeu'), 'com o E4 parado, a resposta do convite já estava escrita: o aviso vem depois da resposta');
        igual(false, is_file($falso['conversa']), 'parado no aviso, nenhuma conexão SMTP ainda');
        pausaSoltar($a, 'senha-criada-antes-aviso');
        igual(303, cvb2ConcluirPost($req)->status, 'o 303 termina');
        $m = emailB3Mensagem(correioConversaFinal($falso));
        igual('Sua senha foi criada', $m['assunto'], 'o E4 sai depois de liberado');
    });
});

teste('e-mail: D-1 esqueci: a resposta sai antes da busca e do E2; com a busca parada, o cliente já tem os 200 e nenhum SMTP foi aberto', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        pausaLigar($a, 'esqueci-antes-pedir', 'ana');
        $req = emb4PostAsync($c, $csrf, 'ana');
        pausaEsperarChegada($req, $a, 'esqueci-antes-pedir');
        igual(200, ordemStatusParado($req), 'com a busca parada, o cliente já tem a resposta: a resposta sai antes da busca');
        igual(false, is_file($falso['conversa']), 'parada na busca, nenhuma conexão SMTP ainda');
        pausaSoltar($a, 'esqueci-antes-pedir');
        [$status, $corpo] = emb4Concluir($req);
        igual(200, $status, 'o pedido termina com 200');
        contem(EMB4_FRASE, $corpo, 'a frase única é a resposta');
        igual('Link para criar uma senha nova', emailB3Mensagem(correioConversaFinal($falso))['assunto'], 'o E2 sai depois de liberado');
    });
});
