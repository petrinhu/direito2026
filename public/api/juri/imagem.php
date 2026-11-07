<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/../nucleo/inicio.php';

/**
 * Imagem da Júri em claro, só com sessão válida e troca feita (plano do CTO do login
 * único, seção 5.2). Índice do acervo: PRIV/acervo.json = {"indice": [{"id": "<32 hex>",
 * "tipo": "jpeg|png|webp", "bytes": n, "sha256": "..."}]}. Nenhum caminho vem do
 * pedido: o id passa por formato estrito e por índice exato, e o arquivo é
 * PRIV/imagens/<id>, sem extensão. Arquivo ausente é acervo vazio (todo id vira 404).
 * JSON inválido, índice com formato inesperado ou tipo fora da lista é 503: quem não
 * lê o índice não autoriza nada.
 */
const D26_IMAGEM_TIPOS = ['jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];

/**
 * Entrada do índice para $id, ou null. Tipo fora da lista fechada é 503. Entrada sem
 * id igual ao pedido não casa, nunca por aproximação.
 *
 * @return array<string, mixed>|null
 */
function d26_imagem_entrada(string $priv, string $id): ?array
{
    $acervo = d26_ler_json($priv . '/acervo.json', []);
    $indice = $acervo['indice'] ?? [];
    if (!is_array($indice)) {
        throw new D26Indisponivel('índice do acervo com formato inesperado');
    }
    foreach ($indice as $item) {
        if (is_array($item) && ($item['id'] ?? null) === $id) {
            $tipo = $item['tipo'] ?? null;
            if (!is_string($tipo) || !array_key_exists($tipo, D26_IMAGEM_TIPOS)) {
                throw new D26Indisponivel('tipo de imagem fora da lista fechada');
            }
            return $item;
        }
    }
    return null;
}

d26_metodo(['GET']);
$priv = d26_priv();
d26_exigir_conta(d26_sessao_iniciar($priv));

$id = $_GET['id'] ?? null;
// Formato estrito antes de qualquer caminho de arquivo: "/", "." e "\0" não passam.
if (!is_string($id) || preg_match('/^[0-9a-f]{32}$/D', $id) !== 1) {
    d26_erro(404, 'nao-encontrada', 'Imagem não encontrada.');
}
$entrada = d26_imagem_entrada($priv, $id);
if ($entrada === null) {
    d26_erro(404, 'nao-encontrada', 'Imagem não encontrada.');
}

$arquivo = $priv . '/imagens/' . $id;
if (!is_file($arquivo) || !is_readable($arquivo)) {
    throw new D26Indisponivel('imagem indexada sem arquivo em imagens/');
}
d26_enviar_arquivo(200, $arquivo, D26_IMAGEM_TIPOS[(string) $entrada['tipo']]);
