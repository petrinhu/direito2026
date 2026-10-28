<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/** Prefixo exato das pastas que a suíte cria em TMPDIR (o mesmo de dirTemporario). */
function temporariosPrefixo(): string
{
    return rtrim(getenv('TMPDIR') ?: '/var/tmp', '/') . '/d26-testes-';
}

teste('temporarios: dirTemporario() cria pasta sob TMPDIR com o prefixo d26-testes- e a registra para limpeza', function (): void {
    $dir = dirTemporario();
    verdadeiro(is_dir($dir), 'a pasta existe depois de criada');
    verdadeiro(str_starts_with($dir, temporariosPrefixo()), 'prefixo exato d26-testes-');
    Registro::limparTemporarios();
    verdadeiro(!is_dir($dir), 'a limpeza do fim do teste apaga a pasta que o helper criou');
}, false);

teste('temporarios: a limpeza só apaga o que dirTemporario() registrou (caminho exato, nunca glob)', function (): void {
    $registrada = dirTemporario();
    // Mesmo prefixo, mas não registrada por dirTemporario(): tem de sobreviver à limpeza.
    $alheia = temporariosPrefixo() . bin2hex(random_bytes(6));
    mkdir($alheia, 0700);
    try {
        Registro::limparTemporarios();
        verdadeiro(!is_dir($registrada), 'a registrada sumiu');
        verdadeiro(is_dir($alheia), 'a não registrada, mesmo prefixo, ficou intacta');
    } finally {
        apagarArvore($alheia);
    }
}, false);

teste('temporarios: a limpeza é idempotente (segunda chamada sem pastas registradas não falha)', function (): void {
    dirTemporario();
    Registro::limparTemporarios();
    Registro::limparTemporarios();
    verdadeiro(true, 'sem exceção');
}, false);
