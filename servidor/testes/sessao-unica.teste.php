<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/**
 * Sessão única por conta (SU-B1, decisão do líder de 08/11/2026: o último a entrar fica).
 * A conta guarda um marcador (sessaoVigente) sorteado a cada login efetivado; a sessão guarda
 * uma cópia ($_SESSION['vigente']). Sessão cujo marcador não confere com o da conta cai.
 * Os testes HTTP usam dois aparelhos (dois clientes) e corrida determinística com os ganchos
 * de pausa de concorrencia.teste.php. Nome de teste começa com "sessão única:" (filtro do rodar.php).
 */

const SU_MARCADOR_ANA = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const SU_SENHA_NOVA_CHEFE = 'NovaSenhaDoChefe123';

/**
 * Sessão no formato da v1.6.1.0 (sem $_SESSION['vigente']), gravada à mão no diretório de
 * sessões com o serializador padrão do PHP. Devolve o id da sessão.
 */
function suSessaoAntiga(Ambiente $a, string $login): string
{
    $conta = contaDe($a, $login);
    $id = bin2hex(random_bytes(16));
    $agora = time();
    $dados = 'usuario|s:' . strlen($login) . ':"' . $login . '";'
        . 'uid|s:32:"' . $conta['uid'] . '";'
        . 'versao|i:' . $conta['versaoSessao'] . ';'
        . 'criada|i:' . $agora . ';'
        . 'atividade|i:' . $agora . ';'
        . 'csrf|s:64:"' . bin2hex(random_bytes(32)) . '";';
    file_put_contents($a->priv . '/sessoes/sess_' . $id, $dados);
    return $id;
}

/**
 * Login disparado sem esperar, com cabeçalhos capturados (o Set-Cookie da sessão nova).
 * postSemEsperar não devolve cabeçalhos, por isso este helper tem o próprio handle.
 *
 * @return array{resource, \CurlHandle}
 */
function suLoginSemEsperar(Cliente $c, string $login, string $senha): array
{
    $cookie = [];
    foreach ($c->cookies as $n => $v) {
        $cookie[] = "$n=$v";
    }
    $h = curl_init($c->origem() . '/api/entrar.php');
    curl_setopt_array($h, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['usuario' => $login, 'senha' => $senha], JSON_THROW_ON_ERROR),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Origin: ' . $c->origem(),
            'X-CSRF-Token: ' . (string) $c->csrf,
            'Cookie: ' . implode('; ', $cookie),
            'Connection: close',
        ],
    ]);
    $m = curl_multi_init();
    curl_multi_add_handle($m, $h);
    curl_multi_exec($m, $ativos);
    return [$m, $h];
}

/**
 * Termina o login disparado por suLoginSemEsperar.
 *
 * @param array{resource, \CurlHandle} $req
 * @return array{int, ?string} [status, valor do Set-Cookie da sessão ou null]
 */
function suConcluirLogin(array $req): array
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
    $tamanhoCabecalho = (int) curl_getinfo($h, CURLINFO_HEADER_SIZE);
    curl_multi_remove_handle($m, $h);
    curl_close($h);
    curl_multi_close($m);
    $cabecalhos = substr($bruto, 0, $tamanhoCabecalho);
    $sessao = null;
    if (preg_match('/^Set-Cookie:\s*' . preg_quote(D26_SESSAO_NOME, '/') . '=([^;\r\n]+)/mi', $cabecalhos, $achado) === 1) {
        $sessao = $achado[1];
    }
    return [$status, $sessao];
}

/** Cliente que usa uma sessão já existente (id devolvido por login ou fixture). */
function suClienteComSessao(Ambiente $a, string $idSessao): Cliente
{
    $c = $a->cliente();
    $c->cookies[D26_SESSAO_NOME] = $idSessao;
    return $c;
}

function suAutenticado(Cliente $c): bool
{
    return $c->get('/api/sessao.php')->json()['autenticado'] === true;
}

