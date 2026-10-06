<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

const COOKIE_DISPOSITIVO = '__Host-d26disp';

/** Satura a chave de conta de $login (14 tentativas de IPs diferentes; espera de ~32 s a partir de agora). */
function saturarConta(string $priv, string $login): void
{
    saturarContaEm($priv, $login, time());
}

/** Conta nova num PRIV temporário. @return array{string, string} [dir, priv] */
function privComConta(string $login = 'chefe'): array
{
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    igual('ok', d26_contas_criar($priv, $login, 'hash-x', false));
    return [$dir, $priv];
}

function lerArquivoUsuarios(Ambiente $a): string
{
    return lerArquivoContas($a->priv);
}

function lerArquivoContas(string $priv): string
{
    return (string) file_get_contents($priv . '/usuarios.json');
}

teste('dispositivo: token é aleatório por aparelho (43 base64url), nunca igual entre emissões', function (): void {
    [$dir, $priv] = privComConta();
    $a = d26_dispositivo_novo($priv, 'chefe');
    $b = d26_dispositivo_novo($priv, 'chefe');
    verdadeiro(preg_match('/^[A-Za-z0-9_-]{43}$/D', $a) === 1, "formato: $a");
    verdadeiro($a !== $b, 'dois aparelhos, dois tokens');
    verdadeiro(d26_dispositivo_novo($priv, 'inexistente') === '', 'conta inexistente não emite');
    apagarArvore($dir);
}, false);

teste('dispositivo: o arquivo de contas guarda só o sha256 do token, nunca o token em claro', function (): void {
    [$dir, $priv] = privComConta();
    $t = d26_dispositivo_novo($priv, 'chefe');
    $bruto = lerArquivoContas($priv);
    naoContem($t, $bruto, 'token em claro no arquivo');
    contem(hash('sha256', $t), $bruto, 'sha256 do token gravado');
    $c = d26_contas_buscar($priv, 'chefe');
    igual(1, count($c['aparelhos']));
    verdadeiro(is_int($c['aparelhos'][0]['criadoEm']) && is_int($c['aparelhos'][0]['expiraEm']), 'criadoEm e expiraEm inteiros');
    igual(30 * 86400, $c['aparelhos'][0]['expiraEm'] - $c['aparelhos'][0]['criadoEm'], 'validade de 30 dias');
    apagarArvore($dir);
}, false);

teste('dispositivo: cookie válido só para a conta dona; adulterado, ausente ou de tipo errado não vale', function (): void {
    [$dir, $priv] = privComConta('chefe');
    igual('ok', d26_contas_criar($priv, 'outro.login', 'hash-y', false));
    $bom = d26_dispositivo_novo($priv, 'chefe');
    $_COOKIE[COOKIE_DISPOSITIVO] = $bom;
    verdadeiro(d26_dispositivo_confiavel($priv, 'chefe'), 'cookie da própria conta vale');
    verdadeiro(!d26_dispositivo_confiavel($priv, 'outro.login'), 'cookie de outra conta não vale');
    verdadeiro(!d26_dispositivo_confiavel($priv, 'Chefe'), 'case-sensitive: login diferente não vale');
    $_COOKIE[COOKIE_DISPOSITIVO] = substr($bom, 0, -1) . ($bom[42] === 'A' ? 'B' : 'A');
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'adulterado não vale');
    $_COOKIE[COOKIE_DISPOSITIVO] = ['array'];
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'tipo errado não vale');
    unset($_COOKIE[COOKIE_DISPOSITIVO]);
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'ausente não vale');
    apagarArvore($dir);
}, false);

teste('dispositivo: cookie expirado (30 dias) não vale', function (): void {
    [$dir, $priv] = privComConta();
    $t0 = 1_800_000_000;
    $tok = d26_dispositivo_novo($priv, 'chefe', $t0);
    $_COOKIE[COOKIE_DISPOSITIVO] = $tok;
    verdadeiro(d26_dispositivo_confiavel($priv, 'chefe', $t0 + 30 * 86400 - 1), 'um segundo antes de vencer ainda vale');
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe', $t0 + 30 * 86400), 'no vencimento não vale');
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe', $t0 + 40 * 86400), 'depois não vale');
    unset($_COOKIE[COOKIE_DISPOSITIVO]);
    apagarArvore($dir);
}, false);

