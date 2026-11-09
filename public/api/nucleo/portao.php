<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/telas.php';

/**
 * Portão do site inteiro (plano do CTO do login único, seção 1.3). Ordem de decisão:
 * método, caminho, sessão, navegação, troca de senha, manifesto. Cada resposta sai
 * com os cabeçalhos do portão (sobrescrevem os de inicio.php, T18), e nenhum byte do
 * app sai antes da sessão válida e da troca feita.
 */

/** Diretório do app: irmão do privado, em direito2026_app. Sob php -S, D26_APP substitui. */
function d26_dir_app(): string
{
    $env = getenv('D26_APP');
    if (PHP_SAPI === 'cli-server' && is_string($env) && $env !== '') {
        return $env;
    }
    return dirname(__DIR__, 4) . '/direito2026_app';
}

/** Cabeçalhos de toda resposta do portão. Limpa os de inicio.php (JSON, CSP none) antes. */
function d26_portao_cabecalhos(int $status, string $tipo, string $csp, ?int $tamanho = null, string $referrer = 'same-origin'): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    // header_remove() sem nome apaga também os Set-Cookie já emitidos (setcookie usa a mesma
    // lista de cabeçalhos). Sem reaplicá-los, a tela de entrada sairia sem o cookie pré e o
    // login pelo formulário daria 403 (LU-F2.4, LU-F2.5): guarda e devolve os cookies.
    $cookies = array_values(array_filter(
        headers_list(),
        static fn (string $linha): bool => stripos($linha, 'set-cookie:') === 0
    ));
    header_remove();
    foreach ($cookies as $cookie) {
        header($cookie, false);
    }
    http_response_code($status);
    header('Content-Type: ' . $tipo);
    header('Cache-Control: private, no-store');
    header('Cross-Origin-Resource-Policy: same-origin');
    header('Content-Security-Policy: ' . $csp);
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: ' . $referrer);
    header('Strict-Transport-Security: max-age=31536000');
    if ($tamanho !== null) {
        header('Content-Length: ' . $tamanho);
    }
}

/** Resposta sem corpo (401, 403, 404, 405, 400). */
function d26_portao_vazio(int $status, array $cabecalhos = []): never
{
    d26_portao_cabecalhos($status, 'text/plain; charset=utf-8', d26_tela_csp(), 0);
    foreach ($cabecalhos as $nome => $valor) {
        header($nome . ': ' . $valor);
    }
    exit;
}

/** Tela HTML do portão (entrada, troca ou indisponível), sem JavaScript. */
function d26_portao_tela(int $status, string $html, string $csp, string $referrer = 'same-origin'): never
{
    d26_portao_cabecalhos($status, 'text/html; charset=utf-8', $csp, strlen($html), $referrer);
    echo $html;
    exit;
}

/**
 * Arquivo do app, com o tipo que o manifesto declara. Só sai o que, depois de resolver symlink,
 * continua dentro da pasta do app ($raizApp, a versão atual): link para fora dela é 503 sem corpo
 * (LU-F2.4, revisão F5.2, I-1). Ausente, ilegível ou fora do app é 503.
 */
function d26_portao_arquivo(string $arquivo, string $tipo, string $raizApp): never
{
    $real = is_file($arquivo) ? realpath($arquivo) : false;
    $base = realpath($raizApp);
    if ($real === false || $base === false || !str_starts_with($real, $base . DIRECTORY_SEPARATOR)) {
        throw new D26Indisponivel('arquivo do manifesto ausente ou fora do diretório do app');
    }
    $tamanho = is_readable($real) ? filesize($real) : false;
    if ($tamanho === false) {
        throw new D26Indisponivel('arquivo do manifesto ilegível no app');
    }
    d26_portao_cabecalhos(200, $tipo, PORTAO_CSP_SHELL, $tamanho);
    readfile($real);
    exit;
}

/** 503 fechado: página mínima em navegação, vazio fora dela. Nunca conteúdo parcial. */
function d26_portao_indisponivel(bool $navegacao): never
{
    if ($navegacao) {
        d26_portao_tela(503, d26_tela_indisponivel(), PORTAO_CSP_TELA);
    }
    d26_portao_vazio(503);
}

/** Navegação de página (Sec-Fetch-Mode: navigate, ou Accept text/html em navegador sem o cabeçalho). */
function d26_portao_navegacao(): bool
{
    $modo = $_SERVER['HTTP_SEC_FETCH_MODE'] ?? null;
    if (is_string($modo)) {
        return $modo === 'navigate';
    }
    return str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'text/html');
}

