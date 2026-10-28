<?php
declare(strict_types=1);

define('D26_API', true);
define('D26_AREA', 'juri');
require __DIR__ . '/../nucleo/inicio.php';
require_once __DIR__ . '/../nucleo/juri.php';

/**
 * Índice do acervo: PRIV/acervo.json = {"kid": "...", "indice": [{"id": "<32 hex>", "tipo": "...", "bytes": n}]}.
 * Arquivo ausente é acervo vazio (todo id vira 404). JSON inválido ou índice
 * com formato inesperado é 503: quem não lê o índice não autoriza nada. Entrada
 * sem id igual ao pedido não casa, nunca por aproximação.
 */
function d26_imagem_indexada(string $priv, string $id): bool
{
    $acervo = d26_ler_json($priv . '/acervo.json', []);
    $indice = $acervo['indice'] ?? [];
    if (!is_array($indice)) {
        throw new D26Indisponivel('índice do acervo com formato inesperado');
    }
    foreach ($indice as $item) {
        if (is_array($item) && ($item['id'] ?? null) === $id) {
            return true;
        }
    }
    return false;
}

d26_metodo(['GET']);
$priv = d26_priv();
// Conta sem salt ou embrulho válido é 503 (R1-C1): nenhum byte sai de conta quebrada.
d26_juri_conta_validar(d26_exigir_conta(d26_sessao_iniciar($priv)));

$id = $_GET['id'] ?? null;
// Formato estrito antes de qualquer caminho de arquivo: "/", "." e "\0" não passam.
if (!is_string($id) || preg_match('/^[0-9a-f]{32}$/D', $id) !== 1 || !d26_imagem_indexada($priv, $id)) {
    d26_erro(404, 'nao-encontrada', 'Imagem não encontrada.');
}

$bytes = @file_get_contents($priv . '/imagens/' . $id . '.juri');
if ($bytes === false) {
    throw new D26Indisponivel('imagem indexada sem arquivo em imagens/');
}
d26_enviar_binario(200, $bytes);
