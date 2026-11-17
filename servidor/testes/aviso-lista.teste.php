<?php
declare(strict_types=1);

/**
 * Fronteira da lista fechada de avisos (SE-F4, revisão que executa). O cookie de aviso só sai e só é lido para os
 * códigos de D26_AVISOS (sessao.php: emissão e leitura). Um código forjado não pode sair no cabeçalho nem chegar à
 * tela. Os casos rodam em processo filho (apoio/avisoFronteira.php), para não carregar sessao.php na suíte.
 * Nome de teste começa com "aviso:" (filtro do rodar.php).
 */

/** @return array<string, mixed> */
function avisoFronteira(string $modo, string $valor): array
{
    $cmd = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/apoio/avisoFronteira.php')
        . ' ' . escapeshellarg(RAIZ_REPO) . ' ' . escapeshellarg($modo) . ' ' . escapeshellarg($valor) . ' 2>&1';
    $saida = [];
    $codigo = 0;
    exec($cmd, $saida, $codigo);
    verdadeiro($codigo === 0, "avisoFronteira saiu com código {$codigo}: " . implode(' ', $saida));
    return json_decode(implode("\n", $saida), true, 512, JSON_THROW_ON_ERROR);
}

teste('aviso: emitir um código fora da lista fechada é recusado, e nenhum cookie de aviso sai', function (): void {
    $r = avisoFronteira('emitir', 'codigo-forjado');
    igual(false, $r['emitiu'] ?? null, 'código fora de D26_AVISOS não é emitido');
    igual('D26Indisponivel', $r['erro'] ?? null, 'a recusa é a da lista fechada');
});

// O cookie de 600 s do código da lista é conferido pelo HTTP (C22b, C22c); na CLI, headers_list() não guarda cabeçalhos.
teste('aviso: emitir um código da lista fechada não é recusado (controle da fronteira)', function (): void {
    $r = avisoFronteira('emitir', 'senha-criada');
    igual(true, $r['emitiu'] ?? null, 'código da lista é emitido');
});

teste('aviso: um cookie de aviso forjado não é lido; um da lista fechada é (controle da leitura)', function (): void {
    $forjado = avisoFronteira('ler', 'codigo-forjado');
    verdadeiro(array_key_exists('codigo', $forjado), 'a resposta traz o campo codigo');
    igual(null, $forjado['codigo'], 'valor fora da lista é ignorado');
    igual(null, avisoFronteira('ler', '')['codigo'], 'valor vazio é ignorado');
    igual('senha-criada', avisoFronteira('ler', 'senha-criada')['codigo'], 'o da lista é lido');
    igual('outro-aparelho', avisoFronteira('ler', 'outro-aparelho')['codigo'], 'o de outro aparelho é lido');
});

teste('aviso: um cookie forjado na entrada não muda a tela (sem texto de aviso)', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $c->cookies[D26_AVISO_NOME] = 'codigo-forjado';
    $r = $c->get('/', PORTAO_NAVEGACAO);
    igual(200, $r->status, 'a entrada responde 200');
    naoContem('codigo-forjado', $r->corpo, 'o valor forjado não aparece na tela');
    naoContem('role="alert"', $r->corpo, 'nenhum aviso aparece com o valor forjado');
});
