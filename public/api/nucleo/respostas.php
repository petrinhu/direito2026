<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/** Cabeçalhos de toda resposta da API (sucesso ou erro). */
function d26_cabecalhos(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
}

function d26_enviar_json_bruto(int $status, string $json): never
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    d26_cabecalhos();
    http_response_code($status);
    echo $json;
    exit;
}

/** @param array<string, mixed> $dados */
function d26_responder(int $status, array $dados): never
{
    d26_enviar_json_bruto($status, json_encode($dados, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

/** @param array<string, mixed> $extra */
function d26_erro(int $status, string $codigo, string $mensagem, array $extra = []): never
{
    d26_responder($status, ['ok' => false, 'erro' => $codigo, 'mensagem' => $mensagem] + $extra);
}

/** @param list<string> $permitidos */
function d26_metodo(array $permitidos): void
{
    $m = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($m, $permitidos, true)) {
        header('Allow: ' . implode(', ', $permitidos));
        d26_erro(405, 'metodo', 'Método não permitido.');
    }
}

/** Corpo JSON (objeto) com limite de tamanho. @return array<string, mixed> */
function d26_corpo_json(): array
{
    $bruto = file_get_contents('php://input', false, null, 0, D26_CORPO_MAX + 1);
    if ($bruto === false || strlen($bruto) > D26_CORPO_MAX) {
        d26_erro(400, 'corpo', 'Requisição inválida.');
    }
    try {
        $dados = json_decode($bruto, true, 8, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        d26_erro(400, 'corpo', 'Requisição inválida.');
    }
    if (!is_array($dados) || ($dados !== [] && array_is_list($dados))) {
        d26_erro(400, 'corpo', 'Requisição inválida.');
    }
    return $dados;
}

/** Registra no erros.log privado (nunca devolve o detalhe ao cliente). */
function d26_log_erro(string $contexto, string $detalhe): void
{
    d26_log_erro_em(d26_priv(), $contexto, $detalhe);
}

/** Mesmo registro, com o diretório privado explícito (módulos que já o conhecem e testes). */
function d26_log_erro_em(string $priv, string $contexto, string $detalhe): void
{
    $linha = gmdate('c') . ' ' . $contexto . ' ' . str_replace(["\r", "\n"], ' ', $detalhe) . "\n";
    try {
        $arq = $priv . '/erros.log';
        $novo = !file_exists($arq);
        if (@file_put_contents($arq, $linha, FILE_APPEND | LOCK_EX) === false) {
            throw new RuntimeException('log indisponível');
        }
        if ($novo) {
            @chmod($arq, 0600);
        }
    } catch (Throwable) {
        error_log('d26: ' . $linha);
    }
}
