<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Dispositivo confiável: depois de um login bem-sucedido o navegador recebe o
 * cookie __Host-d26disp = HMAC-SHA256('disp|' + login) com o segredo do
 * diretório privado. Quem o apresenta para AQUELE login não é barrado pela
 * chave de conta do limite de tentativas (limite.php), o que impede um
 * atacante distribuído de trancar o admin legítimo. O cookie não dispensa a
 * senha nem as chaves usuário+IP e IP. Não é segredo de sessão: só afrouxa
 * uma chave de limite. Invariante: o valor é preso ao login e ao segredo.
 */
const D26_DISP_NOME = '__Host-d26disp';
const D26_DISP_VIDA = 180 * 86400;

function d26_dispositivo_token(string $login, string $segredo): string
{
    return hash_hmac('sha256', 'disp|' . $login, $segredo);
}

/** O cookie da requisição é válido para este login? */
function d26_dispositivo_confiavel(string $priv, string $login): bool
{
    $valor = $_COOKIE[D26_DISP_NOME] ?? null;
    if (!is_string($valor) || preg_match('/^[0-9a-f]{64}$/D', $valor) !== 1) {
        return false;
    }
    return hash_equals(d26_dispositivo_token($login, d26_segredo($priv)), $valor);
}

function d26_dispositivo_emitir(string $priv, string $login): void
{
    setcookie(D26_DISP_NOME, d26_dispositivo_token($login, d26_segredo($priv)), [
        'expires' => time() + D26_DISP_VIDA,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}
