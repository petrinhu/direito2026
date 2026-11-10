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

teste('uso simultâneo: U12 (S57) o CAS do login recusa conta bloqueada mesmo com a conta lida antes do bloqueio (uid, versão e hash iguais)', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    igual('ok', d26_contas_criar($priv, 'ana', 'hash-ana', false));
    $lida = d26_contas_buscar($priv, 'ana'); // lida antes do bloqueio: sem a chave bloqueada, com o mesmo uid, versão e hash
    // Controle: sem bloqueio, o mesmo login entra e devolve a versão. Sem isto, o null abaixo poderia ser vazio.
    igual($lida['versaoSessao'], d26_contas_efetivar_login($priv, 'ana', $lida, null, null), 'controle: conta sem bloqueio entra');
    // Bloqueio gravado no disco sem trocar uid, versaoSessao nem hash: só a chave que o CAS precisa conferir.
    usEditarConta($priv, 'ana', static function (array &$c): void {
        $c['bloqueada'] = ['em' => time(), 'motivo' => 'uso-simultaneo'];
        // Sentinela de data fixa (BAIXA-2 da revisão): um login recusado que gravasse ultimoLogin (M9) trocaria este
        // valor. gmdate('c') no mesmo segundo do controle esconderia a gravação, então a espera não é o caminho.
        $c['ultimoLogin'] = '2000-01-01T00:00:00+00:00';
    });
    $antes = d26_contas_buscar($priv, 'ana');
    igual('2000-01-01T00:00:00+00:00', $antes['ultimoLogin'] ?? null, 'premissa: a sentinela de ultimoLogin ficou gravada antes do login recusado');
    igual(null, d26_contas_efetivar_login($priv, 'ana', $lida, null, null), 'a conta lida antes do bloqueio não entra');
    igual($antes, d26_contas_buscar($priv, 'ana'), 'o login recusado não grava nada (ultimoLogin, sessão e marcador seguem os de antes)');
    apagarArvore($dir);
}, false);


correioCarregar(); // o módulo de correio (D26_SMTP_ASSUNTO_MAX, d26_correio_*) entra no processo de teste

// ---- BL-B2: aviso por e-mail ao líder (U12 a U17, plano-sessao-unica.md 9.1.5, textos R22 "Usar como estão") ----
// Os textos abaixo são LITERAIS, copiados do plano. A hora é a de Recife (America/Recife, sem horário de verão).
// A dona da hora (vigenteDesde do login que causou a queda, no A1; bloqueada.em, no A2) é preenchimento do BL-B2 (L-07).

const US_B2_DESTINO = 'aviso-uso@example.com';
const US_B2_ASSUNTO_A1 = 'Uso simultâneo na conta ana';
const US_B2_ASSUNTO_A2 = 'Conta ana bloqueada por uso simultâneo';

/** Hora no formato do texto (dd/mm/aaaa às hh:mm) no fuso de Recife. */
function usB2Hora(int $instante): string
{
    $d = (new DateTimeImmutable('@' . $instante))->setTimezone(new DateTimeZone('America/Recife'));
    return $d->format('d/m/Y') . ' às ' . $d->format('H:i');
}

/** Grava o destino do aviso no privado sintético, modo 600 (a Fase 1 faz o mesmo no servidor). */
function usB2Destino(Ambiente $a, string $destino = US_B2_DESTINO): void
{
    file_put_contents($a->priv . '/aviso.destino', $destino);
    chmod($a->priv . '/aviso.destino', 0600);
}

/** Lê a conta ana do privado sintético (o que o produto gravou). */
function usB2Conta(Ambiente $a): array
{
    return contaDe($a, 'ana');
}

/** Marcas de envio do teto de avisos (chave própria do BL-B2) no tentativas.json do privado. */
function usB2MarcasAviso(Ambiente $a): int
{
    $d = json_decode((string) @file_get_contents($a->priv . '/tentativas.json'), true);
    $chave = d26_limite_chave_envio('aviso');
    return is_array($d) ? count((array) ($d['e'][$chave]['f'] ?? [])) : 0;
}

