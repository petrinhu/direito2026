<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/**
 * Convite por link no criar e no redefinir (CV-B1, decisão do líder de 08/11/2026: a pessoa cria a
 * própria senha pelo link de 48 h, de uso único). Nesta fatia só o núcleo: o token nasce fora do lock,
 * a conta guarda só o sha256 dele, a senha é inverificável até o link ser usado (CV-B2), e a API não
 * devolve mais senha provisória (R9). Nome de teste começa com "convite:" (filtro do rodar.php).
 * Contas são sintéticas (T25); o link de 48 h é D26_CONVITE_VALIDADE, 172800 s.
 */

const CV_VALIDADE_ESPERADA = 172800;

/** Conta do login no usuarios.json do ambiente (lida do disco, sem o núcleo). */
function conviteConta(Ambiente $a, string $login): ?array
{
    foreach ($a->lerUsuarios()['usuarios'] as $c) {
        if (($c['usuario'] ?? null) === $login) {
            return $c;
        }
    }
    return null;
}

/** Token do link (64 hex) extraído do caminho que a API devolve no criar ou no redefinir. */
function conviteTokenDe(Resposta $r): string
{
    $corpo = $r->json();
    verdadeiro(
        preg_match('#^/api/convite\.php\?t=([0-9a-f]{64})$#', (string) ($corpo['convite'] ?? ''), $m) === 1,
        'a resposta traz o caminho do convite com 64 hex'
    );
    return $m[1];
}

/** Edita o usuarios.json direto (fixture): $fn recebe a conta do login e a devolve alterada. */
function conviteEditarConta(string $priv, string $login, callable $fn): void
{
    $arq = $priv . '/usuarios.json';
    $d = json_decode((string) file_get_contents($arq), true, 512, JSON_THROW_ON_ERROR);
    foreach ($d['usuarios'] as $i => $c) {
        if (($c['usuario'] ?? null) === $login) {
            $d['usuarios'][$i] = $fn($c);
        }
    }
    file_put_contents($arq, json_encode($d, JSON_THROW_ON_ERROR));
}

/** Todos os arquivos regulares do diretório privado (piso não vazio, L-36). @return list<string> */
function conviteArquivosDo(string $priv): array
{
    $arquivos = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($priv, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $f) {
        if ($f->isFile()) {
            $arquivos[] = $f->getPathname();
        }
    }
    return $arquivos;
}

// ---- C1: criar pela API devolve só o caminho do convite e grava só o sha256 do token ----------

teste('convite: C1 criar pela API devolve o caminho do convite, sem senha provisória, e grava só o sha256', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $t0 = time();
    $r = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com']);
    $t1 = time();
    igual(200, $r->status, 'criar');
    $token = conviteTokenDe($r);
    $ana = conviteConta($a, 'ana');
    verdadeiro($ana !== null && isset($ana['convite']) && is_array($ana['convite']), 'a conta nova guarda o convite');
    igual(hash('sha256', $token), $ana['convite']['hash'], 'o disco guarda o sha256 do token');
    verdadeiro(
        $ana['convite']['expiraEm'] >= $t0 + CV_VALIDADE_ESPERADA && $ana['convite']['expiraEm'] <= $t1 + CV_VALIDADE_ESPERADA,
        'validade de 48 h a partir de agora'
    );
    naoContem($token, (string) file_get_contents($a->priv . '/usuarios.json'), 'o token em claro não vai ao disco');
    igual(false, array_key_exists('senhaProvisoria', $r->json()), 'sem senha provisória na resposta (R9)');
});

// ---- C2: conta pendente recusa qualquer senha e gasta um Argon2id ----------------------------

teste('convite: C2 conta pendente recusa qualquer senha, inclusive a que a API devolvesse, e gasta um Argon2id', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $criada = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com'])->json();
    igual(true, $criada['ok'] ?? null, 'criar');
    $ana = conviteConta($a, 'ana');
    igual('argon2id', password_get_info((string) $ana['hash'])['algoName'] ?? null, 'hash inverificável é Argon2id real');
    // G6: o custo do hash inverificável tem de ser o das outras contas, senão o tempo do login revela a conta pendente.
    $custo = password_get_info((string) $ana['hash'])['options'] ?? [];
    igual(D26_ARGON['memory_cost'], $custo['memory_cost'] ?? null, 'custo de memória igual ao das outras contas (G6)');
    igual(D26_ARGON['time_cost'], $custo['time_cost'] ?? null, 'custo de tempo igual ao das outras contas (G6)');
    // Uma senha qualquer e, se a API ainda devolver uma senha provisória (R9), a própria senha entregue.
    $candidatas = ['QualquerSenhaDeQuinze1'];
    if (isset($criada['senhaProvisoria']) && is_string($criada['senhaProvisoria'])) {
        $candidatas[] = $criada['senhaProvisoria'];
    }
    foreach ($candidatas as $i => $senha) {
        $r = $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => $senha]);
        igual(401, $r->status, $i === 0 ? 'login da conta pendente com senha qualquer' : 'login com a senha provisória devolvida pela API');
        igual('credenciais', $r->json()['erro'] ?? null, 'a mesma recusa de senha errada');
    }
    $antes = count($a->verificacoes());
    $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => 'OutraSenhaDeQuinze2']);
    igual($antes + 1, count($a->verificacoes()), 'um Argon2id a mais, para o tempo não revelar a conta');
});

// ---- C3: redefinir derruba a sessão do alvo sem aviso, recusa a senha antiga, zera aparelhos -

teste('convite: C3 redefinir derruba a sessão aberta do alvo sem aviso e recusa a senha antiga', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('ana', 'SenhaAnaAntiga-123', false, false);
    $anaAparelho = $a->entrar('ana', 'SenhaAnaAntiga-123');
    igual(true, $anaAparelho->get('/api/sessao.php')->json()['autenticado'] ?? null, 'ana entrou antes');
    $admin = $a->entrar();
    $r = $admin->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana']);
    igual(200, $r->status, 'redefinir');
    $sessao = $anaAparelho->get('/api/sessao.php');
    igual(false, $sessao->json()['autenticado'] ?? null, 'a sessão de ana caiu');
    naoContem(D26_AVISO_NOME, implode(' | ', $sessao->cabecalhos['set-cookie'] ?? []), 'queda por redefinição não emite aviso');
    igual(401, $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => 'SenhaAnaAntiga-123'])->status, 'senha antiga recusada');
    igual([], conviteConta($a, 'ana')['aparelhos'] ?? null, 'aparelhos vazios');
    verdadeiro(is_array(conviteConta($a, 'ana')['convite'] ?? null), 'redefinir gera o convite novo (CV-B1)');
    igual(false, array_key_exists('senhaProvisoria', $r->json()), 'sem senha provisória na resposta (R9)');
});

// ---- C4: gerar de novo revoga o link anterior -----------------------------------------------

teste('convite: C4 gerar de novo pelo redefinir revoga o link anterior: só o último fica no disco', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $primeiro = conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com']));
    $segundo = conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana']));
    verdadeiro($primeiro !== $segundo, 'tokens diferentes');
    $arq = (string) file_get_contents($a->priv . '/usuarios.json');
    igual(hash('sha256', $segundo), conviteConta($a, 'ana')['convite']['hash'], 'o último fica');
    naoContem(hash('sha256', $primeiro), $arq, 'o primeiro deixou de existir no disco');
});

