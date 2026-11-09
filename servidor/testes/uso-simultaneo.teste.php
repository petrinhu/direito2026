<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/**
 * Bloqueio por uso simultâneo (BL-B1, plano-sessao-unica.md 9.1, decisões do líder de 08/11/2026): a sessão
 * derrubada pela sessão única que ainda faz pedido conta uma ocorrência, quando (a)+(b)+(c) de 9.1.1 valem.
 * Na segunda ocorrência a conta comum é bloqueada; a conta admin nunca é bloqueada, só conta.
 * Relógio: os testes HTTP usam o relógio real e, para os casos fora da janela, editam no disco o
 * `vigenteDesde` da conta ou o `atividade` da sessão. A decisão (a)+(b)+(c) é uma função pura com `$agora`.
 * Nome de teste começa com "uso simultâneo:" (filtro do rodar.php).
 */

const US_SENHA_ANA = 'SenhaDaAnaUso2026';
const US_TEXTO_BLOQUEIO = 'Esta conta foi bloqueada porque foi usada em dois aparelhos ao mesmo tempo. Fale com Petrus para liberar.';
const US_FRASE_RECUSA = 'Site exclusivo para público seleto!';

/** Ambiente com a conta comum ana (sem troca obrigatória). $workers > 0 para testes de corrida. */
function usAmbienteComAna(int $workers = 0): Ambiente
{
    $a = Ambiente::novo($workers > 0 ? ['workers' => $workers] : []);
    $a->semearUsuario('ana', US_SENHA_ANA, false, false);
    return $a;
}

/** Edita a conta do privado sob o lock, pelo caminho que o produto usa. */
function usEditarConta(string $priv, string $login, callable $fn): void
{
    d26_contas_mutar($priv, $login, static function (array &$c) use ($fn): string {
        $fn($c);
        return 'ok';
    });
}

/** Marca a conta como bloqueada (estado que a segunda ocorrência deixa). */
function usMarcarBloqueada(string $priv, string $login): void
{
    usEditarConta($priv, $login, static function (array &$c): void {
        $c['usoSimultaneo'] = 2;
        $c['quedaContadaPara'] = str_repeat('c', 64);
        $c['bloqueada'] = ['em' => time(), 'motivo' => 'uso-simultaneo'];
    });
}

function usSessaoId(Cliente $c): string
{
    return (string) ($c->cookies[D26_SESSAO_NOME] ?? '');
}

/** Põe a atividade da sessão no instante dado (o arquivo de sessão é o do PHP, serializado). */
function usAtividade(Ambiente $a, string $id, int $instante): void
{
    $arq = $a->priv . '/sessoes/sess_' . $id;
    $txt = (string) file_get_contents($arq);
    $novo = preg_replace('/atividade\|i:\d+;/', 'atividade|i:' . $instante . ';', $txt, 1, $trocas);
    verdadeiro(is_string($novo) && $trocas === 1, 'a sessão tem a atividade gravada');
    file_put_contents($arq, $novo);
}

/** Valor do cookie de aviso que a resposta trouxe, ou null (sem Set-Cookie do aviso ou expirado). */
function usAviso(Resposta $r): ?string
{
    foreach ($r->cabecalhos['set-cookie'] ?? [] as $linha) {
        if (str_starts_with($linha, D26_AVISO_NOME . '=')) {
            $valor = explode(';', substr($linha, strlen(D26_AVISO_NOME) + 1))[0];
            return $valor === '' ? null : $valor;
        }
    }
    return null;
}

/** GET disparado sem esperar a resposta (para pedidos paralelos e para a pausa de corrida). @return array{resource, \CurlHandle} */
function usGetSemEsperar(Cliente $c, string $caminho): array
{
    $cookie = [];
    foreach ($c->cookies as $n => $v) {
        $cookie[] = "$n=$v";
    }
    $h = curl_init($c->origem() . $caminho);
    curl_setopt_array($h, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => ['Cookie: ' . implode('; ', $cookie), 'Connection: close'],
    ]);
    $m = curl_multi_init();
    curl_multi_add_handle($m, $h);
    curl_multi_exec($m, $ativos);
    return [$m, $h];
}