/** SMTP falso ligado ao php -S, com a conta ana semeada (sem troca obrigatória). */
function usB2Com(callable $corpo, array $roteiro = [], array $opcoes = []): void
{
    emailB3Com($roteiro, static function (Ambiente $a, array $falso) use ($corpo): void {
        $a->semearUsuario('ana', US_SENHA_ANA, false, false);
        $corpo($a, $falso);
    }, $opcoes);
}

/** Conversa do SMTP falso, depois que o processo dele terminou (ou o prazo passou). */
function usB2Conversa(array $falso): string
{
    return (string) correioConversaFinal($falso, 5.0);
}

// ---- U12: a primeira ocorrência manda A1 (texto byte a byte, hora de Recife, "1ª") ----------------

teste('uso simultâneo: U12a A1 byte a byte: conta comum, 1ª vez, hora de Recife (não UTC)', function (): void {
    verdadeiro(function_exists('d26_correio_msg_uso'), 'd26_correio_msg_uso existe (função de montagem do A1)');
    $instante = strtotime('2026-11-10T02:30:00Z'); // 09/11/2026 23:30 em Recife (UTC-3)
    $m = d26_correio_msg_uso(US_B2_DESTINO, 'ana', 1, false, $instante);
    igual(US_B2_DESTINO, $m['destinatario'], 'destino do A1');
    igual(US_B2_ASSUNTO_A1, $m['assunto'], 'assunto do A1');
    igual('A conta ana entrou em outro aparelho enquanto ainda estava em uso no anterior, em 09/11/2026 às 23:30 (horário de Recife). Esta é a 1ª vez. Na 2ª vez, a conta é bloqueada.', $m['corpo'], 'corpo do A1, conta comum');
});

teste('uso simultâneo: U12b A1 byte a byte: conta admin, 3ª vez, frase de admin no lugar da última', function (): void {
    verdadeiro(function_exists('d26_correio_msg_uso'), 'd26_correio_msg_uso existe');
    $instante = strtotime('2026-11-10T02:30:00Z');
    $m = d26_correio_msg_uso(US_B2_DESTINO, 'admin', 3, true, $instante);
    igual('A conta admin entrou em outro aparelho enquanto ainda estava em uso no anterior, em 09/11/2026 às 23:30 (horário de Recife). Esta é a 3ª vez. Contas de administração não são bloqueadas.', $m['corpo'], 'corpo do A1, admin');
});

teste('uso simultâneo: U12c primeira ocorrência por HTTP: A1 sai para o aviso.destino com login, hora e "1ª"', function (): void {
    usB2Com(function (Ambiente $a, array $falso): void {
        usB2Destino($a);
        $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
        $r = $aparelhoA->get('/api/conteudo.php');
        igual('outro-aparelho', usAviso($r), 'A recebe o aviso de outro aparelho');
        $conversa = usB2Conversa($falso);
        contem('RCPT TO:<' . US_B2_DESTINO . '>', $conversa, 'A1 vai para o aviso.destino sintético');
        $msg = emailB3Mensagem($conversa);
        igual(US_B2_ASSUNTO_A1, $msg['assunto'], 'assunto do A1 por HTTP');
        contem('Esta é a 1ª vez. Na 2ª vez, a conta é bloqueada.', $msg['corpo'], 'frase da 1ª vez');
        contem(usB2Hora((int) usB2Conta($a)['vigenteDesde']), $msg['corpo'], 'hora de Recife do login que causou a queda');
    });
});

teste('uso simultâneo: U14 aviso.destino ausente: nenhum envio e a linha aviso-sem-destino no erros.log', function (): void {
    usB2Com(function (Ambiente $a, array $falso): void {
        $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoA->get('/api/conteudo.php');
        naoContem('MAIL FROM', usB2Conversa($falso), 'nenhum envio sem destino');
        contem('aviso-sem-destino', (string) @file_get_contents($a->priv . '/erros.log'), 'linha aviso-sem-destino');
    });
});

// ---- U13: a segunda ocorrência manda A2 uma vez só, mesmo com pedidos paralelos ---------------------

