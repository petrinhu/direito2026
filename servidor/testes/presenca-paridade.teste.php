<?php
declare(strict_types=1);

/**
 * Paridade entre o LED da presença (presenca-led.php, d26_presenca_conectada_conta) e d26_sessao_avaliar (sessao.php),
 * V17-P2 (A7b, C-3). Três partes:
 * 1. Matriz de 64 combinações de seis dimensões (ativo, bloqueio, ociosidade, validade, versão, marcador). Cada janela
 *    é testada na borda (igual ao limite) e um passo fora (limite + 1). Os dois lados têm de concordar, e os dois têm
 *    de bater com a regra do plano (oráculo).
 * 2. Blocos de conta recriada (ativo x bloqueada, com a saída real de d26_conta_nova) e conta sem marcador. Oráculo:
 *    os dois lados falsos.
 * 3. Divergência por desenho: uid diferente com o mesmo marcador e a mesma versão. O LED não confere uid
 *    (presenca-led.php, d26_presenca_conectada); d26_sessao_avaliar confere (sessao.php, mesmaEncarnacao). Esse estado
 *    só se alcança editando usuarios.json à mão: d26_conta_nova (contas.php:560-573) sorteia uid novo, e o marcador só
 *    nasce no login, sorteado dentro do lock (contas.php:721-722). Excluir ou desativar apaga a presença
 *    (usuarios.php:175-177). O teste fixa a divergência para que ela apareça impressa e não passe despercebida.
 *
 * Nome de teste começa com "presença:" (filtro do rodar.php). O filtro "paridade" pega os três.
 */

require_once __DIR__ . '/apoio/nucleo.php';
require_once RAIZ_REPO . '/public/api/nucleo/presenca.php';
require_once RAIZ_REPO . '/public/api/nucleo/sessao.php';

const PRESENCA_PARIDADE_AGORA = 1000000;
const PRESENCA_PARIDADE_VERSAO = 3;
const PRESENCA_PARIDADE_VIGENTE = 'marcador-vigente';
const PRESENCA_PARIDADE_HASH = '$argon2id$v=19$m=65536,t=4,p=1$x$y';

/**
 * Uma combinação por inteiro de 0 a 63; cada bit é uma dimensão. Dimensões "fora" valem true quando a janela passa um
 * passo do limite ou quando a versão ou o marcador divergem.
 *
 * @return list<array{ativo: bool, bloqueada: bool, ocioso_fora: bool, validade_fora: bool, versao_diferente: bool, marcador_diferente: bool}>
 */
function presencaParidadeMatriz(): array
{
    $casos = [];
    for ($i = 0; $i < 64; $i++) {
        $casos[] = [
            'ativo' => (bool) ($i & 1),
            'bloqueada' => (bool) ($i & 2),
            'ocioso_fora' => (bool) ($i & 4),
            'validade_fora' => (bool) ($i & 8),
            'versao_diferente' => (bool) ($i & 16),
            'marcador_diferente' => (bool) ($i & 32),
        ];
    }
    return $casos;
}

/** Oráculo: a regra do plano (conta ativa, sem bloqueio, dentro das janelas, versão e marcador iguais). */
function presencaParidadeEsperado(array $c): bool
{
    return $c['ativo'] && !$c['bloqueada'] && !$c['ocioso_fora'] && !$c['validade_fora']
        && !$c['versao_diferente'] && !$c['marcador_diferente'];
}

/** Instantes da sessão e da presença de uma combinação: a borda é o limite exato, e "fora" é o limite mais um. */
function presencaParidadeTempos(array $c): array
{
    return [
        PRESENCA_PARIDADE_AGORA - D26_SESSAO_OCIOSIDADE - ($c['ocioso_fora'] ? 1 : 0),
        PRESENCA_PARIDADE_AGORA - D26_SESSAO_VALIDADE - ($c['validade_fora'] ? 1 : 0),
    ];
}

/**
 * Conta da encarnação velha da combinação: uid informado (UID-A por padrão), versão e marcador da sessão, com os
 * campos que a conta real tem depois do login.
 *
 * @return array<string, mixed>
 */