// ---- R1: dois aparelhos com a mesma conta: o último fica, o primeiro cai ----------------------

teste('sessão única R1: o segundo aparelho entra e o primeiro cai na próxima chamada à API', function (): void {
    $a = Ambiente::novo();
    $a->semearConteudo('{"unidades":[]}');
    $aparelhoA = $a->entrar();
    $aparelhoB = $a->entrar();
    igual(false, suAutenticado($aparelhoA), 'A caiu com a entrada de B');
    igual(401, $aparelhoA->get('/api/conteudo.php')->status, 'A não lê o conteúdo');
    igual('sem-sessao', $aparelhoA->get('/api/conteudo.php')->json()['erro'] ?? null, 'com o código sem-sessao');
    igual(true, suAutenticado($aparelhoB), 'B segue dentro');
    igual(200, $aparelhoB->get('/api/conteudo.php')->status, 'B lê o conteúdo');
});

// ---- R2: conta e sessão no formato antigo; o marcador passa a valer no login novo -------------

teste('sessão única R2a: conta e sessão sem o marcador (formato da v1.6.1.0) seguem válidas', function (): void {
    $a = Ambiente::novo();
    $id = suSessaoAntiga($a, Ambiente::LOGIN_ADMIN);
    igual(false, array_key_exists('sessaoVigente', contaDe($a, Ambiente::LOGIN_ADMIN)), 'a conta ainda não tem o campo');
    igual(true, suAutenticado(suClienteComSessao($a, $id)), 'a sessão antiga vale');
});

teste('sessão única R2b: depois de um login novo da conta, a sessão antiga (sem marcador) cai', function (): void {
    $a = Ambiente::novo();
    $id = suSessaoAntiga($a, Ambiente::LOGIN_ADMIN);
    $antiga = suClienteComSessao($a, $id);
    igual(true, suAutenticado($antiga), 'a sessão antiga valia antes do login novo');
    $novo = $a->entrar();
    igual(false, suAutenticado($antiga), 'a sessão antiga caiu com o login novo');
    igual(true, suAutenticado($novo), 'o login novo vale');
});

// ---- R3: caracterização: o aparelho confiável do primeiro segue confiável ----------------------

teste('sessão única R3: depois de o segundo aparelho entrar, o aparelho confiável do primeiro segue confiável', function (): void {
    $a = Ambiente::novo();
    $primeiro = $a->entrar();
    $valorAparelho = $primeiro->cookies[D26_DISP_NOME] ?? null;
    verdadeiro(is_string($valorAparelho), 'o primeiro login gravou o cookie de aparelho');
    $a->entrar();
    $_COOKIE[D26_DISP_NOME] = (string) $valorAparelho;
    try {
        verdadeiro(d26_dispositivo_confiavel($a->priv, Ambiente::LOGIN_ADMIN), 'o aparelho do primeiro segue confiável');
    } finally {
        unset($_COOKIE[D26_DISP_NOME]);
    }
});

// ---- R4: corrida determinística: o login que grava por último é o que vale -------------------

teste('sessão única R4: corrida, o login mais lento não derruba o mais novo: só a sessão de quem gravou por último vale', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $aparelhoA = $a->clienteComSessao();
    pausaLigar($a, 'entrar-apos-verificar', Ambiente::LOGIN_ADMIN);
    $req = suLoginSemEsperar($aparelhoA, Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN);
    pausaEsperarChegada($req, $a, 'entrar-apos-verificar');
    // A e B usam a mesma conta, então passariam pelo mesmo gancho: o marcador passa a casar com ninguém.
    file_put_contents($a->priv . '/pausa-entrar-apos-verificar', 'ninguem');
    $aparelhoB = $a->entrar();
    pausaSoltar($a, 'entrar-apos-verificar');
    [$status, $sessaoA] = suConcluirLogin($req);
    igual(200, $status, 'A recebe 200: o login verificou antes da entrada de B');
    verdadeiro(is_string($sessaoA), 'A recebe o cookie da própria sessão');
    igual(false, suAutenticado($aparelhoB), 'B caiu: A gravou por último');
    igual(true, suAutenticado(suClienteComSessao($a, (string) $sessaoA)), 'só a sessão de A vale');
});

