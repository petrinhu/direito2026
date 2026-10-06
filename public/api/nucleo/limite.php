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
 *  - usuário+IP: 5 falhas livres; depois espera 2^(n-5) s, teto 900 s;
 *  - IP (IPv6 agrupado por /64): 30 tentativas em 15 min bloqueiam o IP por 15 min;
 *  - conta (login exato, case-sensitive, qualquer IP): ao chegar a 10 tentativas
 *    na janela de 15 min, espera 2^(k-9) s com TETO CURTO de 60 s, para um
 *    terceiro nunca conseguir trancar a conta por muito tempo; alerta no erros.log.
 *
 * Invariante: a reserva da tentativa (ler, decidir, incrementar, gravar) acontece
 * ANTES da verificação lenta de senha e dentro de um único flock exclusivo;
 * N requisições simultâneas não passam todas pelo mesmo teste. O sucesso devolve
 * só a própria reserva (usuário+IP some; IP e conta perdem uma tentativa) e NÃO
 * zera o que outros IPs acumularam contra a conta.
 * O tempo entra por parâmetro ($agora) para os testes não dormirem.
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
 * os segundos que faltam esperar (nada é gravado nesse caso).
 */
function d26_limite_reservar(string $priv, string $login, string $ip, int $agora): int
{
    $grupo = d26_limite_ip_agrupado($ip);
    return (int) d26_atualizar_json(
        d26_limite_arquivo($priv),
        D26_LIMITE_PADRAO,
        static function (array &$d) use ($priv, $login, $grupo, $agora): int {
            $d['u'] = $d['u'] ?? [];
            $d['ip'] = $d['ip'] ?? [];
            $d['c'] = $d['c'] ?? [];
            $ku = d26_limite_chave_usuario($login, $grupo);
            $ki = d26_limite_chave_ip($grupo);
            $kc = d26_limite_chave_conta($login);

            $u = $d['u'][$ku] ?? ['n' => 0, 'ult' => 0];
            $fi = d26_limite_podar((array) ($d['ip'][$ki]['f'] ?? []), $agora);
            $fc = d26_limite_podar((array) ($d['c'][$kc]['f'] ?? []), $agora);

            $n = (int) $u['n'];
            $esperaU = $n > D26_LIMITE_LIVRES
                ? (int) $u['ult'] + min(D26_LIMITE_TETO, 1 << min(10, $n - D26_LIMITE_LIVRES)) - $agora
                : 0;
            $esperaIp = count($fi) >= D26_LIMITE_FALHAS_IP ? max($fi) + D26_LIMITE_JANELA - $agora : 0;
            $k = count($fc);
            $esperaConta = $k >= D26_LIMITE_FALHAS_CONTA
                ? max($fc) + min(D26_LIMITE_TETO_CONTA, 1 << min(10, $k - D26_LIMITE_FALHAS_CONTA + 1)) - $agora
                : 0;
            $espera = max($esperaU, $esperaIp, $esperaConta);
            if ($espera > 0) {
                return $espera;
            }

            $d['u'][$ku] = ['n' => $n + 1, 'ult' => $agora];
            $fi[] = $agora;
            $fc[] = $agora;
            $d['ip'][$ki] = ['f' => array_slice($fi, -200)];
            $d['c'][$kc] = ['f' => array_slice($fc, -200)];
            if (count($fc) === D26_LIMITE_FALHAS_CONTA) {
                $nome = d26_login_valido($login) ? $login : '(login inválido)';
                d26_log_erro_em($priv, 'limite-conta', "conta=$nome tentativas=" . count($fc) . ' janela=' . D26_LIMITE_JANELA . 's');
            }
            d26_limite_faxina($d, $agora);
            return 0;
        }
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
 * ($agora é o instante da reserva) às chaves de IP e de conta. As falhas que
 * outros IPs acumularam contra a conta continuam valendo.
 */
function d26_limite_sucesso(string $priv, string $login, string $ip, int $agora): void
{
    $grupo = d26_limite_ip_agrupado($ip);
    d26_atualizar_json(
        d26_limite_arquivo($priv),
        D26_LIMITE_PADRAO,
        static function (array &$d) use ($login, $grupo, $agora): void {
            unset($d['u'][d26_limite_chave_usuario($login, $grupo)]);
            foreach ([['ip', d26_limite_chave_ip($grupo)], ['c', d26_limite_chave_conta($login)]] as [$g, $k]) {
                $f = array_values(array_map('intval', (array) ($d[$g][$k]['f'] ?? [])));
                $i = array_search($agora, $f, true);
                if ($i !== false) {
                    unset($f[$i]);
                    $d[$g][$k]['f'] = array_values($f);
                }
            }
        }
    );
}
