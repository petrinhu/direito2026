<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

/** Salt devolvido por sal.php para $login (o csrf é renovado antes, como faz o navegador). */
function juriSalDe(Ambiente $a, Cliente $c, string $login): string
{
    $c->get('/api/juri/sessao.php');
    $r = $c->post('/api/juri/sal.php', ['usuario' => $login]);
    igual(200, $r->status, "sal.php de $login");
    return (string) $r->json()['salt'];
}

teste('juri: sal.php devolve o salt real da conta (16 B em base64), iter 600000 e v 1', function (): void {
    $a = juriAmbiente();
    $r = juriAnonimo($a)->post('/api/juri/sal.php', ['usuario' => JURI_LOGIN_TESTE]);
    igual(200, $r->status, 'status');
    igual(['ok', 'salt', 'iter', 'v'], array_keys($r->json()), 'chaves exatas');
    igual(600000, $r->json()['iter'], 'iter');
    igual(1, $r->json()['v'], 'v');
    igual(juriLerConta($a)['salt'], $r->json()['salt'], 'é o salt gravado na conta, não um falso');
    igual(16, strlen((string) base64_decode((string) $r->json()['salt'], true)), '16 bytes');
});

teste('juri: login inexistente recebe salt FALSO do mesmo formato (16 B, mesmas chaves) e estável entre chamadas', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $primeiro = $c->post('/api/juri/sal.php', ['usuario' => 'fantasma']);
    $segundo = $c->post('/api/juri/sal.php', ['usuario' => 'fantasma']);
    igual(200, $primeiro->status, 'status');
    igual(['ok', 'salt', 'iter', 'v'], array_keys($primeiro->json()), 'mesmas chaves do real');
    igual(600000, $primeiro->json()['iter'], 'iter');
    igual(1, $primeiro->json()['v'], 'v');
    igual($primeiro->json()['salt'], $segundo->json()['salt'], 'mesmo login, mesmo salt falso em duas chamadas');
    igual(24, strlen((string) $primeiro->json()['salt']), 'mesmo comprimento do base64 de 16 B');
    igual(16, strlen((string) base64_decode((string) $primeiro->json()['salt'], true)), '16 bytes decodificados');
    verdadeiro($primeiro->json()['salt'] !== juriLerConta($a)['salt'], 'o falso não coincide com o real');
});

teste('juri: o salt falso depende do login e do segredo da área (HMAC com a chave da área, não constante)', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a); // cria o segredo.key da Júri
    $ana = juriSalDe($a, $c, 'ana');
    verdadeiro($ana !== juriSalDe($a, $c, 'bia'), 'logins diferentes, salts falsos diferentes');

    $segredo = $a->privJuri . '/segredo.key';
    verdadeiro(is_file($segredo), 'segredo.key da Júri existe depois da primeira sessão anônima');
    file_put_contents($segredo, str_repeat('ab', 32) . "\n");
    verdadeiro(juriSalDe($a, $c, 'ana') !== $ana, 'trocar o segredo da área muda o salt falso');
});

teste('juri: sal.php nunca reserva tentativa: 30 consultas não mudam tentativas.json e não atrasam o login', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $antes = (string) file_get_contents($a->privJuri . '/tentativas.json');
    for ($i = 0; $i < 30; $i++) {
        $login = $i % 2 === 0 ? JURI_LOGIN_TESTE : 'fantasma';
        igual(200, $c->post('/api/juri/sal.php', ['usuario' => $login])->status, "consulta $i");
    }
    igual($antes, (string) file_get_contents($a->privJuri . '/tentativas.json'), 'tentativas.json byte a byte igual');
    igual(401, $c->post('/api/juri/entrar.php', ['usuario' => JURI_LOGIN_TESTE, 'auth' => juriAuthErrado()])->status, 'o login seguinte é 401, não 429');
});

teste('juri: sal.php recusa corpo fora do formato com 400 (sem usuario, usuario não texto, campo extra, senha)', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    $ruins = [
        'vazio' => [],
        'sem usuario' => ['x' => 'admin'],
        'usuario nulo' => ['usuario' => null],
        'usuario lista' => ['usuario' => ['admin']],
        'usuario número' => ['usuario' => 123],
        'campo extra' => ['usuario' => JURI_LOGIN_TESTE, 'extra' => 1],
        'senha' => ['senha' => 'ProvisoriaTeste1'],
        'JSON quebrado' => '{quebrado',
        'JSON lista' => '[1,2]',
    ];
    foreach ($ruins as $nome => $corpo) {
        igual(400, $c->post('/api/juri/sal.php', $corpo)->status, $nome);
    }
});

teste('juri: sal.php só aceita POST com CSRF (GET = 405; POST sem X-CSRF-Token = 403)', function (): void {
    $a = juriAmbiente();
    $c = juriAnonimo($a);
    igual(405, $c->get('/api/juri/sal.php')->status, 'GET');
    igual(403, $a->cliente()->post('/api/juri/sal.php', ['usuario' => JURI_LOGIN_TESTE])->status, 'POST sem csrf');
});
