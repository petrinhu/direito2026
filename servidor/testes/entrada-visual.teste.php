<?php
declare(strict_types=1);

/**
 * Tela de entrada com a cara do site (OS-F1, LU-C2). Sem JavaScript: o endereço do CSS leva o
 * hash do arquivo (o cache de 7 dias da borda não segura versão antiga), o cookie de tema só
 * aceita claro ou escuro, a marca é a mesma do site e a CSP libera a fonte do próprio site.
 */

const ENTRADA_COOKIE_TEMA = '__Host-d26tema';

teste('entrada: o link do CSS leva o hash do arquivo, para o navegador não usar a cópia antiga', function (): void {
    $r = Ambiente::novo()->cliente()->get('/', PORTAO_NAVEGACAO);
    igual(200, $r->status, 'tela de entrada anônima');
    $hash = substr(hash_file('sha256', dirname(__DIR__, 2) . '/public/entrada.css'), 0, 12);
    contem('<link rel="stylesheet" href="/entrada.css?v=' . $hash . '">', $r->corpo, 'link com o hash do CSS');
});

teste('entrada: o cookie de tema só aceita claro ou escuro; outro valor não escreve atributo', function (): void {
    foreach (['dark' => 'dark', 'light' => 'light'] as $cookie => $esperado) {
        $c = Ambiente::novo()->cliente();
        $c->cookies[ENTRADA_COOKIE_TEMA] = $cookie;
        $r = $c->get('/', PORTAO_NAVEGACAO);
        contem('<html lang="pt-br" data-theme="' . $esperado . '">', $r->corpo, "cookie $cookie");
    }

    $hostil = Ambiente::novo()->cliente();
    $hostil->cookies[ENTRADA_COOKIE_TEMA] = 'x"><b>';
    $r = $hostil->get('/', PORTAO_NAVEGACAO);
    naoContem('data-theme', $r->corpo, 'valor fora da lista não vira atributo');
    naoContem('<b>', $r->corpo, 'valor fora da lista não entra no HTML');

    $semCookie = Ambiente::novo()->cliente()->get('/', PORTAO_NAVEGACAO);
    contem('<html lang="pt-br">', $semCookie->corpo, 'sem cookie, sem atributo: vale a preferência do sistema');
});

teste('entrada: a marca do topo é a do site (templo do SeloHome) e não traz link para a home', function (): void {
    $r = Ambiente::novo()->cliente()->get('/', PORTAO_NAVEGACAO);
    verdadeiro(preg_match('#<header[^>]*>.*?Caderno de Direito.*?</header>#s', $r->corpo) === 1, 'cabeçalho com o nome do caderno');
    contem('M6 18 L24 7 L42 18 Z', $r->corpo, 'templo igual ao do SeloHome');
    naoContem('página inicial', $r->corpo, 'sem link para a home antes do login');
});

teste('entrada: a CSP libera a fonte do próprio site e continua sem script', function (): void {
    $r = Ambiente::novo()->cliente()->get('/', PORTAO_NAVEGACAO);
    $csp = (string) $r->cabecalho('content-security-policy');
    contem("font-src 'self'", $csp, 'fonte do próprio site');
    naoContem('script-src', $csp, 'nenhuma liberação de script');
    naoContem('<script', $r->corpo, 'nenhum script no HTML');
});

teste('entrada: as duas fontes públicas existem em public/fontes e o CSS as declara pelo nome literal', function (): void {
    $raiz = dirname(__DIR__, 2) . '/public';
    verdadeiro(is_file("$raiz/fontes/inter-400.woff2"), 'Inter 400 em public/fontes');
    verdadeiro(is_file("$raiz/fontes/cormorant-garamond-700.woff2"), 'Cormorant Garamond 700 em public/fontes');
    $css = (string) file_get_contents("$raiz/entrada.css");
    contem("url('/fontes/inter-400.woff2')", $css, 'Inter declarada');
    contem("url('/fontes/cormorant-garamond-700.woff2')", $css, 'Cormorant declarada');
});