// ---- C5: desativar e excluir apagam o convite; ativar não cria; revogar-aparelhos mantém -----

teste('convite: C5 desativar apaga o convite, ativar não cria, revogar-aparelhos mantém e excluir apaga', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $token = conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com']));
    $hash = hash('sha256', $token);

    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'revogar-aparelhos', 'usuario' => 'ana'])->status, 'revogar-aparelhos');
    igual($hash, conviteConta($a, 'ana')['convite']['hash'] ?? null, 'revogar-aparelhos mantém o convite');

    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => 'ana'])->status, 'desativar');
    igual(false, array_key_exists('convite', conviteConta($a, 'ana')), 'desativar apaga o convite');

    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'ativar', 'usuario' => 'ana'])->status, 'ativar');
    igual(false, array_key_exists('convite', conviteConta($a, 'ana')), 'ativar não cria convite');

    $tokenBia = conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia', 'email' => 'bia@example.com']));
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'excluir', 'usuario' => 'bia'])->status, 'excluir');
    igual(null, conviteConta($a, 'bia'), 'excluir remove a conta e o convite junto');
    naoContem(hash('sha256', $tokenBia), (string) file_get_contents($a->priv . '/usuarios.json'), 'o hash de bia não sobra no disco');
});

// ---- C6: a listagem mostra o estado e o prazo, nunca o hash ----------------------------------

teste('convite: C6 a listagem mostra o estado e o prazo do convite, nunca o hash', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $token = conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com']));
    $hash = hash('sha256', $token);

    $r = $admin->get('/api/usuarios.php');
    igual(200, $r->status, 'listar');
    $ana = null;
    foreach ($r->json()['usuarios'] as $u) {
        if ($u['usuario'] === 'ana') {
            $ana = $u;
        }
    }
    verdadeiro($ana !== null, 'ana aparece na listagem');
    igual('pendente', $ana['convite'] ?? null, 'estado pendente');
    verdadeiro(is_int($ana['conviteExpiraEm'] ?? null), 'prazo como inteiro');
    naoContem($hash, $r->corpo, 'o hash não vai à listagem');
    naoContem($token, $r->corpo, 'o token não vai à listagem');
    naoContem('"hash"', $r->corpo, 'nenhum campo hash na listagem');

    conviteEditarConta($a->priv, 'ana', static function (array $c): array {
        $c['convite']['expiraEm'] = time() - 1;
        return $c;
    });
    $vencido = null;
    foreach ($admin->get('/api/usuarios.php')->json()['usuarios'] as $u) {
        if ($u['usuario'] === 'ana') {
            $vencido = $u;
        }
    }
    igual('vencido', $vencido['convite'] ?? null, 'depois do prazo, vencido');

    $saida = rodarCliScript('auditar-contas.php', [$a->priv], '');
    igual(0, $saida[0], 'auditar-contas sai 0: ' . $saida[2]);
    naoContem($hash, $saida[1] . $saida[2], 'auditar-contas não imprime o hash do convite');
});

// ---- C7: convite e conviteUsado de tipo errado são D26Indisponivel ----------------------------

teste('convite: C7 convite ou conviteUsado de tipo errado dá D26Indisponivel; forma certa passa', function (): void {
    $base = [
        'usuario' => 'ana', 'uid' => str_repeat('1', 32), 'hash' => 'x', 'admin' => false, 'ativo' => true,
        'deveTrocarSenha' => false, 'versaoSessao' => 5, 'criadoEm' => '2026-11-08T00:00:00+00:00', 'ultimoLogin' => null,
    ];
    $hash64 = str_repeat('a', 64);
    $certos = [
        ['convite' => ['hash' => $hash64, 'expiraEm' => 1]],
        ['conviteUsado' => $hash64],
    ];
    foreach ($certos as $extra) {
        d26_conta_validar($base + $extra);
    }
    $errados = [
        ['convite' => 'texto'],
        ['convite' => 42],
        ['convite' => ['hash' => 'curto', 'expiraEm' => 1]],
        ['convite' => ['hash' => $hash64, 'expiraEm' => '1']],
        ['convite' => ['hash' => $hash64]],
        ['conviteUsado' => 42],
        ['conviteUsado' => ['a']],
    ];
    foreach ($errados as $extra) {
        try {
            d26_conta_validar($base + $extra);
            falhar('aceitou o campo de tipo errado: ' . json_encode($extra));
        } catch (D26Indisponivel) {
            // esperado: fechado, nunca passa por coerção
        }
    }
});

// ---- C8: senha provisória no corpo de criar ou de redefinir dá 400 e não grava nada ----------

teste('convite: C8 senhaProvisoria no corpo de criar ou de redefinir dá 400 e não grava nada', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $r = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'senhaProvisoria' => 'Provisoria-Ana1']);
    igual(400, $r->status, 'criar com senha provisória recusado');
    igual(null, conviteConta($a, 'ana'), 'a conta não foi criada');

    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia', 'email' => 'bia@example.com'])->status, 'criar bia sem senha');
    $hashAntes = conviteConta($a, 'bia')['hash'];
    $convite = conviteConta($a, 'bia')['convite'];
    $r2 = $admin->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'bia', 'senhaProvisoria' => 'Provisoria-Bia1']);
    igual(400, $r2->status, 'redefinir com senha provisória recusado');
    igual($hashAntes, conviteConta($a, 'bia')['hash'], 'o hash de bia não mudou');
    igual($convite, conviteConta($a, 'bia')['convite'], 'o convite de bia não mudou');
});

// ---- C9: CLI redefinir-senha apaga o convite do alvo; os outros mantêm o que têm -------------

teste('convite: C9 redefinir-senha.php apaga o convite do alvo e preserva convite e marcador das outras contas', function (): void {
    [$dir, $priv] = cliPrivComContas(['ana' => ['admin' => false], 'bia' => ['admin' => false]]);
    $hashAna = hash('sha256', 'convite-ana');
    $hashBia = hash('sha256', 'convite-bia');
    conviteEditarConta($priv, 'ana', static function (array $c) use ($hashAna): array {
        $c['convite'] = ['hash' => $hashAna, 'expiraEm' => time() + 1000];
        return $c;
    });
    conviteEditarConta($priv, 'bia', static function (array $c) use ($hashBia): array {
        $c['convite'] = ['hash' => $hashBia, 'expiraEm' => time() + 1000];
        $c['conviteUsado'] = str_repeat('c', 64);
        $c['sessaoVigente'] = str_repeat('d', 32);
        return $c;
    });
    [$rc, $out, $err] = rodarCliScript('redefinir-senha.php', [$priv, 'ana'], "NovaSenhaDoCli-123\n");
    igual(0, $rc, "redefinir-senha sai 0: $err");
    $contas = cliContasPorLogin($priv);
    igual(false, array_key_exists('convite', $contas['ana']), 'o convite pendente do alvo some');
    $bia = json_decode((string) file_get_contents($priv . '/usuarios.json'), true, 512, JSON_THROW_ON_ERROR)['usuarios'][1];
    igual($hashBia, $bia['convite']['hash'] ?? null, 'bia mantém o convite');
    igual(str_repeat('c', 64), $bia['conviteUsado'] ?? null, 'bia mantém conviteUsado');
    igual(str_repeat('d', 32), $bia['sessaoVigente'] ?? null, 'bia mantém sessaoVigente');
    apagarArvore($dir);
});

