<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/** Parâmetros do Argon2id (OWASP pede no mínimo m=19 MiB, t=2, p=1; aqui acima disso). */
const D26_ARGON = ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1];

const D26_SESSAO_NOME = '__Host-d26';
const D26_PRE_NOME = '__Host-d26pre';
const D26_SESSAO_OCIOSIDADE = 7200;
const D26_SESSAO_VALIDADE = 43200;
const D26_CORPO_MAX = 8192;

/**
 * Teto de espera por uma trava de arquivo (armazenamento.php). Nunca infinito:
 * lock preso viraria 503 `indisponivel`, não worker pendurado. Os testes de
 * unidade podem definir antes um valor menor.
 */
if (!defined('D26_LOCK_TETO_MS')) {
    define('D26_LOCK_TETO_MS', 2000);
}

/**
 * Diretório privado (fora do webroot, irmão de public_html). A partir de
 * .../public_html/<site>/api/nucleo sobe 4 níveis até a raiz do domínio.
 * Sem caminho absoluto no código. D26_PRIVADO só vale sob php -S (testes).
 */
function d26_dir_privado(string $dirNucleo, string $sapi, ?string $sobrescrita): string
{
    if ($sapi === 'cli-server' && $sobrescrita !== null && $sobrescrita !== '') {
        return $sobrescrita;
    }
    return dirname($dirNucleo, 4) . '/direito2026_privado';
}

function d26_priv(): string
{
    $env = getenv('D26_PRIVADO');
    return d26_dir_privado(__DIR__, PHP_SAPI, $env === false ? null : $env);
}
