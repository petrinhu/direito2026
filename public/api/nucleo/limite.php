<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Limite de tentativas de login. Arquivo tentativas.json:
 * {"u": {sha256(login+IP): {n, ult}}, "ip": {sha256(IP): {f: [ts...]}}, "c": {sha256(login): {f: [ts...]}}}.
 *
 * Três chaves valem ao mesmo tempo, e a maior espera prevalece:
 *  - usuário+IP: 5 falhas livres; depois, a tentativa seguinte à n-ésima (n >= 5) espera
 *    2^(n-4) s (2 s depois da 5ª, 4 s depois da 6ª...), teto 900 s;
 *  - IP (IPv6 agrupado por /64): 30 tentativas em 15 min bloqueiam o IP por 15 min;
 *  - conta (login exato, case-sensitive, qualquer IP): ao chegar a 10 tentativas
 *    na janela de 15 min, espera 2^(k-9) s com TETO CURTO de 60 s, para um
 *    terceiro nunca conseguir trancar a conta por muito tempo; alerta no erros.log.
 *    Quem apresenta o cookie de dispositivo confiável (dispositivo.php) não é
 *    barrado nem conta nesta chave: um atacante distribuído não tranca o admin
 *    legítimo, que continua sujeito às chaves usuário+IP e IP.
 *
 * Tentativa recusada (429) não grava nada: não conta e não renova nenhuma espera.
 *
 * Invariante: a reserva da tentativa (ler, decidir, incrementar, gravar) acontece
 * ANTES da verificação lenta de senha e dentro de um único flock exclusivo;
 * N requisições simultâneas não passam todas pelo mesmo teste. O sucesso devolve
 * só a própria reserva (usuário+IP some; IP e conta perdem uma tentativa) e NÃO
 * zera o que outros IPs acumularam contra a conta.
 * O tempo entra por parâmetro ($agora) para os testes não dormirem.
 *
 * ORDEM FIXA DE LOCKS no núcleo: tentativas.json ANTES de usuarios.json, nunca o
 * inverso. O estado "aparelho confiável" é reavaliado DENTRO do lock de tentativas
 * (callback abaixo), que então toma o lock de usuarios para ler a conta; nenhuma
 * seção sob o lock de usuarios chama este módulo, então não há ciclo. Login sem
 * formato válido só toca a chave de IP (não há conta a proteger e a entrada não
 * pode ser usada para inflar o arquivo). tentativas.json já provisionado (existe
 * usuarios.json) que SUMIU é D26Indisponivel (503), nunca limites zerados.
 */
const D26_LIMITE_LIVRES = 5;
const D26_LIMITE_TETO = 900;
const D26_LIMITE_JANELA = 900;
const D26_LIMITE_FALHAS_IP = 30;
const D26_LIMITE_FALHAS_CONTA = 10;
const D26_LIMITE_TETO_CONTA = 60;
const D26_LIMITE_PADRAO = ['u' => [], 'ip' => [], 'c' => []];

function d26_limite_arquivo(string $priv): string
{
    return $priv . '/tentativas.json';
}

/** Provisionado = o CLI já criou as contas; daí em diante tentativas.json tem de existir. */
function d26_limite_provisionado(string $priv): bool
{
    return is_file($priv . '/usuarios.json');
}

/** IPv4 inteiro; IPv6 agrupado no prefixo /64 (IPv4-mapeado vale como o IPv4). */
function d26_limite_ip_agrupado(string $ip): string
{
    if (filter_var($ip, FILTER_VALIDATE_IP) === false) {
        return $ip;
    }
    $bin = inet_pton($ip);
    if ($bin === false) {
        return $ip;
    }
    if (strlen($bin) === 16) {
        if (str_starts_with($bin, str_repeat("\0", 10) . "\xff\xff")) {
            return (string) inet_ntop(substr($bin, 12, 4));
        }
        return bin2hex(substr($bin, 0, 8)) . '/64';
    }
    return (string) inet_ntop($bin);
}

function d26_limite_chave_usuario(string $login, string $grupoIp): string
{
    return hash('sha256', $login . "\0" . $grupoIp);
}