teste('convite: C9 criar-admin --adicionar e definir-admin preservam convite, conviteUsado e marcador', function (): void {
    [$dir, $priv] = cliPrivComContas(['ana' => ['admin' => false], 'bia' => ['admin' => false]]);
    conviteEditarConta($priv, 'ana', static function (array $c): array {
        $c['convite'] = ['hash' => str_repeat('e', 64), 'expiraEm' => time() + 1000];
        return $c;
    });
    conviteEditarConta($priv, 'bia', static function (array $c): array {
        $c['conviteUsado'] = str_repeat('f', 64);
        $c['sessaoVigente'] = str_repeat('0', 32);
        return $c;
    });
    [$rc1, , $err1] = rodarCliScript('criar-admin.php', [$priv, 'novo.adm', '--adicionar'], "SenhaDoNovoAdm-123\n");
    igual(0, $rc1, "criar-admin sai 0: $err1");
    [$rc2, , $err2] = rodarCliScript('definir-admin.php', [$priv, '--unico=bia'], '');
    igual(0, $rc2, "definir-admin sai 0: $err2");
    $d = json_decode((string) file_get_contents($priv . '/usuarios.json'), true, 512, JSON_THROW_ON_ERROR);
    $porLogin = [];
    foreach ($d['usuarios'] as $c) {
        $porLogin[$c['usuario']] = $c;
    }
    igual(str_repeat('e', 64), $porLogin['ana']['convite']['hash'] ?? null, 'ana mantém o convite');
    igual(str_repeat('f', 64), $porLogin['bia']['conviteUsado'] ?? null, 'bia mantém conviteUsado');
    igual(str_repeat('0', 32), $porLogin['bia']['sessaoVigente'] ?? null, 'bia mantém o marcador');
    apagarArvore($dir);
}, false);

// ---- C10: nenhum token gerado aparece em arquivo do privado -----------------------------------

teste('convite: C10 nenhum token gerado nos testes aparece em nenhum arquivo do privado', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $tokens = [
        conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com'])),
        conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana'])),
        conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia', 'email' => 'bia@example.com'])),
    ];
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => 'bia'])->status, 'desativar bia');
    $arquivos = conviteArquivosDo($a->priv);
    verdadeiro(count($arquivos) >= 3, 'a varredura pegou arquivos (piso não vazio): ' . count($arquivos));
    foreach ($arquivos as $arq) {
        foreach ($tokens as $token) {
            naoContem($token, (string) file_get_contents($arq), 'token em ' . basename($arq));
        }
    }
});

// ---- CV-B2: página pública do convite (GET inofensivo, POST com CAS e limite por IP) -----------
// Textos do líder (M1, M2, M3 e "digitar duas vezes") colados verbatim. "Criar senha", "Criar senha e
// entrar", "Senha criada. Entre com a senha nova." e a mensagem de repetição divergente são
// decisão autônoma do orquestrador, a ratificar.

const CVB2_M1 = 'Este link venceu. Peça um novo a quem administra o site.';
const CVB2_M2 = 'Este link já foi usado. Se não foi você, avise quem administra o site.';
const CVB2_M3 = 'Este link não vale. Peça um novo a quem administra o site.';
const CVB2_REPETICAO = 'A repetição não confere com a senha nova.';
const CVB2_SENHA = 'SenhaDoConvite-2026';
const CVB2_CSP_TELA = "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

/** Campo oculto ou de texto da tela, desescapado (mesma forma de acessoCampo). */
function cvb2Campo(string $html, string $nome): string
{
    return preg_match('/name="' . preg_quote($nome, '/') . '" value="([^"]*)"/', $html, $m) === 1
        ? html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8')
        : '';
}

/** Cria a conta pelo admin e devolve o token do link (CV-B1). */
function cvb2Convidar(Ambiente $a, string $login): string
{
    return conviteTokenDe($a->entrar()->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => $login, 'email' => $login . '@example.com']));
}

/** Página do convite (GET) como a navegação a faz. */
function cvb2Pagina(Cliente $c, string $token): Resposta
{
    return $c->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO);
}

/** @return array<string, string> campos do formulário da tela do convite */
function cvb2Campos(string $token, string $csrf, string $nova, ?string $repetida = null): array
{
    return ['t' => $token, 'csrf' => $csrf, 'senhaNova' => $nova, 'senhaRepetida' => $repetida ?? $nova];
}

/** POST de formulário, como o navegador envia a tela (sem JSON e sem X-CSRF-Token). */
function cvb2Enviar(Cliente $c, array $campos, array $cabecalhos = []): Resposta
{
    return $c->enviar('POST', '/api/convite.php', http_build_query($campos), [
        'Content-Type' => 'application/x-www-form-urlencoded',
        'X-CSRF-Token' => null,
    ] + $cabecalhos);
}

/** Tela de mensagem (M1, M2 ou M3): status, texto em role="alert", no título, sem formulário. */
function cvb2Mensagem(Resposta $r, int $status, string $texto): void
{
    igual($status, $r->status, 'status da mensagem');
    contem('role="alert"', $r->corpo, 'aviso anunciado');
    contem('<title>' . $texto . '</title>', $r->corpo, 'texto repetido no título');
    contem($texto, $r->corpo, 'texto da mensagem');
    naoContem('<form', $r->corpo, 'sem formulário');
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'referrer da mensagem');
    contem('<meta name="referrer" content="strict-origin">', $r->corpo, 'meta de referrer na mensagem');
    igual(CVB2_CSP_TELA, $r->cabecalho('content-security-policy'), 'CSP da mensagem');
}

/** Cookies do cliente mais um extra (para simular um pedido com o cookie de aviso). */
function cvb2Cookies(Cliente $c, string $extra): string
{
    $pares = [];
    foreach ($c->cookies as $n => $v) {
        $pares[] = "$n=$v";
    }
    $pares[] = $extra;
    return implode('; ', $pares);
}

/** Pedido GET saindo por outro IP de origem (127.0.0.2, loopback), para simular outro aparelho. */
function cvb2GetDeOutroIp(Ambiente $a, string $caminho, string $ip): Resposta
{
    $ctx = stream_context_create(['socket' => ['bindto' => $ip . ':0'], 'http' => [
        'method' => 'GET',
        'header' => 'Sec-Fetch-Mode: navigate',
        'ignore_errors' => true,
        'follow_location' => 0,
        'timeout' => 30,
    ]]);
    $http_response_header = [];
    $corpo = @file_get_contents($a->base . $caminho, false, $ctx);
    if ($corpo === false) {
        falhar("sem resposta de {$a->base}$caminho pelo IP $ip");
    }
    $status = 0;
    $cabs = [];
    foreach ($http_response_header as $linha) {
        if (preg_match('#^HTTP/\S+ (\d{3})#', $linha, $m) === 1) {
            $status = (int) $m[1];
            continue;
        }
        $pos = strpos($linha, ':');
        if ($pos !== false) {
            $cabs[strtolower(trim(substr($linha, 0, $pos)))][] = trim(substr($linha, $pos + 1));
        }
    }
    return new Resposta($status, $cabs, $corpo);
}