/** Termina um GET de usGetSemEsperar e devolve a Resposta com os cabeçalhos (Set-Cookie inclusive). */
function usConcluirGet(array $req): Resposta
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
        if ($pos === false) {
            continue;
        }
        $cabs[strtolower(trim(substr($linha, 0, $pos)))][] = trim(substr($linha, $pos + 1));
    }
    return new Resposta($status, $cabs, substr($bruto, $tamanho));
}

/** Hash de um arquivo do privado, para provar que nada foi gravado. */
function usHash(Ambiente $a): string
{
    return hash_file('sha256', $a->priv . '/usuarios.json');
}

// ---- U1: a primeira ocorrência conta e a sessão derrubada vê o aviso -----------------------------

teste('uso simultâneo: U1 A ativo, B entra, A pede depois: uma ocorrência, quedaContadaPara gravado, A vê o aviso', function (): void {
    $a = usAmbienteComAna();
    $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
    igual(true, suAutenticado($aparelhoA), 'A ativo');
    $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
    $r = $aparelhoA->get('/api/conteudo.php');
    igual(401, $r->status, 'A caiu e pediu o conteúdo');
    igual('outro-aparelho', usAviso($r), 'A recebe o aviso de outro aparelho');
    $conta = contaDe($a, 'ana');
    igual(1, $conta['usoSimultaneo'] ?? null, 'uma ocorrência');
    igual(false, array_key_exists('bloqueada', $conta), 'a primeira ocorrência não bloqueia');
    igual(hash('sha256', (string) $conta['sessaoVigente']), $conta['quedaContadaPara'] ?? null, 'quedaContadaPara é o sha256 do marcador que derrubou');
    igual(true, suAutenticado($aparelhoB), 'B segue dentro');
});

// ---- U2: troca de aparelho (A volta depois da janela) não conta ---------------------------------

teste('uso simultâneo: U2 troca de aparelho: A só volta depois da janela de N, nada conta', function (): void {
    $a = usAmbienteComAna();
    $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
    suAutenticado($aparelhoA);
    $a->entrar('ana', US_SENHA_ANA);
    usEditarConta($a->priv, 'ana', static function (array &$c): void {
        $c['vigenteDesde'] = time() - D26_USO_JANELA - 1;
    });
    igual(401, $aparelhoA->get('/api/conteudo.php')->status, 'A caiu');
    igual(0, contaDe($a, 'ana')['usoSimultaneo'] ?? 0, 'nada conta: B entrou há mais de N');
});

// ---- U3: A parado há muito tempo não conta (condição a) -----------------------------------------

teste('uso simultâneo: U3 A parado desde antes de N, B entra depois: nada conta (condição a)', function (): void {
    $a = usAmbienteComAna();
    $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
    suAutenticado($aparelhoA);
    usAtividade($a, usSessaoId($aparelhoA), time() - D26_USO_JANELA - 61);
    $a->entrar('ana', US_SENHA_ANA);
    igual(401, $aparelhoA->get('/api/conteudo.php')->status, 'A caiu');
    igual(0, contaDe($a, 'ana')['usoSimultaneo'] ?? 0, 'nada conta: A estava parado');
});

// ---- U4: o mesmo navegador (mesmo cookie de aparelho) não conta (condição c) --------------------

teste('uso simultâneo: U4 mesmo navegador: o pedido derrubado traz o cookie de aparelho do login vigente, nada conta', function (): void {
    $a = usAmbienteComAna();
    $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
    $tokenA = (string) ($aparelhoA->cookies[D26_DISP_NOME] ?? '');
    verdadeiro($tokenA !== '', 'o primeiro login deu o cookie de aparelho');
    $mesmo = $a->cliente();
    $mesmo->cookies[D26_DISP_NOME] = $tokenA;
    $mesmo->get('/api/sessao.php');
    igual(200, $mesmo->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => US_SENHA_ANA])->status, 'o segundo login no mesmo navegador entra');
    igual(401, $aparelhoA->get('/api/conteudo.php')->status, 'A caiu');
    igual(0, contaDe($a, 'ana')['usoSimultaneo'] ?? 0, 'nada conta: o mesmo navegador');
});

