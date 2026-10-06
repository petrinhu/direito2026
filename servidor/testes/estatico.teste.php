<?php
declare(strict_types=1);

/** @return list<string> */
function arquivosPhpDoNucleo(): array
{
    return glob(RAIZ_REPO . '/public/api/nucleo/*.php') ?: [];
}

teste('nucleo: há arquivos e todos começam com a guarda D26_API', function (): void {
    $arqs = arquivosPhpDoNucleo();
    verdadeiro(count($arqs) >= 6, 'ao menos 6 arquivos no núcleo (veio ' . count($arqs) . ')');
    foreach ($arqs as $a) {
        contem("defined('D26_API')", (string) file_get_contents($a), basename($a));
    }
}, false);

teste('nucleo: .htaccess nega tudo', function (): void {
    contem('Require all denied', (string) @file_get_contents(RAIZ_REPO . '/public/api/nucleo/.htaccess'));
}, false);

teste('nucleo: executado direto pela linha de comando não produz saída nem executa lógica', function (): void {
    foreach (arquivosPhpDoNucleo() as $a) {
        $p = proc_open([PHP_BINARY, $a], [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        $saida = stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
        proc_close($p);
        igual('', $saida, basename($a));
    }
}, false);

teste('compatibilidade 8.3: nenhum recurso de PHP 8.4+ no código do servidor', function (): void {
    $proibidos = ['array_find(', 'array_find_key(', 'array_any(', 'array_all(', 'array_first(', 'array_last(', 'mb_trim(', 'mb_ltrim(', 'mb_rtrim(', 'mb_ucfirst(', 'mb_lcfirst(', '|>', 'bcdivmod(', 'grapheme_str_split('];
    $arqs = array_merge(
        glob(RAIZ_REPO . '/public/api/*.php') ?: [],
        arquivosPhpDoNucleo(),
        glob(RAIZ_REPO . '/servidor/cli/*.php') ?: [],
        glob(RAIZ_REPO . '/servidor/dev/*.php') ?: [],
        glob(RAIZ_REPO . '/servidor/testes/*.php') ?: [],
        glob(RAIZ_REPO . '/servidor/testes/apoio/*.php') ?: []
    );
    verdadeiro(count($arqs) > 10, 'varredura não-vazia (veio ' . count($arqs) . ')');
    foreach ($arqs as $a) {
        // O próprio teste cita os nomes; ignorar este arquivo.
        if (basename($a) === 'estatico.teste.php') {
            continue;
        }
        $txt = (string) file_get_contents($a);
        foreach ($proibidos as $p) {
            naoContem($p, $txt, basename($a));
        }
    }
}, false);

teste('nenhum login, senha, hash ou termo reservado fixo no código do servidor', function (): void {
    $arqs = array_merge(
        glob(RAIZ_REPO . '/public/api/*.php') ?: [],
        arquivosPhpDoNucleo(),
        glob(RAIZ_REPO . '/servidor/cli/*.php') ?: []
    );
    verdadeiro(count($arqs) >= 8, 'varredura não-vazia');
    foreach ($arqs as $a) {
        $txt = (string) file_get_contents($a);
        igual(0, preg_match('/\$argon2id\$/', $txt), basename($a) . ': hash literal');
        igual(0, preg_match('#/home/[a-z0-9_-]+/#i', $txt), basename($a) . ': caminho absoluto');
    }
}, false);

teste('I-3: public/.htaccess põe os cabeçalhos de segurança em <IfModule mod_headers.c>, CSP só nas páginas', function (): void {
    $t = (string) file_get_contents(RAIZ_REPO . '/public/.htaccess');
    $dentro = preg_match('#<IfModule mod_headers\.c>(.*?)</IfModule>#s', $t, $m) === 1 ? $m[1] : '';
    verdadeiro($dentro !== '', 'bloco mod_headers presente');
    foreach ([
        'Header always set X-Content-Type-Options "nosniff"',
        'Header always set X-Frame-Options "DENY"',
        'Header always set Referrer-Policy "same-origin"',
        'Header always set Strict-Transport-Security "max-age=31536000"',
    ] as $linha) {
        contem($linha, $dentro, 'cabeçalho global');
    }
    naoContem('Header set X-Content-Type-Options ', $dentro, 'sem "Header set" simples: não valeria em resposta de erro');
    naoContem('includeSubDomains', $t, 'HSTS sem includeSubDomains');
    naoContem('preload', $t, 'HSTS sem preload');
    $csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
    contem('Header set Content-Security-Policy "' . $csp . '"', $dentro, 'CSP exata');
    // A CSP das páginas só pode valer para as páginas, nunca para a API (que tem a sua, mais restrita).
    verdadeiro(preg_match('#<FilesMatch "([^"]+)">\s*Header set Content-Security-Policy#', $dentro, $f) === 1, 'CSP dentro de um FilesMatch');
    $re = '#' . str_replace('#', '\#', $f[1]) . '#';
    foreach (['index.html', '404.html', 'sw.js'] as $pagina) {
        verdadeiro(preg_match($re, $pagina) === 1, "$pagina recebe a CSP das páginas");
    }
    foreach (['saude.php', 'entrar.php', 'sessao.php', 'conteudo.php'] as $api) {
        verdadeiro(preg_match($re, $api) !== 1, "$api (API) não recebe a CSP das páginas");
    }
}, false);