// ---- R5: troca de senha em voo perde para o login novo ----------------------------------------

teste('sessão única R5: troca de senha em voo perde para o login novo: 409, nada gravado, o login novo segue válido', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $aparelhoA = $a->entrar();
    pausaLigar($a, 'troca-antes-gravar', Ambiente::LOGIN_ADMIN);
    $req = postSemEsperar($aparelhoA, '/api/trocar-senha.php', ['senhaAtual' => Ambiente::SENHA_ADMIN, 'senhaNova' => SU_SENHA_NOVA_CHEFE]);
    pausaEsperarChegada($req, $a, 'troca-antes-gravar');
    $aparelhoB = $a->entrar();
    $antes = contaDe($a, Ambiente::LOGIN_ADMIN);
    pausaSoltar($a, 'troca-antes-gravar');
    [$status, $j] = postConcluir($req);
    igual(409, $status, 'a troca em voo é recusada');
    igual('conta-alterada', $j['erro'] ?? null, 'com o código conta-alterada');
    $depois = contaDe($a, Ambiente::LOGIN_ADMIN);
    igual($antes['hash'], $depois['hash'], 'o hash não mudou');
    igual($antes['versaoSessao'], $depois['versaoSessao'], 'a versão não mudou');
    igual(true, suAutenticado($aparelhoB), 'o login novo segue válido');
});

// ---- R6: admin cujo marcador divergiu não age -------------------------------------------------

teste('sessão única R6: ator cujo marcador divergiu não age: ator-invalido e nada gravado', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    igual('ok', d26_contas_criar($priv, 'chefe', 'h', true));
    igual('ok', d26_contas_criar($priv, 'ana', 'h', false));
    d26_contas_mutar($priv, 'chefe', static function (array &$c): string {
        $c['sessaoVigente'] = str_repeat('a', 32);
        return 'ok';
    });
    $ator = d26_contas_buscar($priv, 'chefe');
    d26_contas_mutar($priv, 'chefe', static function (array &$c): string { // novo login da conta em outro aparelho
        $c['sessaoVigente'] = str_repeat('b', 32);
        return 'ok';
    });
    $antes = file_get_contents($priv . '/usuarios.json');
    igual('ator-invalido', d26_admin_agir($priv, (array) $ator, 'desativar', 'ana'), 'o ator com marcador velho não age');
    igual($antes, file_get_contents($priv . '/usuarios.json'), 'arquivo intacto');
    apagarArvore($dir);
}, false);

// ---- R7: tipo do marcador é fechado; o valor nunca sai na auditoria ----------------------------

teste('sessão única R7: sessaoVigente de tipo errado é D26Indisponivel (inteiro e lista); string válida passa', function (): void {
    foreach ([7, ['x']] as $ruim) {
        $dir = dirTemporario();
        $priv = $dir . '/privado';
        mkdir($priv, 0700, true);
        igual('ok', d26_contas_criar($priv, 'ana', 'h', false));
        d26_contas_mutar($priv, 'ana', static function (array &$c) use ($ruim): string {
            $c['sessaoVigente'] = $ruim;
            return 'ok';
        });
        $recusou = false;
        try {
            d26_contas_buscar($priv, 'ana');
        } catch (D26Indisponivel) {
            $recusou = true;
        }
        verdadeiro($recusou, 'tipo ' . gettype($ruim) . ' recusado de forma fechada');
        apagarArvore($dir);
    }
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    igual('ok', d26_contas_criar($priv, 'ana', 'h', false));
    d26_contas_mutar($priv, 'ana', static function (array &$c): string {
        $c['sessaoVigente'] = SU_MARCADOR_ANA;
        return 'ok';
    });
    igual(SU_MARCADOR_ANA, d26_contas_buscar($priv, 'ana')['sessaoVigente'] ?? null, 'controle positivo: string válida passa');
    verdadeiro(!array_key_exists('sessaoVigente', d26_conta_publica(d26_contas_buscar($priv, 'ana'))), 'd26_conta_publica não expõe o marcador');
    [$rc, $out, $err] = rodarCliScript('auditar-contas.php', [$priv, '--login=ana'], '');
    igual(0, $rc, 'auditar-contas roda com marcador válido');
    naoContem(SU_MARCADOR_ANA, $out . $err, 'a auditoria não imprime o valor do marcador');
    apagarArvore($dir);
}, false);