/**
 * Manifesto do app, validado por inteiro. Qualquer desvio é D26Indisponivel: chave com
 * '..', barra inicial, NUL ou vazia; entrada sem tipo textual. Manifesto ilegível
 * também. Nada parcial sai.
 *
 * @return array<string, array{tipo: string}>
 */
function d26_portao_manifesto(string $atual): array
{
    $arq = $atual . '/manifesto.json';
    if (!is_file($arq)) {
        throw new D26Indisponivel('manifesto do app ausente');
    }
    $dados = d26_ler_json($arq, []);
    $arquivos = $dados['arquivos'] ?? null;
    if (!is_array($arquivos) || $arquivos === []) {
        throw new D26Indisponivel('manifesto sem arquivos');
    }
    foreach ($arquivos as $chave => $entrada) {
        $ruim = !is_string($chave) || $chave === '' || str_contains($chave, '..')
            || str_contains($chave, "\0") || str_starts_with($chave, '/')
            || !is_array($entrada) || !is_string($entrada['tipo'] ?? null) || $entrada['tipo'] === '';
        if ($ruim) {
            throw new D26Indisponivel('manifesto com entrada inválida');
        }
    }
    return $arquivos;
}

/**
 * Texto do aviso da tela de entrada: o da queda desta leitura (navegação que detecta, sem cookie)
 * ou o do cookie do pedido, se estiver na lista fechada (SU-B2). Sem nenhum dos dois, null.
 */
function d26_aviso_da_tela(bool $substituida): ?string
{
    $codigo = $substituida ? D26_AVISO_OUTRO_APARELHO : d26_aviso_pedido();
    return $codigo === null ? null : d26_tela_texto_aviso($codigo);
}

/** Decisão completa do portão. Sempre termina com uma resposta (exit). */
function d26_portao_decidir(): never
{
    $metodo = (string) ($_SERVER['REQUEST_METHOD'] ?? '');
    if ($metodo !== 'GET' && $metodo !== 'HEAD') {
        d26_portao_vazio(405, ['Allow' => 'GET, HEAD']);
    }

    $caminho = rawurldecode((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH));
    if (str_contains($caminho, "\0") || str_contains($caminho, '..')) {
        d26_portao_vazio(400);
    }

    $navegacao = d26_portao_navegacao();
    $priv = d26_priv();
    $substituida = false;
    $conta = d26_sessao_ler($priv, $substituida);
    d26_teste_pausar('portao-depois-de-ler');

    if ($conta === null) {
        if ($navegacao) {
            $nonce = d26_pre_nonce();
            if ($nonce === '') {
                $nonce = d26_pre_emitir();
            }
            $aviso = d26_aviso_da_tela($substituida);
            d26_aviso_consumir();
            d26_portao_tela(200, d26_tela_entrada(d26_csrf_pre_token($nonce, d26_segredo($priv)), $caminho, null, $aviso), PORTAO_CSP_TELA);
        }
        // Pedido que não é navegação não mostra tela: a queda por outro aparelho leva o cookie para a próxima navegação (SU-B2).
        if ($substituida) {
            d26_aviso_emitir();
        }
        d26_portao_vazio(401);
    }

    if ($conta['deveTrocarSenha'] !== false) {
        if ($navegacao) {
            d26_portao_tela(200, d26_tela_troca(d26_csrf_pre_atual($priv)), PORTAO_CSP_TELA);
        }
        d26_portao_vazio(403);
    }

    $atual = d26_dir_app() . '/atual';
    $manifesto = d26_portao_manifesto($atual);
    $chave = ltrim($caminho, '/');
    if ($chave !== '' && isset($manifesto[$chave])) {
        d26_portao_arquivo($atual . '/' . $chave, $manifesto[$chave]['tipo'], $atual);
    }
    if ($navegacao && isset($manifesto['index.html'])) {
        d26_portao_arquivo($atual . '/index.html', $manifesto['index.html']['tipo'], $atual);
    }
    d26_portao_vazio(404);
}

/** Ponto de entrada do portão: qualquer falha inesperada vira 503 fechado, com registro. */
function d26_portao_executar(): never
{
    try {
        d26_portao_decidir();
    } catch (Throwable $e) {
        d26_log_erro('portao', get_class($e) . ': ' . $e->getMessage() . ' em ' . basename($e->getFile()) . ':' . $e->getLine());
        d26_portao_indisponivel(d26_portao_navegacao());
    }
}
