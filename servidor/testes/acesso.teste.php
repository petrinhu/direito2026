<?php
declare(strict_types=1);

/**
 * Entrada pelo formulário (plano do CTO do login único, seções 1.4, 1.5 e 3; LU-F2.5).
 * Frase igual nos casos de falha, limite de tentativas, CSRF pelo cookie pré (T24),
 * Clear-Site-Data "cache" e expiração dos cookies antigos da Júri. Sintético: nenhuma
 * conta real, senha de teste só pelo Ambiente.
 */

const ACESSO_FRASE = 'Site exclusivo para público seleto!';

/** Valor de um campo oculto ou de texto da tela, já desescapado. */
function acessoCampo(string $html, string $nome): string
{
    return preg_match('/name="' . preg_quote($nome, '/') . '" value="([^"]*)"/', $html, $m) === 1
        ? html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8')
        : '';
}

/** Tela de entrada de um cliente anônimo: devolve [token, destino]. */
function acessoTela(Cliente $c, string $caminho = '/'): array
{
    $r = $c->get($caminho, PORTAO_NAVEGACAO);
    igual(200, $r->status, 'tela de entrada');
    $token = acessoCampo($r->corpo, 'csrf');
    verdadeiro($token !== '', 'a tela traz o token oculto');
    return [$token, acessoCampo($r->corpo, 'destino')];
}

/** POST de formulário, como o navegador faz ao enviar a tela (sem JSON, sem X-CSRF-Token). */
function acessoEnviar(Cliente $c, string $token, string $destino, string $usuario, string $senha): Resposta
{
    return $c->enviar('POST', '/api/acesso.php', http_build_query([
        'usuario' => $usuario,
        'senha' => $senha,
        'csrf' => $token,
        'destino' => $destino,
    ]), [
        'Content-Type' => 'application/x-www-form-urlencoded',
        'X-CSRF-Token' => null,
    ]);
}

teste('acesso: a tela de entrada emite o cookie pré e o formulário é aceito com ele', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    verdadeiro(isset($c->cookies['__Host-d26pre']), 'o Set-Cookie do pré chegou ao cliente (header_remove não pode apagá-lo)');
    $r = acessoEnviar($c, $token, '/', Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN);
    igual(303, $r->status, 'login certo pelo formulário');
    igual('/', $r->cabecalho('location'));
    verdadeiro(isset($c->cookies['__Host-d26']), 'a sessão foi emitida');
});

teste('acesso: login certo leva ao destino pedido, e o app sai depois dele', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token, $destino] = acessoTela($c, '/aula/um');
    igual('/aula/um', $destino, 'a tela guarda o destino pedido');
    $r = acessoEnviar($c, $token, $destino, Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN);
    igual(303, $r->status);
    igual('/aula/um', $r->cabecalho('location'));
    $app = $c->get('/aula/um', PORTAO_NAVEGACAO);
    igual(200, $app->status, 'com sessão, o portão serve o app');
    contem('CONTEUDO-SINTETICO-APP', $app->corpo);
});

teste('acesso: usuário inexistente, senha errada, conta inativa, formato inválido e campo vazio dão a MESMA resposta', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $a->semearUsuario('inativo1', 'SenhaInativa123', false, false, false);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    $casos = [
        'senha errada' => [Ambiente::LOGIN_ADMIN, 'senha-errada-1'],
        'inexistente' => ['ninguem', 'senha-errada-1'],
        'inativa com a senha certa' => ['inativo1', 'SenhaInativa123'],
        'formato inválido' => ['a b', 'x'],
        'campo vazio' => ['', ''],
    ];
    $referencia = null;
    foreach ($casos as $nome => [$usuario, $senha]) {
        $r = acessoEnviar($c, $token, '/', $usuario, $senha);
        igual(401, $r->status, "$nome: status");
        contem(ACESSO_FRASE, $r->corpo, "$nome: frase exata");
        contem('role="alert"', $r->corpo, "$nome: erro anunciado");
        contem('<title>' . ACESSO_FRASE, $r->corpo, "$nome: frase repetida no título");
        $referencia ??= $r;
        igual($referencia->corpo, $r->corpo, "$nome: corpo idêntico ao da senha errada");
        igual($referencia->cabecalho('content-length'), $r->cabecalho('content-length'), "$nome: tamanho idêntico");
    }
});