// ---- R8: CLIs preservam o marcador das contas que não são alvo --------------------------------

teste('sessão única R8: redefinir-senha, definir-admin e criar-admin --adicionar preservam o marcador das contas que não são alvo', function (): void {
    [$dir, $priv] = cliPrivComContas(['ana' => ['admin' => false], 'bia' => ['admin' => true]]);
    d26_contas_mutar($priv, 'ana', static function (array &$c): string {
        $c['sessaoVigente'] = SU_MARCADOR_ANA;
        return 'ok';
    });
    [$rc1] = rodarCliScript('redefinir-senha.php', [$priv, 'bia'], "NovaSenhaDaBia123\n");
    igual(0, $rc1, 'redefinir-senha roda');
    igual(SU_MARCADOR_ANA, cliContasPorLogin($priv)['ana']['sessaoVigente'] ?? null, 'redefinir-senha preserva o marcador de ana');
    [$rc2] = rodarCliScript('definir-admin.php', [$priv, '--unico=bia'], '');
    igual(0, $rc2, 'definir-admin roda');
    igual(SU_MARCADOR_ANA, cliContasPorLogin($priv)['ana']['sessaoVigente'] ?? null, 'definir-admin preserva o marcador de ana');
    [$rc3] = rodarCliScript('criar-admin.php', [$priv, 'novo.adm', '--adicionar'], "SenhaNovaDoAdm123\n");
    igual(0, $rc3, 'criar-admin --adicionar roda');
    igual(SU_MARCADOR_ANA, cliContasPorLogin($priv)['ana']['sessaoVigente'] ?? null, 'criar-admin --adicionar preserva o marcador de ana');
    apagarArvore($dir);
}, false);

// ---- R9: sair não grava na conta, nem na sessão substituída nem na vigente ---------------------

teste('sessão única R9: sair não grava na conta, nem numa sessão substituída nem numa vigente', function (): void {
    $a = Ambiente::novo();
    $aparelhoA = $a->entrar();
    $aparelhoB = $a->entrar();
    $antes = hash_file('sha256', $a->priv . '/usuarios.json');
    $aparelhoA->post('/api/sair.php', []);
    igual($antes, hash_file('sha256', $a->priv . '/usuarios.json'), 'sair na sessão substituída não grava na conta');
    igual(true, suAutenticado($aparelhoB), 'a sessão vigente segue');
    $aparelhoB->post('/api/sair.php', []);
    igual($antes, hash_file('sha256', $a->priv . '/usuarios.json'), 'sair na sessão vigente não grava na conta');
});

// ---- SU-B2: aviso na tela de entrada quando a conta entra em outro aparelho --------------------

const SU_AVISO_COOKIE = '__Host-d26aviso';
const SU_AVISO_CODIGO = 'outro-aparelho';
const SU_AVISO_TEXTO = 'Sua conta foi aberta em outro aparelho. Entre de novo para continuar aqui.';

