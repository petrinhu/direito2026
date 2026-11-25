<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/**
 * Casca do convite sem token na URL (V17-C3, plano 1.17.0.0, decisão P2 do líder). O GET de /api/convite.php nunca
 * lê conta, nunca reserva o limite por IP, nunca grava e nunca responde 3xx. A CSP da casca tem um nonce novo em
 * cada resposta, e o nonce do cabeçalho é o mesmo do atributo do script. Nome de teste começa com "convite-casca:".
 */

/** Forma exata da CSP da casca: só script-src com nonce (16 bytes em base64 dão 24 caracteres, com "=="). */
const CASCA_CSP_RE = "#^default-src 'none'; script-src 'nonce-([A-Za-z0-9+/]{22,}={0,2})'; style-src 'self'; font-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'$#";

/** Sha256 de cada arquivo do privado, pelo caminho relativo (instantâneo para provar que o GET não grava). @return array<string, string> */
function cascaInstantaneo(string $priv): array
{
    $hashes = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($priv, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $f) {
        if ($f->isFile()) {
            $hashes[substr($f->getPathname(), strlen($priv))] = hash_file('sha256', $f->getPathname());
        }
    }
    ksort($hashes);
    return $hashes;
}

/** Corpo da casca com o nonce trocado por um valor fixo, para comparar duas respostas. */
function cascaSemNonce(string $corpo): string
{
    return (string) preg_replace('/nonce="[^"]*"/', 'nonce=""', $corpo);
}

teste('convite-casca: C3.1 GET sem t: 200 com a casca, formulário escondido, campo t vazio, aviso sem JavaScript e script com nonce', function (): void {
    $a = Ambiente::novo();
    $r = $a->cliente()->get('/api/convite.php', PORTAO_NAVEGACAO);
    igual(200, $r->status, 'casca');
    igual('strict-origin', $r->cabecalho('referrer-policy'), 'referrer só com a origem');
    igual('private, no-store', $r->cabecalho('cache-control'), 'sem cache');
    contem('<meta name="referrer" content="strict-origin">', $r->corpo, 'meta de referrer');
    contem('<form id="convite-form" method="post" action="/api/convite.php?envio" hidden>', $r->corpo, 'formulário escondido, envio em ?envio (D13)');
    contem('<input type="hidden" name="t" value="">', $r->corpo, 'campo t vazio dentro do formulário');
    contem('<p id="convite-aviso">Para criar a sua senha, esta página precisa do JavaScript ligado no navegador. Ligue o JavaScript e abra de novo o link do e-mail.</p>', $r->corpo, 'aviso visível por padrão, texto do líder');
    contem('<p role="status" id="convite-status"></p>', $r->corpo, 'região de status do script');
    verdadeiro(
        strpos($r->corpo, 'role="status"') < strpos($r->corpo, '<form id="convite-form"'),
        'a região de status fica fora (antes) do formulário'
    );
    verdadeiro(preg_match('#<script nonce="([^"]+)" src="/convite\.js\?v=[0-9a-z]+" defer></script>#', $r->corpo, $m) === 1, 'script com nonce, versão e defer');
});

teste('convite-casca: C3.2 CSP da casca: script-src só com nonce, sem unsafe-inline, self nem strict-dynamic; o resto da política de tela', function (): void {
    $a = Ambiente::novo();
    $r = $a->cliente()->get('/api/convite.php', PORTAO_NAVEGACAO);
    $csp = (string) $r->cabecalho('content-security-policy');
    verdadeiro(preg_match(CASCA_CSP_RE, $csp, $m) === 1, 'CSP da casca fora da forma esperada: ' . $csp);
    naoContem("'unsafe-inline'", $csp, 'sem unsafe-inline');
    naoContem('strict-dynamic', $csp, 'sem strict-dynamic');
    contem("script-src 'nonce-", $csp, 'script-src com nonce');
    contem('<script nonce="' . $m[1] . '"', $r->corpo, 'o nonce do cabeçalho é o do atributo');
});

