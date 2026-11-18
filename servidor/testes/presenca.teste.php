<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/**
 * Presença de sessão aberta por conta (ADM-F2, plano P4 v2, seção 2). O painel do admin mostra o LED "Sessão
 * aberta" e o último login. A presença é um arquivo por conta em PRIV/presenca/, com só o hash do marcador
 * de sessão única (m), a versão (v), a última atividade (a) e a criação da sessão (c). Sem IP e sem id de
 * sessão. O LED vale pelas mesmas regras de d26_sessao_avaliar: ociosidade, validade absoluta, versão e
 * marcador. Nome de teste começa com "presença:" (filtro do rodar.php).
 *
 * Os casos descrevem o comportamento novo e o vermelho é visto antes do código (ADM-F3).
 */

const PRESENCA_SENHA_ANA = 'SenhaDaAna-2026';

/** Arquivo de presença da conta: o nome não traz o login (hash com prefixo, como as chaves de tentativas). */
function presencaArquivo(Ambiente $a, string $login): string
{
    return $a->priv . '/presenca/' . hash('sha256', 'presenca' . "\0" . $login) . '.json';
}

/** Cria a pasta como o provisionamento do CLI faz (o web nunca cria). */
function presencaPasta(Ambiente $a): void
{
    if (!is_dir($a->priv . '/presenca')) {
        mkdir($a->priv . '/presenca', 0700);
    }
}

/** Conta comum de teste, ativa e sem troca pendente. */
function presencaAna(Ambiente $a): void
{
    $a->semearUsuario('ana', PRESENCA_SENHA_ANA, false, false);
}

/** Linha da conta na listagem do admin (GET /api/usuarios.php). */
function presencaLinha(Cliente $adm, string $login): array
{
    $r = $adm->get('/api/usuarios.php');
    igual(200, $r->status, 'listagem do admin');
    foreach ($r->json()['usuarios'] as $u) {
        if (($u['usuario'] ?? null) === $login) {
            return $u;
        }
    }
    throw new RuntimeException('conta ausente na listagem');
}

/** Edita a conta em usuarios.json (mesma técnica de conviteEditarConta). */
function presencaEditar(Ambiente $a, string $login, callable $fn): void
{
    $arq = $a->priv . '/usuarios.json';
    $d = json_decode((string) file_get_contents($arq), true, 512, JSON_THROW_ON_ERROR);
    foreach ($d['usuarios'] as $i => $c) {
        if (($c['usuario'] ?? null) === $login) {
            $d['usuarios'][$i] = $fn($c);
        }
    }
    file_put_contents($arq, json_encode($d, JSON_THROW_ON_ERROR));
}

/** Lê o arquivo de presença da conta; falha de forma explícita se ele ainda não existe. */
function presencaLerArquivo(Ambiente $a, string $login): array
{
    $arq = presencaArquivo($a, $login);
    verdadeiro(is_file($arq), 'arquivo de presença ausente: ainda não foi gravado');
    return json_decode((string) file_get_contents($arq), true, 512, JSON_THROW_ON_ERROR);
}

/** Edita o arquivo de presença da conta (idade e data, para simular o tempo). */
function presencaEditarArquivo(Ambiente $a, string $login, callable $fn): void
{
    $dados = presencaLerArquivo($a, $login);
    $arq = presencaArquivo($a, $login);
    file_put_contents($arq, json_encode($fn($dados), JSON_THROW_ON_ERROR));
}

teste('presença: o login mostra a conta como conectada na listagem, já no primeiro pedido do admin', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'antes do login a conta está sem sessão aberta');
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'depois do login, conectada no primeiro pedido');
    igual(true, $ana->get('/api/sessao.php')->json()['autenticado'] ?? null, 'a sessão da conta vale');
});

teste('presença: sair dá conectado false na listagem', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'conectada antes de sair');
    igual(200, $ana->post('/api/sair.php', [])->status, 'saiu');
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'depois de sair, sem sessão aberta');
});

teste('presença: ociosidade além de 7200 s dá conectado false, e sessão além de 43200 s também', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    presencaEditarArquivo($a, 'ana', static function (array $d): array {
        $d['a'] = time() - 7201;
        return $d;
    });
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'ociosa além de 2 h');
    presencaEditarArquivo($a, 'ana', static function (array $d): array {
        $d['a'] = time();
        $d['c'] = time() - 43201;
        return $d;
    });
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'sessão além de 12 h, mesmo com atividade recente');
});

teste('presença: bloqueio da conta e versão da sessão diferente dão conectado false', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    presencaEditar($a, 'ana', static function (array $c): array {
        $c['bloqueada'] = ['em' => time(), 'motivo' => 'uso-simultaneo'];
        return $c;
    });
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'conta bloqueada');
    presencaEditar($a, 'ana', static function (array $c): array {
        unset($c['bloqueada']);
        $c['versaoSessao'] = (int) $c['versaoSessao'] + 1;
        return $c;
    });
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'versão da sessão mudou');
});

teste('presença: login em outro aparelho segue conectada, e sair do aparelho velho não apaga a presença nova', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $velho = $a->entrar('ana', PRESENCA_SENHA_ANA);
    $novo = $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'conectada pelo aparelho novo');
    $velho->post('/api/sair.php', []);
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'sair do aparelho velho não apaga a presença nova');
    igual(true, $novo->get('/api/sessao.php')->json()['autenticado'] ?? null, 'o aparelho novo segue entrado');
});