/**
 * Uma mensagem decodificada por conexão SMTP que enviou (conversa.bin, ou conversa.bin.N com mais de uma conexão),
 * na ordem de chegada. Espera o SMTP falso terminar, até o prazo. Conexão sem DATA não entra (não é envio).
 *
 * @return list<array{de: string, assunto: string, corpo: string}>
 */
function usB2Mensagens(array $falso): array
{
    correioConversaFinal($falso, 5.0);
    $arquivos = glob($falso['conversa'] . '*') ?: [];
    sort($arquivos, SORT_NATURAL);
    $mensagens = [];
    foreach ($arquivos as $arquivo) {
        $conversa = (string) file_get_contents($arquivo);
        if (str_contains($conversa, 'MAIL FROM:')) {
            $mensagens[] = emailB3Mensagem($conversa);
        }
    }
    return $mensagens;
}

teste('uso simultâneo: U13 segunda ocorrência com dois derrubados em pedidos concorrentes: A2 sai uma vez, e o aparelho vivo depois do bloqueio não duplica', function (): void {
    usB2Com(function (Ambiente $a, array $falso): void {
        usB2Destino($a);
        $p = $a->entrar('ana', US_SENHA_ANA);
        $q = $a->entrar('ana', US_SENHA_ANA); // derruba p
        igual(401, $p->get('/api/conteudo.php')->status, 'ocorrência 1: p cai (A1)');
        $r = $a->entrar('ana', US_SENHA_ANA); // derruba q
        $k = $a->entrar('ana', US_SENHA_ANA); // derruba r: k é o último login vivo
        // q e r são sessões diferentes (a trava de sessão não os serializa). Os dois param, já com a conta lida
        // antes do bloqueio, no ponto de pausa; soltos juntos, só um conta e bloqueia; o outro perde no CAS.
        // r sai depois de q já estar parado: disparados juntos, o php -S não entregou o pedido de r (medido).
        pausaLigar($a, 'queda-antes-contar', 'ana');
        $reqQ = usGetSemEsperar($q, '/api/conteudo.php');
        pausaEsperarChegada($reqQ, $a, 'queda-antes-contar', 1);
        $reqR = usGetSemEsperar($r, '/api/conteudo.php');
        pausaEsperarChegada($reqR, $a, 'queda-antes-contar', 2, [$reqQ]);
        pausaSoltar($a, 'queda-antes-contar');
        igual([401, 401], [usConcluirGet($reqQ)->status, usConcluirGet($reqR)->status], 'q e r recebem 401');
        igual(2, usB2Conta($a)['usoSimultaneo'] ?? null, 'duas ocorrências, uma por marcador, nenhuma a mais');
        verdadeiro(array_key_exists('bloqueada', usB2Conta($a)), 'a conta ficou bloqueada');
        // k é o aparelho vivo que ficou: o pedido dele, depois do bloqueio, não pode mandar outro A2
        igual(401, $k->get('/api/conteudo.php')->status, 'k cai pelo bloqueio');
        $mensagens = usB2Mensagens($falso);
        igual([US_B2_ASSUNTO_A1, US_B2_ASSUNTO_A2], array_column($mensagens, 'assunto'), 'um A1 e um só A2: nenhum a mais');
        igual(1, usB2MarcasAviso($a), 'o teto conta só o A1 (o A2 não entra no teto)');
    }, ['conversas' => 3], ['workers' => 4]);
});

teste('uso simultâneo: U13b A2 byte a byte: conta comum bloqueada, hora do bloqueio em Recife', function (): void {
    verdadeiro(function_exists('d26_correio_msg_bloqueio'), 'd26_correio_msg_bloqueio existe (função de montagem do A2)');
    $instante = strtotime('2026-11-10T02:30:00Z');
    $m = d26_correio_msg_bloqueio(US_B2_DESTINO, 'ana', $instante);
    igual(US_B2_ASSUNTO_A2, $m['assunto'], 'assunto do A2');
    igual('A conta ana foi bloqueada em 09/11/2026 às 23:30 (horário de Recife), na 2ª vez em que foi usada em dois aparelhos ao mesmo tempo. Todas as sessões dela caíram. Para liberar, use Desbloquear no painel. Se a senha pode ter vazado, use também Redefinir senha.', $m['corpo'], 'corpo do A2');
});

