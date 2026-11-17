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
    $a->entrar();
    verdadeiro(!is_file(presencaArquivo($a, 'ana')), 'o login de outra conta faxina a presença velha de ana');
    igual(false, presencaLinha($adm, 'ana')['conectado'] ?? null, 'sem arquivo, sem sessão aberta');
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
