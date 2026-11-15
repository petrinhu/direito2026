<?php
declare(strict_types=1);

/**
 * Apoio do teste entrada-sem-titular.teste.php (SB-F6). Imprime, em JSON, o HTML de cada tela
 * pública que telas.php monta, numa árvore dada por argumento. Roda em processo próprio: carregar
 * telas.php dentro da suíte redefine as constantes PORTAO_CSP_* que o teste do portão também define.
 *
 * Uso: php telasPublicas.php <raiz-do-repositório>
 */

$raiz = $argv[1] ?? '';
if ($raiz === '' || !is_file($raiz . '/public/api/nucleo/telas.php')) {
    fwrite(STDERR, "telasPublicas: raiz sem public/api/nucleo/telas.php\n");
    exit(1);
}

define('D26_API', true);
require $raiz . '/public/api/nucleo/config.php';
require $raiz . '/public/api/nucleo/telas.php';

// Os argumentos de cada tela não dependem de token válido: o HTML é o mesmo de qualquer token.
$telas = [
    'entrada anônima' => d26_tela_entrada('tok', '/', null, null),
    'entrada com aviso de outro aparelho' => d26_tela_entrada(
        'tok',
        '/',
        null,
        d26_tela_texto_aviso(D26_AVISO_OUTRO_APARELHO)
    ),
    'entrada com aviso de bloqueio' => d26_tela_entrada(
        'tok',
        '/',
        null,
        d26_tela_texto_aviso(D26_AVISO_BLOQUEADA)
    ),
    'entrada com erro' => d26_tela_entrada('tok', '/', 'Usuário ou senha não conferem.', null),
    'troca de senha' => d26_tela_troca('tok'),
    'troca com erro' => d26_tela_troca('tok', 'A senha atual não confere.'),
    'convite' => d26_tela_convite('usuario-sintetico', 'tok', 'csrf'),
    'convite M1' => d26_tela_mensagem(D26_CONVITE_M1, true),
    'convite M2' => d26_tela_mensagem(D26_CONVITE_M2),
    'convite M3' => d26_tela_mensagem(D26_CONVITE_M3, true),
    'esqueci' => d26_tela_esqueci('tok'),
    'esqueci enviado' => d26_tela_esqueci_enviado(),
    'criada' => d26_tela_criada(),
    'indisponível' => d26_tela_indisponivel(),
    'aviso legal (rodapé da entrada)' => d26_tela_aviso_legal(),
];

echo json_encode($telas, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