// ---- U5: idempotência por quedaContadaPara ------------------------------------------------------

teste('uso simultâneo: U5 idempotência: três pedidos paralelos do derrubado e dois aparelhos antigos derrubados pelo mesmo login contam uma vez', function (): void {
    $a = usAmbienteComAna(4);
    $antigo1 = suClienteComSessao($a, suSessaoAntiga($a, 'ana'));
    $antigo2 = suClienteComSessao($a, suSessaoAntiga($a, 'ana'));
    igual(true, suAutenticado($antigo1), 'o primeiro aparelho antigo vale antes do login');
    igual(true, suAutenticado($antigo2), 'o segundo aparelho antigo vale antes do login');
    $a->entrar('ana', US_SENHA_ANA);
    $pedidos = [
        usGetSemEsperar($antigo1, '/api/conteudo.php'),
        usGetSemEsperar($antigo1, '/api/conteudo.php'),
        usGetSemEsperar($antigo1, '/api/conteudo.php'),
        usGetSemEsperar($antigo2, '/api/conteudo.php'),
    ];
    foreach ($pedidos as $req) {
        igual(401, usConcluirGet($req)->status, 'cada pedido derrubado recebe 401');
    }
    igual(1, contaDe($a, 'ana')['usoSimultaneo'] ?? null, 'uma ocorrência, não uma por pedido nem por aparelho');
});

// ---- U6: a segunda ocorrência bloqueia a conta comum -------------------------------------------

teste('uso simultâneo: U6 segunda ocorrência de conta comum: bloqueada, versão + 1, B cai com o texto; login com senha certa dá 403 com o texto e senha errada dá a recusa', function (): void {
    $a = usAmbienteComAna();
    $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
    $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
    igual(401, $aparelhoA->get('/api/conteudo.php')->status, 'primeira ocorrência: A cai');
    igual(1, contaDe($a, 'ana')['usoSimultaneo'] ?? null, 'primeira ocorrência conta');
    $a->entrar('ana', US_SENHA_ANA); // A volta e derruba B: B passa a ser o derrubado da segunda ocorrência
    $versaoAntes = (int) contaDe($a, 'ana')['versaoSessao'];
    $r = $aparelhoB->get('/api/conteudo.php');
    igual(401, $r->status, 'segunda ocorrência: B cai');
    igual('bloqueada', usAviso($r), 'B recebe o aviso de bloqueio');
    $conta = contaDe($a, 'ana');
    igual(2, $conta['usoSimultaneo'] ?? null, 'segunda ocorrência');
    verdadeiro(is_array($conta['bloqueada'] ?? null) && ($conta['bloqueada']['motivo'] ?? null) === 'uso-simultaneo' && is_int($conta['bloqueada']['em'] ?? null), 'bloqueada gravada com motivo e instante');
    igual($versaoAntes + 1, (int) $conta['versaoSessao'], 'versaoSessao + 1 derruba a sessão que ficou');
    $pagina = $aparelhoB->get('/', PORTAO_NAVEGACAO);
    igual(200, $pagina->status, 'B navega e vê a tela de entrada');
    contem('<p class="entrada-aviso" role="alert" id="aviso-sessao">' . US_TEXTO_BLOQUEIO . '</p>', $pagina->corpo, 'o texto verbatim em role="alert"');
    contem('<title>' . US_TEXTO_BLOQUEIO . '</title>', $pagina->corpo, 'o texto verbatim no título');
    $novo = $a->cliente();
    [$token, $destino] = acessoTela($novo);
    $tela = acessoEnviar($novo, $token, $destino, 'ana', US_SENHA_ANA);
    igual(403, $tela->status, 'senha certa na conta bloqueada: 403');
    contem('<p class="entrada-aviso" role="alert" id="aviso-sessao">' . US_TEXTO_BLOQUEIO . '</p>', $tela->corpo, 'o 403 traz o texto em role="alert"');
    contem('<title>' . US_TEXTO_BLOQUEIO . '</title>', $tela->corpo, 'o 403 traz o texto no título');
    naoContem('__Host-d26=', implode("\n", $tela->cabecalhos['set-cookie'] ?? []), 'o 403 não emite cookie de sessão');
    [$token2, $destino2] = acessoTela($novo);
    $errada = acessoEnviar($novo, $token2, $destino2, 'ana', 'senha-errada-qualquer-123');
    igual(401, $errada->status, 'senha errada: recusa de sempre');
    contem(US_FRASE_RECUSA, $errada->corpo, 'a frase de recusa');
    naoContem(US_TEXTO_BLOQUEIO, $errada->corpo, 'senha errada não revela o bloqueio');
    $novo->get('/api/sessao.php');
    $json = $novo->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => US_SENHA_ANA]);
    igual(403, $json->status, 'entrar.php com senha certa: 403');
    contem(US_TEXTO_BLOQUEIO, $json->corpo, 'entrar.php devolve o texto verbatim');
});

