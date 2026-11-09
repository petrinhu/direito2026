<?php
declare(strict_types=1);

/**
 * Aviso legal de "site não oficial" no rodapé da tela de entrada (ordem do líder, v1.6.1.1).
 * O texto mora em src/conteudo/avisoLegal.ts e a tela o repete em PHP: o teste de sincronia
 * prova, pelo HTML servido, que os dois são iguais byte a byte (gêmeo da L-17).
 */

teste('entrada aviso: o aviso legal fica no rodapé, depois do formulário, fora do <main>', function (): void {
    $r = Ambiente::novo()->cliente()->get('/', PORTAO_NAVEGACAO);
    igual(200, $r->status, 'tela de entrada anônima');

    contem(
        '<footer class="entrada-rodape"><section class="aviso-legal" role="note" aria-label="Aviso legal">',
        $r->corpo,
        'rodapé com role="note" e aria-label="Aviso legal"'
    );
    contem(
        '<p class="aviso-legal__texto" lang="pt-BR"><strong>Aviso:</strong> este site não é oficial',
        $r->corpo,
        'rótulo "Aviso:" em <strong> antes do corpo'
    );

    $posFormulario = strrpos($r->corpo, '</form>');
    $posRodape = strpos($r->corpo, '<footer class="entrada-rodape">');
    $posMain = strpos($r->corpo, '</main>');
    verdadeiro($posFormulario !== false && $posRodape !== false && $posFormulario < $posRodape, 'aviso depois do formulário');
    verdadeiro($posMain !== false && $posMain < $posRodape, 'aviso depois de </main>, no rodapé da página');
});

teste('entrada aviso: rótulo e corpo na tela são os de src/conteudo/avisoLegal.ts, byte a byte', function (): void {
    $fonte = dirname(__DIR__, 2) . '/src/conteudo/avisoLegal.ts';
    $ts = (string) file_get_contents($fonte);
    verdadeiro(!str_starts_with($ts, "\0GITCRYPT\0"), 'avisoLegal.ts está cifrado: destrave a cópia (git-crypt) antes do teste');

    verdadeiro(preg_match("/rotulo: '([^']*)'/", $ts, $m) === 1, 'rotulo não achado em avisoLegal.ts');
    $rotuloTs = $m[1];
    verdadeiro(preg_match("/corpo:\\s*'([^']*)'/", $ts, $m) === 1, 'corpo não achado em avisoLegal.ts');
    $corpoTs = $m[1];
    verdadeiro(!str_contains($corpoTs . $rotuloTs, '\\'), 'literal com barra invertida: o extrator não cobre escape');

    $r = Ambiente::novo()->cliente()->get('/', PORTAO_NAVEGACAO);
    verdadeiro(
        preg_match('#<p class="aviso-legal__texto"[^>]*><strong>(.*?)</strong> (.*?)</p>#s', $r->corpo, $h) === 1,
        'aviso não achado na tela de entrada'
    );
    $rotuloHtml = html_entity_decode($h[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $corpoHtml = html_entity_decode($h[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');

    igual($rotuloTs, $rotuloHtml, 'rótulo: tela diverge de avisoLegal.ts');
    igual($corpoTs, $corpoHtml, 'corpo: tela diverge de avisoLegal.ts');
});