/** Cabeçalhos de navegação de página (Sec-Fetch-Mode: navigate), como o navegador manda. */
function suNavegacao(): array
{
    return ['Sec-Fetch-Mode' => 'navigate'];
}

/**
 * Sessão gravada à mão, com os campos que o teste controla. Padrão: versão e marcador iguais
 * aos da conta, criada e atividade agora. $campos sobrepõe (vigente, atividade, criada, versao).
 */
function suSessaoCom(Ambiente $a, string $login, array $campos = []): string
{
    $conta = contaDe($a, $login);
    $id = bin2hex(random_bytes(16));
    $agora = time();
    $c = $campos + ['versao' => $conta['versaoSessao'], 'criada' => $agora, 'atividade' => $agora, 'vigente' => null];
    $dados = 'usuario|s:' . strlen($login) . ':"' . $login . '";'
        . 'uid|s:32:"' . $conta['uid'] . '";'
        . 'versao|i:' . (int) $c['versao'] . ';'
        . 'criada|i:' . (int) $c['criada'] . ';'
        . 'atividade|i:' . (int) $c['atividade'] . ';'
        . 'csrf|s:64:"' . bin2hex(random_bytes(32)) . '";';
    if ($c['vigente'] !== null) {
        $dados .= 'vigente|s:' . strlen((string) $c['vigente']) . ':"' . $c['vigente'] . '";';
    }
    file_put_contents($a->priv . '/sessoes/sess_' . $id, $dados);
    return $id;
}

/** Linha Set-Cookie do aviso (começa pelo nome), ou null. */
function suCookieAviso(array $setCookies): ?string
{
    foreach ($setCookies as $linha) {
        if (str_starts_with($linha, SU_AVISO_COOKIE . '=')) {
            return $linha;
        }
    }
    return null;
}

/** Confere cada atributo, comparado sem distinguir maiúsculas, pelas partes separadas por ";". */
function suAtributos(string $linha, array $esperados): void
{
    $partes = array_map('trim', explode(';', $linha));
    foreach ($esperados as $esperado) {
        $achou = false;
        foreach ($partes as $parte) {
            $achou = $achou || strcasecmp($parte, $esperado) === 0;
        }
        verdadeiro($achou, "atributo \"$esperado\" ausente no cookie de aviso: $linha");
    }
}

/** Cookie de aviso com Max-Age=0: é a expiração que o navegador aplica. */
function suExpirado(string $linha): bool
{
    foreach (array_map('trim', explode(';', $linha)) as $parte) {
        if (strcasecmp($parte, 'Max-Age=0') === 0) {
            return true;
        }
    }
    return false;
}

/** Tela de entrada com o aviso: role="alert" no parágrafo, o mesmo texto no título e aria-describedby no usuário. */
function suTelaComAviso(string $corpo): void
{
    verdadeiro(
        preg_match('/<p\b(?=[^>]*\brole="alert")(?=[^>]*\bid="aviso-sessao")[^>]*>' . preg_quote(SU_AVISO_TEXTO, '/') . '<\/p>/', $corpo) === 1,
        'o aviso sai em role="alert" com id aviso-sessao'
    );
    contem('<title>' . SU_AVISO_TEXTO . '</title>', $corpo, 'o aviso vai também ao título');
    verdadeiro(
        preg_match('/<input\b(?=[^>]*\bid="usuario")(?=[^>]*\baria-describedby="aviso-sessao")[^>]*>/', $corpo) === 1,
        'o campo usuário é descrito pelo aviso'
    );
}

// ---- R10: navegação com sessão substituída: a tela de entrada com o aviso ---------------------