/**
 * POST de formulário disparado sem esperar a resposta (corrida determinística, como suLoginSemEsperar).
 *
 * @param array<string, string> $campos
 * @return array{resource, \CurlHandle}
 */
function cvb2PostSemEsperar(Cliente $c, array $campos): array
{
    $h = curl_init($c->origem() . '/api/convite.php');
    curl_setopt_array($h, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($campos),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            'Origin: ' . $c->origem(),
            'Cookie: ' . cvb2Cookies($c, '_'),
            'Connection: close',
        ],
    ]);
    $m = curl_multi_init();
    curl_multi_add_handle($m, $h);
    curl_multi_exec($m, $ativos);
    return [$m, $h];
}

/** Termina o POST disparado por cvb2PostSemEsperar e devolve a resposta. @param array{resource, \CurlHandle} $req */
function cvb2ConcluirPost(array $req): Resposta
{
    [$m, $h] = $req;
    do {
        $estado = curl_multi_exec($m, $ativos);
        if ($ativos > 0) {
            curl_multi_select($m, 0.1);
        }
    } while ($ativos > 0 && $estado === CURLM_OK);
    $status = (int) curl_getinfo($h, CURLINFO_RESPONSE_CODE);
    $bruto = (string) curl_multi_getcontent($h);
    $tamanho = (int) curl_getinfo($h, CURLINFO_HEADER_SIZE);
    curl_multi_remove_handle($m, $h);
    curl_close($h);
    curl_multi_close($m);
    $cabs = [];
    foreach (explode("\r\n", substr($bruto, 0, $tamanho)) as $linha) {
        $pos = strpos($linha, ':');
        if ($pos !== false) {
            $cabs[strtolower(trim(substr($linha, 0, $pos)))][] = trim(substr($linha, $pos + 1));
        }
    }
    return new Resposta($status, $cabs, substr($bruto, $tamanho));
}

// ---- C11: GET válido: tela de convite, cabeçalhos de tela e nada do app ------------------------

teste('convite: C11 GET válido: 200, CSP de tela, no-store, referrer strict-origin, sem script, formulário com o token só no campo oculto', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $antes = hash_file('sha256', $a->priv . '/usuarios.json');
    $r = cvb2Pagina($a->cliente(), $token);
    igual(200, $r->status, 'página do convite');
    igual(CVB2_CSP_TELA, $r->cabecalho('content-security-policy'), 'CSP de tela, sem script');
    igual('private, no-store', $r->cabecalho('cache-control'), 'sem cache');
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'referrer só com a origem: o token está na URL');
    contem('<meta name="referrer" content="strict-origin">', $r->corpo, 'meta de referrer no documento');
    naoContem('no-referrer', $r->corpo, 'sem no-referrer: com ele o navegador manda Origin null no POST');
    naoContem('<script', $r->corpo, 'nenhum script na tela');
    contem('<title>Criar senha</title>', $r->corpo, 'título da tela');
    contem('<form method="post" action="/api/convite.php">', $r->corpo, 'formulário com endereço fixo, sem o token');
    naoContem('action="/api/convite.php?', $r->corpo, 'o token não entra no endereço do formulário');
    contem('<input type="hidden" name="t" value="' . $token . '">', $r->corpo, 'token só no campo oculto t');
    igual(1, substr_count($r->corpo, $token), 'o token aparece uma vez na página');
    contem('name="csrf"', $r->corpo, 'CSRF do cookie pré');
    contem('value="ana"', $r->corpo, 'usuário preenchido');
    contem('readonly', $r->corpo, 'usuário somente leitura');
    contem('autocomplete="username"', $r->corpo, 'usuário para o gerenciador de senhas');
    contem('autocomplete="new-password"', $r->corpo, 'senha nova');
    contem('minlength="15"', $r->corpo, 'mínimo de 15 caracteres');
    contem('name="senhaRepetida"', $r->corpo, 'repetição da senha (R10)');
    contem('Criar senha e entrar', $r->corpo, 'botão');
    igual($antes, hash_file('sha256', $a->priv . '/usuarios.json'), 'o GET não grava usuarios.json');
});

// ---- C12: POST válido: entra, grava o consumo e emite o aparelho -----------------------------

teste('convite: C12 POST válido: 303 para / com Clear-Site-Data, sessão da conta, convite apagado, conviteUsado, aparelho emitido', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    verdadeiro($csrf !== '', 'a página traz o CSRF');
    $r = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA));
    igual(303, $r->status, 'criou a senha e entrou');
    igual('/', $r->cabecalho('location'), 'destino /');
    igual('"cache"', $r->cabecalho('clear-site-data'), 'Clear-Site-Data exato (T19)');
    $sessao = $c->get('/api/sessao.php')->json();
    igual(true, $sessao['autenticado'] ?? null, 'a sessão aberta');
    igual('ana', $sessao['usuario'] ?? null, 'é da conta do convite');
    $conta = conviteConta($a, 'ana');
    igual(false, array_key_exists('convite', $conta), 'o convite foi apagado');
    igual(hash('sha256', $token), $conta['conviteUsado'] ?? null, 'conviteUsado gravado');
    igual(false, $conta['deveTrocarSenha'] ?? null, 'troca obrigatória cumprida');
    verdadeiro(is_string($conta['sessaoVigente'] ?? null), 'o login gravou o marcador da sessão única');
    contem(D26_DISP_NOME . '=', implode(' | ', $r->cabecalhos['set-cookie'] ?? []), 'cookie de aparelho emitido');
    verdadeiro(password_verify(CVB2_SENHA, (string) $conta['hash']), 'a senha nova é a que a conta guarda');
});

// ---- C13: o mesmo link de novo, por GET e por POST: M2 ---------------------------------------

teste('convite: C13 o mesmo link de novo, por GET e por POST: M2 com 410 e sem formulário', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    igual(303, cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA))->status, 'primeiro uso');
    cvb2Mensagem(cvb2Pagina($a->cliente(), $token), 410, CVB2_M2);
    cvb2Mensagem(cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA)), 410, CVB2_M2);
});

// ---- C14: link vencido: M1 no GET; vencer entre o GET e o POST também dá M1, e nada grava ----

teste('convite: C14 link vencido: M1 com 410 no GET; vencer entre o GET e o POST dá M1 e nada grava', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    conviteEditarConta($a->priv, 'ana', static function (array $c): array {
        $c['convite']['expiraEm'] = time() - 1;
        return $c;
    });
    cvb2Mensagem(cvb2Pagina($a->cliente(), $token), 410, CVB2_M1);

    $b = Ambiente::novo();
    $tokenB = cvb2Convidar($b, 'bia');
    $c = $b->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $tokenB)->corpo, 'csrf');
    conviteEditarConta($b->priv, 'bia', static function (array $conta): array {
        $conta['convite']['expiraEm'] = time() - 1;
        return $conta;
    });
    $antes = hash_file('sha256', $b->priv . '/usuarios.json');
    cvb2Mensagem(cvb2Enviar($c, cvb2Campos($tokenB, $csrf, CVB2_SENHA)), 410, CVB2_M1);
    igual($antes, hash_file('sha256', $b->priv . '/usuarios.json'), 'o POST com link vencido não grava');
});