// ---- U7: admin nunca é bloqueado -----------------------------------------------------------------

teste('uso simultâneo: U7 admin com duas e três ocorrências: nunca bloqueada, o contador sobe', function (): void {
    $a = Ambiente::novo();
    $x1 = $a->entrar();
    $x2 = $a->entrar();
    igual(401, $x1->get('/api/conteudo.php')->status, 'admin, primeira ocorrência');
    $x3 = $a->entrar();
    igual(401, $x2->get('/api/conteudo.php')->status, 'admin, segunda ocorrência');
    $x4 = $a->entrar();
    igual(401, $x3->get('/api/conteudo.php')->status, 'admin, terceira ocorrência');
    $conta = contaDe($a, Ambiente::LOGIN_ADMIN);
    igual(3, $conta['usoSimultaneo'] ?? null, 'o contador do admin sobe a cada ocorrência');
    igual(false, array_key_exists('bloqueada', $conta), 'o admin nunca é bloqueado');
    igual(true, suAutenticado($x4), 'o último login do admin segue válido');
});

// ---- U8: corrida: o login novo que chega durante a contagem perde para o bloqueio ---------------

teste('uso simultâneo: U8 corrida: login novo durante a segunda contagem recebe 403 depois do bloqueio, nunca sessão válida', function (): void {
    $a = usAmbienteComAna(4);
    $a1 = $a->entrar('ana', US_SENHA_ANA);
    $b1 = $a->entrar('ana', US_SENHA_ANA);
    igual(401, $a1->get('/api/conteudo.php')->status, 'primeira ocorrência');
    $c1 = $a->entrar('ana', US_SENHA_ANA); // derruba b1: b1 é a segunda ocorrência
    $versaoAntes = (int) contaDe($a, 'ana')['versaoSessao'];

    pausaLigar($a, 'queda-antes-contar', 'ana');
    $reqB = usGetSemEsperar($b1, '/api/conteudo.php');
    pausaEsperarChegada($reqB, $a, 'queda-antes-contar');

    pausaLigar($a, 'entrar-apos-verificar', 'ana');
    $novo = $a->clienteComSessao();
    $reqNovo = suLoginSemEsperar($novo, 'ana', US_SENHA_ANA);
    pausaEsperarChegada($reqNovo, $a, 'entrar-apos-verificar');

    pausaSoltar($a, 'queda-antes-contar');
    igual(401, usConcluirGet($reqB)->status, 'b1 cai na segunda ocorrência');
    pausaSoltar($a, 'entrar-apos-verificar');
    [$status, $sessao] = suConcluirLogin($reqNovo);
    igual(403, $status, 'o login novo recebe 403 depois do bloqueio');
    verdadeiro($sessao === null, 'o login novo não recebe sessão');
    $conta = contaDe($a, 'ana');
    verdadeiro(isset($conta['bloqueada']), 'a conta ficou bloqueada');
    igual($versaoAntes + 1, (int) $conta['versaoSessao'], 'o bloqueio fez versaoSessao + 1');
    igual(2, $conta['usoSimultaneo'] ?? null, 'duas ocorrências contadas');
});