teste('sessão única R10: sessão substituída em navegação: 200 com a tela de entrada e o aviso, sessão expirada, nada do app, sem cookie de aviso', function (): void {
    $a = Ambiente::novo();
    $aparelhoA = $a->entrar();
    $a->entrar();
    $r = $aparelhoA->get('/', suNavegacao());
    igual(200, $r->status, 'navegação recebe a tela de entrada');
    suTelaComAviso($r->corpo);
    naoContem('<script', $r->corpo, 'a tela segue sem JavaScript');
    naoContem('assets/', $r->corpo, 'nenhum byte do app');
    verdadeiro(!isset($aparelhoA->cookies[D26_SESSAO_NOME]), 'o cookie de sessão expirou');
    verdadeiro(suCookieAviso($aparelhoA->ultimoSetCookie) === null, 'a navegação que detecta não emite o cookie de aviso');
});

// ---- R11: pedido fora de navegação emite o cookie; a navegação seguinte mostra e expira ------

teste('sessão única R11: sessão substituída em pedido de asset: 401 vazio com o cookie de aviso; a navegação seguinte mostra o aviso e expira o cookie; a terceira não mostra', function (): void {
    $a = Ambiente::novo();
    $aparelhoA = $a->entrar();
    $a->entrar();
    $asset = $aparelhoA->get('/assets/app.js', ['Sec-Fetch-Mode' => 'no-cors']);
    igual(401, $asset->status, 'pedido de asset sem navegação recebe 401');
    igual('', $asset->corpo, 'sem corpo');
    $cookie = suCookieAviso($aparelhoA->ultimoSetCookie);
    verdadeiro($cookie !== null, 'o cookie de aviso saiu com o 401');
    suAtributos($cookie ?? '', ['__Host-d26aviso=outro-aparelho', 'Max-Age=600', 'Path=/', 'Secure', 'HttpOnly', 'SameSite=Strict']);
    verdadeiro(isset($aparelhoA->cookies[SU_AVISO_COOKIE]), 'o navegador guarda o cookie de aviso');
    $segunda = $aparelhoA->get('/', suNavegacao());
    suTelaComAviso($segunda->corpo);
    $expiracao = suCookieAviso($aparelhoA->ultimoSetCookie);
    verdadeiro($expiracao !== null && suExpirado($expiracao), 'a navegação seguinte expira o cookie de aviso');
    verdadeiro(!isset($aparelhoA->cookies[SU_AVISO_COOKIE]), 'o navegador já não guarda o cookie de aviso');
    $terceira = $aparelhoA->get('/', suNavegacao());
    naoContem(SU_AVISO_TEXTO, $terceira->corpo, 'a terceira navegação não mostra o aviso');
});

// ---- R12: endpoints JSON: mesmo corpo de hoje, cookie de aviso junto ------------------------

teste('sessão única R12: sessão substituída em endpoint JSON: 401 sem-sessao com o mesmo corpo do anônimo e o cookie de aviso', function (): void {
    $a = Ambiente::novo();
    $a->semearConteudo('{"unidades":[]}');
    $aparelhoA = $a->entrar();
    $a->entrar();
    $anonimo = $a->cliente()->get('/api/conteudo.php');
    $r = $aparelhoA->get('/api/conteudo.php');
    igual(401, $r->status, 'o endpoint recusa');
    igual('sem-sessao', $r->json()['erro'] ?? null, 'com o código sem-sessao');
    igual($anonimo->corpo, $r->corpo, 'o corpo é igual ao de quem não entrou');
    $cookie = suCookieAviso($aparelhoA->ultimoSetCookie);
    verdadeiro($cookie !== null, 'o cookie de aviso saiu');
    suAtributos($cookie ?? '', ['__Host-d26aviso=outro-aparelho', 'Max-Age=600', 'Path=/', 'Secure', 'HttpOnly', 'SameSite=Strict']);
});

teste('sessão única R12: sessão substituída em /api/sessao.php: 200 com autenticado false e o cookie de aviso', function (): void {
    $a = Ambiente::novo();
    $aparelhoA = $a->entrar();
    $a->entrar();
    $r = $aparelhoA->get('/api/sessao.php');
    igual(200, $r->status, 'a consulta de sessão responde 200');
    igual(false, $r->json()['autenticado'] ?? null, 'sem sessão');
    verdadeiro(suCookieAviso($aparelhoA->ultimoSetCookie) !== null, 'o cookie de aviso saiu');
});

