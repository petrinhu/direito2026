<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';
require_once __DIR__ . '/apoio/presenca.php';

/**
 * Presença: gravação no login (60 s entre gravações, forma do arquivo, pasta ausente, falha que não derruba o login).
 * Nome de teste começa com "presença:" (filtro do rodar.php).
 */

teste('presença: duas chamadas de API em menos de 60 s gravam o arquivo uma vez só (a atividade não muda)', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    $depois = presencaLerArquivo($a, 'ana')['a'];
    $ana->get('/api/sessao.php');
    $ana->get('/api/sessao.php');
    igual($depois, presencaLerArquivo($a, 'ana')['a'], 'as chamadas dentro de 60 s não regravam a atividade');
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'segue conectada');
});

teste('presença: o arquivo tem só m, v, a e c, sem IP e sem id de sessão, e os modos são 700 (pasta) e 600 (arquivo)', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    $arq = presencaArquivo($a, 'ana');
    $dados = presencaLerArquivo($a, 'ana');
    $chaves = array_keys($dados);
    sort($chaves);
    igual(['a', 'c', 'm', 'v'], $chaves, 'só as quatro chaves');
    verdadeiro(preg_match('/^[0-9a-f]{64}$/', (string) $dados['m']) === 1, 'm é um hash, não o marcador');
    naoContem('127.0.0.1', (string) file_get_contents($arq), 'nenhum IP no arquivo');
    $sessao = $ana->cookies[D26_SESSAO_NOME] ?? '';
    verdadeiro($sessao === '' || !str_contains((string) file_get_contents($arq), (string) $sessao), 'nenhum id de sessão no arquivo');
    igual(0700, fileperms($a->priv . '/presenca') & 0777, 'pasta 700');
    igual(0600, fileperms($arq) & 0777, 'arquivo 600');
});

teste('presença: pasta presenca/ ausente dá conectado false e o portão segue 200, com no máximo uma linha no erros.log', function (): void {
    $a = Ambiente::novo();
    presencaAna($a);
    $adm = $a->entrar();
    rmdir($a->priv . '/presenca');
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(200, $ana->get('/api/sessao.php')->status, 'o portão responde 200 sem a pasta');
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'sem a pasta, sem leitura: conectada false');
    $ana->get('/api/sessao.php');
    $adm->get('/api/usuarios.php');
    $linhas = array_filter(
        explode("\n", (string) @file_get_contents($a->priv . '/erros.log')),
        static fn (string $l): bool => str_contains($l, 'presenca')
    );
    verdadeiro(count($linhas) <= 1, 'no máximo uma linha de presença no erros.log por processo (era ' . count($linhas) . ')');
    verdadeiro(!is_dir($a->priv . '/presenca'), 'o web não criou a pasta');
});

teste('presença: uma atividade dentro de 60 s não regrava a presença (o limite de gravação vale de verdade)', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    // Atividade de 30 s atrás: se o servidor regravar, a atividade vira "agora" e o caso pega. Não depende do mesmo segundo.
    $sentinela = time() - 30;
    presencaEditarArquivo($a, 'ana', static fn (array $d): array => ['m' => $d['m'], 'v' => $d['v'], 'a' => $sentinela, 'c' => $d['c']]);
    $ana->get('/api/sessao.php');
    igual($sentinela, presencaLerArquivo($a, 'ana')['a'], 'dentro de 60 s a atividade gravada não muda');
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'segue conectada');
});

teste('presença: falha ao gravar a presença não derruba o login: entra, sem temporário que sobre, e uma linha só no erros.log', function (): void {
    $a = Ambiente::novo();
    presencaAna($a);
    presencaPasta($a);
    // Uma pasta no lugar do arquivo: o rename do temporário falha (Is a directory). Sem depender de permissão.
    mkdir(presencaArquivo($a, 'ana'), 0700);
    // Marcador fresco: a faxina não roda nos logins, e o glob de *.json não é o assunto deste caso.
    touch($a->priv . '/presenca/.faxina');
    $um = $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(true, $um->get('/api/sessao.php')->json()['autenticado'] ?? null, 'a primeira sessão vale');
    // Segundo login da mesma conta: a sessão única derruba a primeira, então a checagem da primeira vem antes.
    $dois = $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(true, $dois->get('/api/sessao.php')->json()['autenticado'] ?? null, 'a segunda sessão vale');
    clearstatcache();
    igual([], glob($a->priv . '/presenca/*.tmp') ?: [], 'nenhum temporário sobra');
    $log = (string) @file_get_contents($a->priv . '/erros.log');
    igual(1, substr_count($log, 'gravação da presença falhou'), 'uma linha só no erros.log, mesmo com dois logins');
});
