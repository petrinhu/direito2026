<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';
require_once __DIR__ . '/apoio/presenca.php';

/**
 * Presença: escrita atômica (temporário 600, nenhum .tmp sobra, presença antiga inteira durante a troca).
 * Nome de teste começa com "presença:" (filtro do rodar.php).
 */

teste('presença: escrita atômica: nenhum arquivo temporário sobra na pasta, e a presença final é 600', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    $ana->get('/api/sessao.php');
    clearstatcache();
    igual([], glob($a->priv . '/presenca/*.tmp') ?: [], 'nenhum .tmp sobra');
    igual(0600, fileperms(presencaArquivo($a, 'ana')) & 0777, 'a presença final sai com 600');
});

teste('presença: escrita atômica: durante a troca, a presença antiga segue inteira e o temporário já é 600', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    $p1 = (string) file_get_contents(presencaArquivo($a, 'ana'));
    $m1 = presencaLerArquivo($a, 'ana')['m'];
    // Segunda aba: o login para no ponto entre o temporário pronto e o rename (login.php:97 sem lock).
    pausaLigar($a, 'presenca-antes-rename', 'ana');
    $segunda = $a->clienteComSessao();
    $req = suLoginSemEsperar($segunda, 'ana', PRESENCA_SENHA_ANA);
    pausaEsperarChegada($req, $a, 'presenca-antes-rename');
    clearstatcache();
    igual($p1, (string) file_get_contents(presencaArquivo($a, 'ana')), 'durante a troca, a presença antiga segue inteira');
    $tmps = glob($a->priv . '/presenca/*.tmp') ?: [];
    igual(1, count($tmps), 'um temporário na pasta: o da troca em curso');
    igual(0600, fileperms($tmps[0]) & 0777, 'o temporário já nasce com 600');
    $novo = json_decode((string) file_get_contents($tmps[0]), true);
    verdadeiro(is_array($novo) && is_string($novo['m'] ?? null) && $novo['m'] !== $m1, 'o temporário traz a presença nova, com outro marcador');
    pausaSoltar($a, 'presenca-antes-rename');
    [$status] = suConcluirLogin($req);
    igual(200, $status, 'a segunda aba conclui o login');
    clearstatcache();
    igual([], glob($a->priv . '/presenca/*.tmp') ?: [], 'nenhum temporário sobra depois da troca');
    verdadeiro(presencaLerArquivo($a, 'ana')['m'] !== $m1, 'a presença agora é a nova');
});

teste('presença: a presença final é 600 mesmo com umask 0022 no processo', function (): void {
    require_once __DIR__ . '/apoio/nucleo.php';
    require_once RAIZ_REPO . '/public/api/nucleo/presenca.php';
    $priv = dirTemporario();
    mkdir($priv . '/presenca', 0700);
    // O pedido real tem umask 0077 (inicio.php:13); aqui o processo põe 0022, que deixaria o temporário em 644.
    $velho = umask(0022);
    try {
        d26_presenca_gravar($priv, 'ana', str_repeat('a', 64), 1, time(), time());
    } finally {
        umask($velho);
    }
    $arq = d26_presenca_arquivo($priv, 'ana');
    igual(0600, fileperms($arq) & 0777, 'modo da presença final sem o umask do pedido');
    igual(0, count(glob($priv . '/presenca/*.tmp') ?: []), 'nenhum temporário sobra');
}, false);
