<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/**
 * Portão estático da área da Júri (B1 deixou a lacuna: nada impede um endpoint
 * novo de carregar o núcleo sem a área e cair no perfil do Interdisciplinar em
 * silêncio). Todo arquivo de public/api/juri/ precisa, nesta ordem, de
 * define('D26_API', true) e define('D26_AREA', 'juri') ANTES do require de
 * inicio.php. A varredura é por tokens PHP: comentário e espaço não contam.
 */

/** Código PHP sem espaço nem comentário, para comparar trechos com segurança. */
function juriCodigoCompacto(string $arquivo): string
{
    $compacto = '';
    foreach (token_get_all((string) file_get_contents($arquivo)) as $token) {
        if (is_array($token)) {
            if (in_array($token[0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT, T_OPEN_TAG], true)) {
                continue;
            }
            $compacto .= $token[1];
        } else {
            $compacto .= $token;
        }
    }
    return $compacto;
}

/**
 * Nomes dos arquivos de $dir que NÃO carregam a área antes do núcleo, em ordem
 * alfabética. Diretório sem nenhum .php é erro: varredura vazia não é "limpo" (L-36).
 *
 * @return list<string>
 */
function juriPortaoEstatico(string $dir): array
{
    $arquivos = glob($dir . '/*.php') ?: [];
    if ($arquivos === []) {
        falhar("portão estático: nenhum .php em $dir (varredura quebrada, não diretório limpo)");
    }
    sort($arquivos);
    $faltas = [];
    foreach ($arquivos as $arquivo) {
        $codigo = juriCodigoCompacto($arquivo);
        $posApi = strpos($codigo, "define('D26_API',true)");
        $posArea = strpos($codigo, "define('D26_AREA','juri')");
        $posNucleo = strpos($codigo, "require__DIR__.'/../nucleo/inicio.php'");
        $ok = $posNucleo !== false
            && $posApi !== false && $posApi < $posNucleo
            && $posArea !== false && $posArea < $posNucleo;
        if (!$ok) {
            $faltas[] = basename($arquivo);
        }
    }
    return $faltas;
}

teste('juri: portão estático, todo public/api/juri/*.php define D26_API e D26_AREA antes do inicio.php', function (): void {
    igual([], juriPortaoEstatico(RAIZ_REPO . '/public/api/juri'), 'arquivos da Júri fora da regra');
}, false);

teste('juri: o portão reprova, em diretório temporário, arquivo sem a área, sem a API, com a área depois do núcleo ou só em comentário', function (): void {
    $dir = dirTemporario();
    try {
        $ok = "<?php\ndefine('D26_API', true);\ndefine('D26_AREA', 'juri');\nrequire __DIR__ . '/../nucleo/inicio.php';\n";
        file_put_contents($dir . '/bom.php', $ok);
        file_put_contents($dir . '/sem-area.php', "<?php\ndefine('D26_API', true);\nrequire __DIR__ . '/../nucleo/inicio.php';\n");
        file_put_contents($dir . '/sem-api.php', "<?php\ndefine('D26_AREA', 'juri');\nrequire __DIR__ . '/../nucleo/inicio.php';\n");
        file_put_contents($dir . '/area-depois.php', "<?php\ndefine('D26_API', true);\nrequire __DIR__ . '/../nucleo/inicio.php';\ndefine('D26_AREA', 'juri');\n");
        file_put_contents($dir . '/so-comentario.php', "<?php\ndefine('D26_API', true);\n// define('D26_AREA', 'juri');\nrequire __DIR__ . '/../nucleo/inicio.php';\n");
        igual(
            ['area-depois.php', 'sem-api.php', 'sem-area.php', 'so-comentario.php'],
            juriPortaoEstatico($dir),
            'arquivos reprovados'
        );
    } finally {
        apagarArvore($dir);
    }
}, false);

teste('juri: o portão falha com diretório sem nenhum .php (varredura quebrada não passa)', function (): void {
    $dir = dirTemporario();
    try {
        $falhou = false;
        try {
            juriPortaoEstatico($dir);
        } catch (RuntimeException) {
            $falhou = true;
        }
        verdadeiro($falhou, 'diretório vazio tem de reprovar');
    } finally {
        apagarArvore($dir);
    }
}, false);