teste('uso simultâneo: U13c contar_uso não conta de novo a conta já bloqueada, mesmo com CAS e marcador conferindo (A2 idempotente no lock)', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    igual('ok', d26_contas_criar($priv, 'ana', 'hash-ana', false));
    // Bloqueio gravado sem trocar uid, versaoSessao nem hash (como o S57): a lida é do mesmo estado, então o CAS passa.
    usEditarConta($priv, 'ana', static function (array &$c): void {
        $c['sessaoVigente'] = str_repeat('a', 64);
        $c['usoSimultaneo'] = 1;
        $c['bloqueada'] = ['em' => time(), 'motivo' => 'uso-simultaneo'];
    });
    $agora = time();
    $lida = d26_contas_buscar($priv, 'ana');
    $ordinal = null;
    igual('nao-conta', d26_contas_contar_uso($priv, $lida, $agora - 10, $agora - 3600, null, $agora, $ordinal), 'conta já bloqueada não conta de novo');
    igual(null, $ordinal, 'nenhum número de ocorrência para um aviso');
    igual(1, d26_contas_buscar($priv, 'ana')['usoSimultaneo'] ?? null, 'o contador não sobe');
    apagarArvore($dir);
}, false);

// ---- U15: teto de 20 avisos em 24 h (chave própria); o teto do "Esqueci a senha" cheio não impede o aviso --

/** Escreve marcas de envio numa chave do teto no tentativas.json do privado sintético. */
function usB2EncherTeto(Ambiente $a, string $chave, int $n): void
{
    $arq = $a->priv . '/tentativas.json';
    $d = json_decode((string) @file_get_contents($arq), true);
    $d = is_array($d) ? $d : D26_LIMITE_PADRAO;
    $d['e'][d26_limite_chave_envio($chave)]['f'] = array_fill(0, $n, time());
    file_put_contents($arq, json_encode($d));
    chmod($arq, 0600);
}

teste('uso simultâneo: U15a teto de 20 avisos em 24 h: o 21º não sai, linha aviso-teto', function (): void {
    usB2Com(function (Ambiente $a, array $falso): void {
        usB2Destino($a);
        usB2EncherTeto($a, 'aviso', 20);
        $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoA->get('/api/conteudo.php');
        naoContem('MAIL FROM', usB2Conversa($falso), 'o 21º aviso não sai');
        contem('aviso-teto', (string) @file_get_contents($a->priv . '/erros.log'), 'linha aviso-teto');
    });
});

teste('uso simultâneo: U15b o teto do Esqueci a senha cheio não impede o aviso ao líder', function (): void {
    usB2Com(function (Ambiente $a, array $falso): void {
        usB2Destino($a);
        usB2EncherTeto($a, 'teto', D26_ENVIO_TETO_DIA);
        $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoA->get('/api/conteudo.php');
        contem('RCPT TO:<' . US_B2_DESTINO . '>', usB2Conversa($falso), 'o A1 sai mesmo com o teto do Esqueci cheio');
    });
});

teste('uso simultâneo: U15c teto cheio de A1 não segura o A2: o bloqueio sai sempre e não entra no teto (decisão do líder, 10/11/2026)', function (): void {
    usB2Com(function (Ambiente $a, array $falso): void {
        usB2Destino($a);
        usB2EncherTeto($a, 'aviso', 20);
        $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoA->get('/api/conteudo.php'); // 1ª ocorrência: o A1 sai suprimido pelo teto cheio
        $aparelhoC = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB->get('/api/conteudo.php'); // 2ª ocorrência: bloqueia, e o A2 sai mesmo com o teto cheio
        verdadeiro(array_key_exists('bloqueada', usB2Conta($a)), 'a conta ficou bloqueada');
        contem('aviso-teto', (string) @file_get_contents($a->priv . '/erros.log'), 'o A1 ficou no teto');
        igual([US_B2_ASSUNTO_A2], array_column(usB2Mensagens($falso), 'assunto'), 'só o A2 sai');
        igual(20, usB2MarcasAviso($a), 'o A2 não grava marca no teto');
        verdadeiro($aparelhoC !== null, 'o terceiro login existiu');
    }, ['conversas' => 2]);
});