// ---- C14b: a janela do CAS: o link vence DURANTE o Argon2id, depois da classificação --------

// A classificação (convite.php) já viu o link no prazo; o vencimento cai entre o hash e a gravação.
// Só o CAS de d26_contas_consumir_convite (contas.php) pega isso. Caracterização coberta por mutação (L-27).
teste('convite: C14b CAS: o link que vence durante o Argon2id dá M1 e nada grava', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');

    pausaLigar($a, 'convite-antes-gravar', 'ana');
    $req = cvb2PostSemEsperar($c, cvb2Campos($token, $csrf, CVB2_SENHA));
    pausaEsperarChegada($req, $a, 'convite-antes-gravar');
    conviteEditarConta($a->priv, 'ana', static function (array $conta): array {
        $conta['convite']['expiraEm'] = time() - 1;
        return $conta;
    });
    pausaSoltar($a, 'convite-antes-gravar');

    cvb2Mensagem(cvb2ConcluirPost($req), 410, CVB2_M1);
    $conta = conviteConta($a, 'ana');
    igual(false, password_verify(CVB2_SENHA, (string) $conta['hash']), 'a senha não foi gravada');
    igual(false, array_key_exists('conviteUsado', $conta), 'o link não foi consumido');
});

// ---- C15: corrida: o POST que grava por último perde com M2 --------------------------------

teste('convite: C15 corrida: um 303 e um M2; o hash gravado é o do vencedor', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $token = cvb2Convidar($a, 'ana');
    $A = $a->cliente();
    $csrfA = cvb2Campo(cvb2Pagina($A, $token)->corpo, 'csrf');
    $B = $a->cliente();
    $csrfB = cvb2Campo(cvb2Pagina($B, $token)->corpo, 'csrf');

    pausaLigar($a, 'convite-antes-gravar', 'ana');
    $reqA = cvb2PostSemEsperar($A, cvb2Campos($token, $csrfA, 'SenhaCorridaA-2026'));
    pausaEsperarChegada($reqA, $a, 'convite-antes-gravar');
    // A e B são a mesma conta: o marcador passa a casar com ninguém, como na R4 da sessão única.
    file_put_contents($a->priv . '/pausa-convite-antes-gravar', 'ninguem');
    $rB = cvb2Enviar($B, cvb2Campos($token, $csrfB, 'SenhaCorridaB-2026'));
    igual(303, $rB->status, 'o POST B grava e entra');
    pausaSoltar($a, 'convite-antes-gravar');

    cvb2Mensagem(cvb2ConcluirPost($reqA), 410, CVB2_M2);
    $conta = conviteConta($a, 'ana');
    verdadeiro(password_verify('SenhaCorridaB-2026', (string) $conta['hash']), 'o hash gravado é o do vencedor');
    igual(false, password_verify('SenhaCorridaA-2026', (string) $conta['hash']), 'o perdedor não gravou');
    igual(hash('sha256', $token), $conta['conviteUsado'] ?? null, 'o consumo ficou com o vencedor');
});

// ---- C15b (SE4): o perdedor do CAS não zera o contador, mesmo que o zero viesse antes do CAS -----

teste('convite: C15b o perdedor do CAS para antes da gravação e não zera o contador reinjetado depois do vencedor', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $token = cvb2Convidar($a, 'ana');
    $perdedor = $a->cliente();
    $csrfP = cvb2Campo(cvb2Pagina($perdedor, $token)->corpo, 'csrf');
    $vencedor = $a->cliente();
    $csrfV = cvb2Campo(cvb2Pagina($vencedor, $token)->corpo, 'csrf');

    // O perdedor passa pela classificação do link (válido) e fica parado antes do CAS.
    pausaLigar($a, 'convite-antes-gravar', 'ana');
    $reqP = cvb2PostSemEsperar($perdedor, cvb2Campos($token, $csrfP, 'SenhaPerdedoraSE4-2026'));
    pausaEsperarChegada($reqP, $a, 'convite-antes-gravar');
    // O vencedor grava enquanto o perdedor espera (o marcador casa com ninguém, como em C15).
    file_put_contents($a->priv . '/pausa-convite-antes-gravar', 'ninguem');
    igual(303, cvb2Enviar($vencedor, cvb2Campos($token, $csrfV, 'SenhaVencedoraSE4-2026'))->status, 'o vencedor grava e entra');
    pausaSoltar($a, 'convite-antes-gravar');
    // Falhas da conta chegam depois da vitória: o contador tem de sobreviver ao perdedor.
    cvb2Falhas($a, 10, 0, 0);

    cvb2Mensagem(cvb2ConcluirPost($reqP), 410, CVB2_M2);
    $t = json_decode((string) file_get_contents($a->priv . '/tentativas.json'), true, 512, JSON_THROW_ON_ERROR);
    $kc = hash('sha256', 'conta' . "\0" . 'ana');
    igual(10, count($t['c'][$kc]['f'] ?? []), 'o perdedor do CAS não zera a conta (o zero só vem depois do CAS vencido)');
});

// ---- C16: senha curta, igual ao login ou repetição diferente: 400 e o link segue valendo ------

teste('convite: C16 senha curta, igual ao login ou repetição diferente: tela com a mensagem, 400, e o link segue valendo', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');

    $curta = cvb2Enviar($c, cvb2Campos($token, $csrf, 'Curta-1'));
    igual(400, $curta->status, 'senha curta');
    contem('A senha precisa ter pelo menos 15 caracteres.', $curta->corpo, 'mensagem da regra');
    contem('<input type="hidden" name="t" value="' . $token . '">', $curta->corpo, 'o link segue na tela');

    $diferente = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA, 'OutraSenhaDiferente-1'));
    igual(400, $diferente->status, 'repetição diferente');
    contem(CVB2_REPETICAO, $diferente->corpo, 'mensagem da repetição');

    $b = Ambiente::novo();
    $tokenB = cvb2Convidar($b, 'ana-convite-longo');
    $cb = $b->cliente();
    $csrfB = cvb2Campo(cvb2Pagina($cb, $tokenB)->corpo, 'csrf');
    $igualAoLogin = cvb2Enviar($cb, cvb2Campos($tokenB, $csrfB, 'ana-convite-longo'));
    igual(400, $igualAoLogin->status, 'senha igual ao login');
    contem('A senha não pode ser igual ao nome de usuário.', $igualAoLogin->corpo, 'mensagem do login');

    igual(303, cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA))->status, 'o mesmo link ainda entra');
});

// ---- C17: sem cookie pré, sem HMAC, Origin de outro site ou corpo JSON: recusa e nada grava ---

