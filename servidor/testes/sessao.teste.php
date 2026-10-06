<?php
declare(strict_types=1);

const CABECALHOS_SEGURANCA = [
    'content-type' => 'application/json; charset=utf-8',
    'cache-control' => 'no-store',
    'x-content-type-options' => 'nosniff',
    'referrer-policy' => 'same-origin',
    'x-frame-options' => 'DENY',
    'content-security-policy' => "default-src 'none'; frame-ancestors 'none'",
];

teste('cabeçalhos de segurança em sucesso e em erro, em todos os endpoints', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $respostas = [
        'saude' => $c->get('/api/saude.php'),
        'sessao' => $c->get('/api/sessao.php'),
        'conteudo-401' => $c->get('/api/conteudo.php'),
        'usuarios-401' => $c->get('/api/usuarios.php'),
        'entrar-405' => $c->get('/api/entrar.php'),
        'entrar-401' => $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y']),
        'entrar-403' => $c->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'y'], ['X-CSRF-Token' => 'errado']),
    ];
    foreach ($respostas as $nome => $r) {
        foreach (CABECALHOS_SEGURANCA as $cab => $valor) {
            igual($valor, $r->cabecalho($cab), "$nome: $cab");
        }
    }
});

teste('cookie de sessão: nome __Host-d26, Secure, HttpOnly, SameSite=Strict, path=/, sem Domain nem Expires', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $c->get('/api/sessao.php');
    igual(1, count($c->ultimoSetCookie), 'um Set-Cookie');
    $sc = $c->ultimoSetCookie[0];
    verdadeiro(str_starts_with($sc, '__Host-d26='), 'nome do cookie');
    foreach (['Secure', 'HttpOnly', 'SameSite=Strict', 'path=/'] as $attr) {
        verdadeiro(stripos($sc, $attr) !== false, "atributo $attr em: $sc");
    }
    foreach (['domain=', 'expires=', 'max-age='] as $attr) {
        verdadeiro(stripos($sc, $attr) === false, "sem $attr em: $sc");
    }
});

teste('sessão mantém o mesmo csrf enquanto o cookie vier; sem cookie nasce outra', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $c->get('/api/sessao.php');
    $csrf1 = $c->csrf;
    $c->get('/api/sessao.php');
    igual($csrf1, $c->csrf, 'mesmo csrf com o mesmo cookie');
    $outro = $a->clienteComSessao();
    verdadeiro($outro->csrf !== $csrf1, 'sessão nova, csrf novo');
});

teste('id de sessão forjado pelo cliente é descartado (strict mode)', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $c->cookies['__Host-d26'] = 'idforjadoporatacante0123456789abcdef';
    $c->get('/api/sessao.php');
    verdadeiro($c->cookies['__Host-d26'] !== 'idforjadoporatacante0123456789abcdef', 'servidor emitiu id próprio');
    verdadeiro(!is_file($a->priv . '/sessoes/sess_idforjadoporatacante0123456789abcdef'), 'não criou arquivo com o id forjado');
});

teste('sair.php destrói a sessão e o cookie; exige csrf', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    $semToken = $c->post('/api/sair.php', [], ['X-CSRF-Token' => null]);
    igual(403, $semToken->status, 'sair sem csrf');
    $idAntigo = $c->cookies['__Host-d26'];
    $r = $c->post('/api/sair.php');
    igual(200, $r->status);
    igual(['ok' => true], $r->json());
    verdadeiro(!isset($c->cookies['__Host-d26']), 'cookie removido');
    $c->cookies['__Host-d26'] = $idAntigo;
    $s = $c->get('/api/sessao.php')->json();
    igual(false, $s['autenticado'], 'sessão antiga não volta');
});

teste('sessão expira por ociosidade (2 h) e por validade absoluta (12 h)', function (): void {
    $a = Ambiente::novo();
    foreach (['atividade' => 7201, 'criada' => 43201] as $campo => $segundos) {
        $c = $a->entrar();
        $arq = $a->priv . '/sessoes/sess_' . $c->cookies['__Host-d26'];
        $txt = (string) file_get_contents($arq);
        $novo = preg_replace('/' . $campo . '\|i:\d+;/', $campo . '|i:' . (time() - $segundos) . ';', $txt, -1, $n);
        igual(1, $n, "campo $campo encontrado no arquivo de sessão");
        file_put_contents($arq, (string) $novo);
        $s = $c->get('/api/sessao.php')->json();
        igual(false, $s['autenticado'], "expirou por $campo");
        $a->zerarTentativas();
    }
});
