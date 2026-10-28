<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Regras próprias da área da Júri (endpoints em public/api/juri/). Tudo o que é
 * comum (sessão, CSRF, limite, aparelho, Argon2id, CAS da conta) vem do núcleo
 * compartilhado; aqui fica só o que a Júri acrescenta.
 *
 * Login SEM senha no servidor: o navegador deriva AUTH (32 B, base64url) a partir
 * da senha e do salt da conta. O servidor só recebe AUTH, confere
 * Argon2id(AUTH) com d26_senha_confere e devolve o embrulho da CEK (que só o
 * navegador consegue abrir). Quem olha o arquivo do servidor não vê senha.
 *
 * Salt falso: login inexistente recebe HMAC(segredo da área, "sal" . login)
 * truncado em 16 B, do mesmo formato e tamanho do real. É estável entre chamadas,
 * então não revela quem existe, e não passa pelo limite de tentativas.
 *
 * Conta da Júri sem salt ou embrulho válido é D26Indisponivel (503): nunca login
 * sem embrulho, nunca dado parcial.
 */
const D26_JURI_ITER = 600000;
const D26_JURI_VERSAO = 1;
const D26_JURI_SALT_BYTES = 16;
const D26_JURI_AUTH_BYTES = 32;
const D26_JURI_IV_BYTES = 12;
/** CEK de 32 B + tag GCM de 16 B: o que o embrulho cifra. */
const D26_JURI_CT_BYTES = 48;

/**
 * AUTH no formato exato: base64url SEM padding de 32 bytes, canônico (os bits de
 * folga do último caractere são zero). Qualquer outra forma é 400 antes de tocar
 * o limite de tentativas.
 */
function d26_juri_auth_valido(mixed $auth): bool
{
    if (!is_string($auth) || preg_match('/^[A-Za-z0-9_-]{43}$/D', $auth) !== 1) {
        return false;
    }
    $bin = base64_decode(strtr($auth, '-_', '+/') . '=', true);
    return $bin !== false
        && strlen($bin) === D26_JURI_AUTH_BYTES
        && rtrim(strtr(base64_encode($bin), '+/', '-_'), '=') === $auth;
}

/**
 * Corpo JSON com EXATAMENTE as chaves esperadas. `senha` tem código próprio: é o
 * erro mais provável de quem vem do login antigo, e a mensagem diz o que fazer.
 * Nunca ecoa o valor enviado.
 *
 * @param list<string> $esperadas
 * @return array<string, mixed>
 */
function d26_juri_corpo(array $esperadas): array
{
    $corpo = d26_corpo_json();
    if (array_key_exists('senha', $corpo)) {
        d26_erro(400, 'senha-no-corpo', 'A senha não é enviada ao servidor. Envie só a chave derivada no aparelho.');
    }
    $recebidas = array_keys($corpo);
    sort($recebidas);
    $previstas = $esperadas;
    sort($previstas);
    if ($recebidas !== $previstas) {
        d26_erro(400, 'invalido', 'Requisição inválida.');
    }
    return $corpo;
}

/** Salt FALSO estável: primeiros 16 B de HMAC-SHA256(segredo da área, "sal" . login). Bytes crus. */
function d26_juri_salt_falso(string $priv, string $login): string
{
    return substr(hash_hmac('sha256', 'sal' . $login, d26_segredo($priv), true), 0, D26_JURI_SALT_BYTES);
}

/** Decodifica base64 padrão canônico de exatamente $tamanho bytes, ou null. */
function d26_juri_b64_bytes(mixed $texto, int $tamanho): ?string
{
    if (!is_string($texto) || $texto === '') {
        return null;
    }
    $bin = base64_decode($texto, true);
    if ($bin === false || strlen($bin) !== $tamanho || base64_encode($bin) !== $texto) {
        return null;
    }
    return $bin;
}

/** Salt real da conta, em bytes crus (16). Ausente ou malformado é D26Indisponivel. */
function d26_juri_salt_da_conta(array $conta): string
{
    $bytes = d26_juri_b64_bytes($conta['salt'] ?? null, D26_JURI_SALT_BYTES);
    if ($bytes === null) {
        throw new D26Indisponivel('conta da Júri sem salt de 16 B válido');
    }
    return $bytes;
}

/**
 * Recusa fechada da conta da Júri: salt de 16 B e embrulho exato {v: 1, iv: 12 B,
 * ct: 48 B} (campos v, iv e ct, e nenhum outro). Devolve a própria conta.
 *
 * @param array<string, mixed> $conta
 * @return array<string, mixed>
 */
function d26_juri_conta_validar(array $conta): array
{
    d26_juri_salt_da_conta($conta);
    $e = $conta['embrulho'] ?? null;
    $forma = is_array($e)
        && count($e) === 3
        && isset($e['v'], $e['iv'], $e['ct'])
        && $e['v'] === D26_JURI_VERSAO
        && d26_juri_b64_bytes($e['iv'], D26_JURI_IV_BYTES) !== null
        && d26_juri_b64_bytes($e['ct'], D26_JURI_CT_BYTES) !== null;
    if (!$forma) {
        throw new D26Indisponivel('conta da Júri sem embrulho válido');
    }
    return $conta;
}

/**
 * Embrulho que sai para o navegador: só v, iv e ct, como gravados (conta já validada).
 *
 * @param array<string, mixed> $conta
 * @return array{v: int, iv: string, ct: string}
 */
function d26_juri_embrulho_saida(array $conta): array
{
    $e = $conta['embrulho'];
    return ['v' => D26_JURI_VERSAO, 'iv' => (string) $e['iv'], 'ct' => (string) $e['ct']];
}
