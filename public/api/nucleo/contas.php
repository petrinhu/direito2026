<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Contas de usuário (usuarios.json): {"versao":1,"usuarios":[{usuario, hash,
 * admin, ativo, deveTrocarSenha, versaoSessao, criadoEm, ultimoLogin}]}.
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

/** Senha provisória escolhida por quem administra: 1 a 128 caracteres. */
function d26_senha_provisoria_valida(string $senha): bool
{
    if (!mb_check_encoding($senha, 'UTF-8')) {
        return false;
    }
    $n = mb_strlen($senha, 'UTF-8');
    return $n >= 1 && $n <= 128;
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
    if ($conta === null) {
        d26_hash_senha($senha);
        return false;
    }
    return password_verify($senha, (string) $conta['hash']);
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
                'hash' => $hash,
                'admin' => $admin,
                'ativo' => true,
                'deveTrocarSenha' => true,
                'versaoSessao' => 1,
                'criadoEm' => gmdate('c'),
                'ultimoLogin' => null,
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
        return 'ok';
    });
}

function d26_contas_definir_ativo(string $priv, string $login, bool $ativo): string
{
    return d26_contas_mutar($priv, $login, static function (array &$c) use ($ativo): string {
        if ($c['ativo'] !== $ativo && !$ativo) {
            $c['versaoSessao'] = (int) $c['versaoSessao'] + 1;
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
        $versao = (int) $c['versaoSessao'];
        return 'ok';
    });
    return $versao;
}

/** Registra o login; se $novoHash vier (rehash por parâmetros novos), troca o hash. */
function d26_contas_registrar_login(string $priv, string $login, ?string $novoHash): void
{
    d26_contas_mutar($priv, $login, static function (array &$c) use ($novoHash): string {
        $c['ultimoLogin'] = gmdate('c');
        if ($novoHash !== null) {
            $c['hash'] = $novoHash;
        }
        return 'ok';
    });
}
