<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Núcleo do login (plano do CTO do login único, seção 1.5; LU-F2.5). Extraído de entrar.php
 * para servir também ao formulário de acesso.php. Não responde HTTP: devolve o resultado e
 * cada endpoint escolhe a saída (JSON ou tela), sem repetir a regra.
 *
 * Invariante: toda falha de login devolve a MESMA frase e o mesmo estado 'recusado', e a
 * reserva do limite acontece antes do Argon2id, para que o tempo não diga se a conta existe.
 */

/** Frase do líder, igual em todos os casos de falha de entrada. Verbatim, não alterar. */
const D26_FRASE_RECUSA = 'Site exclusivo para público seleto!';

/** Cabeçalho que limpa o cache do navegador no login e no sair. "cookies", "storage" e "*" derrubariam o domínio-pai (T19). */
const D26_CLEAR_SITE_DATA = '"cache"';

/** Nomes dos cookies da área da Júri antes do login único. O login os expira para não sobrarem por 30 dias. */
const D26_COOKIES_JURI_ANTIGOS = ['__Host-juri', '__Host-juripre', '__Host-juridisp'];

/** Frase de espera: a mesma frase, com os segundos (limite, seção 1.5). */
function d26_frase_espera(int $segundos): string
{
    return D26_FRASE_RECUSA . " Aguarde {$segundos} segundos.";
}

/**
 * Destino pós-login: só caminho interno simples. Qualquer outra coisa (URL absoluta,
 * barra dupla, barra invertida, espaço, quebra de linha) vai para '/' (sem redirecionamento aberto).
 */
function d26_destino_seguro(mixed $bruto): string
{
    if (!is_string($bruto) || preg_match('@^/(?!/)[A-Za-z0-9._~%/-]*(\?[^#\s]*)?$@D', $bruto) !== 1) {
        return '/';
    }
    return $bruto;
}

/** Expira os três cookies antigos da Júri. Só nomes fixos: nunca lê ou devolve valor. */
function d26_cookies_juri_antigos_expirar(): void
{
    foreach (D26_COOKIES_JURI_ANTIGOS as $nome) {
        setcookie($nome, '', [
            'expires' => 1,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }
}

/**
 * Tenta o login. Devolve um destes formatos:
 *  - ['estado' => 'entrou', 'conta' => array, 'csrf' => string]
 *  - ['estado' => 'espera', 'segundos' => int]   (limite de tentativas, 429)
 *  - ['estado' => 'recusado']                    (qualquer falha, 401)
 *
 * @return array<string, mixed>
 */
function d26_login_executar(string $priv, string $usuario, string $senha): array
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $loginValido = d26_login_valido($usuario);
    // Reserva atômica ANTES do Argon2id: requisições simultâneas não passam todas pelo mesmo teste.
    // O aparelho confiável é reavaliado DENTRO do lock de tentativas (ordem de locks: tentativas, usuários).
    $reserva = time();
    $res = d26_limite_reservar_detalhado(
        $priv,
        $usuario,
        $ip,
        $reserva,
        static fn (): bool => $loginValido && d26_dispositivo_confiavel($priv, $usuario)
    );
    if ($res['espera'] > 0) {
        return ['estado' => 'espera', 'segundos' => (int) $res['espera']];
    }

    $conta = $loginValido ? d26_contas_buscar($priv, $usuario) : null;
    $confere = d26_senha_confere($conta, $senha);
    if (!$confere || $conta === null || $conta['ativo'] !== true || !is_string($conta['uid'] ?? null) || $conta['uid'] === '') {
        return ['estado' => 'recusado'];
    }

    // Fora de qualquer lock: ponto de pausa dos testes de corrida (no-op em produção).
    d26_teste_pausar('entrar-apos-verificar', $usuario);
    $novoHash = password_needs_rehash((string) $conta['hash'], PASSWORD_ARGON2ID, D26_ARGON) ? d26_hash_senha($senha) : null;
    // O aparelho que já é confiável não ocupa outra vaga.
    $token = $res['confiavel'] ? null : d26_dispositivo_gerar_token();
    // Login = UMA mutação sob lock: a conta tem de ser a mesma que foi verificada (ativa, uid, versão e hash).
    $vigente = null;
    $versao = d26_contas_efetivar_login($priv, $usuario, $conta, $novoHash, $token, null, $vigente);
    if ($versao === null) {
        return ['estado' => 'recusado']; // a reserva fica: conta como tentativa
    }

    d26_limite_sucesso($priv, $usuario, $ip, $reserva, $res['inseriu']['c']);
    d26_sessao_autenticar($priv, $usuario, (string) $conta['uid'], $versao, true, $vigente);
    if ($token !== null) {
        d26_dispositivo_entregar($token);
    }
    d26_cookies_juri_antigos_expirar();

    return ['estado' => 'entrou', 'conta' => $conta, 'csrf' => (string) $_SESSION['csrf']];
}