function presencaParidadeContaVelha(bool $ativo, bool $bloqueada, bool $versaoDiferente, bool $marcadorDiferente, string $uid = 'UID-A'): array
{
    $conta = [
        'usuario' => 'ana',
        'hash' => PRESENCA_PARIDADE_HASH,
        'admin' => false,
        'ativo' => $ativo,
        'deveTrocarSenha' => false,
        'versaoSessao' => $versaoDiferente ? PRESENCA_PARIDADE_VERSAO + 1 : PRESENCA_PARIDADE_VERSAO,
        'criadoEm' => '2026-01-01T00:00:00-03:00',
        'ultimoLogin' => null,
        'uid' => $uid,
        'sessaoVigente' => $marcadorDiferente ? 'outro-marcador' : PRESENCA_PARIDADE_VIGENTE,
    ];
    if ($bloqueada) {
        $conta['bloqueada'] = ['em' => PRESENCA_PARIDADE_AGORA - 10, 'motivo' => 'uso-simultaneo'];
    }
    return $conta;
}

/**
 * Grava a conta e a presença (da encarnação velha: UID-A, versão 3, marcador vigente) no privado e põe a sessão
 * correspondente. Devolve o que o LED e d26_sessao_avaliar dizem sobre a mesma conta e o mesmo instante.
 *
 * @param array<string, mixed> $conta
 * @return array{led: bool, sessao: bool}
 */
function presencaParidadeAvaliar(string $priv, array $conta, int $atividade, int $criada): array
{
    file_put_contents(d26_contas_arquivo($priv), json_encode(['versao' => 1, 'usuarios' => [$conta]], JSON_THROW_ON_ERROR));
    @unlink(d26_presenca_arquivo($priv, 'ana'));
    d26_presenca_gravar($priv, 'ana', d26_presenca_marcador(PRESENCA_PARIDADE_VIGENTE), PRESENCA_PARIDADE_VERSAO, $criada, $atividade);
    $_SESSION = [
        'usuario' => 'ana',
        'uid' => 'UID-A',
        'atividade' => $atividade,
        'criada' => $criada,
        'versao' => PRESENCA_PARIDADE_VERSAO,
        'vigente' => PRESENCA_PARIDADE_VIGENTE,
    ];
    $led = d26_presenca_conectada_conta($priv, d26_contas_buscar($priv, 'ana') ?? [], PRESENCA_PARIDADE_AGORA);
    $sessao = d26_sessao_avaliar($priv, PRESENCA_PARIDADE_AGORA)['conta'] !== null;
    return ['led' => $led, 'sessao' => $sessao];
}

teste('presença: paridade LED x d26_sessao_avaliar na matriz de 64 combinações', function (): void {
    $priv = dirTemporario();
    mkdir($priv . '/presenca', 0700);
    $matriz = presencaParidadeMatriz();
    igual(64, count($matriz), 'piso: a matriz tem as 64 combinações');

    $analisados = 0;
    $conectados = 0;
    $divergencias = [];
    $foraDoOraculo = [];
    foreach ($matriz as $n => $c) {
        $analisados++;
        [$atividade, $criada] = presencaParidadeTempos($c);
        $conta = presencaParidadeContaVelha($c['ativo'], $c['bloqueada'], $c['versao_diferente'], $c['marcador_diferente']);
        $r = presencaParidadeAvaliar($priv, $conta, $atividade, $criada);
        $esperado = presencaParidadeEsperado($c);
        $conectados += $esperado ? 1 : 0;
        if ($r['led'] !== $r['sessao']) {
            $divergencias[] = "caso $n: LED=" . var_export($r['led'], true) . ' sessão=' . var_export($r['sessao'], true);
        }
        if ($r['led'] !== $esperado || $r['sessao'] !== $esperado) {
            $foraDoOraculo[] = "caso $n: esperado " . var_export($esperado, true);
        }
    }
    // Piso: a matriz exercita os dois lados (conectado e desconectado), senão a paridade é vazia.
    verdadeiro($conectados > 0 && $conectados < $analisados, 'a matriz tem casos conectados e desconectados');
    echo "  paridade-matriz: encontrados=" . count($matriz) . " analisados=$analisados conectados=$conectados"
        . ' divergencias=' . count($divergencias) . ' fora_do_oraculo=' . count($foraDoOraculo) . "\n";
    igual([], $divergencias, 'divergência entre LED e d26_sessao_avaliar');
    igual([], $foraDoOraculo, 'LED ou sessão fora da regra do plano');
});