// ---- R12c: troca de senha, os dois casos que o contrato aceita (403 com o cookie antigo, 401 sem) ----

teste('sessão única R12c: troca de senha com sessão substituída: 403 de CSRF com o cookie antigo; 401 sem cookie de sessão', function (): void {
    $a = Ambiente::novo();
    $aparelhoA = $a->entrar();
    $a->entrar();
    $corpo = ['senhaAtual' => Ambiente::SENHA_ADMIN, 'senhaNova' => SU_SENHA_NOVA_CHEFE];
    $comCookie = $aparelhoA->post('/api/trocar-senha.php', $corpo);
    igual(403, $comCookie->status, 'com o cookie antigo: 403, porque o CSRF da sessão já caiu antes da checagem da conta');
    igual('csrf', $comCookie->json()['erro'] ?? null, 'com o código csrf');
    verdadeiro(suCookieAviso($aparelhoA->ultimoSetCookie) !== null, 'o cookie de aviso sai também aqui');
    $semCookie = $a->cliente();
    $semCookie->get('/api/sessao.php');
    $r = $semCookie->post('/api/trocar-senha.php', $corpo);
    igual(401, $r->status, 'sem cookie de sessão: 401');
    igual('sem-sessao', $r->json()['erro'] ?? null, 'com o código sem-sessao');
});

// ---- R13: sessão que não foi substituída cai sem aviso (o marcador diverge, mas o resto não confere) ----

teste('sessão única R13: sessão vencida por ociosidade, por 12 h, ou derrubada por redefinição ou desativação, com marcador divergente: tela sem aviso e sem cookie', function (): void {
    $agora = time();
    $casos = [
        'ociosa' => [['atividade' => $agora - D26_SESSAO_OCIOSIDADE - 1], static fn (array &$c): null => null],
        'doze horas' => [['criada' => $agora - D26_SESSAO_VALIDADE - 1], static fn (array &$c): null => null],
        'redefinida' => [[], static function (array &$c): void { $c['versaoSessao'] = (int) $c['versaoSessao'] + 1; }],
        'desativada' => [[], static function (array &$c): void { $c['ativo'] = false; }],
    ];
    foreach ($casos as $nome => [$campos, $mudar]) {
        $a = Ambiente::novo();
        $id = suSessaoCom($a, Ambiente::LOGIN_ADMIN, $campos + ['vigente' => str_repeat('a', 32)]);
        d26_contas_mutar($a->priv, Ambiente::LOGIN_ADMIN, static function (array &$c) use ($mudar): string {
            $c['sessaoVigente'] = str_repeat('b', 32);
            $mudar($c);
            return 'ok';
        });
        $c = suClienteComSessao($a, $id);
        $r = $c->get('/', suNavegacao());
        igual(200, $r->status, "$nome: navegação recebe a tela de entrada");
        naoContem(SU_AVISO_TEXTO, $r->corpo, "$nome: a tela não traz o aviso");
        verdadeiro(suCookieAviso($c->ultimoSetCookie) === null, "$nome: nenhum cookie de aviso");
        Ambiente::limparTudo();
    }
});

// ---- R14: Accept text/html sem Sec-Fetch-Mode é navegação, como em R10 ------------------------

teste('sessão única R14: Accept text/html sem Sec-Fetch-Mode se comporta como navegação: tela com o aviso', function (): void {
    $a = Ambiente::novo();
    $aparelhoA = $a->entrar();
    $a->entrar();
    $r = $aparelhoA->get('/', ['Accept' => 'text/html']);
    igual(200, $r->status, 'a tela de entrada, não 401');
    suTelaComAviso($r->corpo);
});