// ---- U16: o aviso sai DEPOIS da resposta, fora de lock; falha do SMTP não muda a resposta -------------

teste('uso simultâneo: U16 o aviso sai depois da resposta (ordem por injeção, TE4); falha do SMTP não sai do despacho', function (): void {
    verdadeiro(function_exists('d26_aviso_agendar') && function_exists('d26_aviso_despachar'), 'd26_aviso_agendar e d26_aviso_despachar existem');
    $ordem = [];
    $dir = dirTemporario();
    d26_aviso_agendar($dir, d26_correio_msg_uso(US_B2_DESTINO, 'ana', 1, false, time()));
    $terminar = static function () use (&$ordem): bool {
        $ordem[] = 'termino';
        return true;
    };
    $enviar = static function (array $m) use (&$ordem): void {
        $ordem[] = 'envio';
        throw new D26EnvioFalhou('etapa'); // falha do SMTP: não pode sair do despacho
    };
    try {
        d26_aviso_despachar($dir, $terminar, $enviar);
    } catch (Throwable $e) {
        falhar('a falha do envio saiu do despacho: ' . get_class($e));
    }
    igual(['termino', 'envio'], $ordem, 'o término da resposta vem antes do envio');
});

/**
 * GET que entrega o corpo à medida que chega, sem esperar o fim da resposta. O corpo vai para $corpo por referência.
 *
 * @return array{resource, \CurlHandle}
 */
function usGetParcial(Cliente $c, string $caminho, string &$corpo): array
{
    $cookie = [];
    foreach ($c->cookies as $n => $v) {
        $cookie[] = "$n=$v";
    }
    $h = curl_init($c->origem() . $caminho);
    curl_setopt_array($h, [
        CURLOPT_WRITEFUNCTION => static function ($curl, string $pedaco) use (&$corpo): int {
            $corpo .= $pedaco;
            return strlen($pedaco);
        },
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => ['Cookie: ' . implode('; ', $cookie), 'Connection: close'],
    ]);
    $m = curl_multi_init();
    curl_multi_add_handle($m, $h);
    curl_multi_exec($m, $ativos);
    return [$m, $h];
}

/** Termina um GET de usGetParcial e devolve o status. */
function usConcluirParcial(array $req): int
{
    [$m, $h] = $req;
    do {
        $estado = curl_multi_exec($m, $ativos);
        if ($ativos > 0) {
            curl_multi_select($m, 0.1);
        }
    } while ($ativos > 0 && $estado === CURLM_OK);
    $status = (int) curl_getinfo($h, CURLINFO_RESPONSE_CODE);
    curl_multi_remove_handle($m, $h);
    curl_close($h);
    curl_multi_close($m);
    return $status;
}

/**
 * Envio depois da resposta com o término REAL do SAPI (stub de apoio/sapi-*.php, sob php -S). O SMTP falso segura a
 * conexão enquanto $parada existir. Prova: quando a conexão do envio chega ao SMTP, o término do SAPI já foi chamado
 * e o corpo da resposta já saiu para o cliente. Com o envio síncrono no pedido (mutante g), o término não existe
 * quando a conexão abre, e o corpo não sai.
 */
