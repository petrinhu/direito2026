<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Dispositivo confiável (aparelho): depois de um login bem-sucedido o navegador
 * recebe o cookie __Host-d26disp com um token ALEATÓRIO por aparelho
 * (random_bytes(32), base64url). O servidor guarda na conta só o sha256 dele,
 * com criadoEm, expiraEm (30 dias) e a versaoSessao vigente. Quem apresenta um
 * token válido DAQUELA conta não é barrado pela chave de conta do limite de
 * tentativas (limite.php), o que impede um atacante distribuído de trancar o
 * admin legítimo. Não dispensa a senha nem as chaves usuário+IP e IP.
 * Invariantes: (1) no máximo 5 aparelhos por conta, o mais antigo sai;
 * (2) o aparelho vale só enquanto uid e versaoSessao da conta forem os do
 * momento da emissão: troca de senha, redefinição, desativação e exclusão
 * derrubam todos, e a revogação pelo admin (usuarios.php) também incrementa a
 * versaoSessao (derruba as sessões do alvo); (3) comparação em tempo constante,
 * sem curto-circuito.
 */
const D26_DISP_NOME = '__Host-d26disp';
const D26_DISP_VIDA = 30 * 86400;
const D26_DISP_MAXIMO = 5;

function d26_dispositivo_hash(string $token): string
{
    return hash('sha256', $token);
}

/** Token novo (random_bytes(32), base64url, 43 caracteres); só o sha256 vai ao arquivo. */
function d26_dispositivo_gerar_token(): string
{
    return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
}

/**
 * Anexa o aparelho à conta (por referência, dentro de uma mutação sob lock):
 * poda os vencidos, preso à versaoSessao/uid vigentes, no máximo D26_DISP_MAXIMO
 * (o mais antigo sai). Único lugar que monta a entrada de aparelho.
 *
 * @param array<string, mixed> $c
 */
function d26_dispositivo_anexar(array &$c, string $token, int $agora): void
{
    $lista = array_values(array_filter(
        is_array($c['aparelhos'] ?? null) ? $c['aparelhos'] : [],
        static fn (mixed $a): bool => is_array($a) && (int) ($a['expiraEm'] ?? 0) > $agora
    ));
    $lista[] = [
        'h' => d26_dispositivo_hash($token),
        'criadoEm' => $agora,
        'expiraEm' => $agora + D26_DISP_VIDA,
        'versao' => (int) $c['versaoSessao'],
        'uid' => $c['uid'],
    ];
    usort($lista, static fn (array $x, array $y): int => $x['criadoEm'] <=> $y['criadoEm']);
    $c['aparelhos'] = array_slice($lista, -D26_DISP_MAXIMO);
}

/**
 * Cria um aparelho para a conta e devolve o token em claro (única vez em que
 * ele existe no servidor), ou '' se a conta não existe, não tem uid, ou (quando
 * $versaoEsperada/$uidEsperado vêm) já não é a encarnação que o chamador viu:
 * conferido DENTRO do lock, para uma troca/redefinição concorrente nunca deixar
 * aparelho válido preso à versão errada.
 */
function d26_dispositivo_novo(string $priv, string $login, ?int $agora = null, ?int $versaoEsperada = null, ?string $uidEsperado = null): string
{
    $agora ??= time();
    $token = d26_dispositivo_gerar_token();
    $r = d26_contas_mutar($priv, $login, static function (array &$c) use ($token, $agora, $versaoEsperada, $uidEsperado): string {
        if (!is_string($c['uid'] ?? null) || $c['uid'] === '') {
            return 'sem-uid';
        }
        if (($versaoEsperada !== null && (int) $c['versaoSessao'] !== $versaoEsperada)
            || ($uidEsperado !== null && !hash_equals($uidEsperado, $c['uid']))
            || ($c['ativo'] ?? null) !== true) {
            return 'divergente';
        }
        d26_dispositivo_anexar($c, $token, $agora);
        return 'ok';
    });
    return $r === 'ok' ? $token : '';
}

/** O cookie da requisição é um aparelho válido desta conta? */
function d26_dispositivo_confiavel(string $priv, string $login, ?int $agora = null): bool
{
    $valor = $_COOKIE[D26_DISP_NOME] ?? null;
    if (!is_string($valor) || preg_match('/^[A-Za-z0-9_-]{43}$/D', $valor) !== 1) {
        return false;
    }
    // Lê sob o lock de usuarios.json; quem chama com o lock de tentativas preso
    // respeita a ordem fixa (tentativas, depois usuários).
    $conta = d26_contas_buscar_travada($priv, $login);
    if ($conta === null || !is_string($conta['uid'] ?? null) || $conta['uid'] === '' || $conta['ativo'] !== true) {
        return false;
    }
    $agora ??= time();
    $h = d26_dispositivo_hash($valor);
    $achou = false;
    foreach (is_array($conta['aparelhos'] ?? null) ? $conta['aparelhos'] : [] as $a) {
        if (!is_array($a)) {
            continue;
        }
        $igual = hash_equals((string) ($a['h'] ?? ''), $h); // sem sair no primeiro acerto
        $vale = (int) ($a['expiraEm'] ?? 0) > $agora
            && (int) ($a['versao'] ?? -1) === (int) $conta['versaoSessao']
            && hash_equals((string) ($a['uid'] ?? ''), $conta['uid']);
        $achou = ($igual && $vale) || $achou;
    }
    return $achou;
}

/** Entrega o cookie do aparelho (o token já foi gravado como sha256 na conta). */
function d26_dispositivo_entregar(string $token): void
{
    setcookie(D26_DISP_NOME, $token, [
        'expires' => time() + D26_DISP_VIDA,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

/** Cria o aparelho (preso à versão/uid dados) e entrega o cookie. Sem conta que confira, não emite nada. */
function d26_dispositivo_emitir(string $priv, string $login, ?int $versaoEsperada = null, ?string $uidEsperado = null): void
{
    $token = d26_dispositivo_novo($priv, $login, null, $versaoEsperada, $uidEsperado);
    if ($token !== '') {
        d26_dispositivo_entregar($token);
    }
}