teste('dispositivo: no máximo 5 por conta; o mais antigo sai', function (): void {
    [$dir, $priv] = privComConta();
    $t0 = 1_800_000_000;
    $tokens = [];
    for ($i = 0; $i < 6; $i++) {
        $tokens[] = d26_dispositivo_novo($priv, 'chefe', $t0 + $i);
    }
    igual(5, count(d26_contas_buscar($priv, 'chefe')['aparelhos']), 'teto de 5');
    $agora = $t0 + 10;
    $_COOKIE[COOKIE_DISPOSITIVO] = $tokens[0];
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe', $agora), 'o mais antigo saiu');
    foreach (range(1, 5) as $i) {
        $_COOKIE[COOKIE_DISPOSITIVO] = $tokens[$i];
        verdadeiro(d26_dispositivo_confiavel($priv, 'chefe', $agora), "aparelho $i continua");
    }
    unset($_COOKIE[COOKIE_DISPOSITIVO]);
    apagarArvore($dir);
}, false);

teste('dispositivo: troca de senha, redefinição e desativação invalidam todos os aparelhos', function (): void {
    foreach (['troca', 'redefinicao', 'desativacao'] as $caso) {
        [$dir, $priv] = privComConta();
        $a = d26_dispositivo_novo($priv, 'chefe');
        $b = d26_dispositivo_novo($priv, 'chefe');
        $_COOKIE[COOKIE_DISPOSITIVO] = $a;
        verdadeiro(d26_dispositivo_confiavel($priv, 'chefe'), "$caso: antes valia");
        match ($caso) {
            'troca' => d26_contas_trocar_senha($priv, 'chefe', 'hash-novo', d26_contas_buscar($priv, 'chefe')),
            'redefinicao' => d26_contas_redefinir($priv, 'chefe', 'hash-novo'),
            default => d26_contas_definir_ativo($priv, 'chefe', false),
        };
        foreach ([$a, $b] as $t) {
            $_COOKIE[COOKIE_DISPOSITIVO] = $t;
            verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), "$caso: cookie antigo não vale mais");
        }
        // Mesmo que a lista fosse restaurada à mão, a versaoSessao presa ao aparelho barraria.
        if ($caso === 'troca') {
            $c = d26_contas_buscar($priv, 'chefe');
            verdadeiro(($c['aparelhos'] ?? []) === [], 'a lista foi esvaziada');
        }
        unset($_COOKIE[COOKIE_DISPOSITIVO]);
        apagarArvore($dir);
    }
}, false);

teste('dispositivo: aparelho preso à versaoSessao e ao uid (lista restaurada à mão não revive o cookie)', function (): void {
    [$dir, $priv] = privComConta();
    $tok = d26_dispositivo_novo($priv, 'chefe');
    $_COOKIE[COOKIE_DISPOSITIVO] = $tok;
    $d = json_decode(lerArquivoContas($priv), true);
    $d['usuarios'][0]['versaoSessao'] += 1;
    file_put_contents($priv . '/usuarios.json', json_encode($d));
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'versaoSessao diferente do aparelho');
    $d['usuarios'][0]['versaoSessao'] -= 1;
    file_put_contents($priv . '/usuarios.json', json_encode($d));
    verdadeiro(d26_dispositivo_confiavel($priv, 'chefe'), 'versão original volta a valer (controle)');
    $d['usuarios'][0]['uid'] = bin2hex(random_bytes(16));
    file_put_contents($priv . '/usuarios.json', json_encode($d));
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'uid diferente do aparelho');
    unset($_COOKIE[COOKIE_DISPOSITIVO]);
    apagarArvore($dir);
}, false);

teste('dispositivo: excluir e recriar a conta não ressuscita o cookie', function (): void {
    [$dir, $priv] = privComConta();
    $_COOKIE[COOKIE_DISPOSITIVO] = d26_dispositivo_novo($priv, 'chefe');
    d26_contas_excluir($priv, 'chefe');
    d26_contas_criar($priv, 'chefe', 'hash-z', false);
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'conta recriada não herda aparelhos');
    unset($_COOKIE[COOKIE_DISPOSITIVO]);
    apagarArvore($dir);
}, false);

teste('dispositivo: conta sem uid não aceita aparelho', function (): void {
    [$dir, $priv] = privComConta();
    $d = json_decode(lerArquivoContas($priv), true);
    unset($d['usuarios'][0]['uid']);
    file_put_contents($priv . '/usuarios.json', json_encode($d));
    igual('', d26_dispositivo_novo($priv, 'chefe'), 'sem uid não emite');
    apagarArvore($dir);
}, false);