teste('convite-casca: C3.3 dois GET seguidos trazem nonces diferentes, e cada nonce confere com o próprio cabeçalho', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $r1 = $c->get('/api/convite.php', PORTAO_NAVEGACAO);
    $r2 = $c->get('/api/convite.php', PORTAO_NAVEGACAO);
    verdadeiro(preg_match(CASCA_CSP_RE, (string) $r1->cabecalho('content-security-policy'), $m1) === 1, 'CSP do primeiro GET');
    verdadeiro(preg_match(CASCA_CSP_RE, (string) $r2->cabecalho('content-security-policy'), $m2) === 1, 'CSP do segundo GET');
    verdadeiro($m1[1] !== $m2[1], 'nonces diferentes entre dois GET');
    contem('<script nonce="' . $m1[1] . '"', $r1->corpo, 'primeiro GET: nonce do atributo');
    contem('<script nonce="' . $m2[1] . '"', $r2->corpo, 'segundo GET: nonce do atributo');
});

teste('convite-casca: C3.4 50 GET de clientes novos e 50 do IP com o limite cheio: todos 200, nenhum 429 nem 3xx', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $bloqueado = $a->cliente();
    $csrf = cvb2Campo(cvb2Casca($bloqueado)->corpo, 'csrf');
    for ($i = 0; $i < 30; $i++) {
        cvb2Enviar($bloqueado, cvb2Campos(str_repeat('0', 64), $csrf, CVB2_SENHA));
    }
    igual(429, cvb2Enviar($bloqueado, cvb2Campos($token, $csrf, CVB2_SENHA))->status, 'o IP está com o limite cheio');
    $status = [];
    for ($i = 0; $i < 50; $i++) {
        $status[] = $a->cliente()->get('/api/convite.php', PORTAO_NAVEGACAO)->status;
    }
    for ($i = 0; $i < 50; $i++) {
        $status[] = $bloqueado->get('/api/convite.php', PORTAO_NAVEGACAO)->status;
    }
    igual(array_fill(0, 100, 200), $status, 'cem GET: todos 200');
});

teste('convite-casca: C3.5 com usuarios.json ausente ou corrompido, o GET da casca continua 200 (a casca não lê contas)', function (): void {
    // Corrompido, e não só ausente: ausente, a leitura de contas devolve vazio sem falhar e um mutante que lê passaria.
    $a = Ambiente::novo();
    file_put_contents($a->priv . '/usuarios.json', '{quebrado');
    $r = $a->cliente()->get('/api/convite.php', PORTAO_NAVEGACAO);
    igual(200, $r->status, 'casca com usuarios.json corrompido');
    contem('<form id="convite-form"', $r->corpo, 'a casca segue completa');
    unlink($a->priv . '/usuarios.json');
    igual(200, $a->cliente()->get('/api/convite.php', PORTAO_NAVEGACAO)->status, 'casca sem usuarios.json');
});

teste('convite-casca: C3.6 cinquenta GET não mudam nenhum arquivo do privado (sha256 antes e depois, aquecido com um GET)', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $c->get('/api/convite.php', PORTAO_NAVEGACAO); // aquece: a primeira emissão do cookie pré pode criar o segredo
    $antes = cascaInstantaneo($a->priv);
    verdadeiro(count($antes) > 0, 'piso de varredura: o privado tem arquivos');
    for ($i = 0; $i < 50; $i++) {
        igual(200, $c->get('/api/convite.php', PORTAO_NAVEGACAO)->status, "GET $i");
    }
    igual($antes, cascaInstantaneo($a->priv), 'nenhum arquivo do privado mudou');
});

teste('convite-casca: C3.7 GET com outro parâmetro, sem t: a mesma casca (o link com t também é casca, sem 303: convite-legado)', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $semT = cascaSemNonce($c->get('/api/convite.php', PORTAO_NAVEGACAO)->corpo);
    $outro = $c->get('/api/convite.php?x=1', PORTAO_NAVEGACAO);
    igual(200, $outro->status, 'outro parâmetro: casca, não 303');
    igual($semT, cascaSemNonce($outro->corpo), 'mesma casca com outro parâmetro');
});