function d26_limite_chave_ip(string $grupoIp): string
{
    return hash('sha256', 'ip' . "\0" . $grupoIp);
}

function d26_limite_chave_conta(string $login): string
{
    return hash('sha256', 'conta' . "\0" . $login);
}

/**
 * @param array<mixed> $marcas
 * @return list<int>
 */
function d26_limite_podar(array $marcas, int $agora): array
{
    return array_values(array_filter(
        array_map('intval', $marcas),
        static fn (int $t): bool => $t > $agora - D26_LIMITE_JANELA
    ));
}

/**
 * Reserva atômica da tentativa. Devolve 0 (reservada, pode verificar a senha) ou
 * os segundos que faltam esperar (nada é gravado nesse caso). Veja
 * d26_limite_reservar_detalhado para o que foi inserido.
 *
 * @param bool|callable(): bool $dispositivoConfiavel
 */
function d26_limite_reservar(string $priv, string $login, string $ip, int $agora, bool|callable $dispositivoConfiavel = false): int
{
    return d26_limite_reservar_detalhado($priv, $login, $ip, $agora, $dispositivoConfiavel)['espera'];
}

/**
 * Como d26_limite_reservar, mas devolve também se o aparelho é confiável (avaliado
 * DENTRO do lock quando vier callable) e o que a reserva inseriu, para o sucesso
 * devolver SÓ isso (login confiável não pode apagar falha alheia da chave de conta).
 *
 * @param bool|callable(): bool $dispositivoConfiavel
 * @return array{espera: int, confiavel: bool, inseriu: array{u: bool, ip: bool, c: bool}}
 */
function d26_limite_reservar_detalhado(string $priv, string $login, string $ip, int $agora, bool|callable $dispositivoConfiavel = false): array
{
    $grupo = d26_limite_ip_agrupado($ip);
    return d26_atualizar_json(
        d26_limite_arquivo($priv),
        D26_LIMITE_PADRAO,
        static function (array &$d) use ($priv, $login, $grupo, $agora, $dispositivoConfiavel): array {
            $d['u'] = $d['u'] ?? [];
            $d['ip'] = $d['ip'] ?? [];
            $d['c'] = $d['c'] ?? [];
            $loginValido = d26_login_valido($login);
            $confiavel = $loginValido && (is_callable($dispositivoConfiavel) ? (bool) $dispositivoConfiavel() : $dispositivoConfiavel);
            $ku = d26_limite_chave_usuario($login, $grupo);
            $ki = d26_limite_chave_ip($grupo);
            $kc = d26_limite_chave_conta($login);

            $u = $d['u'][$ku] ?? ['n' => 0, 'ult' => 0];
            $fi = d26_limite_podar((array) ($d['ip'][$ki]['f'] ?? []), $agora);
            $fc = d26_limite_podar((array) ($d['c'][$kc]['f'] ?? []), $agora);

            $n = (int) $u['n'];
            $esperaU = $loginValido && $n >= D26_LIMITE_LIVRES
                ? (int) $u['ult'] + min(D26_LIMITE_TETO, 1 << min(10, $n - D26_LIMITE_LIVRES + 1)) - $agora
                : 0;
            $esperaIp = count($fi) >= D26_LIMITE_FALHAS_IP ? max($fi) + D26_LIMITE_JANELA - $agora : 0;
            $k = count($fc);
            $esperaConta = $loginValido && !$confiavel && $k >= D26_LIMITE_FALHAS_CONTA
                ? max($fc) + min(D26_LIMITE_TETO_CONTA, 1 << min(10, $k - D26_LIMITE_FALHAS_CONTA + 1)) - $agora
                : 0;
            $espera = max($esperaU, $esperaIp, $esperaConta);
            $inseriu = ['u' => false, 'ip' => false, 'c' => false];
            if ($espera > 0) {
                return ['espera' => $espera, 'confiavel' => $confiavel, 'inseriu' => $inseriu];
            }

            if ($loginValido) {
                // 'l' liga a entrada à conta (hash do login) para o CLI desbloquear achá-la sem saber o IP.
                $d['u'][$ku] = ['n' => $n + 1, 'ult' => $agora, 'l' => $kc];
                $inseriu['u'] = true;
            }
            $fi[] = $agora;
            $d['ip'][$ki] = ['f' => array_slice($fi, -200)];
            $inseriu['ip'] = true;
            if ($loginValido && !$confiavel) {
                $fc[] = $agora;
                $d['c'][$kc] = ['f' => array_slice($fc, -200)];
                $inseriu['c'] = true;
                if (count($fc) === D26_LIMITE_FALHAS_CONTA) {
                    d26_log_erro_em($priv, 'limite-conta', "conta=$login tentativas=" . count($fc) . ' janela=' . D26_LIMITE_JANELA . 's');
                }
            }
            d26_limite_faxina($d, $agora);
            return ['espera' => 0, 'confiavel' => $confiavel, 'inseriu' => $inseriu];
        },
        d26_limite_provisionado($priv)
    );
}

