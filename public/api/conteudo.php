<?php
declare(strict_types=1);

define('D26_API', true);
require __DIR__ . '/nucleo/inicio.php';

d26_metodo(['GET']);
$priv = d26_priv();
d26_exigir_conta(d26_sessao_iniciar($priv));

// Arquivo fixo: nenhum parâmetro da requisição escolhe o que é lido.
$bruto = file_get_contents($priv . '/conteudo/interdisciplinar.json');
if ($bruto === false || !json_validate($bruto)) {
    throw new RuntimeException('conteudo/interdisciplinar.json ausente ou inválido');
}
d26_enviar_json_bruto(200, '{"ok":true,"conteudo":' . trim($bruto) . '}');