teste('login certo emite __Host-d26disp: aleatório, Secure, HttpOnly, SameSite=Strict, path=/, sem Domain, 30 dias', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    $achados = array_values(array_filter($c->ultimoSetCookie, static fn (string $s): bool => str_starts_with($s, COOKIE_DISPOSITIVO . '=')));
    igual(1, count($achados), 'um Set-Cookie do dispositivo');
    $sc = $achados[0];
    foreach (['Secure', 'HttpOnly', 'SameSite=Strict', 'path=/'] as $attr) {
        verdadeiro(stripos($sc, $attr) !== false, "atributo $attr em: $sc");
    }
    verdadeiro(stripos($sc, 'domain=') === false, 'sem Domain');
    verdadeiro(preg_match('/max-age=(\d+)/i', $sc, $m) === 1 && abs((int) $m[1] - 30 * 86400) <= 5, 'Max-Age de 30 dias: ' . $sc);
    verdadeiro(preg_match('/^__Host-d26disp=[A-Za-z0-9_-]{43};/', $sc) === 1, 'valor aleatório base64url de 43: ' . $sc);
    $valor = $c->cookies[COOKIE_DISPOSITIVO];
    naoContem($valor, lerArquivoUsuarios($a), 'o token em claro nunca vai ao arquivo de contas');
    $c->post('/api/sair.php');
    verdadeiro(isset($c->cookies[COOKIE_DISPOSITIVO]), 'sair não apaga o dispositivo confiável');
});

teste('dois logins de aparelhos diferentes recebem tokens diferentes; o mesmo aparelho não gasta vaga a cada login', function (): void {
    $a = Ambiente::novo();
    $um = $a->entrar()->cookies[COOKIE_DISPOSITIVO] ?? '';
    $dois = $a->entrar()->cookies[COOKIE_DISPOSITIVO] ?? '';
    verdadeiro($um !== '' && $dois !== '' && $um !== $dois, 'tokens distintos por aparelho');
    igual(2, count($a->lerUsuarios()['usuarios'][0]['aparelhos']), 'dois aparelhos');
    $c = $a->clienteComSessao();
    $c->cookies[COOKIE_DISPOSITIVO] = $um;
    igual(200, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status);
    igual(2, count($a->lerUsuarios()['usuarios'][0]['aparelhos']), 'aparelho já confiável não ocupa outra vaga');
});

teste('login errado não emite o cookie do dispositivo', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'errada-errada']);
    verdadeiro(!isset($c->cookies[COOKIE_DISPOSITIVO]), 'sem cookie');
});

teste('atacante distribuído satura a conta: sem dispositivo 429, com dispositivo o admin entra', function (): void {
    $a = Ambiente::novo();
    $primeiro = $a->entrar(); // 1º login: o admin ganha o cookie
    $disp = $primeiro->cookies[COOKIE_DISPOSITIVO] ?? '';
    verdadeiro($disp !== '', 'cookie do dispositivo emitido no 1º login');
    saturarConta($a->priv, Ambiente::LOGIN_ADMIN);

    $semDisp = $a->clienteComSessao();
    $r = $semDisp->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    igual(429, $r->status, 'sem dispositivo: trancado pelo atacante');

    $comDisp = $a->clienteComSessao();
    $comDisp->cookies[COOKIE_DISPOSITIVO] = $disp;
    igual(200, $comDisp->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'com dispositivo: entra');

    $falso = $a->clienteComSessao();
    $falso->cookies[COOKIE_DISPOSITIVO] = substr($disp, 0, -1) . ($disp[42] === 'A' ? 'B' : 'A');
    igual(429, $falso->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'cookie adulterado não ajuda');
});

teste('dispositivo confiável não dá passe livre: senha errada continua contando (usuário+IP, 5 falhas livres)', function (): void {
    $a = Ambiente::novo();
    $disp = $a->entrar()->cookies[COOKIE_DISPOSITIVO] ?? '';
    $c = $a->clienteComSessao();
    $c->cookies[COOKIE_DISPOSITIVO] = $disp;
    for ($i = 1; $i <= 5; $i++) {
        igual(401, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'errada-errada'])->status, "falha $i");
    }
    igual(429, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'a 6ª espera mesmo com o dispositivo');
});