// ---- U9: Desbloquear pelo painel e pelo CLI ----------------------------------------------------

teste('uso simultâneo: U9 desbloquear pelo painel: apaga bloqueada, zera contadores e tentativas, não troca hash nem versão', function (): void {
    $a = usAmbienteComAna();
    $ana = $a->cliente();
    $ana->get('/api/sessao.php');
    $ana->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => 'senha-errada-qualquer-123']);
    $chave = d26_limite_chave_conta('ana');
    $tentativas = json_decode((string) file_get_contents($a->priv . '/tentativas.json'), true, 512, JSON_THROW_ON_ERROR);
    verdadeiro(isset($tentativas['c'][$chave]) || $tentativas['u'] !== [], 'a senha errada deixou contador de tentativa');
    usMarcarBloqueada($a->priv, 'ana');
    $antes = contaDe($a, 'ana');
    $admin = $a->entrar();
    $r = $admin->post('/api/usuarios.php', ['acao' => 'desbloquear', 'usuario' => 'ana']);
    igual(200, $r->status, 'o painel aceita Desbloquear');
    $depois = contaDe($a, 'ana');
    igual(false, array_key_exists('bloqueada', $depois), 'bloqueada apagada');
    igual(0, $depois['usoSimultaneo'] ?? 0, 'contador zerado');
    igual(false, array_key_exists('quedaContadaPara', $depois), 'quedaContadaPara apagado');
    igual($antes['hash'], $depois['hash'], 'Desbloquear não troca a senha');
    igual($antes['versaoSessao'], $depois['versaoSessao'], 'Desbloquear não mexe na versão');
    $t2 = json_decode((string) file_get_contents($a->priv . '/tentativas.json'), true, 512, JSON_THROW_ON_ERROR);
    igual(false, isset($t2['c'][$chave]), 'o contador de tentativas da conta foi zerado');
    igual(0, count(array_filter($t2['u'] ?? [], static fn (mixed $v): bool => is_array($v) && ($v['l'] ?? null) === $chave)), 'as entradas de usuário+IP da conta foram zeradas');
});

teste('uso simultâneo: U9 desbloquear pelo CLI: limpa só a conta alvo em usuarios.json e não toca outra conta', function (): void {
    [$dir, $priv] = cliPrivComContas(['ana' => ['admin' => false], 'bia' => ['admin' => false]]);
    usMarcarBloqueada($priv, 'ana');
    usMarcarBloqueada($priv, 'bia');
    $biaAntes = cliContasPorLogin($priv)['bia'];
    [$rc] = rodarCliScript('desbloquear.php', [$priv, 'ana'], '');
    igual(0, $rc, 'o CLI roda');
    $contas = cliContasPorLogin($priv);
    igual(false, array_key_exists('bloqueada', $contas['ana']), 'a conta alvo ficou desbloqueada');
    igual(0, $contas['ana']['usoSimultaneo'] ?? 0, 'contador da conta alvo zerado');
    igual($biaAntes, $contas['bia'], 'a outra conta não mudou um byte');
    apagarArvore($dir);
}, false);

// ---- U10: tipo errado dos campos novos é D26Indisponivel ---------------------------------------

