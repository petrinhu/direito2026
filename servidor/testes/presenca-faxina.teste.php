<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';
require_once __DIR__ . '/apoio/presenca.php';

/**
 * Presença: faxina (13 h, janela de 10 min, marcador, temporário órfão e em curso, arquivo ilegível).
 * Nome de teste começa com "presença:" (filtro do rodar.php).
 */

teste('presença: a faxina do login apaga a presença com mais de 13 h', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    presencaEditarArquivo($a, 'ana', static function (array $d): array {
        $d['a'] = time() - 13 * 3600 - 60;
        return $d;
    });
    // Sessão única: o login novo do admin derruba o $adm anterior, então o painel vem do login novo.
    presencaEnvelhecerFaxina($a, 601); // ADM-F6b: a faxina tem janela de 10 min; o login do ana acabou de passar por ela
    $outro = $a->entrar();
    clearstatcache(); // o arquivo mudou em outro processo (o servidor): sem limpar, is_file lê o cache de stat
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'o login de outra conta faxina a presença velha de ana');
    igual(false, presencaLinha($outro, 'ana')['conectado'] ?? null, 'sem arquivo, sem sessão aberta');
});

teste('presença: a faxina roda numa atividade de outra conta, e só volta a rodar depois de 10 minutos', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $a->semearUsuario('bia', PRESENCA_SENHA_ANA, false, false);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    presencaEscreverVelha($a, 'bia');
    presencaEnvelhecerFaxina($a, 601);
    $ana->get('/api/sessao.php');
    clearstatcache();
    verdadeiro(!is_file(presencaArquivo($a, 'bia')), 'a atividade de ana apagou a presença velha de bia (faxina oportunista)');

    presencaEscreverVelha($a, 'bia');
    $ana->get('/api/sessao.php');
    clearstatcache();
    verdadeiro(is_file(presencaArquivo($a, 'bia')), 'dentro de 10 minutos a faxina não roda de novo: a presença velha segue');
    presencaEnvelhecerFaxina($a, 601);
    $ana->get('/api/sessao.php');
    clearstatcache();
    verdadeiro(!is_file(presencaArquivo($a, 'bia')), 'passados 10 minutos, a próxima atividade faxina de novo');
    igual(200, $adm->get('/api/usuarios.php')->status, 'o painel segue 200');
});

teste('presença: a abertura do painel também faxina a presença velha, com a mesma janela de 10 minutos', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    presencaEscreverVelha($a, 'ana');
    presencaEnvelhecerFaxina($a, 601);
    igual(200, $adm->get('/api/usuarios.php')->status, 'o painel abre');
    clearstatcache();
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'a abertura do painel apagou a presença com mais de 13 h');
});

teste('presença: a faxina apaga o temporário órfão da escrita atômica (mais de 5 min)', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    // Órfão: o processo morreu entre o touch e o rename. Tem a forma <arquivo>.json.<rand>.tmp e 10 min de idade.
    $orfao = $a->priv . '/presenca/' . hash('sha256', 'presenca' . "\0" . 'bia') . '.json.abcdef012345.tmp';
    file_put_contents($orfao, json_encode(['m' => str_repeat('0', 64), 'v' => 1, 'a' => time() - 600, 'c' => time() - 600], JSON_THROW_ON_ERROR));
    chmod($orfao, 0600);
    touch($orfao, time() - 600);
    presencaEnvelhecerFaxina($a, 601);
    $ana->get('/api/sessao.php');
    clearstatcache();
    verdadeiro(!is_file($orfao), 'a faxina varre o temporário órfão de mais de 5 min');
});

teste('presença: a faxina poupa um temporário recente, de escrita em curso', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    $emCurso = $a->priv . '/presenca/' . hash('sha256', 'presenca' . "\0" . 'carla') . '.json.fedcba543210.tmp';
    file_put_contents($emCurso, '{}');
    chmod($emCurso, 0600);
    presencaEnvelhecerFaxina($a, 601);
    $ana->get('/api/sessao.php');
    clearstatcache();
    verdadeiro(is_file($emCurso), 'um temporário de agora pode ser escrita em curso: a faxina não mexe');
});

teste('presença: falha no marcador da faxina não derruba o login, e a faxina roda mesmo assim', function (): void {
    $a = Ambiente::novo();
    presencaAna($a);
    presencaPasta($a);
    presencaEscreverVelha($a, 'bia');
    // Link para pasta que não existe: o touch do marcador falha, sem depender de permissão.
    symlink($a->priv . '/nao-existe/x', $a->priv . '/presenca/.faxina');
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    clearstatcache();
    verdadeiro(!is_file(presencaArquivo($a, 'bia')), 'a faxina rodou mesmo sem o marcador: a presença velha foi apagada');
    $log = (string) @file_get_contents($a->priv . '/erros.log');
    igual(1, substr_count($log, 'faxina da presença falhou'), 'a falha do marcador entra uma vez no erros.log');
});

teste('presença: a faxina termina com arquivo ilegível na pasta, e a listagem responde 200', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    chmod(presencaArquivo($a, 'ana'), 0000);
    clearstatcache();
    if (@file_get_contents(presencaArquivo($a, 'ana')) !== false) {
        falhar('o ambiente lê arquivo 0000 (privilégio): o caso não prova nada');
    }
    // Marcador envelhecido: a abertura do painel roda a faxina, que pega o arquivo ilegível.
    presencaEnvelhecerFaxina($a, 700);
    igual(200, $adm->get('/api/usuarios.php')->status, 'a listagem responde 200 com a faxina e o arquivo ilegível');
    clearstatcache();
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'a faxina apagou o arquivo ilegível');
});

teste('presença: o marcador da faxina sai com 0600 mesmo com umask 022, e volta a 0600 se já existia com 0644', function (): void {
    // O servidor herda a umask deste processo no spawn: 022 reproduz o modo de hospedagem que deixava o marcador em 0644.
    $antiga = umask(0022);
    try {
        $a = Ambiente::novo();
    } finally {
        umask($antiga);
    }
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar(); // o primeiro login cria o marcador
    $marcador = $a->priv . '/presenca/.faxina';
    clearstatcache();
    verdadeiro(is_file($marcador), 'o marcador existe depois do primeiro login');
    igual(0600, fileperms($marcador) & 0777, 'marcador novo sai 600, não 644 (umask 022)');

    chmod($marcador, 0644);
    presencaEnvelhecerFaxina($a, 601);
    igual(200, $adm->get('/api/sessao.php')->status, 'a atividade do admin segue 200');
    clearstatcache();
    igual(0600, fileperms($marcador) & 0777, 'marcador antigo 644 volta a 600 na próxima faxina');
});