function usB2SapiEnvioDepois(string $stub): void
{
    $parada = dirTemporario() . '/envio-parado';
    touch($parada);
    usB2Com(function (Ambiente $a, array $falso) use ($parada): void {
        usB2Destino($a);
        $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
        $sinal = $a->priv . '/sinal-sapi-finish';
        $chegou = $falso['conversa'] . '.chegou';
        @unlink($sinal);
        $corpo = '';
        $req = usGetParcial($aparelhoA, '/api/conteudo.php', $corpo); // 1ª ocorrência: o A1 é o envio em teste
        [$m] = $req;
        $limite = microtime(true) + 5;
        while (!is_file($chegou) && microtime(true) < $limite) {
            curl_multi_exec($m, $ativos);
            clearstatcache(true, $chegou);
            usleep(20000);
        }
        verdadeiro(is_file($chegou), 'a conexão do envio chegou ao SMTP falso (o envio começou)');
        clearstatcache(true, $sinal);
        verdadeiro(is_file($sinal), 'o término do SAPI foi chamado antes de a conexão do envio existir');
        $limite = microtime(true) + 2;
        while ($corpo === '' && microtime(true) < $limite) {
            curl_multi_exec($m, $ativos);
            usleep(20000);
        }
        verdadeiro($corpo !== '', 'o corpo da resposta já saiu com o envio ainda parado no SMTP');
        unlink($parada);
        igual(401, usConcluirParcial($req), 'o 401 termina');
        igual([US_B2_ASSUNTO_A1], array_column(usB2Mensagens($falso), 'assunto'), 'o A1 saiu depois do término');
    }, ['esperarArquivo' => $parada], ['prepend' => $stub]);
}

teste('uso simultâneo: U16b SAPI falso litespeed: o término vem antes da conexão do envio, e o corpo sai antes do envio', fn () => usB2SapiEnvioDepois(RAIZ_REPO . '/servidor/testes/apoio/sapi-litespeed.php'));
teste('uso simultâneo: U16b SAPI falso fastcgi: o término vem antes da conexão do envio, e o corpo sai antes do envio', fn () => usB2SapiEnvioDepois(RAIZ_REPO . '/servidor/testes/apoio/sapi-fastcgi.php'));

// ---- U17: A1 e A2 não levam IP, cookie nem User-Agent --------------------------------------------------

/**
 * Corpo inteiro do A1 e do A2 como o líder lê (plano 9.1.5, R22 "Usar como estão"). Literais copiados do plano, com
 * {hora} no lugar de dd/mm/aaaa às hh:mm (horário de Recife). Não vêm do código de produção: o teste não se compara a si.
 */
const US_B2_CORPO_A1 = 'A conta ana entrou em outro aparelho enquanto ainda estava em uso no anterior, em {hora} (horário de Recife). Esta é a 1ª vez. Na 2ª vez, a conta é bloqueada.';
const US_B2_CORPO_A2 = 'A conta ana foi bloqueada em {hora} (horário de Recife), na 2ª vez em que foi usada em dois aparelhos ao mesmo tempo. Todas as sessões dela caíram. Para liberar, use Desbloquear no painel. Se a senha pode ter vazado, use também Redefinir senha.';

teste('uso simultâneo: U17 A1 e A2 por HTTP: corpo inteiro igual ao texto do 9.1.5, sem IP, cookie nem User-Agent', function (): void {
    usB2Com(function (Ambiente $a, array $falso): void {
        usB2Destino($a);
        $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoA->get('/api/conteudo.php', ['User-Agent' => 'UA-SENTINELA-BL-B2']);
        $horaA1 = (int) usB2Conta($a)['vigenteDesde']; // a hora do A1 é a do login que causou a queda
        $aparelhoC = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB->get('/api/conteudo.php', ['User-Agent' => 'UA-SENTINELA-BL-B2']);
        $horaA2 = (int) usB2Conta($a)['bloqueada']['em'];
        $porAssunto = [];
        foreach (usB2Mensagens($falso) as $msg) {
            $porAssunto[$msg['assunto']] = $msg;
        }
        verdadeiro(isset($porAssunto[US_B2_ASSUNTO_A1]) && isset($porAssunto[US_B2_ASSUNTO_A2]), 'o A1 e o A2 saíram');
        igual(str_replace('{hora}', usB2Hora($horaA1), US_B2_CORPO_A1), $porAssunto[US_B2_ASSUNTO_A1]['corpo'], 'corpo inteiro do A1 igual ao 9.1.5');
        igual(str_replace('{hora}', usB2Hora($horaA2), US_B2_CORPO_A2), $porAssunto[US_B2_ASSUNTO_A2]['corpo'], 'corpo inteiro do A2 igual ao 9.1.5');
        foreach ([US_B2_ASSUNTO_A1, US_B2_ASSUNTO_A2] as $assunto) {
            verdadeiro(preg_match('/\d+\.\d+\.\d+\.\d+/', $porAssunto[$assunto]['corpo']) !== 1, "o corpo de '$assunto' não tem endereço IP");
        }
        $conversas = usB2ConversasBrutas($falso);
        naoContem('UA-SENTINELA-BL-B2', $conversas, 'o User-Agent não vai ao e-mail');
        foreach ([$aparelhoA, $aparelhoB] as $c) {
            foreach ([D26_SESSAO_NOME, D26_DISP_NOME] as $nome) {
                if (isset($c->cookies[$nome])) {
                    naoContem((string) $c->cookies[$nome], $conversas, "o cookie $nome não vai ao e-mail");
                }
            }
        }
        verdadeiro($aparelhoC !== null, 'o terceiro login existiu');
    }, ['conversas' => 3]);
});