/** @return array{int, string, string} */
function rodarDesbloquear(array $args): array
{
    $p = proc_open(
        array_merge([PHP_BINARY, RAIZ_REPO . '/servidor/cli/desbloquear.php'], $args),
        [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes
    );
    $out = (string) stream_get_contents($pipes[1]);
    $err = (string) stream_get_contents($pipes[2]);
    return [proc_close($p), $out, $err];
}

teste('cli desbloquear: zera os contadores da conta (conta e usuário+IP), sem tocar nas outras contas', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    file_put_contents($priv . '/erros.log', '');
    saturarConta($priv, 'chefe');
    for ($i = 0; $i < 7; $i++) {
        d26_limite_reservar($priv, 'chefe', '192.0.2.50', time() - 1000 + $i); // usuário+IP do próprio admin
    }
    saturarConta($priv, 'outra');
    verdadeiro(d26_limite_reservar($priv, 'chefe', '192.0.2.99', time()) > 0, 'chefe trancado');
    [$rc, $out, $err] = rodarDesbloquear([$priv, 'chefe']);
    igual(0, $rc, "saída: $out $err");
    igual(0, d26_limite_reservar($priv, 'chefe', '192.0.2.99', time()), 'conta liberada');
    igual(0, d26_limite_reservar($priv, 'chefe', '192.0.2.50', time()), 'usuário+IP daquela conta também liberado');
    verdadeiro(d26_limite_reservar($priv, 'outra', '192.0.2.99', time()) > 0, 'outra conta continua trancada');
    naoContem('192.0.2', $out . $err, 'não imprime IP');
    apagarArvore($dir);
}, false);

teste('cli desbloquear: argumentos inválidos, pasta inexistente ou login inválido falham sem criar nada', function (): void {
    $dir = dirTemporario();
    verdadeiro(rodarDesbloquear([])[0] !== 0, 'sem argumentos');
    verdadeiro(rodarDesbloquear([$dir . '/privado'])[0] !== 0, 'sem login');
    verdadeiro(rodarDesbloquear([$dir . '/nao-existe', 'chefe'])[0] !== 0, 'pasta inexistente');
    verdadeiro(!file_exists($dir . '/nao-existe'), 'não criou a pasta');
    mkdir($dir . '/privado', 0700);
    verdadeiro(rodarDesbloquear([$dir . '/privado', 'a b'])[0] !== 0, 'login inválido');
    verdadeiro(!file_exists($dir . '/privado/tentativas.json'), 'não criou arquivo');
    apagarArvore($dir);
}, false);

teste('cookie de outra conta não isenta: o aparelho do admin não ajuda quem tenta a conta da Ana', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'senhaProvisoria' => 'Provisoria-Ana1'])->status);
    $disp = $admin->cookies[COOKIE_DISPOSITIVO];
    saturarConta($a->priv, 'ana');
    $c = $a->clienteComSessao();
    $c->cookies[COOKIE_DISPOSITIVO] = $disp;
    igual(429, $c->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => 'Provisoria-Ana1'])->status, 'cookie do admin não vale para a Ana');
});

teste('cookie antigo não vale após troca de senha (pela API) e o navegador recebe aparelho novo', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    $antigo = $c->cookies[COOKIE_DISPOSITIVO];
    igual(200, $c->post('/api/trocar-senha.php', ['senhaAtual' => Ambiente::SENHA_ADMIN, 'senhaNova' => 'SenhaNovaDoAdmin123'])->status);
    $novo = $c->cookies[COOKIE_DISPOSITIVO];
    verdadeiro($novo !== $antigo, 'a troca reemite o aparelho do navegador que acabou de provar a senha');
    saturarConta($a->priv, Ambiente::LOGIN_ADMIN);
    $velho = $a->clienteComSessao();
    $velho->cookies[COOKIE_DISPOSITIVO] = $antigo;
    igual(429, $velho->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'SenhaNovaDoAdmin123'])->status, 'cookie antigo não isenta');
    $atual = $a->clienteComSessao();
    $atual->cookies[COOKIE_DISPOSITIVO] = $novo;
    igual(200, $atual->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => 'SenhaNovaDoAdmin123'])->status, 'cookie novo isenta');
});

teste('cookie antigo não vale após redefinição e desativação pelo admin', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'senhaProvisoria' => 'Provisoria-Ana1'])->status);
    $disp = $a->entrar('ana', 'Provisoria-Ana1')->cookies[COOKIE_DISPOSITIVO];
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana', 'senhaProvisoria' => 'Outra-Provisoria2'])->status);
    saturarConta($a->priv, 'ana');
    $c = $a->clienteComSessao();
    $c->cookies[COOKIE_DISPOSITIVO] = $disp;
    igual(429, $c->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => 'Outra-Provisoria2'])->status, 'após redefinição');
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => 'ana'])->status);
    igual([], $a->lerUsuarios()['usuarios'][1]['aparelhos'] ?? [], 'desativar esvazia os aparelhos');
});