// ---- R15: valor de cookie fora da lista fechada não escreve nada na tela ---------------------

teste('sessão única R15: cookie de aviso com valor fora da lista (inclusive HTML) não escreve nada na tela', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    $c->cookies[SU_AVISO_COOKIE] = 'x"><b>';
    $r = $c->get('/', suNavegacao());
    igual(200, $r->status, 'a tela de entrada comum');
    naoContem('<b>', $r->corpo, 'o valor não entra no HTML');
    naoContem('aviso-sessao', $r->corpo, 'nenhum aviso');
    naoContem(SU_AVISO_TEXTO, $r->corpo, 'o texto do aviso não aparece sem a queda');
});

// ---- R16: o arquivo da sessão substituída some na primeira detecção ---------------------------

teste('sessão única R16: o arquivo da sessão substituída some no primeiro pedido que a detecta, pelo portão', function (): void {
    $a = Ambiente::novo();
    $aparelhoA = $a->entrar();
    $arquivo = $a->priv . '/sessoes/sess_' . $aparelhoA->cookies[D26_SESSAO_NOME];
    $a->entrar();
    verdadeiro(is_file($arquivo), 'antes da detecção, o arquivo existe');
    $aparelhoA->get('/', suNavegacao());
    clearstatcache(); // is_file é cacheado pelo PHP: sem isto, o "existe" da checagem de antes volta
    verdadeiro(!is_file($arquivo), 'o portão apagou o arquivo da sessão substituída');
});

teste('sessão única R16: o arquivo da sessão substituída some no primeiro pedido que a detecta, pela API', function (): void {
    $a = Ambiente::novo();
    $aparelhoA = $a->entrar();
    $arquivo = $a->priv . '/sessoes/sess_' . $aparelhoA->cookies[D26_SESSAO_NOME];
    $a->entrar();
    $aparelhoA->get('/api/conteudo.php');
    clearstatcache();
    verdadeiro(!is_file($arquivo), 'a API apagou o arquivo da sessão substituída');
});

// ---- R17: entrar, acesso e sair com o cookie de aviso no pedido o expiram; sem ele, nada sai ----

teste('sessão única R17: login pela API com o cookie de aviso no pedido expira o cookie; sem ele, nenhum Set-Cookie de aviso', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $c->cookies[SU_AVISO_COOKIE] = SU_AVISO_CODIGO;
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    igual(200, $r->status, 'login pela API');
    $expiracao = suCookieAviso($c->ultimoSetCookie);
    verdadeiro($expiracao !== null && suExpirado($expiracao), 'o login expira o cookie de aviso');
    verdadeiro(!isset($c->cookies[SU_AVISO_COOKIE]), 'o navegador deixa de guardar o cookie');
    $sem = $a->clienteComSessao();
    $sem->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    verdadeiro(suCookieAviso($sem->ultimoSetCookie) === null, 'sem o cookie no pedido, o login não emite nenhum Set-Cookie de aviso');
});

teste('sessão única R17: login pelo formulário com o cookie de aviso no pedido expira o cookie', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    $c->cookies[SU_AVISO_COOKIE] = SU_AVISO_CODIGO;
    $r = acessoEnviar($c, $token, '/', Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN);
    igual(303, $r->status, 'login certo pelo formulário');
    $expiracao = suCookieAviso($c->ultimoSetCookie);
    verdadeiro($expiracao !== null && suExpirado($expiracao), 'o formulário expira o cookie de aviso');
});

teste('sessão única R17: sair com o cookie de aviso no pedido expira o cookie', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    $c->cookies[SU_AVISO_COOKIE] = SU_AVISO_CODIGO;
    $r = $c->post('/api/sair.php', []);
    igual(200, $r->status, 'sair');
    $expiracao = suCookieAviso($c->ultimoSetCookie);
    verdadeiro($expiracao !== null && suExpirado($expiracao), 'sair expira o cookie de aviso');
});
