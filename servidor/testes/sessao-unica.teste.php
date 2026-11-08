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
