<?php
declare(strict_types=1);

/** Carrega a biblioteca do núcleo para testes unitários (sem servidor). */
if (!defined('D26_API')) {
    define('D26_API', true);
}
// Testes de unidade não esperam 2 s por uma trava presa; o teste HTTP usa o teto real.
if (!defined('D26_LOCK_TETO_MS')) {
    define('D26_LOCK_TETO_MS', 300);
}
// Testes de unidade chamam a validação de senha fora do servidor: a lista vem do repositório (o servidor lê o privado).
if (!defined('D26_SENHAS_COMUNS_CAMINHO')) {
    define('D26_SENHAS_COMUNS_CAMINHO', RAIZ_REPO . '/servidor/dados/senhas-proibidas.txt');
}
foreach (['config', 'armazenamento', 'respostas', 'contas', 'limite', 'dispositivo', 'csrf'] as $modulo) {
    require_once RAIZ_REPO . "/public/api/nucleo/$modulo.php";
}

/**
 * Pasta temporária do teste, sob TMPDIR com o prefixo d26-testes-. Fica registrada
 * em Registro::$temporarios e é apagada ao fim do teste (Ambiente::limparTudo),
 * pelo caminho exato que ela mesma criou.
 */
function dirTemporario(): string
{
    $dir = rtrim(getenv('TMPDIR') ?: '/var/tmp', '/') . '/d26-testes-' . bin2hex(random_bytes(6));
    mkdir($dir, 0700, true);
    Registro::$temporarios[] = $dir;
    return $dir;
}
