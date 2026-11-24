<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';
require_once __DIR__ . '/apoio/presenca.php';

/**
 * Presença: LED "Sessão aberta" na listagem do admin (regra de d26_sessao_avaliar aplicada ao arquivo).
 * Nome de teste começa com "presença:" (filtro do rodar.php).
 */

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

teste('presença: não admin recebe 403 na listagem e a resposta não traz o campo conectado', function (): void {
    $a = Ambiente::novo();
    presencaPasta($a);
    presencaAna($a);
    $ana = $a->entrar('ana', PRESENCA_SENHA_ANA);
    $r = $ana->get('/api/usuarios.php');
    igual(403, $r->status, 'não admin');
    naoContem('conectado', $r->corpo, 'o campo não sai para quem não administra');
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

teste('presença: sem o argumento conectado, d26_conta_publica devolve null (sem informação), nunca false', function (): void {
    $c = [
        'usuario' => 'ana', 'admin' => false, 'ativo' => true, 'deveTrocarSenha' => false,
        'criadoEm' => '2026-11-01T00:00:00+00:00', 'ultimoLogin' => null, 'aparelhos' => [],
    ];
    igual(null, d26_conta_publica($c, 10)['conectado'], 'quem não informa a presença não afirma que a conta está desconectada');
    igual(true, d26_conta_publica($c, 10, true)['conectado'], 'com a presença informada, o valor passa');
    igual(false, d26_conta_publica($c, 10, false)['conectado'], 'com false explícito, false');
});