/** Conversas SMTP cruas, todas as conexões, depois do prazo (para procurar IP, cookie e User-Agent no que saiu). */
function usB2ConversasBrutas(array $falso): string
{
    correioConversaFinal($falso, 5.0);
    $tudo = '';
    foreach (glob($falso['conversa'] . '*') ?: [] as $arquivo) {
        $tudo .= (string) file_get_contents($arquivo);
    }
    return $tudo;
}

// ---- U12d: login no tamanho máximo (32) passa na validação do envio (conflito de D26_SMTP_ASSUNTO_MAX) --

teste('uso simultâneo: U12d A2 com login de 32 caracteres passa d26_correio_validar (assunto até o teto de envio)', function (): void {
    verdadeiro(function_exists('d26_correio_msg_bloqueio'), 'd26_correio_msg_bloqueio existe');
    $login = str_repeat('a', 32);
    $m = d26_correio_msg_bloqueio(US_B2_DESTINO, $login, time());
    try {
        d26_correio_validar($m);
    } catch (D26EnvioFalhou $e) {
        falhar('A2 com login de 32 caracteres recusado na validação: etapa ' . $e->getMessage() . ' (assunto de ' . strlen($m['assunto']) . ' bytes)');
    }
});

// ---- Conserto do assunto (decisão do orquestrador, opção 1): encoded-words dobradas, teto de 160 bytes ----

/** Recorta o cabeçalho Subject (com as dobras) da mensagem montada, para decodificar sem o helper de e-mail. */
function usB2Subject(string $cabecalhos): string
{
    $inicio = strpos($cabecalhos, 'Subject: ');
    $fim = strpos($cabecalhos, "\r\nMessage-ID:");
    verdadeiro($inicio !== false && $fim !== false && $fim > $inicio, 'a mensagem tem Subject antes de Message-ID');
    return substr($cabecalhos, $inicio, $fim - $inicio);
}

teste('uso simultâneo: U12e assunto maior que 45 bytes sai em encoded-words de até 75 caracteres, juntas igual ao original, com acento no corte', function (): void {
    verdadeiro(function_exists('d26_correio_montar'), 'd26_correio_montar existe');
    $assunto = str_repeat('ç', 30) . 'fim'; // 63 bytes: o corte de 45 bytes cairia no meio de um ç
    $cabecalhos = d26_correio_montar(['destinatario' => US_B2_DESTINO, 'assunto' => $assunto, 'corpo' => 'x']);
    $sub = usB2Subject($cabecalhos);
    verdadeiro(emailB3SubjectEstrito(substr($sub, strlen('Subject: '))), 'o Subject sai só com encoded-words separadas por CRLF e espaço');
    preg_match_all('/=\?UTF-8\?B\?([A-Za-z0-9+\/=]+)\?=/', $sub, $palavras);
    verdadeiro(count($palavras[1]) >= 2, 'o assunto de 63 bytes ocupa mais de uma encoded-word');
    $juntos = '';
    foreach ($palavras[0] as $palavra) {
        verdadeiro(strlen($palavra) <= 75, 'cada encoded-word tem até 75 caracteres');
    }
    foreach ($palavras[1] as $b64) {
        $parte = base64_decode($b64, true);
        verdadeiro($parte !== false && preg_match('//u', $parte) === 1, 'cada parte decodifica como UTF-8 válido');
        $juntos .= $parte;
    }
    igual($assunto, $juntos, 'juntas, as partes dão o assunto byte a byte');
    foreach (explode("\r\n", $cabecalhos) as $linha) {
        verdadeiro(strlen($linha) <= D26_SMTP_LINHA_MAX, 'nenhuma linha do cabeçalho passa de D26_SMTP_LINHA_MAX');
    }
});