teste('convite: C17 sem cookie pré ou sem o HMAC: 403; Origin de outro site: 403; corpo JSON: 400; nada grava', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $antes = hash_file('sha256', $a->priv . '/usuarios.json');

    igual(403, cvb2Enviar($a->cliente(), cvb2Campos($token, 'qualquer', CVB2_SENHA))->status, 'sem cookie pré');

    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    igual(403, cvb2Enviar($c, cvb2Campos($token, str_repeat('0', 64), CVB2_SENHA))->status, 'sem o HMAC do cookie pré');
    igual(403, cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA), ['Origin' => 'http://site-de-outro.example'])->status, 'Origin de outro site');
    igual(400, $c->post('/api/convite.php', ['t' => $token, 'senhaNova' => CVB2_SENHA])->status, 'corpo JSON');
    igual($antes, hash_file('sha256', $a->priv . '/usuarios.json'), 'nenhuma recusa grava');
});

// ---- C18: limite por IP: 30 falhas de token, a seguinte dá 429; outro IP segue entrando -----

teste('convite: C18 30 falhas de token do mesmo IP: a seguinte dá 429; um link válido de outro IP segue entrando', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    for ($i = 0; $i < 30; $i++) {
        igual(404, cvb2Pagina($c, str_repeat('0', 64))->status, "falha de token $i");
    }
    $bloqueada = cvb2Pagina($c, $token);
    igual(429, $bloqueada->status, 'a 31ª do mesmo IP dá 429, mesmo com link válido');
    contem('Aguarde', $bloqueada->corpo, 'frase de espera');
    igual('strict-origin', $bloqueada->cabecalho('referrer-policy'), 'referrer da tela de espera');
    contem('<meta name="referrer" content="strict-origin">', $bloqueada->corpo, 'meta de referrer na tela de espera');
    igual(CVB2_CSP_TELA, $bloqueada->cabecalho('content-security-policy'), 'CSP da tela de espera');
    igual(200, cvb2GetDeOutroIp($a, '/api/convite.php?t=' . $token, '127.0.0.2')->status, 'link válido de outro IP segue entrando');
});

// ---- C19: t ausente, lista, 63 ou 65 hex, maiúsculas: M3 com 404 e nada no erros.log ---------

teste('convite: C19 t ausente, lista, 63 ou 65 hex, maiúsculas: M3 com 404, e nenhuma linha nova no erros.log com o valor enviado', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $log = $a->priv . '/erros.log';
    $antes = is_file($log) ? (string) file_get_contents($log) : '';
    $pedidos = [
        '/api/convite.php',
        '/api/convite.php?t[]=' . $token,
        '/api/convite.php?t=' . substr($token, 0, 63),
        '/api/convite.php?t=' . $token . 'a',
        '/api/convite.php?t=' . strtoupper($token),
    ];
    foreach ($pedidos as $caminho) {
        cvb2Mensagem($c->get($caminho, PORTAO_NAVEGACAO), 404, CVB2_M3);
    }
    $depois = is_file($log) ? (string) file_get_contents($log) : '';
    igual($antes, $depois, 'nenhuma linha nova no erros.log');
    naoContem($token, $depois, 'o token não vai ao erros.log');
});

// ---- C20: navegador com sessão de outra conta ------------------------------------------------

teste('convite: C20 navegador com sessão de outra conta: depois do POST a sessão é da conta do convite e a outra fica igual', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('bia', 'SenhaDaBia-Teste1', false, false);
    $outro = $a->entrar('bia', 'SenhaDaBia-Teste1');
    $token = cvb2Convidar($a, 'ana');
    $antesBia = conviteConta($a, 'bia');
    $csrf = cvb2Campo(cvb2Pagina($outro, $token)->corpo, 'csrf');
    igual(303, cvb2Enviar($outro, cvb2Campos($token, $csrf, CVB2_SENHA))->status, 'criou a senha no mesmo navegador');
    igual('ana', $outro->get('/api/sessao.php')->json()['usuario'] ?? null, 'a sessão agora é da conta do convite');
    igual($antesBia, conviteConta($a, 'bia'), 'a conta da outra pessoa ficou igual');
});

// ---- C21: nenhuma resposta de convite.php emite o cookie de aviso ----------------------------

teste('convite: C21 nenhuma resposta de convite.php emite __Host-d26aviso, nem com o cookie de aviso no pedido', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    // O aviso vai no jar: Cliente::enviar troca o cabeçalho Cookie pelo jar, então um Cookie avulso nunca chegava.
    $c->cookies[D26_AVISO_NOME] = D26_AVISO_OUTRO_APARELHO;
    $respostas = [
        $c->get('/api/convite.php?t=' . $token, PORTAO_NAVEGACAO),
        $c->get('/api/convite.php?t=' . str_repeat('0', 64), PORTAO_NAVEGACAO),
        cvb2Enviar($c, cvb2Campos($token, 'errado', CVB2_SENHA)),
        cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA)),
    ];
    // Emitir é gravar o aviso com valor (o da lista fechada). Consumir (CV-B2, criação de senha) é só expirar:
    // "__Host-d26aviso=; Max-Age=0". Qualquer cookie desse nome que não seja a expiração conta como emissão.
    // (A versão anterior proibia o nome inteiro e ficaria vermelha com o consumo, que é o comportamento certo.)
    foreach ($respostas as $r) {
        foreach ($r->cabecalhos['set-cookie'] ?? [] as $cookie) {
            if (str_contains($cookie, D26_AVISO_NOME)) {
                igual(
                    D26_AVISO_NOME . '=; Max-Age=0',
                    substr($cookie, 0, strlen(D26_AVISO_NOME . '=; Max-Age=0')),
                    "status {$r->status}: o convite só expira o aviso, nunca o emite"
                );
            }
        }
    }
});

// ---- C22: login depois do CAS com a conta e o usuário+IP cheios: o convite entra e zera -------

/** Injeta marcas de falha em tentativas.json para ana (conta e usuário+IP) e para o IP do cliente (127.0.0.1). */
function cvb2Falhas(Ambiente $a, int $conta, int $usuarioIp, int $ip): array
{
    $agora = time();
    $kc = hash('sha256', 'conta' . "\0" . 'ana');
    $ku = hash('sha256', 'ana' . "\0" . '127.0.0.1');
    $ki = hash('sha256', 'ip' . "\0" . '127.0.0.1');
    $d = ['u' => [], 'ip' => [], 'c' => []];
    if ($conta > 0) {
        $d['c'][$kc] = ['f' => array_fill(0, $conta, $agora)];
    }
    if ($usuarioIp > 0) {
        $d['u'][$ku] = ['n' => $usuarioIp, 'ult' => $agora, 'l' => $kc];
    }
    if ($ip > 0) {
        $d['ip'][$ki] = ['f' => array_fill(0, $ip, $agora)];
    }
    file_put_contents($a->priv . '/tentativas.json', json_encode($d, JSON_THROW_ON_ERROR));
    return ['kc' => $kc, 'ku' => $ku, 'ki' => $ki];
}

/** Último Set-Cookie da resposta (o que vale por último para o navegador). */
function cvb2UltimoCookie(Resposta $r): string
{
    $cookies = $r->cabecalhos['set-cookie'] ?? [];
    return (string) end($cookies);
}

