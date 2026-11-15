<?php
declare(strict_types=1);

/**
 * Nome do titular fora das telas públicas (SB-F6, parte de servidor, plano da onda SB).
 * O nome completo mora só em src/conteudo/sobre/autoria.ts (constante TITULAR), lida em tempo
 * de teste e nunca escrita neste arquivo. Nenhuma tela que o servidor entrega sem sessão pode
 * trazer o nome completo, em forma normalizada (caixa, acento, espaço). Compara o NOME COMPLETO,
 * nunca o primeiro nome: a tela de bloqueio diz "Fale com Petrus" por exceção do líder.
 *
 * As telas saem de apoio/telasPublicas.php, em processo filho (ver o cabeçalho dele).
 */

/** Nome completo lido de src/conteudo/sobre/autoria.ts. A mensagem nunca o imprime. */
function sbf6_titular_do_fonte(): string
{
    $fonte = RAIZ_REPO . '/src/conteudo/sobre/autoria.ts';
    $ts = (string) file_get_contents($fonte);
    verdadeiro(!str_starts_with($ts, "\0GITCRYPT\0"), 'autoria.ts está cifrado: destrave a cópia (git-crypt) antes do teste');
    verdadeiro(preg_match("/export const TITULAR = '([^']*)'/", $ts, $m) === 1, 'TITULAR não achado em autoria.ts');
    return $m[1];
}

/** Forma comparável: entidades decodificadas, caixa baixa, acento de português tirado, espaço colapsado. */
function sbf6_normalizar(string $texto): string
{
    $sem = html_entity_decode($texto, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $sem = strtr(mb_strtolower($sem, 'UTF-8'), [
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a',
        'é' => 'e', 'ê' => 'e', 'è' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ò' => 'o', 'ö' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'ç' => 'c', 'ñ' => 'n',
    ]);
    return trim(preg_replace('/\s+/u', ' ', $sem) ?? '');
}

/** Verdadeiro se o nome completo aparece no HTML (texto ou atributo), depois de normalizar os dois. */
function sbf6_contem_nome(string $html, string $nome): bool
{
    return str_contains(sbf6_normalizar($html), sbf6_normalizar($nome));
}

/** HTML de cada tela pública, gerado por processo filho sobre a árvore do repositório. */
function sbf6_telas_publicas(): array
{
    $cmd = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/apoio/telasPublicas.php')
        . ' ' . escapeshellarg(RAIZ_REPO) . ' 2>&1';
    $saida = [];
    $codigo = 0;
    exec($cmd, $saida, $codigo);
    verdadeiro($codigo === 0, "telasPublicas saiu com código {$codigo}");
    return json_decode(implode("\n", $saida), true, 512, JSON_THROW_ON_ERROR);
}

teste('entrada sem titular: a checagem acha o nome completo em HTML sintético (controle da checagem)', function (): void {
    $nome = sbf6_titular_do_fonte();
    verdadeiro($nome !== '', 'TITULAR vazio em autoria.ts');
    verdadeiro(sbf6_contem_nome("<p>{$nome}</p>", $nome), 'controle: a checagem não achou o nome num HTML que o tem');
    verdadeiro(sbf6_contem_nome('<p>' . mb_strtoupper($nome, 'UTF-8') . '</p>', $nome), 'controle: caixa alta escapou da checagem');
    verdadeiro(!sbf6_contem_nome('<p>Fale com Petrus</p>', $nome), 'controle: o primeiro nome sozinho não deve contar');
});

teste('entrada sem titular: nenhuma tela pública traz o nome completo', function (): void {
    $nome = sbf6_titular_do_fonte();
    $telas = sbf6_telas_publicas();
    verdadeiro(count($telas) >= 14, 'telas públicas a menos do que o esperado: varredura quebrada');
    foreach ($telas as $tela => $html) {
        verdadeiro(!sbf6_contem_nome((string) $html, $nome), "tela pública '{$tela}' traz o titular (nome completo)");
    }
});

teste('entrada sem titular: a entrada anônima, pelo HTTP, não traz o nome completo', function (): void {
    $nome = sbf6_titular_do_fonte();
    $r = Ambiente::novo()->cliente()->get('/', PORTAO_NAVEGACAO);
    igual(200, $r->status, 'tela de entrada anônima');
    verdadeiro(!sbf6_contem_nome($r->corpo, $nome), 'entrada anônima (HTTP) traz o titular (nome completo)');
});
