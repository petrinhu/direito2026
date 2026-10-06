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
 * derrubam todos; (3) comparação em tempo constante, sem curto-circuito.
 */
const D26_DISP_NOME = '__Host-d26disp';
const D26_DISP_VIDA = 30 * 86400;
const D26_DISP_MAXIMO = 5;

function d26_dispositivo_hash(string $token): string
{
    return hash('sha256', $token);
}

/**
 * Cria um aparelho para a conta e devolve o token em claro (única vez em que
 * ele existe no servidor), ou '' se a conta não existe ou não tem uid.
 */
function d26_dispositivo_novo(string $priv, string $login, ?int $agora = null): string
{
    $agora ??= time();
    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    $r = d26_contas_mutar($priv, $login, static function (array &$c) use ($token, $agora): string {
        if (!is_string($c['uid'] ?? null) || $c['uid'] === '') {
            return 'sem-uid';
        }
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
    $conta = d26_contas_buscar($priv, $login);
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

/** Cria o aparelho e entrega o cookie. Sem conta válida, não emite nada. */
function d26_dispositivo_emitir(string $priv, string $login): void
{
    $token = d26_dispositivo_novo($priv, $login);
    if ($token === '') {
        return;
    }
    setcookie(D26_DISP_NOME, $token, [
        'expires' => time() + D26_DISP_VIDA,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

/** Admin: derruba todos os aparelhos da conta (a sessão em andamento não cai). */
function d26_dispositivo_revogar_todos(string $priv, string $login): string
{
    return d26_contas_mutar($priv, $login, static function (array &$c): string {
        $c['aparelhos'] = [];
        return 'ok';
    });
}
