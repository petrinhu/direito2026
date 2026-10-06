<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Contas de usuário (usuarios.json): {"versao":1,"usuarios":[{usuario, uid, hash,
 * admin, ativo, deveTrocarSenha, versaoSessao, criadoEm, ultimoLogin}]}.
 * uid (16 bytes aleatórios, hex) identifica a ENCARNAÇÃO da conta e versaoSessao
 * nasce aleatória: a sessão guarda os dois, então excluir e recriar o mesmo login
 * nunca ressuscita a sessão da conta antiga.
 * aparelhos: dispositivos confiáveis (só sha256, ver dispositivo.php); esvaziado
 * em toda troca de versaoSessao. Conta sem uid não é aceita (sessão nem login).
 * O papel de admin vem só do arquivo. Comparação de login é EXATA.
 */
const D26_CONTAS_PADRAO = ['versao' => 1, 'usuarios' => []];
const D26_ALFABETO_PROVISORIA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function d26_contas_arquivo(string $priv): string
{
    return $priv . '/usuarios.json';
}

function d26_login_valido(string $login): bool
{
    return preg_match('/^[A-Za-z0-9._-]{3,32}$/D', $login) === 1;
}

/** Devolve a mensagem de recusa em pt-br, ou null se a senha nova serve. */
function d26_validar_senha_nova(string $nova, string $login, string $atual): ?string
{
    if (!mb_check_encoding($nova, 'UTF-8')) {
        return 'A senha contém caracteres inválidos.';
    }
    $tamanho = mb_strlen($nova, 'UTF-8');
    if ($tamanho < 10) {
        return 'A senha precisa ter pelo menos 10 caracteres.';
    }
    if ($tamanho > 128) {
        return 'A senha pode ter no máximo 128 caracteres.';
    }
    if ($nova === $login) {
        return 'A senha não pode ser igual ao nome de usuário.';
    }
    if ($nova === $atual) {
        return 'A senha nova precisa ser diferente da atual.';
    }
    return null;
}

/**
 * Senha provisória escolhida por quem administra: de $minimo a 128 caracteres.
 * O CLI do líder aceita 1 (padrão); a API do admin exige 8 (D26_PROVISORIA_MINIMA_API).
 */
const D26_PROVISORIA_MINIMA_API = 8;

function d26_senha_provisoria_valida(string $senha, int $minimo = 1): bool
{
    if (!mb_check_encoding($senha, 'UTF-8')) {
        return false;
    }
    $n = mb_strlen($senha, 'UTF-8');
    return $n >= $minimo && $n <= 128;
}

function d26_gerar_senha_provisoria(): string
{
    $senha = '';
    $max = strlen(D26_ALFABETO_PROVISORIA) - 1;
    for ($i = 0; $i < 12; $i++) {
        $senha .= D26_ALFABETO_PROVISORIA[random_int(0, $max)];
    }
    return $senha;
}

function d26_hash_senha(string $senha): string
{
    return password_hash($senha, PASSWORD_ARGON2ID, D26_ARGON);
}

/**
 * Confere a senha. Conta inexistente gasta o mesmo custo de um Argon2id
 * (hash descartado), para o tempo não revelar se o usuário existe. Nenhum
 * hash fictício fica gravado no repositório.
 */
function d26_senha_confere(?array $conta, string $senha): bool
{
    d26_teste_marcar('i');
    try {
        if ($conta === null) {
            d26_hash_senha($senha);
            return false;
        }
        return password_verify($senha, (string) $conta['hash']);
    } finally {
        d26_teste_marcar('f');
    }
}

/**
 * Gancho de teste: registra início e fim de cada verificação de senha em
 * PRIV/verificacoes.log. Só age sob php -S com D26_PRIVADO definido; em
 * produção (LiteSpeed) PHP_SAPI nunca é cli-server e a função não faz nada.
 */
function d26_teste_marcar(string $fase): void
{
    if (PHP_SAPI !== 'cli-server') {
        return;
    }
    $dir = getenv('D26_PRIVADO');
    if (!is_string($dir) || $dir === '') {
        return;
    }
    @file_put_contents($dir . '/verificacoes.log', $fase . ' ' . sprintf('%.6f', microtime(true)) . "\n", FILE_APPEND | LOCK_EX);
}

/** @return list<array<string, mixed>> */
function d26_contas_listar(string $priv): array
{
    return array_values(d26_ler_json(d26_contas_arquivo($priv), D26_CONTAS_PADRAO)['usuarios'] ?? []);
}

/** @return array<string, mixed>|null */
function d26_contas_buscar(string $priv, string $login): ?array
{
    foreach (d26_contas_listar($priv) as $c) {
        if ($c['usuario'] === $login) {
            return $c;
        }
    }
    return null;
}

