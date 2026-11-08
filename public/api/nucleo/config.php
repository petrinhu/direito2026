<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/** Parâmetros do Argon2id (OWASP pede no mínimo m=19 MiB, t=2, p=1; aqui acima disso). */
const D26_ARGON = ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1];

/**
 * Uma conta, uma sessão, um privado (plano do CTO do login único, seção 3). Não há
 * perfil por área: todas as rotas usam os mesmos cookies e o mesmo privado.
 */
const D26_SESSAO_NOME = '__Host-d26';
const D26_PRE_NOME = '__Host-d26pre';
const D26_DISP_NOME = '__Host-d26disp';
const D26_PRIVADO_NOME = 'direito2026_privado';
/** Subpastas do privado único: imagens/ é da Júri, mas o privado é um só. */
const D26_SUBPASTAS = ['sessoes', 'conteudo', 'imagens'];
const D26_SESSAO_OCIOSIDADE = 7200;
const D26_SESSAO_VALIDADE = 43200;
const D26_CORPO_MAX = 8192;

/**
 * Aviso de sessão substituída (SU-B2): quando a conta entra em outro aparelho, a sessão antiga cai
 * e um cookie de vida curta leva o motivo até a tela de entrada. Valor de lista fechada.
 */
const D26_AVISO_NOME = '__Host-d26aviso';
const D26_AVISO_VALIDADE = 600;
const D26_AVISO_OUTRO_APARELHO = 'outro-aparelho';
const D26_AVISOS = [D26_AVISO_OUTRO_APARELHO];

/**
 * Teto de espera por uma trava de arquivo (armazenamento.php). Nunca infinito:
 * lock preso viraria 503 `indisponivel`, não worker pendurado. Os testes de
 * unidade podem definir antes um valor menor.
 */
if (!defined('D26_LOCK_TETO_MS')) {
    define('D26_LOCK_TETO_MS', 2000);
}

/**
 * Diretório privado único (fora do webroot, irmão de public_html). A partir de
 * .../public_html/<site>/api/nucleo sobe 4 níveis até a raiz do domínio. O nome é
 * D26_PRIVADO_NOME. Sem caminho absoluto no código. D26_PRIVADO só vale sob php -S (testes).
 */
function d26_dir_privado(string $dirNucleo, string $sapi, ?string $sobrescrita): string
{
    if ($sapi === 'cli-server' && $sobrescrita !== null && $sobrescrita !== '') {
        return $sobrescrita;
    }
    return dirname($dirNucleo, 4) . '/' . D26_PRIVADO_NOME;
}

function d26_priv(): string
{
    $env = getenv('D26_PRIVADO');
    return d26_dir_privado(__DIR__, PHP_SAPI, $env === false ? null : $env);
}