teste('acesso: campo vazio não sai antes do Argon2id (tempo comparável ao de senha errada)', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    $medir = static function (string $usuario) use ($c, $token): float {
        $t = microtime(true);
        $r = acessoEnviar($c, $token, '/', $usuario, 'senha-errada-1');
        $decorrido = microtime(true) - $t;
        igual(401, $r->status, "a medição tem de ser a tentativa de verdade, não um 404 ($usuario)");
        return $decorrido;
    };
    $existente = $medir(Ambiente::LOGIN_ADMIN);
    $vazio = $medir('');
    verdadeiro($vazio > $existente * 0.5, sprintf('vazio %.3fs vs existente %.3fs', $vazio, $existente));
});

teste('acesso: seis tentativas erradas seguidas recebem 429 com a frase e os segundos', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    for ($i = 0; $i < 5; $i++) {
        igual(401, acessoEnviar($c, $token, '/', Ambiente::LOGIN_ADMIN, 'senha-errada-1')->status, "tentativa $i");
    }
    $r = acessoEnviar($c, $token, '/', Ambiente::LOGIN_ADMIN, 'senha-errada-1');
    igual(429, $r->status, 'sexta tentativa vem com espera');
    contem(ACESSO_FRASE, $r->corpo, '429 traz a frase');
    verdadeiro(preg_match('/Aguarde [1-9][0-9]* segundos/', $r->corpo) === 1, '429 traz os segundos');
});

teste('acesso: destino malicioso cai em / (sem redirecionamento aberto)', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    foreach (['//evil.example/x', 'https://evil.example/', '/\\evil.example', '/a b', '/x?y=1&z=\r\nSet-Cookie: a=b'] as $destino) {
        $c = $a->cliente();
        [$token] = acessoTela($c);
        $r = acessoEnviar($c, $token, $destino, Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN);
        igual(303, $r->status, "destino $destino");
        igual('/', $r->cabecalho('location'), "destino $destino");
    }
});

teste('acesso: POST JSON é recusado, e POST de formulário em entrar.php também', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    $json = $c->post('/api/acesso.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN, 'csrf' => $token]);
    igual(400, $json->status, 'acesso.php recusa JSON');
    verdadeiro(!isset($c->cookies['__Host-d26']), 'nenhuma sessão por JSON recusado');
    $form = $c->enviar('POST', '/api/entrar.php', http_build_query([
        'usuario' => Ambiente::LOGIN_ADMIN,
        'senha' => Ambiente::SENHA_ADMIN,
    ]), ['Content-Type' => 'application/x-www-form-urlencoded', 'X-CSRF-Token' => $token]);
    igual(400, $form->status, 'entrar.php recusa formulário');
    igual('tipo-conteudo', $form->json()['erro']);
});

teste('acesso: formulário sem o token, ou com o token de outro cliente, é recusado', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    acessoTela($c);
    $outro = $a->cliente();
    [$tokenOutro] = acessoTela($outro);
    igual(403, acessoEnviar($c, '', '/', Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN)->status, 'sem token');
    igual(403, acessoEnviar($c, $tokenOutro, '/', Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN)->status, 'token de outro cliente');
    verdadeiro(!isset($c->cookies['__Host-d26']), 'nenhuma sessão sem token válido');
});

teste('acesso: com sessão válida e token pré, o formulário entra e chega ao destino (T24)', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    // Já entrou antes (sessão ativa). O POST da tela ainda leva o cookie de sessão (same-site).
    $c->csrf = $token;
    igual(200, $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN])->status, 'sessão aberta');
    $r = acessoEnviar($c, $token, '/aula/dois', Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN);
    igual(303, $r->status, 'com sessão, o token pré ainda vale');
    igual('/aula/dois', $r->cabecalho('location'));
});

teste('acesso: login expira os cookies antigos da Júri e manda limpar o cache', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    $c->cookies['__Host-juri'] = 'antigo';
    $c->cookies['__Host-juripre'] = 'antigo';
    $c->cookies['__Host-juridisp'] = 'antigo';
    $r = acessoEnviar($c, $token, '/', Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN);
    igual(303, $r->status);
    igual('"cache"', $r->cabecalho('clear-site-data'), 'Clear-Site-Data exato');
    foreach (['__Host-juri', '__Host-juripre', '__Host-juridisp'] as $nome) {
        verdadeiro(!isset($c->cookies[$nome]), "$nome expirado no login");
    }
});

teste('sair: Clear-Site-Data é exatamente "cache" (reprova cookies, storage e *)', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    $r = $c->post('/api/sair.php', []);
    igual(200, $r->status);
    $valor = $r->cabecalho('clear-site-data');
    igual('"cache"', $valor, 'valor exato');
    verdadeiro(!in_array($valor, ['"cookies"', '"storage"', '"*"'], true), 'nenhum valor que derrube o domínio-pai');
});
