<?php
declare(strict_types=1);

/**
 * Instala a conta única da área da Júri a partir da credencial gerada pela
 * ferramenta local (scripts/juri/acervo.ts). Roda NO SERVIDOR, como o criar-admin.
 *
 * Uso:  php juri-instalar.php <dir-privado-da-juri> <credencial-admin.json> [--substituir]
 *
 * A credencial é um objeto JSON com EXATAMENTE os campos login, salt, auth e
 * embrulho. O auth (base64url de 32 bytes) entra na conta como Argon2id(auth), o
 * mesmo que entrar.php confere; o salt e o embrulho entram como vieram, depois de
 * validados pela forma. A conta nasce admin, ativa e com deveTrocarSenha=true.
 *
 * Recusa se usuarios.json já existe, salvo --substituir (troca a conta da Júri).
 * Fail-closed: qualquer campo fora do formato recusa antes de gravar nada. Nunca
 * imprime o auth, o hash, o salt nem o embrulho; a mensagem de erro nomeia o campo,
 * nunca o valor. A credencial equivale à senha provisória até a troca: quem a
 * instala apaga o arquivo depois (o CLI não apaga o que não criou).
 *
 * D26_AREA é definida ANTES de carregar o núcleo: sem ela o layout seria o do
 * Interdisciplinar (sem imagens/, com as constantes erradas). No servidor, onde o
 * núcleo não está ao lado deste arquivo, aponte-o por D26_NUCLEO=<pasta api/nucleo>.
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}

define('D26_API', true);
define('D26_AREA', 'juri');

/** Teto do arquivo de credencial: a credencial real tem menos de 1 KiB. */
const JURI_CREDENCIAL_MAX_BYTES = 16384;
/** Campos exatos da credencial, em ordem alfabética (comparação por sort). */
const JURI_CREDENCIAL_CAMPOS = ['auth', 'embrulho', 'login', 'salt'];

function falha(string $mensagem): never
{
    fwrite(STDERR, "juri-instalar: $mensagem\n");
    exit(1);
}

