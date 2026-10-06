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

/**
 * Gancho de teste de corrida DETERMINÍSTICO: se existir PRIV/pausa-<ponto>, o
 * processo avisa que chegou (linha em PRIV/pausado-<ponto>) e dorme até o
 * marcador sumir (teto de 15 s, para um bug nunca pendurar a suíte). Só age sob
 * php -S com D26_PRIVADO; em produção (PHP_SAPI nunca é cli-server) não faz
 * nada. Chamado SEMPRE fora de qualquer lock. $chave (login do ator) permite
 * pausar só um dos processos que chegam ao mesmo ponto.
 */
function d26_teste_pausar(string $ponto, string $chave = ''): void
{
    if (PHP_SAPI !== 'cli-server') {
        return;
    }
    $dir = getenv('D26_PRIVADO');
    if (!is_string($dir) || $dir === '' || !is_file($dir . '/pausa-' . $ponto)) {
        return;
    }
    // O conteúdo do marcador escolhe quem pausa: '*' todos, ou só a $chave (o login do ator).
    $alvo = trim((string) @file_get_contents($dir . '/pausa-' . $ponto));
    if ($alvo !== '*' && $alvo !== $chave) {
        return;
    }
    @file_put_contents($dir . '/pausado-' . $ponto, "1\n", FILE_APPEND | LOCK_EX);
    $limite = microtime(true) + 15;
    while (is_file($dir . '/pausa-' . $ponto) && microtime(true) < $limite) {
        usleep(10000);
    }
}

/**
 * Valida o TIPO de cada campo da conta. Tipo errado (arquivo editado à mão ou
 * corrompido) é D26Indisponivel, fechado: `1`/"true" nunca passam por booleano.
 * uid ausente é aceito aqui (a sessão e o login recusam conta sem uid); presente,
 * tem de ser string. `aparelhos` ausente vale [].
 *
 * @param array<mixed> $c
 * @return array<string, mixed>
 */
function d26_conta_validar(array $c): array
{
    $ok = is_string($c['usuario'] ?? null)
        && is_string($c['hash'] ?? null)
        && is_bool($c['admin'] ?? null)
        && is_bool($c['ativo'] ?? null)
        && is_bool($c['deveTrocarSenha'] ?? null)
        && is_int($c['versaoSessao'] ?? null)
        && is_string($c['criadoEm'] ?? null)
        && (($c['ultimoLogin'] ?? null) === null || is_string($c['ultimoLogin']))
        && (!array_key_exists('uid', $c) || is_string($c['uid']))
        && (!array_key_exists('aparelhos', $c) || is_array($c['aparelhos']));
    if (!$ok) {
        throw new D26Indisponivel('conta com campo de tipo inválido');
    }
    return $c;
}

/**
 * A conta (lida DENTRO do lock) ainda é a que o chamador leu antes do trabalho
 * lento: ativa, mesmo uid, mesma versaoSessao e mesmo hash. É a comparação
 * (compare-and-swap) que impede uma ação baseada em leitura velha de sobrescrever
 * redefinição, desativação ou exclusão+recriação ocorridas no meio.
 *
 * @param array<string, mixed> $c
 * @param array<string, mixed> $lida
 */
function d26_conta_igual_lida(array $c, array $lida): bool
{
    d26_conta_validar($c);
    return $c['ativo'] === true
        && is_string($lida['uid'] ?? null) && $lida['uid'] !== ''
        && is_string($c['uid'] ?? null)
        && hash_equals($lida['uid'], $c['uid'])
        && is_int($lida['versaoSessao'] ?? null)
        && $lida['versaoSessao'] === $c['versaoSessao']
        && is_string($lida['hash'] ?? null)
        && hash_equals($lida['hash'], $c['hash']);
}

/** @return list<array<string, mixed>> */
function d26_contas_listar(string $priv): array
{
    return array_map('d26_conta_validar', array_values(d26_ler_json(d26_contas_arquivo($priv), D26_CONTAS_PADRAO)['usuarios'] ?? []));
}

/** @return array<string, mixed>|null */
function d26_contas_buscar(string $priv, string $login): ?array
{
    return d26_conta_achar(d26_ler_json(d26_contas_arquivo($priv), D26_CONTAS_PADRAO), $login);
}

/**
 * Igual a d26_contas_buscar, mas lendo SOB o lock de usuarios.json (instantâneo
 * consistente). Ordem fixa de locks no núcleo: tentativas.json ANTES de
 * usuarios.json, nunca o inverso (ver limite.php). Esta função pode ser chamada
 * com o lock de tentativas preso; nada sob o lock de usuarios chama o limite.
 *
 * @return array<string, mixed>|null
 */
function d26_contas_buscar_travada(string $priv, string $login): ?array
{
    return d26_conta_achar(d26_ler_json_travado(d26_contas_arquivo($priv), D26_CONTAS_PADRAO), $login);
}

/**
 * @param array<mixed> $dados
 * @return array<string, mixed>|null
 */
function d26_conta_achar(array $dados, string $login): ?array
{
    foreach ($dados['usuarios'] ?? [] as $c) {
        if (is_array($c) && ($c['usuario'] ?? null) === $login) {
            return d26_conta_validar($c);
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
        },
        false,
        false
    );
}