teste('presença: o contador de uso simultâneo é o mesmo antes e depois das chamadas de presença', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    $uso = static function () use ($a): array {
        $c = $a->lerUsuarios()['usuarios'];
        foreach ($c as $u) {
            if (($u['usuario'] ?? null) === 'ana') {
                return [$u['usoSimultaneo'] ?? null, $u['bloqueada'] ?? null];
            }
        }
        return [];
    };
    $antes = $uso();
    for ($i = 0; $i < 3; $i++) {
        presencaLinha($adm, 'ana');
        $ana->get('/api/sessao.php');
    }
    igual($antes, $uso(), 'nenhuma chamada de presença mexe no contador nem no bloqueio');
});

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

teste('presença: excluir a conta pelo painel apaga o arquivo de presença', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    verdadeiro(is_file(presencaArquivo($a, 'ana')), 'o arquivo existe antes');
    $r = $adm->post('/api/usuarios.php', ['acao' => 'excluir', 'usuario' => 'ana']);
    igual(200, $r->status, 'excluída pelo painel');
    clearstatcache(); // o arquivo mudou em outro processo (o servidor): sem limpar, is_file lê o cache de stat
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'o arquivo sai junto com a conta');
});

teste('presença: excluir pelo CLI apaga o arquivo de presença da conta removida, e as outras ficam', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false], 'bia' => ['admin' => false]]);
    @mkdir($priv . '/presenca', 0700);
    $arqAna = $priv . '/presenca/' . hash('sha256', 'presenca' . "\0" . 'ana') . '.json';
    $arqBia = $priv . '/presenca/' . hash('sha256', 'presenca' . "\0" . 'bia') . '.json';
    file_put_contents($arqAna, json_encode(['m' => str_repeat('a', 64), 'v' => 1, 'a' => time(), 'c' => time()], JSON_THROW_ON_ERROR));
    file_put_contents($arqBia, json_encode(['m' => str_repeat('b', 64), 'v' => 1, 'a' => time(), 'c' => time()], JSON_THROW_ON_ERROR));
    [$rc, $out, $err] = rodarCliScript('remover-conta.php', [$priv, 'ana'], '');
    igual(0, $rc, "saída: $out $err");
    clearstatcache();
    verdadeiro(!is_file($arqAna), 'a presença de ana sai com a conta');
    verdadeiro(is_file($arqBia), 'a presença de bia fica');
    apagarArvore($dir);
}, false);

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

teste('presença: não admin recebe 403 na listagem e a resposta não traz o campo conectado', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    $r = $ana->get('/api/usuarios.php');
    igual(403, $r->status, 'não admin');
    naoContem('conectado', $r->corpo, 'o campo não sai para quem não administra');
});

/** Presença velha (13 h e um minuto), gravada direto: simula conta que parou de usar o sistema há muito tempo. */
function presencaEscreverVelha(Ambiente $a, string $login): void
{
    $velha = time() - 13 * 3600 - 60;
    file_put_contents(presencaArquivo($a, $login), json_encode(['m' => str_repeat('0', 64), 'v' => 1, 'a' => $velha, 'c' => $velha], JSON_THROW_ON_ERROR));
    chmod(presencaArquivo($a, $login), 0600);
}

/** Marcador da faxina oportunista: o mtime dele é a última faxina. Envelhecê-lo libera a próxima. */
function presencaEnvelhecerFaxina(Ambiente $a, int $segundos): void
{
    $m = $a->priv . '/presenca/.faxina';
    verdadeiro(is_file($m), 'o marcador da faxina existe depois do primeiro login');
    touch($m, time() - $segundos);
    clearstatcache();
}

teste('presença: desativar a conta pelo painel apaga o arquivo de presença', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    verdadeiro(is_file(presencaArquivo($a, 'ana')), 'o arquivo existe antes');
    $r = $adm->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => 'ana']);
    igual(200, $r->status, 'desativada pelo painel');
    clearstatcache();
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'desativar a conta tira a presença: sem sessão aberta para uma conta inativa');
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

teste('presença: marcador divergente com a mesma versão dá conectado false no LED', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    igual(true, presencaLinha($adm, 'ana')['conectado'] ?? null, 'antes da troca: conectada');
    // Só o marcador muda; versão, atividade e criação ficam como estão.
    presencaEditarArquivo($a, 'ana', static fn (array $d): array => ['m' => str_repeat('0', 64), 'v' => $d['v'], 'a' => $d['a'], 'c' => $d['c']]);
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'marcador de outra sessão não acende o LED');
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

teste('presença: sair apaga o arquivo de presença da própria conta (não só o LED)', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    verdadeiro(is_file(presencaArquivo($a, 'ana')), 'o arquivo existe antes de sair');
    igual(200, $ana->post('/api/sair.php', [])->status, 'saiu');
    clearstatcache();
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'sair tira o registro de presença');
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

teste('presença: arquivo de presença ilegível dá conectado false na listagem, sem 500', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $adm = $a->entrar();
    $a->entrar('ana', PRESENCA_SENHA_ANA);
    chmod(presencaArquivo($a, 'ana'), 0000);
    clearstatcache();
    // Sem esta guarda, um ambiente com privilégio leria o arquivo 0000 e o caso não provaria nada (L-36: falha alto).
    if (@file_get_contents(presencaArquivo($a, 'ana')) !== false) {
        falhar('o ambiente lê arquivo 0000 (privilégio): o caso não prova nada');
    }
    $linha = presencaLinha($adm, 'ana');
    igual(false, $linha['conectado'] ?? null, 'arquivo ilegível conta como sem sessão aberta');
    chmod(presencaArquivo($a, 'ana'), 0600);
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