teste('presença: paridade LED x sessão, blocos de conta recriada e sem marcador', function (): void {
    $priv = dirTemporario();
    mkdir($priv . '/presenca', 0700);
    // Sessão e presença da encarnação velha, nos instantes de borda (um passo dentro do limite).
    $atividade = PRESENCA_PARIDADE_AGORA - D26_SESSAO_OCIOSIDADE;
    $criada = PRESENCA_PARIDADE_AGORA - D26_SESSAO_VALIDADE;

    $casos = [];
    // Conta recriada: a saída REAL de d26_conta_nova (uid e versão sorteados, sem marcador). Ativo x bloqueada.
    foreach ([[true, false], [true, true], [false, false], [false, true]] as [$ativo, $bloqueada]) {
        $conta = d26_conta_nova('ana', PRESENCA_PARIDADE_HASH, false);
        $conta['ativo'] = $ativo;
        if ($bloqueada) {
            $conta['bloqueada'] = ['em' => PRESENCA_PARIDADE_AGORA - 10, 'motivo' => 'uso-simultaneo'];
        }
        $casos[] = ['nome' => 'recriada ativo=' . var_export($ativo, true) . ' bloqueada=' . var_export($bloqueada, true), 'conta' => $conta];
    }
    // Conta sem marcador: mesma versão da presença, sem sessaoVigente.
    $casos[] = ['nome' => 'sem sessaoVigente, mesma versão', 'conta' => [
        'usuario' => 'ana',
        'hash' => PRESENCA_PARIDADE_HASH,
        'admin' => false,
        'ativo' => true,
        'deveTrocarSenha' => false,
        'versaoSessao' => PRESENCA_PARIDADE_VERSAO,
        'criadoEm' => '2026-01-01T00:00:00-03:00',
        'ultimoLogin' => null,
        'uid' => 'UID-A',
    ]];
    igual(5, count($casos), 'piso: quatro casos de conta recriada e um sem marcador');

    $analisados = 0;
    $divergencias = [];
    $foraDoOraculo = [];
    foreach ($casos as $n => $caso) {
        $analisados++;
        $r = presencaParidadeAvaliar($priv, $caso['conta'], $atividade, $criada);
        // Oráculo: uid diferente ou sem marcador não é sessão aberta, nos dois lados.
        $esperado = false;
        if ($r['led'] !== $r['sessao']) {
            $divergencias[] = "{$caso['nome']}: LED=" . var_export($r['led'], true) . ' sessão=' . var_export($r['sessao'], true);
        }
        if ($r['led'] !== $esperado || $r['sessao'] !== $esperado) {
            $foraDoOraculo[] = "{$caso['nome']}: LED=" . var_export($r['led'], true) . ' sessão=' . var_export($r['sessao'], true);
        }
    }
    echo "  paridade-blocos: encontrados=" . count($casos) . " analisados=$analisados conectados=0"
        . ' divergencias=' . count($divergencias) . ' fora_do_oraculo=' . count($foraDoOraculo) . "\n";
    igual([], $divergencias, 'divergência entre LED e d26_sessao_avaliar nos blocos');
    igual([], $foraDoOraculo, 'LED ou sessão aberta para conta recriada ou sem marcador');
});

teste('presença: paridade, LED não confere uid (divergência por desenho)', function (): void {
    $priv = dirTemporario();
    mkdir($priv . '/presenca', 0700);
    $atividade = PRESENCA_PARIDADE_AGORA - D26_SESSAO_OCIOSIDADE;
    $criada = PRESENCA_PARIDADE_AGORA - D26_SESSAO_VALIDADE;
    // uid diferente, com o mesmo marcador e a mesma versão: estado que só a edição manual do usuarios.json produz.
    $conta = presencaParidadeContaVelha(true, false, false, false, 'UID-B');
    $r = presencaParidadeAvaliar($priv, $conta, $atividade, $criada);
    $divergiu = $r['led'] !== $r['sessao'] ? 1 : 0;
    echo "  divergencia_por_desenho=$divergiu\n";
    igual(true, $r['led'], 'o LED não confere uid: com marcador e versão iguais, mostra conectado');
    igual(false, $r['sessao'], 'd26_sessao_avaliar confere uid: uid diferente é recusada');
});