/** @return array<string, mixed> conta nova: nasce com deveTrocarSenha e uid/versaoSessao aleatórios */
function d26_conta_nova(string $login, string $hash, bool $admin): array
{
    return [
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
            $d['usuarios'][] = d26_conta_nova($login, $hash, $admin);
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

/**
 * Troca de senha pelo próprio usuário. Só grava se a conta ainda é a que foi lida
 * ($lida: ativa, mesmo uid, versaoSessao e hash, conferido DENTRO do lock); senão
 * uma redefinição do admin feita durante o Argon2id seria sobrescrita.
 * Devolve a nova versaoSessao, ou 0 se a conta mudou, sumiu ou não confere
 * (nada é gravado, quem chamou responde 409 e NÃO autentica).
 *
 * @param array<string, mixed> $lida
 */
function d26_contas_trocar_senha(string $priv, string $login, string $hash, array $lida): int
{
    $versao = 0;
    d26_contas_mutar($priv, $login, static function (array &$c) use ($hash, $lida, &$versao): string {
        if (!d26_conta_igual_lida($c, $lida)) {
            return 'divergente';
        }
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
 * Efetiva o login numa ÚNICA mutação sob lock: exige a conta ainda igual à lida
 * (ativa, uid, versaoSessao e hash) e então registra ultimoLogin, troca o hash se
 * veio rehash e anexa o aparelho novo ($tokenAparelho, só o sha256 vai ao arquivo).
 * O Argon2id lento roda ANTES, fora do lock. Devolve a versaoSessao vigente, ou
 * null se a conta divergiu (redefinição, desativação, exclusão/recriação durante
 * a verificação): nada é gravado e o login deve ser recusado (401).
 *
 * @param array<string, mixed> $lida
 */
function d26_contas_efetivar_login(string $priv, string $login, array $lida, ?string $novoHash, ?string $tokenAparelho, ?int $agora = null): ?int
{
    $versao = null;
    $agora ??= time();
    d26_contas_mutar($priv, $login, static function (array &$c) use ($lida, $novoHash, $tokenAparelho, $agora, &$versao): string {
        if (!d26_conta_igual_lida($c, $lida)) {
            return 'divergente';
        }
        $c['ultimoLogin'] = gmdate('c');
        if ($novoHash !== null) {
            $c['hash'] = $novoHash;
        }
        if ($tokenAparelho !== null) {
            d26_dispositivo_anexar($c, $tokenAparelho, $agora);
        }
        $versao = (int) $c['versaoSessao'];
        return 'ok';
    });
    return $versao;
}

/**
 * Ações do admin sobre contas, TODAS sob um único lock e com o ATOR revalidado
 * dentro dele (admin, ativo, mesmo uid e versaoSessao da sessão): um admin
 * desativado entre a leitura da sessão e a ação não age mais, e dois admins que
 * se desativam ao mesmo tempo não zeram a administração. Invariante: depois de
 * qualquer ação sobra pelo menos um admin ativo; se não sobrasse, nada é gravado.
 * Devolve 'ok' | 'existe' | 'nao-encontrado' | 'ator-invalido' | 'ultimo-admin'.
 * Não há promoção a admin pela API (existe um admin por desenho; o CLI cria o primeiro).
 *
 * @param array<string, mixed> $ator conta lida da sessão
 */
function d26_admin_agir(string $priv, array $ator, string $acao, string $alvo, ?string $hash = null): string
{
    return d26_atualizar_json(
        d26_contas_arquivo($priv),
        D26_CONTAS_PADRAO,
        static function (array &$d) use ($ator, $acao, $alvo, $hash): string {
            $original = $d;
            $us = array_values(array_map('d26_conta_validar', $d['usuarios'] ?? []));
            $atorOk = false;
            foreach ($us as $c) {
                if ($c['usuario'] === ($ator['usuario'] ?? null)) {
                    $atorOk = $c['admin'] === true && $c['ativo'] === true
                        && is_string($c['uid'] ?? null) && $c['uid'] !== ''
                        && is_string($ator['uid'] ?? null) && hash_equals($c['uid'], $ator['uid'])
                        && is_int($ator['versaoSessao'] ?? null) && $c['versaoSessao'] === $ator['versaoSessao'];
                    break;
                }
            }
            if (!$atorOk) {
                return 'ator-invalido';
            }
            $i = null;
            foreach ($us as $k => $c) {
                if ($c['usuario'] === $alvo) {
                    $i = $k;
                    break;
                }
            }
            if ($acao === 'criar') {
                if ($i !== null) {
                    return 'existe';
                }
                $us[] = d26_conta_nova($alvo, (string) $hash, false);
            } elseif ($i === null) {
                return 'nao-encontrado';
            } else {
                $c = $us[$i];
                switch ($acao) {
                    case 'redefinir':
                        $c['hash'] = (string) $hash;
                        $c['deveTrocarSenha'] = true;
                        $c['versaoSessao'] += 1;
                        $c['aparelhos'] = [];
                        break;
                    case 'ativar':
                        $c['ativo'] = true;
                        break;
                    case 'desativar':
                        if ($c['ativo']) {
                            $c['versaoSessao'] += 1;
                            $c['aparelhos'] = [];
                        }
                        $c['ativo'] = false;
                        break;
                    case 'revogar-aparelhos':
                        // Decisão do CTO: revogar também derruba as sessões do alvo.
                        $c['versaoSessao'] += 1;
                        $c['aparelhos'] = [];
                        break;
                    case 'excluir':
                        break;
                    default:
                        return 'nao-encontrado';
                }
                if ($acao === 'excluir') {
                    array_splice($us, $i, 1);
                } else {
                    $us[$i] = $c;
                }
            }
            $admins = array_filter($us, static fn (array $c): bool => $c['admin'] === true && $c['ativo'] === true);
            if ($admins === []) {
                $d = $original;
                return 'ultimo-admin';
            }
            $d['usuarios'] = $us;
            return 'ok';
        },
        false,
        false
    );
}
