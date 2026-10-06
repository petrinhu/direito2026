<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Preâmbulo de todo endpoint: nada de detalhe de erro para o cliente (o
 * detalhe vai para PRIV/erros.log), arquivos novos sempre privados, módulos.
 */
umask(0077);
ob_start();

foreach (['config', 'armazenamento', 'respostas', 'contas', 'limite', 'dispositivo', 'csrf', 'sessao'] as $modulo) {
    require_once __DIR__ . '/' . $modulo . '.php';
}

set_error_handler(static function (int $nivel, string $mensagem, string $arquivo, int $linha): bool {
    if ((error_reporting() & $nivel) === 0) {
        return false;
    }
    throw new ErrorException($mensagem, 0, $nivel, $arquivo, $linha);
});

set_exception_handler(static function (Throwable $e): void {
    d26_log_erro('excecao', get_class($e) . ': ' . $e->getMessage() . ' em ' . basename($e->getFile()) . ':' . $e->getLine());
    d26_erro(500, 'interno', 'Erro interno. Tente de novo em instantes.');
});

register_shutdown_function(static function (): void {
    $e = error_get_last();
    if ($e !== null && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        d26_log_erro('fatal', $e['message'] . ' em ' . basename($e['file']) . ':' . $e['line']);
        if (!headers_sent()) {
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
            d26_cabecalhos();
            http_response_code(500);
            echo '{"ok":false,"erro":"interno","mensagem":"Erro interno. Tente de novo em instantes."}';
        }
    }
});

d26_cabecalhos();
