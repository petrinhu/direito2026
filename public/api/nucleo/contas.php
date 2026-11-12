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
/**
 * Teto de caracteres de uma senha que se CONFERE (login, senha atual da troca e senha nova).
 * Nenhuma senha válida passa do teto (CLI, troca e redefinição recusam acima dele), então
 * uma senha maior não tem conta correspondente: é recusada antes do Argon2id (X9).
 */
const D26_SENHA_MAXIMA = 128;
const D26_ALFABETO_PROVISORIA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function d26_contas_arquivo(string $priv): string
{
    return $priv . '/usuarios.json';
}

function d26_login_valido(string $login): bool
{
    return preg_match('/^[A-Za-z0-9._-]{3,32}$/D', $login) === 1;
}

/** Limites do e-mail da conta (EM-B1, 8.1.1), medidos depois do trim. */
const D26_EMAIL_MINIMO = 6;
const D26_EMAIL_MAXIMO = 254;

/**
 * Normaliza o e-mail da conta ou devolve null se ele não serve. Regras, nesta ordem: trim; só ASCII
 * imprimível (sem espaço, CR, LF, NUL); de 6 a 254 caracteres; FILTER_VALIDATE_EMAIL; minúsculas.
 * Endereço fora do ASCII é recusado nesta versão. Não é ecoado em mensagem nenhuma (chamador).
 */
function d26_email_normalizar(mixed $bruto): ?string
{
    if (!is_string($bruto)) {
        return null;
    }
    $email = trim($bruto);
    $tamanho = strlen($email);
    if ($tamanho < D26_EMAIL_MINIMO || $tamanho > D26_EMAIL_MAXIMO) {
        return null;
    }
    if (preg_match('/^[\x21-\x7E]+$/D', $email) !== 1 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        return null;
    }
    return strtolower($email);
}

/**
 * Outra conta (que não $loginIgnorado) já usa este e-mail? Chamada SÓ dentro do lock de usuarios.json:
 * é a unicidade do CAS. Compara em minúsculas.
 *
 * @param array<mixed> $usuarios contas (crus ou validadas)
 */
function d26_email_em_uso(array $usuarios, string $email, string $loginIgnorado): bool
{
    foreach ($usuarios as $c) {
        if (is_array($c) && ($c['usuario'] ?? null) !== $loginIgnorado && isset($c['email'])
            && is_string($c['email']) && strtolower($c['email']) === $email) {
            return true;
        }
    }
    return false;
}