teste('uso simultâneo: U10 campos novos de tipo errado dão D26Indisponivel; a forma certa passa', function (): void {
    $ruins = [
        ['usoSimultaneo', 'dois'],
        ['usoSimultaneo', ['x']],
        ['bloqueada', 'sim'],
        ['bloqueada', ['em' => 'x', 'motivo' => 'uso-simultaneo']],
        ['bloqueada', ['em' => 1, 'motivo' => 'outro']],
        ['quedaContadaPara', 'NAO-HEX'],
        ['quedaContadaPara', 42],
        ['vigenteDesde', '1'],
        ['vigenteAparelho', 'xyz'],
    ];
    foreach ($ruins as [$campo, $valor]) {
        [$dir, $priv] = cliPrivComContas(['ana' => ['admin' => false]]);
        usEditarConta($priv, 'ana', static function (array &$c) use ($campo, $valor): void {
            $c[$campo] = $valor;
        });
        $recusou = false;
        try {
            d26_contas_buscar($priv, 'ana');
        } catch (D26Indisponivel) {
            $recusou = true;
        }
        verdadeiro($recusou, "campo $campo com tipo errado recusado de forma fechada");
        apagarArvore($dir);
    }
    [$dir, $priv] = cliPrivComContas(['ana' => ['admin' => false]]);
    usEditarConta($priv, 'ana', static function (array &$c): void {
        $c['usoSimultaneo'] = 2;
        $c['quedaContadaPara'] = str_repeat('a', 64);
        $c['vigenteDesde'] = 1700000000;
        $c['vigenteAparelho'] = str_repeat('b', 64);
        $c['bloqueada'] = ['em' => 1700000001, 'motivo' => 'uso-simultaneo'];
    });
    $conta = d26_contas_buscar($priv, 'ana');
    igual(2, $conta['usoSimultaneo'] ?? null, 'controle positivo: contador válido passa');
    igual('uso-simultaneo', $conta['bloqueada']['motivo'] ?? null, 'controle positivo: bloqueada válida passa');
    apagarArvore($dir);
}, false);

teste('uso simultâneo: U10 cli corrompido: auditar-contas com usoSimultaneo de tipo errado dá erro interno curto', function (): void {
    [$dir, $priv] = cliPrivComContas(['bia' => ['admin' => false]]);
    usEditarConta($priv, 'bia', static function (array &$c): void {
        $c['usoSimultaneo'] = 'dois';
    });
    [$rc, $out, $err] = rodarCliScript('auditar-contas.php', [$priv], '');
    verdadeiro($rc !== 0, 'auditar-contas sai com erro');
    contem('auditar-contas: erro interno', $err, 'mensagem curta');
    naoContem('Stack trace', $out . $err, 'sem pilha de chamadas');
    apagarArvore($dir);
}, false);

teste('uso simultâneo: U10 cli corrompido: desbloquear com usuarios.json corrompido dá erro interno curto', function (): void {
    [$dir, $priv] = cliPrivComContas(['bia' => ['admin' => false]]);
    file_put_contents($priv . '/usuarios.json', '{corrompido');
    [$rc, $out, $err] = rodarCliScript('desbloquear.php', [$priv, 'bia'], '');
    verdadeiro($rc !== 0, 'desbloquear sai com erro');
    contem('desbloquear: erro interno', $err, 'mensagem curta');
    naoContem('Stack trace', $out . $err, 'sem pilha de chamadas');
    apagarArvore($dir);
}, false);

teste('uso simultâneo: U10 CLIs redefinir-senha e criar-admin --adicionar preservam bloqueada e contador das contas que não são alvo', function (): void {
    [$dir, $priv] = cliPrivComContas(['ana' => ['admin' => false], 'bia' => ['admin' => false]]);
    usMarcarBloqueada($priv, 'ana');
    $anaAntes = cliContasPorLogin($priv)['ana'];
    [$rc1] = rodarCliScript('redefinir-senha.php', [$priv, 'bia'], "NovaSenhaDaBia123\n");
    igual(0, $rc1, 'redefinir-senha roda');
    igual($anaAntes, cliContasPorLogin($priv)['ana'], 'redefinir-senha preserva a conta bloqueada de ana');
    [$rc2] = rodarCliScript('criar-admin.php', [$priv, 'novo.adm', '--adicionar'], "SenhaNovaDoAdm123\n");
    igual(0, $rc2, 'criar-admin --adicionar roda');
    igual($anaAntes, cliContasPorLogin($priv)['ana'], 'criar-admin --adicionar preserva a conta bloqueada de ana');
    apagarArvore($dir);
}, false);