/** @return array<string, mixed> o objeto JSON da credencial, sem conferir campo nenhum ainda */
function juriCredencialLer(string $arquivo): array
{
    if (!is_file($arquivo) || !is_readable($arquivo)) {
        falha('credencial ausente ou ilegível');
    }
    $tamanho = filesize($arquivo);
    if ($tamanho === false || $tamanho > JURI_CREDENCIAL_MAX_BYTES) {
        falha('credencial com tamanho fora do esperado');
    }
    $bruto = file_get_contents($arquivo);
    if ($bruto === false) {
        falha('credencial ilegível');
    }
    try {
        $dados = json_decode($bruto, true, 8, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        falha('credencial não é JSON válido');
    }
    if (!is_array($dados) || array_is_list($dados)) {
        falha('credencial precisa ser um objeto JSON');
    }
    return $dados;
}

/**
 * Forma exata da credencial. Cada campo é conferido pela MESMA função que o
 * servidor usa para a conta: o que entra aqui é o que o login aceita depois.
 *
 * @param array<string, mixed> $c
 * @return array{login: string, salt: string, auth: string, embrulho: array{v: int, iv: string, ct: string}}
 */
function juriCredencialValidar(array $c): array
{
    $chaves = array_keys($c);
    sort($chaves);
    if ($chaves !== JURI_CREDENCIAL_CAMPOS) {
        falha('credencial com campos fora do esperado (exatamente login, salt, auth e embrulho)');
    }
    if (!is_string($c['login']) || !d26_login_valido($c['login'])) {
        falha('campo login inválido (3 a 32 caracteres: letras, números, ponto, hífen, sublinhado)');
    }
    if (d26_juri_b64_bytes($c['salt'], D26_JURI_SALT_BYTES) === null) {
        falha('campo salt fora do formato (16 bytes em base64 padrão)');
    }
    if (!d26_juri_auth_valido($c['auth'])) {
        falha('campo auth fora do formato (32 bytes em base64url, 43 caracteres, sem padding)');
    }
    if (!d26_juri_embrulho_valido($c['embrulho'])) {
        falha('campo embrulho fora do formato (v 1, iv de 12 bytes e ct de 48 bytes, em base64 padrão)');
    }
    return [
        'login' => $c['login'],
        'salt' => $c['salt'],
        'auth' => $c['auth'],
        'embrulho' => ['v' => D26_JURI_VERSAO, 'iv' => $c['embrulho']['iv'], 'ct' => $c['embrulho']['ct']],
    ];
}

/**
 * Conta da Júri: a base de d26_conta_nova (uid, versaoSessao, deveTrocarSenha=true),
 * com o salt e o embrulho da credencial. Nunca guarda o auth, só o Argon2id dele.
 *
 * @param array{login: string, salt: string, auth: string, embrulho: array{v: int, iv: string, ct: string}} $cred
 * @return array<string, mixed>
 */
function juriContaDaCredencial(array $cred): array
{
    $conta = d26_conta_nova($cred['login'], d26_hash_senha($cred['auth']), true);
    $conta['salt'] = $cred['salt'];
    $conta['embrulho'] = $cred['embrulho'];
    return $conta;
}

/** Ponto de entrada: sem efeito colateral antes de tudo estar validado (exceto a estrutura, só ao gravar). */
function juriInstalar(array $argv): void
{
    $args = array_slice($argv, 1);
    $substituir = in_array('--substituir', $args, true);
    $desconhecidos = array_filter(
        $args,
        static fn (string $a): bool => str_starts_with($a, '--') && $a !== '--substituir'
    );
    $posicionais = array_values(array_filter($args, static fn (string $a): bool => !str_starts_with($a, '--')));
    if ($desconhecidos !== [] || count($posicionais) !== 2) {
        falha('uso: php juri-instalar.php <dir-privado-da-juri> <credencial-admin.json> [--substituir]');
    }
    [$priv, $arquivoCredencial] = $posicionais;
    $arquivoUsuarios = rtrim($priv, '/') . '/usuarios.json';
    if (is_file($arquivoUsuarios) && !$substituir) {
        falha('usuarios.json já existe; use --substituir para trocar a conta da Júri por esta');
    }

    $cred = juriCredencialValidar(juriCredencialLer($arquivoCredencial));
    d26_garantir_estrutura($priv);
    $conta = juriContaDaCredencial($cred);

    // Confere de novo SOB a trava: dois CLIs ao mesmo tempo não sobrescrevem a conta um do outro.
    $trava = d26_travar($arquivoUsuarios);
    try {
        if (is_file($arquivoUsuarios) && !$substituir) {
            falha('usuarios.json já existe; use --substituir para trocar a conta da Júri por esta');
        }
        d26_gravar_atomico($arquivoUsuarios, ['versao' => 1, 'usuarios' => [$conta]]);
    } finally {
        d26_destravar($trava);
    }
    echo "Conta da Júri instalada: {$cred['login']} (deve trocar a senha no primeiro acesso)\n";
}

umask(0077);
$nucleo = getenv('D26_NUCLEO') ?: __DIR__ . '/../../public/api/nucleo';
foreach (['config', 'armazenamento', 'contas', 'juri'] as $modulo) {
    $arquivo = rtrim($nucleo, '/') . "/$modulo.php";
    if (!is_file($arquivo)) {
        falha('núcleo não encontrado; defina D26_NUCLEO com a pasta api/nucleo');
    }
    require_once $arquivo;
}

try {
    juriInstalar($argv);
} catch (Throwable $e) {
    // Nenhuma exceção deste caminho carrega o conteúdo da credencial; a mensagem é a do núcleo (nome de arquivo, não dado).
    falha('não foi possível instalar a conta (' . $e::class . ')');
}
