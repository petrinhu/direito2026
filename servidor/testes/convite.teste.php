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
    $r = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana']);
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
    $criada = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana'])->json();
    igual(true, $criada['ok'] ?? null, 'criar');
    $ana = conviteConta($a, 'ana');
    igual('argon2id', password_get_info((string) $ana['hash'])['algoName'] ?? null, 'hash inverificável é Argon2id real');
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
    $primeiro = conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana']));
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
    $token = conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana']));
    $hash = hash('sha256', $token);

    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'revogar-aparelhos', 'usuario' => 'ana'])->status, 'revogar-aparelhos');
    igual($hash, conviteConta($a, 'ana')['convite']['hash'] ?? null, 'revogar-aparelhos mantém o convite');

    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => 'ana'])->status, 'desativar');
    igual(false, array_key_exists('convite', conviteConta($a, 'ana')), 'desativar apaga o convite');

    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'ativar', 'usuario' => 'ana'])->status, 'ativar');
    igual(false, array_key_exists('convite', conviteConta($a, 'ana')), 'ativar não cria convite');

    $tokenBia = conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia']));
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'excluir', 'usuario' => 'bia'])->status, 'excluir');
    igual(null, conviteConta($a, 'bia'), 'excluir remove a conta e o convite junto');
    naoContem(hash('sha256', $tokenBia), (string) file_get_contents($a->priv . '/usuarios.json'), 'o hash de bia não sobra no disco');
});

// ---- C6: a listagem mostra o estado e o prazo, nunca o hash ----------------------------------

teste('convite: C6 a listagem mostra o estado e o prazo do convite, nunca o hash', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $token = conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana']));
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

    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia'])->status, 'criar bia sem senha');
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
        conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana'])),
        conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana'])),
        conviteTokenDe($admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia'])),
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