teste('uso simultâneo: auditar-contas não imprime vigenteAparelho nem quedaContadaPara', function (): void {
    [$dir, $priv] = cliPrivComContas(['ana' => ['admin' => false]]);
    $aparelho = str_repeat('e', 64);
    $queda = str_repeat('f', 64);
    usEditarConta($priv, 'ana', static function (array &$c) use ($aparelho, $queda): void {
        $c['vigenteAparelho'] = $aparelho;
        $c['vigenteDesde'] = 1700000000;
        $c['quedaContadaPara'] = $queda;
        $c['usoSimultaneo'] = 1;
    });
    [$rc, $out, $err] = rodarCliScript('auditar-contas.php', [$priv], '');
    igual(0, $rc, 'auditar-contas roda');
    naoContem($aparelho, $out . $err, 'o aparelho não sai na auditoria');
    naoContem($queda, $out . $err, 'a queda não sai na auditoria');
    apagarArvore($dir);
}, false);

// ---- U11: "Esqueci a senha" de conta bloqueada não envia -----------------------------------------

teste('uso simultâneo: U11 esqueci a senha de conta bloqueada: nada enviado, a mesma frase', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        usMarcarBloqueada($a->priv, 'ana');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        $r = emb4Enviar($c, $csrf, 'ana@example.com');
        igual(200, $r->status, 'o pedido responde 200');
        contem('Se houver uma conta com esse usuário ou e-mail', $r->corpo, 'a frase única');
        $conversa = correioConversaFinal($falso, 2.0);
        verdadeiro($conversa === null, 'nenhuma conexão SMTP: a conta bloqueada não recebe o link');
        igual(false, array_key_exists('convite', contaDe($a, 'ana') ?? []), 'nenhum convite gravado');
    });
}, false);

// ---- Predicado (a)+(b)+(c) e reserva, como função pura com $agora -------------------------------

teste('uso simultâneo: predicado (a), a atividade tem de ser de até N antes do login vigente', function (): void {
    $conta = ['vigenteDesde' => 1000, 'vigenteAparelho' => str_repeat('a', 64)];
    $outro = str_repeat('b', 64);
    verdadeiro(d26_uso_simultaneo_vale($conta, 1000 - D26_USO_JANELA, 0, $outro, 1000), 'atividade exatamente N antes conta');
    verdadeiro(!d26_uso_simultaneo_vale($conta, 1000 - D26_USO_JANELA - 1, 0, $outro, 1000), 'atividade mais velha que N não conta');
}, false);

teste('uso simultâneo: predicado (b), o pedido tem de chegar até N depois do login vigente', function (): void {
    $conta = ['vigenteDesde' => 1000, 'vigenteAparelho' => str_repeat('a', 64)];
    $outro = str_repeat('b', 64);
    verdadeiro(d26_uso_simultaneo_vale($conta, 1000, 0, $outro, 1000 + D26_USO_JANELA), 'pedido exatamente N depois conta');
    verdadeiro(!d26_uso_simultaneo_vale($conta, 1000, 0, $outro, 1000 + D26_USO_JANELA + 1), 'pedido mais tarde que N não conta');
}, false);

teste('uso simultâneo: predicado (c), o mesmo cookie de aparelho do login vigente não conta', function (): void {
    $conta = ['vigenteDesde' => 1000, 'vigenteAparelho' => str_repeat('a', 64)];
    verdadeiro(!d26_uso_simultaneo_vale($conta, 1000, 0, str_repeat('a', 64), 1010), 'o mesmo aparelho não conta');
    verdadeiro(d26_uso_simultaneo_vale($conta, 1000, 0, str_repeat('b', 64), 1010), 'outro aparelho conta');
    verdadeiro(d26_uso_simultaneo_vale($conta, 1000, 0, null, 1010), 'pedido sem cookie conta quando o login vigente tinha cookie');
}, false);