/** Entradas de um dia atrás ou mais não pesam mais. @param array<string, mixed> $d */
function d26_limite_faxina(array &$d, int $agora): void
{
    foreach ($d['u'] as $k => $v) {
        if ((int) $v['ult'] < $agora - 86400) {
            unset($d['u'][$k]);
        }
    }
    foreach (['ip', 'c'] as $grupo) {
        foreach ($d[$grupo] as $k => $v) {
            if (d26_limite_podar((array) ($v['f'] ?? []), $agora) === []) {
                unset($d[$grupo][$k]);
            }
        }
    }
}

/**
 * Login correto: zera a chave usuário+IP do próprio IP e devolve a reserva
 * ($agora é o instante da reserva) às chaves de IP e, só se a reserva a inseriu
 * ($devolverConta), de conta. As falhas que outros IPs acumularam contra a conta
 * continuam valendo.
 */
function d26_limite_sucesso(string $priv, string $login, string $ip, int $agora, bool $devolverConta = true): void
{
    $grupo = d26_limite_ip_agrupado($ip);
    d26_atualizar_json(
        d26_limite_arquivo($priv),
        D26_LIMITE_PADRAO,
        static function (array &$d) use ($login, $grupo, $agora, $devolverConta): void {
            $d['u'] = $d['u'] ?? [];
            $d['ip'] = $d['ip'] ?? [];
            $d['c'] = $d['c'] ?? [];
            unset($d['u'][d26_limite_chave_usuario($login, $grupo)]);
            $devolver = [['ip', d26_limite_chave_ip($grupo)]];
            if ($devolverConta) {
                $devolver[] = ['c', d26_limite_chave_conta($login)];
            }
            foreach ($devolver as [$g, $k]) {
                $f = array_values(array_map('intval', (array) ($d[$g][$k]['f'] ?? [])));
                $i = array_search($agora, $f, true);
                if ($i !== false) {
                    unset($f[$i]);
                    $d[$g][$k]['f'] = array_values($f);
                }
            }
            d26_limite_faxina($d, $agora);
        },
        d26_limite_provisionado($priv)
    );
}

/**
 * Operação do administrador (CLI desbloquear.php): zera os contadores da conta,
 * a chave de conta e as chaves usuário+IP ligadas àquele login. Não mexe nas
 * chaves de IP nem nas de outras contas. Devolve quantas entradas removeu.
 */
function d26_limite_desbloquear_conta(string $priv, string $login): int
{
    return (int) d26_atualizar_json(
        d26_limite_arquivo($priv),
        D26_LIMITE_PADRAO,
        static function (array &$d) use ($login): int {
            $kc = d26_limite_chave_conta($login);
            $removidas = 0;
            if (isset($d['c'][$kc])) {
                unset($d['c'][$kc]);
                $removidas++;
            }
            foreach ($d['u'] ?? [] as $k => $v) {
                if (($v['l'] ?? null) === $kc) {
                    unset($d['u'][$k]);
                    $removidas++;
                }
            }
            return $removidas;
        },
        d26_limite_provisionado($priv)
    );
}