/** Devolve a mensagem de recusa em pt-br, ou null se a senha nova serve. */
function d26_validar_senha_nova(string $nova, string $login, string $atual): ?string
{
    if (!mb_check_encoding($nova, 'UTF-8')) {
        return 'A senha contém caracteres inválidos.';
    }
    $tamanho = mb_strlen($nova, 'UTF-8');
    if ($tamanho < 15) {
        return 'A senha precisa ter pelo menos 15 caracteres.';
    }
    if ($tamanho > D26_SENHA_MAXIMA) {
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
    return $n >= $minimo && $n <= D26_SENHA_MAXIMA;
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
 * Senha acima de D26_SENHA_MAXIMA é recusada ANTES de qualquer hash e sem olhar a conta:
 * o resultado é o mesmo para conta existente e inexistente (sem enumeração) e não há custo
 * de Argon2id que um atacante possa multiplicar com um corpo de 1 MiB.
 */
function d26_senha_confere(?array $conta, string $senha): bool
{
    if (mb_strlen($senha, 'UTF-8') > D26_SENHA_MAXIMA) {
        return false;
    }
    if ($conta === null) {
        d26_argon_marcado(static fn (): string => d26_hash_senha($senha));
        return false;
    }
    return d26_argon_marcado(static fn (): bool => password_verify($senha, (string) $conta['hash']));
}

/**
 * Roda UMA operação Argon2id entre as marcas de teste. As marcas envolvem a operação, não a
 * função de quem chama: assim a contagem de verificacoes() prova que o hash rodou de verdade
 * (um atalho que pule o hash deixa de gerar marca). Sem efeito fora de php -S com D26_PRIVADO.
 */
function d26_argon_marcado(callable $operacao): mixed
{
    d26_teste_marcar('i');
    try {
        return $operacao();
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
    // clearstatcache: o PHP guarda o último resultado de stat; sem limpar, is_file repete "existe" e a pausa
    // nunca é solta (medido: o pedido ficava parado até o teto de 15 s, e o teste lia o estado antes da gravação).
    while (is_file($dir . '/pausa-' . $ponto) && microtime(true) < $limite) {
        clearstatcache(true, $dir . '/pausa-' . $ponto);
        usleep(10000);
    }
}

/**
 * Sinal de teste: PRIV/sinal-<nome> diz que o pedido terminou o trabalho que vem depois da resposta. A resposta sai
 * antes da gravação e do E2 (TE4), então o teste espera este sinal para saber que o pedido acabou. No-op em produção.
 */
function d26_teste_sinal(string $nome): void
{
    if (PHP_SAPI !== 'cli-server') {
        return;
    }
    $dir = getenv('D26_PRIVADO');
    if (is_string($dir) && $dir !== '') {
        @file_put_contents($dir . '/sinal-' . $nome, "1\n");
    }
}

/**
 * Valida o TIPO de cada campo da conta. Tipo errado (arquivo editado à mão ou
 * corrompido) é D26Indisponivel, fechado: `1`/"true" nunca passam por booleano.
 * uid ausente é aceito aqui (a sessão e o login recusam conta sem uid); presente,
 * tem de ser string. `aparelhos` ausente vale []. `sessaoVigente` (marcador de sessão
 * única, ver d26_marcador_confere) é opcional: ausente ou string. `convite` (registro do link,
 * ver d26_convite_valido) e `conviteUsado` (sha256 em hex) são opcionais e fechados.
 * Chave desconhecida no arquivo da conta é ignorada: só os campos listados são validados.
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
        && (!array_key_exists('aparelhos', $c) || is_array($c['aparelhos']))
        && (!array_key_exists('sessaoVigente', $c) || is_string($c['sessaoVigente']))
        && (!array_key_exists('convite', $c) || d26_convite_valido($c['convite']))
        && (!array_key_exists('conviteUsado', $c) || d26_hash_hex_valido($c['conviteUsado']))
        && (!array_key_exists('email', $c) || is_string($c['email']))
        && (!array_key_exists('envioFalhouEm', $c) || is_string($c['envioFalhouEm']))
        && (!array_key_exists('vigenteDesde', $c) || is_int($c['vigenteDesde']))
        && (!array_key_exists('vigenteAparelho', $c) || d26_hash_hex_valido($c['vigenteAparelho']))
        && (!array_key_exists('usoSimultaneo', $c) || is_int($c['usoSimultaneo']))
        && (!array_key_exists('quedaContadaPara', $c) || d26_hash_hex_valido($c['quedaContadaPara']))
        && (!array_key_exists('bloqueada', $c) || d26_bloqueio_valido($c['bloqueada']));
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

/**
 * Sessão única (SU-B1): o marcador `sessaoVigente` da conta confere com o do outro lado
 * (a sessão, em $_SESSION['vigente'], ou a conta lida antes de uma ação). null = ausente.
 * Os dois ausentes conferem: conta da v1.6.1.0, sem marcador, segue válida até o primeiro
 * login novo. Um ausente só, valor de tipo errado ou valor diferente NÃO conferem (fechado).
 * Fica FORA de d26_conta_igual_lida de propósito: o login não a usa (dois logins em voo
 * passam o compare-and-swap, e o último a gravar é o que vale), mas a troca de senha e as
 * ações do admin usam, para que um aparelho já substituído não aja.
 */
function d26_marcador_confere(mixed $daConta, mixed $doOutro): bool
{
    if ($daConta === null || $doOutro === null) {
        return $daConta === null && $doOutro === null;
    }
    return is_string($daConta) && is_string($doOutro) && hash_equals($daConta, $doOutro);
}

/** sha256 em hex minúsculo: 64 caracteres. Qualquer outra coisa é tipo errado (fechado). */
function d26_hash_hex_valido(mixed $valor): bool
{
    return is_string($valor) && preg_match('/^[0-9a-f]{64}$/D', $valor) === 1;
}

/** Bloqueio por uso simultâneo (BL-B1): objeto com o instante (inteiro) e o motivo fixo. Outra forma é tipo errado. */
function d26_bloqueio_valido(mixed $bloqueio): bool
{
    return is_array($bloqueio) && is_int($bloqueio['em'] ?? null) && ($bloqueio['motivo'] ?? null) === 'uso-simultaneo';
}

/**
 * Condições (a), (b) e (c) de 9.1.1 para uma sessão derrubada que fez pedido, contra a conta lida. $atividade e
 * $criada são da sessão derrubada; $aparelhoPedido é o sha256 do cookie de aparelho do pedido (null se não trouxe).
 * (a) a última atividade é de até N antes do login vigente; (b) o pedido chega até N depois dele; (c) o cookie do
 * pedido não é o do login vigente. Sem cookie nos dois lados vale a reserva: não conta quando a sessão foi criada
 * até D26_USO_RESERVA antes do login vigente. Função pura: o relógio entra por $agora.
 *
 * @param array<string, mixed> $conta
 */
function d26_uso_simultaneo_vale(array $conta, int $atividade, int $criada, ?string $aparelhoPedido, int $agora): bool
{
    $desde = $conta['vigenteDesde'] ?? null;
    if (!is_int($desde)) {
        return false;
    }
    if ($atividade < $desde - D26_USO_JANELA || $agora - $desde > D26_USO_JANELA) {
        return false;
    }
    $aparelhoVigente = $conta['vigenteAparelho'] ?? null;
    if ($aparelhoVigente === null && $aparelhoPedido === null) {
        return $criada < $desde - D26_USO_RESERVA;
    }
    return $aparelhoVigente === null || $aparelhoPedido === null || !hash_equals((string) $aparelhoVigente, $aparelhoPedido);
}

/**
 * Registro do convite por link (CV-B1): {"hash": sha256 do token, "expiraEm": epoch}. O token em
 * claro nunca entra na conta; a conferência no CV-B2 é por hash_equals.
 */
function d26_convite_valido(mixed $convite): bool
{
    return is_array($convite)
        && d26_hash_hex_valido($convite['hash'] ?? null)
        && is_int($convite['expiraEm'] ?? null);
}

/** Token do link: 256 bits aleatórios (NIST 4.1.2.2 pede 112), em 64 hex. */
function d26_convite_token(): string
{
    return bin2hex(random_bytes(32));
}

/**
 * O que a conta guarda do convite: o sha256 do token e o prazo de D26_CONVITE_VALIDADE a partir de $agora.
 *
 * @return array{hash: string, expiraEm: int}
 */
function d26_convite_registro(string $token, int $agora, int $validade = D26_CONVITE_VALIDADE): array
{
    return ['hash' => hash('sha256', $token), 'expiraEm' => $agora + $validade];
}

/** Token recebido na página do convite: 64 hex minúsculos e string. Qualquer outra coisa (ausente, lista, tamanho, maiúsculas) é null. */
function d26_convite_token_recebido(mixed $bruto): ?string
{
    return is_string($bruto) && preg_match('/^[0-9a-f]{64}$/D', $bruto) === 1 ? $bruto : null;
}

/**
 * Classifica o link da página pública (CV-B2) pelo sha256 do token: 'valido' (convite pendente no prazo, com a
 * conta em 'conta'), 'vencido' (convite com o hash, prazo passado), 'usado' (é o último consumido) ou 'nao-vale'.
 * Lê sem lock: quem grava confere de novo, dentro do lock (d26_contas_consumir_convite).
 *
 * @param list<array<string, mixed>> $contas
 * @return array{estado: string, conta: ?array<string, mixed>}
 */
function d26_convite_classificar(array $contas, string $token, int $agora): array
{
    $hash = hash('sha256', $token);
    foreach ($contas as $c) {
        if (is_array($c['convite'] ?? null) && hash_equals((string) $c['convite']['hash'], $hash)) {
            return ['estado' => (int) $c['convite']['expiraEm'] > $agora ? 'valido' : 'vencido', 'conta' => $c];
        }
    }
    foreach ($contas as $c) {
        if (is_string($c['conviteUsado'] ?? null) && hash_equals($c['conviteUsado'], $hash)) {
            return ['estado' => 'usado', 'conta' => null];
        }
    }
    return ['estado' => 'nao-vale', 'conta' => null];
}

/**
 * Consome o convite e grava a senha nova numa ÚNICA mutação sob lock (CV-B2, compare-and-swap). Invariante: só
 * grava se a conta ainda é a lida (ativa, mesmo uid), o convite ainda é o mesmo (mesmo hash) e não venceu.
 * Gravado: hash da senha, troca obrigatória cumprida, versaoSessao + 1 (derruba sessões), aparelhos vazios,
 * conviteUsado com o hash consumido (para a mensagem M2) e o convite apagado. Devolve 'ok' ou 'divergente'.
 */
function d26_contas_consumir_convite(string $priv, string $login, string $uid, string $hashConvite, string $hashSenha, int $agora, ?string &$email = null): string
{
    $email = null;
    $resultado = d26_contas_mutar($priv, $login, static function (array &$c) use ($uid, $hashConvite, $hashSenha, $agora, &$email): string {
        $convite = $c['convite'] ?? null;
        if (($c['ativo'] ?? null) !== true
            || !is_string($c['uid'] ?? null) || !hash_equals($uid, $c['uid'])
            || !is_array($convite) || !hash_equals($hashConvite, (string) $convite['hash'])
            || (int) $convite['expiraEm'] <= $agora) {
            return 'divergente';
        }
        $c['hash'] = $hashSenha;
        $c['deveTrocarSenha'] = false;
        $c['versaoSessao'] = (int) $c['versaoSessao'] + 1;
        $c['aparelhos'] = [];
        $c['conviteUsado'] = $hashConvite;
        unset($c['convite']);
        // O e-mail que recebe o aviso E4 é o da conta NO MOMENTO da troca (lido dentro do lock, 8.1.4).
        $email = isset($c['email']) ? (string) $c['email'] : null;
        return 'ok';
    });
    return $resultado === 'ok' ? 'ok' : 'divergente';
}

/** Caminho que a API devolve ao admin. O painel compõe a origem; o servidor nunca usa o Host. */
function d26_convite_caminho(string $token): string
{
    return '/api/convite.php?t=' . $token;
}

/**
 * Senha inverificável: Argon2id de 32 bytes aleatórios, descartados logo depois. A conta com convite
 * pendente recusa qualquer senha e custa o mesmo Argon2id de qualquer outra (G6, sem enumeração).
 */
function d26_hash_inverificavel(): string
{
    return d26_hash_senha(bin2hex(random_bytes(32)));
}

/** Estado do convite para o painel: 'pendente', 'vencido' ou null (sem convite). Nunca o hash. */
function d26_convite_estado(mixed $convite, int $agora): ?string
{
    if (!is_array($convite)) {
        return null;
    }
    return (int) $convite['expiraEm'] > $agora ? 'pendente' : 'vencido';
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

/**
 * Campos que a API pode expor: nunca o hash da senha nem o do convite (só o estado e o prazo).
 *
 * @return array<string, mixed>
 */
function d26_conta_publica(array $c, ?int $agora = null): array
{
    $agora ??= time();
    return [
        'usuario' => $c['usuario'],
        'admin' => (bool) $c['admin'],
        'ativo' => (bool) $c['ativo'],
        'deveTrocarSenha' => (bool) $c['deveTrocarSenha'],
        'criadoEm' => $c['criadoEm'],
        'ultimoLogin' => $c['ultimoLogin'],
        'aparelhos' => is_array($c['aparelhos'] ?? null) ? count($c['aparelhos']) : 0,
        'convite' => d26_convite_estado($c['convite'] ?? null, $agora),
        'conviteExpiraEm' => is_array($c['convite'] ?? null) ? $c['convite']['expiraEm'] : null,
        // O e-mail sai só para quem administra (esta função só é chamada pela listagem do admin).
        'email' => isset($c['email']) ? (string) $c['email'] : null,
        'envioFalhouEm' => is_string($c['envioFalhouEm'] ?? null) ? $c['envioFalhouEm'] : null,
        // Uso simultâneo (BL-B1): só o contador e o instante do bloqueio. Nunca os marcadores de aparelho e de queda.
        'usoSimultaneo' => (int) ($c['usoSimultaneo'] ?? 0),
        'bloqueadaEm' => is_array($c['bloqueada'] ?? null) ? (int) $c['bloqueada']['em'] : null,
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

/**
 * Cria a conta. $email (já normalizado, ou null) é conferido de unicidade DENTRO do lock.
 *
 * @return 'ok'|'existe'|'email-em-uso'
 */
function d26_contas_criar(string $priv, string $login, string $hash, bool $admin, ?string $email = null): string
{
    return d26_atualizar_json(
        d26_contas_arquivo($priv),
        D26_CONTAS_PADRAO,
        static function (array &$d) use ($login, $hash, $admin, $email): string {
            foreach ($d['usuarios'] ?? [] as $c) {
                if ($c['usuario'] === $login) {
                    return 'existe';
                }
            }
            if ($email !== null && d26_email_em_uso($d['usuarios'] ?? [], $email, $login)) {
                return 'email-em-uso';
            }
            $nova = d26_conta_nova($login, $hash, $admin);
            if ($email !== null) {
                $nova['email'] = $email;
            }
            $d['usuarios'][] = $nova;
            return 'ok';
        }
    );
}

/** CLI redefinir-senha: o convite pendente sai junto (senão haveria duas portas abertas, CV-B1 C9). */
function d26_contas_redefinir(string $priv, string $login, string $hash): string
{
    return d26_contas_mutar($priv, $login, static function (array &$c) use ($hash): string {
        $c['hash'] = $hash;
        $c['deveTrocarSenha'] = true;
        $c['versaoSessao'] = (int) $c['versaoSessao'] + 1;
        $c['aparelhos'] = [];
        unset($c['convite']);
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
        if (!$ativo) {
            unset($c['convite']); // conta desativada não tem link de primeiro acesso (CV-B1 C5)
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
 * Marca ou apaga a falha de envio do e-mail da conta (8.1.2). Com $quando (ISO 8601), grava a hora da falha; sem
 * ele, apaga a marca no envio bem-sucedido. Uma mutação sob lock, sem tocar em mais nada da conta.
 */
function d26_contas_marcar_envio(string $priv, string $login, ?string $quando): string
{
    return d26_contas_mutar($priv, $login, static function (array &$c) use ($quando): string {
        if ($quando === null) {
            unset($c['envioFalhouEm']);
        } else {
            $c['envioFalhouEm'] = $quando;
        }
        return 'ok';
    });
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
        if (!d26_conta_igual_lida($c, $lida) || !d26_marcador_confere($c['sessaoVigente'] ?? null, $lida['sessaoVigente'] ?? null)) {
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
 * Sessão única (SU-B1): a cada login efetivado a conta ganha um marcador novo
 * (`sessaoVigente`, sorteado DENTRO do lock) e ele sai em $vigente. O marcador não
 * entra na conferência do lock: dois logins em voo passam os dois, e vence o que
 * gravar por último. As sessões de login anterior caem na próxima conferência.
 *
 * @param array<string, mixed> $lida
 */
function d26_contas_efetivar_login(string $priv, string $login, array $lida, ?string $novoHash, ?string $tokenAparelho, ?int $agora = null, ?string $aparelhoPresente = null, ?string &$vigente = null): ?int
{
    $versao = null;
    $agora ??= time();
    d26_contas_mutar($priv, $login, static function (array &$c) use ($lida, $novoHash, $tokenAparelho, $aparelhoPresente, $agora, &$versao, &$vigente): string {
        if (!d26_conta_igual_lida($c, $lida)) {
            return 'divergente';
        }
        // BL-B1: a conta bloqueada não entra, mesmo que a senha tenha conferido antes do bloqueio (corrida, 9.2).
        if (array_key_exists('bloqueada', $c)) {
            return 'bloqueada';
        }
        $c['ultimoLogin'] = gmdate('c');
        if ($novoHash !== null) {
            $c['hash'] = $novoHash;
        }
        if ($tokenAparelho !== null) {
            d26_dispositivo_anexar($c, $tokenAparelho, $agora);
        }
        // Aparelho do login vigente (BL-B1, condição (c)): o novo, ou o já confiável que chegou no pedido.
        $aparelho = $tokenAparelho !== null ? d26_dispositivo_hash($tokenAparelho) : $aparelhoPresente;
        if ($aparelho !== null) {
            $c['vigenteAparelho'] = $aparelho;
        } else {
            unset($c['vigenteAparelho']);
        }
        $c['vigenteDesde'] = $agora;
        $vigente = bin2hex(random_bytes(16));
        $c['sessaoVigente'] = $vigente;
        $versao = (int) $c['versaoSessao'];
        return 'ok';
    });
    return $versao;
}

/**
 * Conta uma ocorrência de uso simultâneo (BL-B1) numa ÚNICA mutação sob o lock de usuarios.json. O CAS confere a
 * conta lida (ativa, uid, versão, hash) e o marcador que derrubou a sessão. Idempotente por quedaContadaPara (sha256
 * do marcador): uma queda por login conta uma vez, mesmo com pedidos paralelos. A conta admin nunca é bloqueada: só
 * o contador sobe. Na ocorrência que chega a D26_USO_BLOQUEIO_EM numa conta comum grava bloqueada e faz
 * versaoSessao + 1 (a sessão que ficou também cai). Devolve 'contou', 'bloqueou', 'nao-conta' ou 'divergente'.
 * $ordinal (BL-B2) recebe o número da ocorrência lido DENTRO do lock, para o aviso; só é preenchido em 'contou' e 'bloqueou'.
 *
 * @param array<string, mixed> $lida
 */
function d26_contas_contar_uso(string $priv, array $lida, int $atividade, int $criada, ?string $aparelhoPedido, int $agora, ?int &$ordinal = null): string
{
    $resultado = 'nao-conta';
    if (!is_string($lida['sessaoVigente'] ?? null)) {
        return $resultado;
    }
    d26_contas_mutar($priv, (string) $lida['usuario'], static function (array &$c) use ($lida, $atividade, $criada, $aparelhoPedido, $agora, &$resultado, &$ordinal): string {
        if (!d26_conta_igual_lida($c, $lida) || !d26_marcador_confere($c['sessaoVigente'] ?? null, $lida['sessaoVigente'])) {
            $resultado = 'divergente';
            return 'divergente';
        }
        $marca = hash('sha256', (string) $c['sessaoVigente']);
        if (array_key_exists('bloqueada', $c) || ($c['quedaContadaPara'] ?? null) === $marca
            || !d26_uso_simultaneo_vale($c, $atividade, $criada, $aparelhoPedido, $agora)) {
            return 'nao-conta';
        }
        $c['usoSimultaneo'] = (int) ($c['usoSimultaneo'] ?? 0) + 1;
        $c['quedaContadaPara'] = $marca;
        $ordinal = $c['usoSimultaneo']; // lido DENTRO do lock: um Desbloquear antes do lock não desloca o número (BL-B2)
        $resultado = 'contou';
        if ($c['admin'] !== true && $c['usoSimultaneo'] >= D26_USO_BLOQUEIO_EM) {
            $c['bloqueada'] = ['em' => $agora, 'motivo' => 'uso-simultaneo'];
            $c['versaoSessao'] = (int) $c['versaoSessao'] + 1;
            $c['aparelhos'] = [];
            $resultado = 'bloqueou';
        }
        return 'ok';
    });
    return $resultado;
}

/**
 * Ações do admin sobre contas, TODAS sob um único lock e com o ATOR revalidado
 * dentro dele (admin, ativo, mesmo uid, versaoSessao e marcador sessaoVigente da sessão): um admin
 * desativado entre a leitura da sessão e a ação não age mais, e dois admins que
 * se desativam ao mesmo tempo não zeram a administração. Invariante: depois de
 * qualquer ação sobra pelo menos um admin ativo; se não sobrasse, nada é gravado.
 * Devolve 'ok' | 'existe' | 'nao-encontrado' | 'ator-invalido' | 'ultimo-admin'.
 * Não há promoção a admin pela API (existe um admin por desenho; o CLI cria o primeiro).
 *
 * $convite é o registro do link (d26_convite_registro), já pronto FORA do lock: só o sha256 entra
 * na conta. Criar e redefinir gravam esse registro; desativar apaga o convite; os outros não mexem.
 *
 * $email (EM-B1, já normalizado): criar grava; a ação 'email' troca e apaga o convite pendente. A unicidade
 * é conferida DENTRO deste lock ('email-em-uso', nada gravado). Devolve também 'email-em-uso'.
 *
 * @param array<string, mixed> $ator conta lida da sessão
 * @param ?array{hash: string, expiraEm: int} $convite
 */
function d26_admin_agir(string $priv, array $ator, string $acao, string $alvo, ?string $hash = null, ?array $convite = null, ?string $email = null, ?string &$emailLido = null): string
{
    // $emailLido: o e-mail da conta alvo lido DENTRO do lock, só no 'redefinir' (P9: o E3 não pode ler o e-mail depois do lock).
    $emailLido = null;
    return d26_atualizar_json(
        d26_contas_arquivo($priv),
        D26_CONTAS_PADRAO,
        static function (array &$d) use ($ator, $acao, $alvo, $hash, $convite, $email, &$emailLido): string {
            $original = $d;
            $us = array_values(array_map('d26_conta_validar', $d['usuarios'] ?? []));
            $atorOk = false;
            foreach ($us as $c) {
                if ($c['usuario'] === ($ator['usuario'] ?? null)) {
                    $atorOk = $c['admin'] === true && $c['ativo'] === true
                        && is_string($c['uid'] ?? null) && $c['uid'] !== ''
                        && is_string($ator['uid'] ?? null) && hash_equals($c['uid'], $ator['uid'])
                        && is_int($ator['versaoSessao'] ?? null) && $c['versaoSessao'] === $ator['versaoSessao']
                        && d26_marcador_confere($c['sessaoVigente'] ?? null, $ator['sessaoVigente'] ?? null);
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
                if ($email !== null && d26_email_em_uso($us, $email, $alvo)) {
                    return 'email-em-uso';
                }
                $nova = d26_conta_nova($alvo, (string) $hash, false);
                if ($email !== null) {
                    $nova['email'] = $email;
                }
                if ($convite !== null) {
                    $nova['convite'] = $convite;
                }
                $us[] = $nova;
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
                        unset($c['conviteUsado'], $c['convite']); // o link anterior morre aqui
                        if ($convite !== null) {
                            $c['convite'] = $convite;
                        }
                        // O destino do E3 é o e-mail que a conta tinha neste lock (P9, como o E4 do CAS em convite).
                        $emailLido = isset($c['email']) ? (string) $c['email'] : null;
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
                        unset($c['convite']);
                        break;
                    case 'revogar-aparelhos':
                        // Decisão do CTO: revogar também derruba as sessões do alvo.
                        $c['versaoSessao'] += 1;
                        $c['aparelhos'] = [];
                        break;
                    case 'email':
                        // Troca de e-mail: unicidade no lock; o convite pendente (link ao endereço antigo) morre aqui.
                        if ($email === null || d26_email_em_uso($us, $email, $alvo)) {
                            return $email === null ? 'email-invalido' : 'email-em-uso';
                        }
                        $c['email'] = $email;
                        unset($c['convite']);
                        break;
                    case 'desbloquear':
                        // BL-B1 (9.1.4): tira o bloqueio e zera a contagem. Não troca a senha nem a versão da sessão.
                        unset($c['bloqueada'], $c['quedaContadaPara']);
                        $c['usoSimultaneo'] = 0;
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

/**
 * Conta que o pedido "Esqueci a senha" identifica (EM-B4, 8.1.3): com '@' é e-mail (normalizado, único no lock),
 * sem '@' é login (formato de d26_login_valido, H1). Entrada inválida ou sem conta devolve null, sem exceção.
 *
 * @param list<array<string, mixed>> $contas
 * @return array<string, mixed>|null
 */
function d26_contas_pedido_achar(array $contas, string $pedido): ?array
{
    $pedido = trim($pedido);
    if ($pedido === '') {
        return null;
    }
    if (str_contains($pedido, '@')) {
        $email = d26_email_normalizar($pedido);
        if ($email === null) {
            return null;
        }
        foreach ($contas as $c) {
            if (($c['email'] ?? null) === $email) {
                return $c;
            }
        }
        return null;
    }
    if (!d26_login_valido($pedido)) {
        return null;
    }
    foreach ($contas as $c) {
        if (($c['usuario'] ?? null) === $pedido) {
            return $c;
        }
    }
    return null;
}

/**
 * Grava o convite do pedido "Esqueci a senha" sob lock (EM-B4, 8.1.3). Troca SÓ o convite: a senha, a versão da
 * sessão, os aparelhos e a sessão aberta não mudam (E29t). Confere DENTRO do lock o uid e o e-mail que o pedido leu
 * antes: se a conta mudou (troca de e-mail, desativação, exclusão), não grava e devolve 'divergente'. O e-mail que
 * recebe o E2 sai por $emailNoLock, preenchido no lock: nunca vem da leitura anterior.
 *
 * @param array{hash: string, expiraEm: int} $registro
 */
function d26_contas_pedir_senha(string $priv, string $login, array $registro, string $uidLido, string $emailLido, ?string &$emailNoLock = null): string
{
    $emailNoLock = null;
    return d26_contas_mutar($priv, $login, static function (array &$c) use ($registro, $uidLido, $emailLido, &$emailNoLock): string {
        if (($c['ativo'] ?? null) !== true || !is_string($c['email'] ?? null) || !is_string($c['uid'] ?? null)) {
            return 'inelegivel';
        }
        if (!hash_equals($uidLido, $c['uid']) || $c['email'] !== $emailLido) {
            return 'divergente';
        }
        $c['convite'] = $registro;
        $emailNoLock = (string) $c['email'];
        return 'ok';
    });
}