teste('uso simultâneo: reserva, sem cookie nos dois lados não conta quando a sessão foi criada até 30 s antes do login', function (): void {
    $conta = ['vigenteDesde' => 1000];
    verdadeiro(!d26_uso_simultaneo_vale($conta, 1000, 1000 - 30, null, 1010), 'criada exatamente 30 s antes do login não conta');
    verdadeiro(d26_uso_simultaneo_vale($conta, 1000, 1000 - 31, null, 1010), 'criada mais de 30 s antes do login conta');
}, false);

// ---- Login grava o marcador de aparelho e o instante; pedidos válidos não gravam o arquivo -----

teste('uso simultâneo: o login grava vigenteDesde e vigenteAparelho, com o aparelho novo ou o já confiável', function (): void {
    $a = usAmbienteComAna();
    $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
    $conta = contaDe($a, 'ana');
    igual(hash('sha256', (string) $aparelhoA->cookies[D26_DISP_NOME]), $conta['vigenteAparelho'] ?? null, 'aparelho novo: sha256 do cookie emitido');
    verdadeiro(is_int($conta['vigenteDesde'] ?? null), 'instante do login gravado');
    $mesmo = $a->cliente();
    $mesmo->cookies[D26_DISP_NOME] = (string) $aparelhoA->cookies[D26_DISP_NOME];
    $mesmo->get('/api/sessao.php');
    $mesmo->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => US_SENHA_ANA]);
    igual(hash('sha256', (string) $aparelhoA->cookies[D26_DISP_NOME]), contaDe($a, 'ana')['vigenteAparelho'] ?? null, 'aparelho já confiável: sha256 do cookie que chegou');
}, false);

teste('uso simultâneo: cem pedidos de sessão válida não gravam usuarios.json', function (): void {
    $a = usAmbienteComAna();
    $aparelho = $a->entrar('ana', US_SENHA_ANA);
    $antes = usHash($a);
    for ($i = 0; $i < 100; $i++) {
        igual(true, suAutenticado($aparelho), "pedido $i");
    }
    igual($antes, usHash($a), 'o arquivo de contas não mudou em cem pedidos válidos');
});

teste('uso simultâneo: entrar.php, sem aviso, também conta o derrubado que tenta entrar de novo', function (): void {
    $a = usAmbienteComAna();
    $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
    suAutenticado($aparelhoA);
    $a->entrar('ana', US_SENHA_ANA);
    // O CSRF do derrubado é de uma sessão que já caiu: entrar.php recusa (403) DEPOIS de contar, porque a
    // contagem vem antes da checagem de formulário. O que o teste prova é a contagem, sem aviso.
    $aparelhoA->post('/api/entrar.php', ['usuario' => 'ana', 'senha' => US_SENHA_ANA]);
    igual(1, contaDe($a, 'ana')['usoSimultaneo'] ?? null, 'a tentativa do derrubado conta mesmo sem aviso');
});

teste('uso simultâneo: d26_conta_publica expõe só usoSimultaneo e bloqueadaEm, nunca os marcadores', function (): void {
    $c = [
        'usuario' => 'ana', 'admin' => false, 'ativo' => true, 'deveTrocarSenha' => false,
        'criadoEm' => '2026-11-01T00:00:00+00:00', 'ultimoLogin' => null, 'aparelhos' => [],
        'versaoSessao' => 5, 'uid' => str_repeat('1', 32), 'hash' => 'h',
        'usoSimultaneo' => 1, 'bloqueada' => ['em' => 7, 'motivo' => 'uso-simultaneo'],
        'vigenteDesde' => 3, 'vigenteAparelho' => str_repeat('a', 64), 'quedaContadaPara' => str_repeat('b', 64),
    ];
    $p = d26_conta_publica($c, 10);
    igual(1, $p['usoSimultaneo'] ?? null, 'usoSimultaneo exposto');
    igual(7, $p['bloqueadaEm'] ?? null, 'bloqueadaEm exposto');
    foreach (['vigenteDesde', 'vigenteAparelho', 'quedaContadaPara', 'bloqueada'] as $proibido) {
        igual(false, array_key_exists($proibido, $p), "$proibido não sai na listagem do admin");
    }
}, false);