/** Campos que a API pode expor: nunca o hash. @return array<string, mixed> */
function d26_conta_publica(array $c): array
{
    return [
        'usuario' => $c['usuario'],
        'admin' => (bool) $c['admin'],
        'ativo' => (bool) $c['ativo'],
        'deveTrocarSenha' => (bool) $c['deveTrocarSenha'],
        'criadoEm' => $c['criadoEm'],
        'ultimoLogin' => $c['ultimoLogin'],
        'aparelhos' => is_array($c['aparelhos'] ?? null) ? count($c['aparelhos']) : 0,
    ];
}

/**
 * Aplica $fn à conta do login, sob lock. $fn recebe a conta por referência
 * (ou null se não existe) e devolve o resultado; a exclusão é feita por $fn
 * devolvendo 'excluida'.
 *
 * @param callable(array<string, mixed>&): string $fn
 */
function d26_contas_mutar(string $priv, string $login, callable $fn): string
{
    return d26_atualizar_json(
        d26_contas_arquivo($priv),
        D26_CONTAS_PADRAO,
        static function (array &$d) use ($login, $fn): string {
            $d['usuarios'] = array_values($d['usuarios'] ?? []);
            foreach ($d['usuarios'] as $i => $c) {
                if ($c['usuario'] !== $login) {
                    continue;
                }
                $r = $fn($c);
                if ($r === 'excluida') {
                    array_splice($d['usuarios'], $i, 1);
                } else {
                    $d['usuarios'][$i] = $c;
                }
                return $r;
            }
            return 'nao-encontrado';
        }
    );
}

/** @return 'ok'|'existe' */
function d26_contas_criar(string $priv, string $login, string $hash, bool $admin): string
{
    return d26_atualizar_json(
        d26_contas_arquivo($priv),
        D26_CONTAS_PADRAO,
        static function (array &$d) use ($login, $hash, $admin): string {
            foreach ($d['usuarios'] ?? [] as $c) {
                if ($c['usuario'] === $login) {
                    return 'existe';
                }
            }
            $d['usuarios'][] = [
                'usuario' => $login,
                'uid' => bin2hex(random_bytes(16)),
                'hash' => $hash,
                'admin' => $admin,
                'ativo' => true,
                'deveTrocarSenha' => true,
                'versaoSessao' => random_int(1 << 20, 1 << 40),
                'criadoEm' => gmdate('c'),
                'ultimoLogin' => null,
                'aparelhos' => [],
            ];
            return 'ok';
        }
    );
}

function d26_contas_redefinir(string $priv, string $login, string $hash): string
{
    return d26_contas_mutar($priv, $login, static function (array &$c) use ($hash): string {
        $c['hash'] = $hash;
        $c['deveTrocarSenha'] = true;
        $c['versaoSessao'] = (int) $c['versaoSessao'] + 1;
        $c['aparelhos'] = [];
        return 'ok';
    });
}

function d26_contas_definir_ativo(string $priv, string $login, bool $ativo): string
{
    return d26_contas_mutar($priv, $login, static function (array &$c) use ($ativo): string {
        if ($c['ativo'] !== $ativo && !$ativo) {
            $c['versaoSessao'] = (int) $c['versaoSessao'] + 1;
            $c['aparelhos'] = [];
        }
        $c['ativo'] = $ativo;
        return 'ok';
    });
}

function d26_contas_excluir(string $priv, string $login): string
{
    return d26_contas_mutar($priv, $login, static fn (array &$c): string => 'excluida');
}

/** Troca de senha pelo próprio usuário. Devolve a nova versaoSessao ou 0. */
function d26_contas_trocar_senha(string $priv, string $login, string $hash): int
{
    $versao = 0;
    d26_contas_mutar($priv, $login, static function (array &$c) use ($hash, &$versao): string {
        $c['hash'] = $hash;
        $c['deveTrocarSenha'] = false;
        $c['versaoSessao'] = (int) $c['versaoSessao'] + 1;
        $c['aparelhos'] = [];
        $versao = (int) $c['versaoSessao'];
        return 'ok';
    });
    return $versao;
}

/**
 * Registra o login; se $novoHash vier (rehash por parâmetros novos), troca o hash
 * SÓ se a conta ainda é a que foi lida ($lida: mesmo hash, versaoSessao e uid),
 * conferido dentro do lock. Senão uma redefinição ou troca de senha feita durante
 * o Argon2id lento seria desfeita pelo rehash da senha antiga.
 *
 * @param array<string, mixed> $lida
 */
function d26_contas_registrar_login(string $priv, string $login, ?string $novoHash, array $lida): void
{
    d26_contas_mutar($priv, $login, static function (array &$c) use ($novoHash, $lida): string {
        $c['ultimoLogin'] = gmdate('c');
        $intacta = hash_equals((string) $lida['hash'], (string) $c['hash'])
            && (int) $lida['versaoSessao'] === (int) $c['versaoSessao']
            && (string) ($lida['uid'] ?? '') === (string) ($c['uid'] ?? '');
        if ($novoHash !== null && $intacta) {
            $c['hash'] = $novoHash;
        }
        return 'ok';
    });
}
