<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

const COOKIE_DISPOSITIVO = '__Host-d26disp';

/** Satura a chave de conta de $login (14 tentativas de IPs diferentes; espera de ~32 s a partir de agora). */
function saturarConta(string $priv, string $login): void
{
    saturarContaEm($priv, $login, time());
}

teste('dispositivo: token é HMAC do login com o segredo; vale só para aquele login e aquele segredo', function (): void {
    $s1 = str_repeat('ab', 32);
    $s2 = str_repeat('cd', 32);
    $t = d26_dispositivo_token('chefe', $s1);
    igual(hash_hmac('sha256', 'disp|chefe', $s1), $t);
    verdadeiro($t !== d26_dispositivo_token('Chefe', $s1), 'case-sensitive');
    verdadeiro($t !== d26_dispositivo_token('chefe', $s2), 'segredo diferente, token diferente');
    verdadeiro($t !== hash_hmac('sha256', 'pre|chefe', $s1), 'separação de domínio com o CSRF pré-login');
}, false);

teste('dispositivo: cookie válido só para o login a que pertence; adulterado ou ausente não vale', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    $bom = d26_dispositivo_token('chefe', d26_segredo($priv));
    $_COOKIE[COOKIE_DISPOSITIVO] = $bom;
    verdadeiro(d26_dispositivo_confiavel($priv, 'chefe'), 'cookie do próprio login vale');
    verdadeiro(!d26_dispositivo_confiavel($priv, 'outro.login'), 'não vale para outro login');
    $_COOKIE[COOKIE_DISPOSITIVO] = substr($bom, 0, -1) . ($bom[63] === '0' ? '1' : '0');
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'adulterado não vale');
    $_COOKIE[COOKIE_DISPOSITIVO] = ['array'];
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'tipo errado não vale');
    unset($_COOKIE[COOKIE_DISPOSITIVO]);
    verdadeiro(!d26_dispositivo_confiavel($priv, 'chefe'), 'ausente não vale');
    apagarArvore($dir);
}, false);

teste('login certo emite __Host-d26disp: Secure, HttpOnly, SameSite=Strict, path=/, sem Domain, 180 dias', function (): void {
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
    verdadeiro(preg_match('/max-age=(\d+)/i', $sc, $m) === 1 && abs((int) $m[1] - 180 * 86400) <= 5, 'Max-Age de 180 dias: ' . $sc);
    verdadeiro(preg_match('/^__Host-d26disp=[0-9a-f]{64};/', $sc) === 1, 'valor é um HMAC hex de 64: ' . $sc);
    $c->post('/api/sair.php');
    verdadeiro(isset($c->cookies[COOKIE_DISPOSITIVO]), 'sair não apaga o dispositivo confiável');
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
    $falso->cookies[COOKIE_DISPOSITIVO] = substr($disp, 0, -1) . ($disp[63] === '0' ? '1' : '0');
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