teste('uso simultâneo: U12f assunto com caractere de controle (abaixo de 0x20) é recusado como cabecalho', function (): void {
    foreach (["Conta\x01ana", "Conta\tana", "Conta\x1Fana", "Conta\rana", "Conta\nana", "Conta\x00ana"] as $ruim) {
        try {
            d26_correio_validar(['destinatario' => US_B2_DESTINO, 'assunto' => $ruim, 'corpo' => 'x']);
            falhar('assunto com controle passou: ' . bin2hex($ruim));
        } catch (D26EnvioFalhou $e) {
            igual('cabecalho', $e->etapa, 'recusa como cabecalho: ' . bin2hex($ruim));
        }
    }
});

teste('uso simultâneo: U12g teto do assunto em 160 bytes: 160 passa, 161 é recusado como cabecalho', function (): void {
    igual(160, D26_SMTP_ASSUNTO_MAX, 'teto do assunto em 160 bytes');
    d26_correio_validar(['destinatario' => US_B2_DESTINO, 'assunto' => str_repeat('a', 160), 'corpo' => 'x']);
    try {
        d26_correio_validar(['destinatario' => US_B2_DESTINO, 'assunto' => str_repeat('a', 161), 'corpo' => 'x']);
        falhar('161 bytes passou da validação');
    } catch (D26EnvioFalhou $e) {
        igual('cabecalho', $e->etapa, '161 bytes recusado como cabecalho');
    }
});

teste('uso simultâneo: U12h A1 por HTTP com login de 32 caracteres: o assunto dobrado chega inteiro ao SMTP falso', function (): void {
    $login = str_repeat('a', 32);
    emailB3Com([], function (Ambiente $a, array $falso) use ($login): void {
        usB2Destino($a);
        $a->semearUsuario($login, US_SENHA_ANA, false, false);
        $aparelhoA = $a->entrar($login, US_SENHA_ANA);
        $aparelhoB = $a->entrar($login, US_SENHA_ANA);
        $aparelhoA->get('/api/conteudo.php');
        $msg = emailB3Mensagem(usB2Conversa($falso));
        igual('Uso simultâneo na conta ' . $login, $msg['assunto'], 'assunto dobrado decodifica igual ao original');
    });
});

// ---- U18: o ordinal do A1 é lido DENTRO do lock (Desbloquear entre a leitura e o lock, ramo contas.php:870) ----

teste('uso simultâneo: U18 o ordinal do A1 é o número lido dentro do lock, não o da leitura anterior', function (): void {
    $a = Ambiente::novo([]);
    $a->semearUsuario('ana', US_SENHA_ANA, true, false);
    $agora = time();
    usEditarConta($a->priv, 'ana', static function (array &$c) use ($agora): void {
        $c['vigenteDesde'] = $agora - 5;
        $c['sessaoVigente'] = str_repeat('a', 64);
        $c['usoSimultaneo'] = 5; // o número real, dentro do lock
    });
    $lida = contaDe($a, 'ana');
    $lida['usoSimultaneo'] = 0; // leitura anterior ao lock (um Desbloquear caiu entre as duas)
    $ordinal = null;
    $resultado = d26_contas_contar_uso($a->priv, $lida, $agora - 10, $agora - 3600, null, $agora, $ordinal);
    igual('contou', $resultado, 'a contagem vale');
    igual(6, $ordinal, 'o ordinal é 6, o número dentro do lock + 1');
});
