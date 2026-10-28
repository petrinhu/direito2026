<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/** Parâmetros do Argon2id (OWASP pede no mínimo m=19 MiB, t=2, p=1; aqui acima disso). */
const D26_ARGON = ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1];

/**
 * Perfil da área. O endpoint escolhe a área com define('D26_AREA', 'juri') ANTES
 * de require nucleo/inicio.php. Sem D26_AREA a área é o Interdisciplinar, com os
 * valores de sempre, byte a byte. Valor desconhecido é erro: nunca cai no padrão
 * em silêncio (fail-closed, L-02). Só 'juri' é valor válido além da ausência.
 *
 * @return array{sessao: string, pre: string, disp: string, privNome: string, subpastas: list<string>}
 */
function d26_perfil_area(?string $area): array
{
    return match ($area) {
        null => [
            'sessao' => '__Host-d26',
            'pre' => '__Host-d26pre',
            'disp' => '__Host-d26disp',
            'privNome' => 'direito2026_privado',
            'subpastas' => ['sessoes', 'conteudo'],
        ],
        'juri' => [
            'sessao' => '__Host-juri',
            'pre' => '__Host-juripre',
            'disp' => '__Host-juridisp',
            'privNome' => 'juri2026_privado',
            'subpastas' => ['sessoes', 'conteudo', 'imagens'],
        ],
        default => throw new InvalidArgumentException('área desconhecida em D26_AREA: ' . $area),
    };
}

if (!defined('D26_AREA_PERFIL')) {
    define('D26_AREA_PERFIL', d26_perfil_area(defined('D26_AREA') ? D26_AREA : null));
}
if (!defined('D26_SESSAO_NOME')) {
    define('D26_SESSAO_NOME', D26_AREA_PERFIL['sessao']);
}
if (!defined('D26_PRE_NOME')) {
    define('D26_PRE_NOME', D26_AREA_PERFIL['pre']);
}
if (!defined('D26_DISP_NOME')) {
    define('D26_DISP_NOME', D26_AREA_PERFIL['disp']);
}
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
 * Diretório privado da área (fora do webroot, irmão de public_html). A partir de
 * .../public_html/<site>/api/nucleo sobe 4 níveis até a raiz do domínio. O nome
 * vem do perfil da área (direito2026_privado no Interdisciplinar, juri2026_privado
 * na Júri). Sem caminho absoluto no código. D26_PRIVADO só vale sob php -S (testes).
 */
function d26_dir_privado(string $dirNucleo, string $sapi, ?string $sobrescrita): string
{
    if ($sapi === 'cli-server' && $sobrescrita !== null && $sobrescrita !== '') {
        return $sobrescrita;
    }
    return dirname($dirNucleo, 4) . '/' . D26_AREA_PERFIL['privNome'];
}

function d26_priv(): string
{
    $env = getenv('D26_PRIVADO');
    return d26_dir_privado(__DIR__, PHP_SAPI, $env === false ? null : $env);
}