teste('convite: C22 o login falha depois do CAS (10 falhas na conta, 6 no usuário+IP): 303 com sessão, zera a conta e o usuário+IP, e mantém as marcas de IP', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    $chaves = cvb2Falhas($a, 10, 6, 3);
    $r = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA));
    igual(303, $r->status, 'a senha foi criada e entra, mesmo com o limite da conta cheio');
    igual('/', $r->cabecalho('location'), 'destino /');
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'referrer do 303');
    igual(true, $c->get('/api/sessao.php')->json()['autenticado'] ?? null, 'sessão aberta na conta do convite');
    $t = json_decode((string) file_get_contents($a->priv . '/tentativas.json'), true);
    igual(false, array_key_exists($chaves['kc'], $t['c'] ?? []), 'a chave da conta sai do tentativas.json');
    igual(false, array_key_exists($chaves['ku'], $t['u'] ?? []), 'a chave usuário+IP sai do tentativas.json');
    verdadeiro(count($t['ip'][$chaves['ki']]['f'] ?? []) >= 3, 'a chave de IP mantém as 3 marcas injetadas');
});

teste('convite: C22b 30 falhas de IP injetadas na pausa do CAS: 303 para / sem sessão, com o aviso senha-criada de 600 s, e a tela mostra o aviso e expira o cookie', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    pausaLigar($a, 'convite-antes-gravar', 'ana');
    $req = cvb2PostSemEsperar($c, cvb2Campos($token, $csrf, CVB2_SENHA));
    pausaEsperarChegada($req, $a, 'convite-antes-gravar');
    cvb2Falhas($a, 0, 0, 30);
    pausaSoltar($a, 'convite-antes-gravar');
    $r = cvb2ConcluirPost($req);
    igual(303, $r->status, 'senha criada: 303 mesmo sem o login');
    igual('/', $r->cabecalho('location'), 'destino /');
    igual('"cache"', $r->cabecalho('clear-site-data'), 'Clear-Site-Data exato');
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'referrer do 303');
    igual(false, $c->get('/api/sessao.php')->json()['autenticado'] ?? null, 'sem sessão aberta');
    contem(D26_AVISO_NOME . '=senha-criada; Max-Age=600', cvb2UltimoCookie($r), 'o último Set-Cookie é o aviso senha-criada, de 600 s');
    $c->cookies[D26_AVISO_NOME] = 'senha-criada';
    $tela = $c->get('/', PORTAO_NAVEGACAO);
    contem('Senha criada. Entre com a senha nova.', $tela->corpo, 'a entrada mostra o texto do aviso');
    contem('role="alert"', $tela->corpo, 'o aviso sai em role="alert"');
    contem(D26_AVISO_NOME . '=; Max-Age=0', implode(' | ', $tela->cabecalhos['set-cookie'] ?? []), 'a entrada expira o cookie do aviso');
});

teste('convite: C22c conta já bloqueada: o convite grava a senha e dá 303 com o aviso bloqueada, sem sessão', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    conviteEditarConta($a->priv, 'ana', static function (array $c): array {
        $c['bloqueada'] = ['em' => time(), 'motivo' => 'uso-simultaneo'];
        return $c;
    });
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    $r = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA));
    igual(303, $r->status, 'a senha foi criada e o login recusa a conta bloqueada');
    igual('/', $r->cabecalho('location'), 'destino /');
    igual(false, $c->get('/api/sessao.php')->json()['autenticado'] ?? null, 'sem sessão');
    contem(D26_AVISO_NOME . '=bloqueada; Max-Age=600', cvb2UltimoCookie($r), 'último aviso: bloqueada');
    $conta = conviteConta($a, 'ana');
    verdadeiro(password_verify(CVB2_SENHA, (string) $conta['hash']), 'a senha nova ficou gravada');
});

teste('convite: C22d GET, POST com senha curta e POST com link usado não zeram a conta, o usuário+IP nem a categoria de envio', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    $chaves = cvb2Falhas($a, 10, 6, 0);
    $ke = hash('sha256', 'econta' . "\0" . 'ana');
    $d = json_decode((string) file_get_contents($a->priv . '/tentativas.json'), true);
    $d['c'][$ke] = ['f' => [time(), time()]];
    file_put_contents($a->priv . '/tentativas.json', json_encode($d, JSON_THROW_ON_ERROR));
    $confere = static function () use ($a, $chaves, $ke): void {
        $t = json_decode((string) file_get_contents($a->priv . '/tentativas.json'), true);
        igual(10, count($t['c'][$chaves['kc']]['f'] ?? []), 'a conta conserva as 10 marcas');
        igual(6, $t['u'][$chaves['ku']]['n'] ?? null, 'o usuário+IP conserva as 6 falhas');
        igual(2, count($t['c'][$ke]['f'] ?? []), 'a categoria de envio fica intacta');
    };
    cvb2Pagina($c, $token);
    $confere();
    $curta = cvb2Enviar($c, cvb2Campos($token, $csrf, 'curta'));
    igual(400, $curta->status, 'senha curta');
    $confere();

    $b = Ambiente::novo();
    $tokenB = cvb2Convidar($b, 'ana');
    $cb = $b->cliente();
    $csrfB = cvb2Campo(cvb2Pagina($cb, $tokenB)->corpo, 'csrf');
    igual(303, cvb2Enviar($cb, cvb2Campos($tokenB, $csrfB, CVB2_SENHA))->status, 'primeiro POST cria a senha');
    $chavesB = cvb2Falhas($b, 10, 6, 0);
    $usado = cvb2Enviar($cb, cvb2Campos($tokenB, $csrfB, CVB2_SENHA));
    igual(410, $usado->status, 'link usado: M2');
    $tb = json_decode((string) file_get_contents($b->priv . '/tentativas.json'), true);
    igual(10, count($tb['c'][$chavesB['kc']]['f'] ?? []), 'link usado: a conta conserva as 10 marcas');
});

// ---- C23: Referrer-Policy strict-origin nas respostas do convite (o token vai na URL) ------------

teste('convite: C23 o 303 de sucesso sai com Referrer-Policy strict-origin', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    $r = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA));
    igual(303, $r->status, 'criou e entrou');
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'referrer do 303');
});

// ---- C24: os 403 (sem cookie pré, Origin de outro site) e o 400 (tipo de conteúdo) também --------

teste('convite: C24 os 403 e o 400 do formulário saem com Referrer-Policy strict-origin', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $semCookie = cvb2Enviar($a->cliente(), cvb2Campos($token, 'qualquer', CVB2_SENHA));
    igual(403, $semCookie->status, 'sem cookie pré');
    igual('strict-origin', $semCookie->cabecalho('referrer-policy'), 'referrer do 403 sem cookie pré');

    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    $origem = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA), ['Origin' => 'http://site-de-outro.example']);
    igual(403, $origem->status, 'Origin de outro site');
    igual('strict-origin', $origem->cabecalho('referrer-policy'), 'referrer do 403 de Origin');

    $json = $c->post('/api/convite.php', ['t' => $token, 'senhaNova' => CVB2_SENHA]);
    igual(400, $json->status, 'corpo JSON');
    igual('strict-origin', $json->cabecalho('referrer-policy'), 'referrer do 400');
});

// ---- C24b: falha do servidor (503 do handler global) também sai com strict-origin ----------------

