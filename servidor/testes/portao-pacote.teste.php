<?php
declare(strict_types=1);

/**
 * Portão com o PACOTE REAL (LU-F4.3, plano 7.1.1: "O portão entrega cada arquivo a quem tem sessão,
 * com tipo, CSP e bytes certos, em cópia local (php -S, conta sintética, pacote real)"). Roda dentro
 * do preci, depois do build: o webroot e o app são os que o separador gerou (dist-pacote/), não os
 * de public/ (que tem arquivos gerados e ignorados pelo git, como public/assets/busca-indice.json,
 * que sombrearia o app). Conta sintética, conteúdo sintético: nenhum dado real entra aqui (L-28).
 *
 * Caminho do pacote: D26_PACOTE_APP (a pasta do app) e D26_PACOTE_WEBROOT (o webroot), com padrão
 * em dist-pacote/. Ausente: falha, com a instrução de rodar o build (L-36: nada de verde vazio).
 */

const PACOTE_CSP_SHELL = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'none'; manifest-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

/** Pasta do app do pacote, com manifesto. Ausente é falha com a instrução do build. */
function pacoteApp(): string
{
    $env = getenv('D26_PACOTE_APP');
    $dir = is_string($env) && $env !== '' ? $env : RAIZ_REPO . '/dist-pacote/app';
    if (!is_file($dir . '/manifesto.json')) {
        falhar("pacote do app ausente em $dir: rode 'npm run build' antes (ou defina D26_PACOTE_APP)");
    }
    return $dir;
}

/** Webroot do pacote (api/ e o público sem conteúdo). Ausente é falha com a instrução do build. */
function pacoteWebroot(): string
{
    $env = getenv('D26_PACOTE_WEBROOT');
    $dir = is_string($env) && $env !== '' ? $env : RAIZ_REPO . '/dist-pacote/webroot';
    if (!is_file($dir . '/api/portao.php')) {
        falhar("pacote do webroot ausente em $dir: rode 'npm run build' antes (ou defina D26_PACOTE_WEBROOT)");
    }
    return $dir;
}

/** Tipo de mídia em minúsculas, sem parâmetros (text/html; charset=UTF-8 vira text/html). */
function midia(string $tipo): string
{
    return strtolower(trim(explode(';', $tipo)[0]));
}

/**
 * Entradas do manifesto do pacote, {caminho: {tipo, bytes, md5}}. Piso: zero entrada é falha.
 *
 * @return array<string, array{tipo: string, bytes: int, md5: string}>
 */
function pacoteArquivos(string $dir): array
{
    $m = json_decode((string) file_get_contents($dir . '/manifesto.json'), true, 512, JSON_THROW_ON_ERROR);
    $arquivos = is_array($m) ? ($m['arquivos'] ?? null) : null;
    if (!is_array($arquivos) || $arquivos === []) {
        falhar('manifesto do pacote sem arquivos (zero é varredura quebrada, L-36)');
    }
    return $arquivos;
}

teste('pacote real: com sessão, cada caminho do manifesto sai com md5, tipo e CSP do shell', function (): void {
    $app = pacoteApp();
    $webroot = pacoteWebroot();
    $arquivos = pacoteArquivos($app);
    $a = Ambiente::novo(['docrootDir' => $webroot]);
    copiarArvore($app, $a->app . '/atual');
    $c = $a->entrar();

    $falhas = [];
    $analisados = 0;
    foreach ($arquivos as $caminho => $entrada) {
        $analisados++;
        $r = $c->get('/' . $caminho);
        $md5Servido = md5($r->corpo);
        if ($r->status !== 200) {
            $falhas[] = "$caminho: status {$r->status}, esperado 200";
            continue;
        }
        if ($md5Servido !== $entrada['md5']) {
            $falhas[] = "$caminho: md5 servido $md5Servido, manifesto {$entrada['md5']}";
            continue;
        }
        if (strlen($r->corpo) !== $entrada['bytes']) {
            $falhas[] = "$caminho: {$r->corpo} bytes servidos, manifesto {$entrada['bytes']}";
            continue;
        }
        // O PHP acrescenta ;charset=UTF-8 a text/*: compara o tipo de mídia (antes do ;), que é o que o manifesto declara.
        $tipoServido = midia((string) $r->cabecalho('content-type'));
        if ($tipoServido !== midia($entrada['tipo'])) {
            $falhas[] = "$caminho: tipo '$tipoServido', manifesto '{$entrada['tipo']}'";
            continue;
        }
        if ($r->cabecalho('content-security-policy') !== PACOTE_CSP_SHELL) {
            $falhas[] = "$caminho: CSP diferente do shell";
        }
    }
    // Navegação na raiz cai no index do app, com o mesmo md5 do manifesto (fallback da SPA).
    $raiz = $c->get('/', ['Sec-Fetch-Mode' => 'navigate']);
    if (!isset($arquivos['index.html']) || md5($raiz->corpo) !== $arquivos['index.html']['md5']) {
        $falhas[] = 'navegação em / não entregou o index.html do pacote';
    }
    if ($falhas !== []) {
        falhar('pacote real: ' . count($falhas) . " divergência(s): " . implode(' | ', $falhas));
    }
    igual(count($arquivos), $analisados, 'toda entrada do manifesto foi analisada');
}, true);

teste('pacote real: sem sessão, todo caminho do manifesto dá 401 sem corpo, e a raiz dá a tela de entrada', function (): void {
    $app = pacoteApp();
    $webroot = pacoteWebroot();
    $arquivos = pacoteArquivos($app);
    $a = Ambiente::novo(['docrootDir' => $webroot]);
    copiarArvore($app, $a->app . '/atual');
    $anonimo = $a->cliente();
    $falhas = [];
    foreach (array_keys($arquivos) as $caminho) {
        $r = $anonimo->get('/' . $caminho);
        if ($r->status !== 401 || $r->corpo !== '') {
            $falhas[] = "$caminho: status {$r->status}, corpo de " . strlen($r->corpo) . ' bytes';
        }
    }
    if ($falhas !== []) {
        falhar('anônimo recebeu algo do pacote: ' . implode(' | ', $falhas));
    }
    $entrada = $anonimo->get('/', ['Sec-Fetch-Mode' => 'navigate']);
    igual(200, $entrada->status, 'raiz anônima');
    naoContem('<script', $entrada->corpo, 'tela de entrada sem script');
}, true);
