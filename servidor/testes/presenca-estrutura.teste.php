<?php
declare(strict_types=1);

/**
 * Estrutura da divisão de public/api/nucleo/presenca.php (V17-P1, A7a, decisão D5 do plano 1170): a fachada só
 * carrega os quatro arquivos por assunto, e cada função de presença mora no arquivo do seu assunto. Conta por
 * tokens (token_get_all), não por regex, para não confundir texto de comentário com declaração.
 */

const PRESENCA_ASSUNTOS = [
    'presenca-arquivo.php' => ['d26_presenca_arquivo', 'd26_presenca_marcador', 'd26_presenca_gravar', 'd26_presenca_ler', 'd26_presenca_apagar'],
    'presenca-led.php' => ['d26_presenca_conectada', 'd26_presenca_conectada_conta'],
    'presenca-faxina.php' => ['d26_presenca_faxina_oportunista', 'd26_presenca_faxina'],
    'presenca-aviso.php' => ['d26_presenca_avisar', 'd26_presenca_dia', 'd26_presenca_ja_avisada_hoje', 'd26_presenca_avisar_ausente'],
];

/** Tokens de declaração de função nomeada do arquivo (closures ficam de fora, sem nome). */
function presencaEstruturaNomes(string $arquivo): array
{
    $tokens = token_get_all((string) file_get_contents($arquivo));
    $nomes = [];
    $n = count($tokens);
    for ($i = 0; $i < $n; $i++) {
        if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_FUNCTION) {
            continue;
        }
        $j = $i + 1;
        while ($j < $n && is_array($tokens[$j]) && $tokens[$j][0] === T_WHITESPACE) {
            $j++;
        }
        if ($j < $n && is_array($tokens[$j]) && $tokens[$j][0] === T_STRING) {
            $nomes[] = $tokens[$j][1];
        }
    }
    return $nomes;
}

/** Quantos tokens T_FUNCTION (com ou sem nome) o arquivo tem: a fachada não pode ter nenhum. */
function presencaEstruturaTokensFuncao(string $arquivo): int
{
    $conta = 0;
    foreach (token_get_all((string) file_get_contents($arquivo)) as $t) {
        if (is_array($t) && $t[0] === T_FUNCTION) {
            $conta++;
        }
    }
    return $conta;
}

/** Quantos tokens T_REQUIRE_ONCE o arquivo tem. */
function presencaEstruturaRequires(string $arquivo): int
{
    $conta = 0;
    foreach (token_get_all((string) file_get_contents($arquivo)) as $t) {
        if (is_array($t) && $t[0] === T_REQUIRE_ONCE) {
            $conta++;
        }
    }
    return $conta;
}

teste('presença: estrutura dividida em quatro assuntos', function (): void {
    $pasta = RAIZ_REPO . '/public/api/nucleo';
    $fachada = $pasta . '/presenca.php';

    // Piso (L-36): a lista esperada tem de continuar com as 13 funções de hoje.
    $esperadas = array_merge(...array_values(PRESENCA_ASSUNTOS));
    igual(13, count($esperadas), 'piso: a lista esperada tem as 13 funções de presença');
    igual(13, count(array_unique($esperadas)), 'piso: nenhuma função repetida na lista esperada');

    // Cada arquivo de assunto existe e tem exatamente as funções do seu assunto, sem sobra nem falta.
    $encontradas = [];
    foreach (PRESENCA_ASSUNTOS as $arquivo => $funcoes) {
        $caminho = $pasta . '/' . $arquivo;
        verdadeiro(is_file($caminho), "arquivo de assunto ausente: $arquivo");
        $nomes = presencaEstruturaNomes($caminho);
        sort($nomes);
        $ordem = $funcoes;
        sort($ordem);
        igual($ordem, $nomes, "funções de $arquivo");
        $encontradas = array_merge($encontradas, $nomes);
    }
    igual(13, count($encontradas), 'contagem: cada função em exatamente um arquivo de assunto');

    // A fachada não declara nenhuma função e carrega os quatro arquivos por require_once.
    verdadeiro(is_file($fachada), 'a fachada presenca.php existe');
    igual(0, presencaEstruturaTokensFuncao($fachada), 'presenca.php sem declaração de função');
    igual(4, presencaEstruturaRequires($fachada), 'presenca.php carrega os quatro arquivos com require_once');
});
