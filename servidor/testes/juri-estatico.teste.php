<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/**
 * Portão estático da área da Júri, depois da unificação (plano do CTO do login
 * único, seção 3): não existe mais perfil por área. Todo arquivo de public/api/juri/
 * precisa, nesta ordem, de define('D26_API', true) ANTES do require de inicio.php,
 * e nenhum pode definir D26_AREA (o nome saiu do núcleo; defini-lo seria voltar ao
 * perfil antigo). A varredura é por tokens PHP: comentário e espaço não contam.
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
 * Nomes dos arquivos de $dir que NÃO passam no portão, em ordem alfabética.
 * Diretório sem nenhum .php é erro: varredura vazia não é "limpo" (L-36).
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
        $posNucleo = strpos($codigo, "require__DIR__.'/../nucleo/inicio.php'");
        $ok = $posNucleo !== false
            && $posApi !== false && $posApi < $posNucleo
            && strpos($codigo, "define('D26_AREA'") === false;
        if (!$ok) {
            $faltas[] = basename($arquivo);
        }
    }
    return $faltas;
}

teste('juri: portão estático, todo public/api/juri/*.php define D26_API antes do inicio.php e nenhum define D26_AREA', function (): void {
    igual([], juriPortaoEstatico(RAIZ_REPO . '/public/api/juri'), 'arquivos da Júri fora da regra');
}, false);

teste('juri: o portão reprova, em diretório temporário, arquivo sem a API, com a API depois do núcleo ou com D26_AREA de código', function (): void {
    $dir = dirTemporario();
    try {
        file_put_contents($dir . '/bom.php', "<?php\ndefine('D26_API', true);\n// define('D26_AREA', 'juri');\nrequire __DIR__ . '/../nucleo/inicio.php';\n");
        file_put_contents($dir . '/sem-api.php', "<?php\nrequire __DIR__ . '/../nucleo/inicio.php';\n");
        file_put_contents($dir . '/api-depois.php', "<?php\nrequire __DIR__ . '/../nucleo/inicio.php';\ndefine('D26_API', true);\n");
        file_put_contents($dir . '/com-area.php', "<?php\ndefine('D26_API', true);\ndefine('D26_AREA', 'juri');\nrequire __DIR__ . '/../nucleo/inicio.php';\n");
        igual(
            ['api-depois.php', 'com-area.php', 'sem-api.php'],
            juriPortaoEstatico($dir),
            'arquivos reprovados (bom.php passa: comentário com D26_AREA não conta)'
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