teste('admin revoga os aparelhos de um usuário: o cookie deixa de valer e o admin não revoga a si mesmo', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'senhaProvisoria' => 'Provisoria-Ana1'])->status);
    $disp = $a->entrar('ana', 'Provisoria-Ana1')->cookies[COOKIE_DISPOSITIVO];
    $sessaoAna = $a->entrar('ana', 'Provisoria-Ana1');
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'revogar-aparelhos', 'usuario' => 'ana'])->status);
    saturarConta($a->priv, 'ana');
    $c = $a->clienteComSessao();
    $c->cookies[COOKIE_DISPOSITIVO] = $disp;
    igual(429, $c->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => 'Provisoria-Ana1'])->status, 'revogado: não isenta mais');
    igual(false, $sessaoAna->get('/api/sessao.php')->json()['autenticado'] ?? null, 'revogar incrementa a versaoSessao: a sessão da Ana cai (decisão do CTO)');
    $r = $admin->post('/api/usuarios.php', ['acao' => 'revogar-aparelhos', 'usuario' => Ambiente::LOGIN_ADMIN]);
    igual(409, $r->status, 'sobre si mesmo: recusa');
    igual('si-mesmo', $r->json()['erro'] ?? null);
    igual(400, $admin->post('/api/usuarios.php', ['acao' => 'revogar-aparelhos', 'usuario' => 'fantasma'])->status, 'usuário inexistente');
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia', 'senhaProvisoria' => 'Provisoria-Bia1'])->status);
    igual(403, $a->entrar('bia', 'Provisoria-Bia1')->post('/api/usuarios.php', ['acao' => 'revogar-aparelhos', 'usuario' => 'ana'])->status, 'não admin não revoga');
});

teste('listar usuários não expõe hash de aparelho nem token, só a contagem', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $tok = $admin->cookies[COOKIE_DISPOSITIVO];
    $r = $admin->get('/api/usuarios.php');
    igual(200, $r->status);
    naoContem($tok, $r->corpo, 'token em claro');
    naoContem(hash('sha256', $tok), $r->corpo, 'hash do aparelho');
    naoContem('"hash"', $r->corpo, 'hash de senha');
    igual(1, $r->json()['usuarios'][0]['aparelhos'], 'contagem de aparelhos');
});

teste('conta sem uid: sessão recusada, login recusado, e a API e o CLI sempre gravam uid', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    igual(true, $c->get('/api/sessao.php')->json()['autenticado']);
    $d = $a->lerUsuarios();
    unset($d['usuarios'][0]['uid']);
    file_put_contents($a->priv . '/usuarios.json', json_encode($d, JSON_THROW_ON_ERROR));
    igual(false, $c->get('/api/sessao.php')->json()['autenticado'], 'sessão de conta sem uid não vale');
    $novo = $a->clienteComSessao();
    igual(401, $novo->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'login em conta sem uid é recusado');
});

teste('API criar grava uid hex de 32 e aparelhos vazio', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'senhaProvisoria' => 'Provisoria-Ana1'])->status);
    $ana = $a->lerUsuarios()['usuarios'][1];
    verdadeiro(preg_match('/^[0-9a-f]{32}$/D', (string) ($ana['uid'] ?? '')) === 1, 'uid gravado pela API');
});

teste('dispositivo (mata a mutação M2): conta com ativo=false editada à mão, sem mexer em aparelhos nem versão, não tem aparelho confiável', function (): void {
    [$dir, $priv] = privComConta();
    $_COOKIE[COOKIE_DISPOSITIVO] = d26_dispositivo_novo($priv, 'chefe');
    verdadeiro(d26_dispositivo_confiavel($priv, 'chefe'), 'controle: ativa, o cookie vale');
    $d = json_decode(lerArquivoContas($priv), true);
    $d['usuarios'][0]['ativo'] = false;
    file_put_contents($priv . '/usuarios.json', json_encode($d));
    verdadeiro(count(d26_contas_buscar($priv, 'chefe')['aparelhos']) === 1, 'o aparelho continua listado');
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'desativada: o aparelho não vale');
    unset($_COOKIE[COOKIE_DISPOSITIVO]);
    apagarArvore($dir);
}, false);

teste('dispositivo: d26_dispositivo_novo com versão/uid esperados só emite se a conta é a vista (conferido sob lock)', function (): void {
    [$dir, $priv] = privComConta();
    $c = d26_contas_buscar($priv, 'chefe');
    igual('', d26_dispositivo_novo($priv, 'chefe', null, $c['versaoSessao'] + 1, $c['uid']), 'versão errada');
    igual('', d26_dispositivo_novo($priv, 'chefe', null, $c['versaoSessao'], str_repeat('0', 32)), 'uid errado');
    igual([], d26_contas_buscar($priv, 'chefe')['aparelhos'], 'nada foi gravado');
    verdadeiro(d26_dispositivo_novo($priv, 'chefe', null, $c['versaoSessao'], $c['uid']) !== '', 'versão e uid certos emitem');
    apagarArvore($dir);
}, false);