teste('convite: C24b usuarios.json corrompido: o 503 do handler global sai com strict-origin e sem o token', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    file_put_contents($a->priv . '/usuarios.json', '{quebrado');
    $r = cvb2Pagina($a->cliente(), $token);
    igual(503, $r->status, 'falha do servidor');
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'referrer do 503');
    naoContem($token, $r->corpo, 'o token não volta no corpo do erro');
});

// ---- C25: o 405 (método errado, com o token na URL) também ------------------------------------

teste('convite: C25 o 405 (método errado, com o token na URL) sai com Referrer-Policy strict-origin', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $r = $a->cliente()->enviar('PUT', '/api/convite.php?t=' . $token, '', []);
    igual(405, $r->status, 'método não permitido');
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'referrer do 405');
});

// ---- C26: a criação de senha expira o cookie de aviso que veio no pedido (303 e tela sem entrada) -

teste('convite: C26 a criação de senha expira o cookie de aviso que veio no pedido, no 303 e na tela sem entrada', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    $c->cookies[D26_AVISO_NOME] = D26_AVISO_OUTRO_APARELHO;
    $entrou = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA));
    igual(303, $entrou->status, 'criou e entrou');
    contem(D26_AVISO_NOME . '=; Max-Age=0', implode(' | ', $entrou->cabecalhos['set-cookie'] ?? []), 'o aviso que veio no pedido sai do navegador (303)');

    // Login que falha depois do CAS (IP cheio na pausa, como em C22b): 303 para /, e o último Set-Cookie é o aviso senha-criada.
    $b = Ambiente::novo(['workers' => 4]);
    $tokenB = cvb2Convidar($b, 'ana');
    $d = $b->cliente();
    $csrfB = cvb2Campo(cvb2Pagina($d, $tokenB)->corpo, 'csrf');
    $d->cookies[D26_AVISO_NOME] = D26_AVISO_OUTRO_APARELHO;
    pausaLigar($b, 'convite-antes-gravar', 'ana');
    $req = cvb2PostSemEsperar($d, cvb2Campos($tokenB, $csrfB, CVB2_SENHA));
    pausaEsperarChegada($req, $b, 'convite-antes-gravar');
    cvb2Falhas($b, 0, 0, 30);
    pausaSoltar($b, 'convite-antes-gravar');
    $criada = cvb2ConcluirPost($req);
    igual(303, $criada->status, 'senha criada sem entrada: 303 para /');
    contem(D26_AVISO_NOME . '=senha-criada; Max-Age=600', cvb2UltimoCookie($criada), 'o último aviso é senha-criada, não a expiração');
    naoContem(D26_AVISO_NOME . '=; Max-Age=0', cvb2UltimoCookie($criada), 'o último Set-Cookie não é a expiração');
});

// ---- C27: a tela de erro de senha (400) reenvia o formulário: mesma política no cabeçalho e no meta ----

teste('convite: C27 a tela de erro de senha (400) sai com strict-origin no cabeçalho e no meta, e o reenvio cria a senha', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    $erro = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA, CVB2_SENHA . '-outra'));
    igual(400, $erro->status, 'repetição diferente');
    igual('strict-origin', $erro->cabecalho('referrer-policy'), 'referrer da tela de erro');
    contem('<meta name="referrer" content="strict-origin">', $erro->corpo, 'meta de referrer na tela de erro');
    naoContem('no-referrer', $erro->corpo, 'sem no-referrer na tela que reenvia o formulário');
    $reenvio = cvb2Enviar($c, cvb2Campos($token, cvb2Campo($erro->corpo, 'csrf'), CVB2_SENHA));
    igual(303, $reenvio->status, 'o reenvio cria a senha e entra');
});

// ---- C28: origem do POST: o que o navegador manda com strict-origin passa; "null" nunca passa ----------

teste('convite: C28 Origin null ou de outro site é 403 origem com qualquer Sec-Fetch-Site; Origin próprio com same-origin cria a senha', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    $antes = hash_file('sha256', $a->priv . '/usuarios.json');
    $recusas = [
        'null com same-origin' => ['Origin' => 'null', 'Sec-Fetch-Site' => 'same-origin'],
        'null com cross-site' => ['Origin' => 'null', 'Sec-Fetch-Site' => 'cross-site'],
        'null com same-site' => ['Origin' => 'null', 'Sec-Fetch-Site' => 'same-site'],
        'null com none' => ['Origin' => 'null', 'Sec-Fetch-Site' => 'none'],
        'null sem Sec-Fetch-Site' => ['Origin' => 'null'],
        'outro site com same-origin' => ['Origin' => 'http://site-de-outro.example', 'Sec-Fetch-Site' => 'same-origin'],
        'própria com cross-site' => ['Origin' => $c->origem(), 'Sec-Fetch-Site' => 'cross-site'],
        'própria com same-site' => ['Origin' => $c->origem(), 'Sec-Fetch-Site' => 'same-site'],
    ];
    foreach ($recusas as $nome => $cabecalhos) {
        $r = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA), $cabecalhos);
        igual(403, $r->status, "$nome: status");
        igual('origem', $r->json()['erro'], "$nome: erro");
    }
    igual($antes, hash_file('sha256', $a->priv . '/usuarios.json'), 'nenhuma recusa grava nem consome o link');
    $navegador = cvb2Enviar($c, cvb2Campos($token, $csrf, CVB2_SENHA), ['Origin' => $c->origem(), 'Sec-Fetch-Site' => 'same-origin']);
    igual(303, $navegador->status, 'Origin próprio com same-origin (o pedido do navegador real) cria a senha');
});

// ---- C29: falha ao zerar o contador depois do CAS: a senha fica criada, a pessoa entra e o erro vai ao erros.log ----
teste('convite: C29 falha ao zerar o contador depois do CAS: a senha fica criada, a pessoa entra e o erros.log registra', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
    pausaLigar($a, 'convite-antes-gravar', 'ana');
    $req = cvb2PostSemEsperar($c, cvb2Campos($token, $csrf, CVB2_SENHA));
    pausaEsperarChegada($req, $a, 'convite-antes-gravar');
    // Segura o lock de tentativas.json: o zerar do CAS espera D26_LOCK_TETO_MS e lança D26Indisponivel.
    $trava = fopen($a->priv . '/tentativas.json.lock', 'c');
    flock($trava, LOCK_EX);
    pausaSoltar($a, 'convite-antes-gravar');
    // Espera a linha do erro (sem sleep fixo); teto de 10 s. Só depois de achar ou estourar, solta o lock.
    $limite = microtime(true) + 10;
    while (microtime(true) < $limite && !str_contains((string) @file_get_contents($a->priv . '/erros.log'), 'contadores não zerados')) {
        usleep(10000);
    }
    flock($trava, LOCK_UN);
    fclose($trava);
    $r = cvb2ConcluirPost($req);
    igual(303, $r->status, 'a senha criada leva à entrada mesmo sem zerar');
    igual('/', $r->cabecalho('location'), 'destino /');
    verdadeiro(password_verify(CVB2_SENHA, (string) conviteConta($a, 'ana')['hash']), 'a senha nova ficou gravada');
    contem('contadores não zerados (D26Indisponivel)', (string) file_get_contents($a->priv . '/erros.log'), 'o erro foi registrado');
});
