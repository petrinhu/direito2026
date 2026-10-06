<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Limite de tentativas de login. Arquivo tentativas.json:
 * {"u": {sha256(login+IP): {n, ate, ult}}, "ip": {sha256(IP): {f: [ts...], ate}}}.
 * Usuário+IP: 5 falhas livres, depois espera 2^(n-5) s (teto 900 s).
 * IP: 30 falhas em 15 min bloqueiam o IP por 15 min. O tempo entra por
 * parâmetro ($agora) para os testes não dormirem.
 */
const D26_LIMITE_LIVRES = 5;
const D26_LIMITE_TETO = 900;
const D26_LIMITE_JANELA_IP = 900;
const D26_LIMITE_FALHAS_IP = 30;
const D26_LIMITE_PADRAO = ['u' => [], 'ip' => []];

function d26_limite_arquivo(string $priv): string
{
    return $priv . '/tentativas.json';
}

function d26_limite_chave_usuario(string $login, string $ip): string
{
    return hash('sha256', $login . "\0" . $ip);
}

function d26_limite_chave_ip(string $ip): string
{
    return hash('sha256', 'ip' . "\0" . $ip);
}

/** Segundos que ainda faltam esperar (0 = livre). */
function d26_limite_pre(string $priv, string $login, string $ip, int $agora): int
{
    $d = d26_ler_json(d26_limite_arquivo($priv), D26_LIMITE_PADRAO);
    $ate = max(
        (int) ($d['u'][d26_limite_chave_usuario($login, $ip)]['ate'] ?? 0),
        (int) ($d['ip'][d26_limite_chave_ip($ip)]['ate'] ?? 0)
    );
    return max(0, $ate - $agora);
}

function d26_limite_falha(string $priv, string $login, string $ip, int $agora): void
{
    d26_atualizar_json(
        d26_limite_arquivo($priv),
        D26_LIMITE_PADRAO,
        static function (array &$d) use ($login, $ip, $agora): void {
            $d['u'] = $d['u'] ?? [];
            $d['ip'] = $d['ip'] ?? [];
            $ku = d26_limite_chave_usuario($login, $ip);
            $e = $d['u'][$ku] ?? ['n' => 0, 'ate' => 0, 'ult' => 0];
            $e['n'] = (int) $e['n'] + 1;
            $e['ult'] = $agora;
            if ($e['n'] > D26_LIMITE_LIVRES) {
                $expoente = $e['n'] - D26_LIMITE_LIVRES;
                $e['ate'] = $agora + ($expoente >= 10 ? D26_LIMITE_TETO : min(D26_LIMITE_TETO, 1 << $expoente));
            }
            $d['u'][$ku] = $e;

            $ki = d26_limite_chave_ip($ip);
            $i = $d['ip'][$ki] ?? ['f' => [], 'ate' => 0];
            $i['f'] = array_values(array_filter(
                (array) $i['f'],
                static fn ($t): bool => (int) $t > $agora - D26_LIMITE_JANELA_IP
            ));
            $i['f'][] = $agora;
            if (count($i['f']) >= D26_LIMITE_FALHAS_IP) {
                $i['ate'] = $agora + D26_LIMITE_JANELA_IP;
            }
            $d['ip'][$ki] = $i;

            // Faxina: entradas de um dia atrás ou mais não pesam mais.
            foreach ($d['u'] as $k => $v) {
                if ((int) $v['ult'] < $agora - 86400 && (int) $v['ate'] < $agora) {
                    unset($d['u'][$k]);
                }
            }
            foreach ($d['ip'] as $k => $v) {
                $ultima = $v['f'] === [] ? 0 : max($v['f']);
                if ($ultima < $agora - 86400 && (int) $v['ate'] < $agora) {
                    unset($d['ip'][$k]);
                }
            }
        }
    );
}

/** Sucesso zera só o contador de usuário+IP (o do IP segue valendo). */
function d26_limite_sucesso(string $priv, string $login, string $ip): void
{
    d26_atualizar_json(
        d26_limite_arquivo($priv),
        D26_LIMITE_PADRAO,
        static function (array &$d) use ($login, $ip): void {
            unset($d['u'][d26_limite_chave_usuario($login, $ip)]);
        }
    );
}
