<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

/**
 * Corridas DETERMINÍSTICAS: o endpoint dorme num ponto nomeado (d26_teste_pausar,
 * ativo só sob php -S) entre a leitura e a gravação enquanto o teste faz a ação
 * concorrente; nada depende de sorte de tempo.
 */

/** Liga a pausa de $ponto para o login $quem ('*' = todos). */
function pausaLigar(Ambiente $a, string $ponto, string $quem = '*'): void
{
    file_put_contents($a->priv . '/pausa-' . $ponto, $quem);
}

/** Solta todos os processos parados em $ponto. */
function pausaSoltar(Ambiente $a, string $ponto): void
{
    @unlink($a->priv . '/pausa-' . $ponto);
}

/**
 * Dispara um POST sem esperar a resposta. @param array<string, mixed> $corpo
 * @return array{resource, \CurlHandle}
 */
function postSemEsperar(Cliente $c, string $caminho, array $corpo): array
{
    $cookie = [];
    foreach ($c->cookies as $n => $v) {
        $cookie[] = "$n=$v";
    }
    $h = curl_init($c->origem() . $caminho);
    curl_setopt_array($h, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($corpo, JSON_THROW_ON_ERROR),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Origin: ' . $c->origem(),
            'X-CSRF-Token: ' . (string) $c->csrf,
            'Cookie: ' . implode('; ', $cookie),
            'Connection: close',
        ],
    ]);
    static $m = null; // um multi só: todos os pedidos pendentes avançam juntos
    $m ??= curl_multi_init();
    curl_multi_add_handle($m, $h);
    curl_multi_exec($m, $ativos);
    return [$m, $h];
}

/** Espera $n processos chegarem a $ponto (teto 15 s: sem isso é código sem o gancho). */
function pausaEsperarChegada(array $req, Ambiente $a, string $ponto, int $n = 1, array $outros = []): void
{
    [$m] = $req;
    $arq = $a->priv . '/pausado-' . $ponto;
    $limite = microtime(true) + 15;
    while (microtime(true) < $limite) {
        curl_multi_exec($m, $ativos);
        $chegaram = is_file($arq) ? count(file($arq, FILE_IGNORE_NEW_LINES) ?: []) : 0;
        if ($chegaram >= $n) {
            return;
        }
        usleep(20000);
    }
    $diag = [];
    foreach ([$req, ...$outros] as $r) {
        $diag[] = curl_getinfo($r[1], CURLINFO_RESPONSE_CODE) . ':' . substr((string) curl_multi_getcontent($r[1]), 0, 120);
    }
    falhar("ninguém chegou ao ponto de pausa '$ponto' (o gancho não existe no código?) [" . implode(' | ', $diag) . ']');
}

/** @param array{resource, \CurlHandle} $req @return array{int, array<string, mixed>} */
function postConcluir(array $req): array
{
    [$m, $h] = $req;
    do {
        $estado = curl_multi_exec($m, $ativos);
        if ($ativos > 0) {
            curl_multi_select($m, 0.1);
        }
    } while ($ativos > 0 && $estado === CURLM_OK);
    $status = (int) curl_getinfo($h, CURLINFO_RESPONSE_CODE);
    $corpo = (string) curl_multi_getcontent($h);
    curl_multi_remove_handle($m, $h);
    curl_close($h);
    $j = json_decode($corpo, true);
    return [$status, is_array($j) ? $j : []];
}

function contaDe(Ambiente $a, string $login): ?array
{
    foreach ($a->lerUsuarios()['usuarios'] as $c) {
        if ($c['usuario'] === $login) {
            return $c;
        }
    }
    return null;
}

/** Admin cria a Ana (provisória conhecida) e devolve o cliente do admin. */
function admComAna(Ambiente $a): Cliente
{
    $adm = $a->entrar();
    igual(200, $adm->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'senhaProvisoria' => 'Provisoria-Ana1'])->status);
    return $adm;
}

// ---- Item 1 e 11: troca de senha em voo x redefinição / exclusão -------------------------------

teste('item 1: troca de senha em voo NÃO sobrescreve a redefinição do admin (409, nada gravado)', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $adm = admComAna($a);
    $ana = $a->entrar('ana', 'Provisoria-Ana1');
    pausaLigar($a, 'troca-antes-gravar', 'ana');
    $req = postSemEsperar($ana, '/api/trocar-senha.php', ['senhaAtual' => 'Provisoria-Ana1', 'senhaNova' => 'NovaSenhaDaAna123']);
    pausaEsperarChegada($req, $a, 'troca-antes-gravar');
    igual(200, $adm->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana', 'senhaProvisoria' => 'Redefinida-Admin9'])->status);
    pausaSoltar($a, 'troca-antes-gravar');
    [$status, $j] = postConcluir($req);
    igual(409, $status, 'a troca em voo é recusada');
    igual('conta-alterada', $j['erro'] ?? null);
    $c = contaDe($a, 'ana');
    verdadeiro(password_verify('Redefinida-Admin9', $c['hash']), 'a senha redefinida pelo admin continua valendo');
    verdadeiro(!password_verify('NovaSenhaDaAna123', $c['hash']), 'a senha da troca em voo não foi gravada');
    igual(true, $c['deveTrocarSenha'], 'a redefinição continua exigindo troca');
});

teste('item 11: troca de senha em voo sobre conta excluída responde 409, nunca 200 nem sessão', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $adm = admComAna($a);
    $ana = $a->entrar('ana', 'Provisoria-Ana1');
    pausaLigar($a, 'troca-antes-gravar', 'ana');
    $req = postSemEsperar($ana, '/api/trocar-senha.php', ['senhaAtual' => 'Provisoria-Ana1', 'senhaNova' => 'NovaSenhaDaAna123']);
    pausaEsperarChegada($req, $a, 'troca-antes-gravar');
    igual(200, $adm->post('/api/usuarios.php', ['acao' => 'excluir', 'usuario' => 'ana'])->status);
    pausaSoltar($a, 'troca-antes-gravar');
    [$status] = postConcluir($req);
    igual(409, $status);
    igual(null, contaDe($a, 'ana'), 'a conta excluída não ressurgiu');
});

teste('item 11 (unidade): trocar senha de conta inexistente devolve 0 e não grava', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    igual(0, d26_contas_trocar_senha($priv, 'fantasma', 'h', ['usuario' => 'fantasma', 'uid' => 'x', 'versaoSessao' => 1, 'hash' => 'h']));
    verdadeiro(!is_file($priv . '/usuarios.json'), 'nada foi criado');
    apagarArvore($dir);
}, false);

// ---- Item 2: login em voo x redefinição / desativação / exclusão+recriação ---------------------

teste('item 2: login com a senha antiga em voo, depois de redefinição, desativação ou exclusão+recriação: 401, sem sessão e sem aparelho', function (): void {
    foreach (['redefinir', 'desativar', 'excluir-recriar'] as $caso) {
        $a = Ambiente::novo(['workers' => 4]);
        $adm = admComAna($a);
        $cli = $a->clienteComSessao();
        $sessoesAntes = count(glob($a->priv . '/sessoes/sess_*') ?: []);
        pausaLigar($a, 'entrar-apos-verificar', 'ana');
        $req = postSemEsperar($cli, '/api/entrar.php', ['usuario' => 'ana', 'senha' => 'Provisoria-Ana1']);
        pausaEsperarChegada($req, $a, 'entrar-apos-verificar');
        if ($caso === 'redefinir') {
            igual(200, $adm->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana', 'senhaProvisoria' => 'Redefinida-Admin9'])->status);
        } elseif ($caso === 'desativar') {
            igual(200, $adm->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => 'ana'])->status);
        } else {
            igual(200, $adm->post('/api/usuarios.php', ['acao' => 'excluir', 'usuario' => 'ana'])->status);
            igual(200, $adm->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'senhaProvisoria' => 'Outra-Provisoria2'])->status);
        }
        pausaSoltar($a, 'entrar-apos-verificar');
        [$status, $j] = postConcluir($req);
        igual(401, $status, "$caso: o login com a senha antiga é recusado");
        igual('credenciais', $j['erro'] ?? null, $caso);
        igual($sessoesAntes, count(glob($a->priv . '/sessoes/sess_*') ?: []), "$caso: nenhuma sessão nova");
        igual([], contaDe($a, 'ana')['aparelhos'] ?? [], "$caso: nenhum aparelho confiável gravado");
        igual(null, contaDe($a, 'ana')['ultimoLogin'], "$caso: ultimoLogin intacto");
        $a->parar();
    }
});

// ---- Item 3: confiável avaliado sob o lock de tentativas; ordem de locks -----------------------

teste('item 3: o aparelho confiável é avaliado DENTRO do lock de tentativas (a avaliação roda com a trava presa)', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    file_put_contents($priv . '/tentativas.json', '{"u":[],"ip":[],"c":[]}');
    $presa = null;
    $r = d26_limite_reservar_detalhado($priv, 'chefe', '192.0.2.1', 1000, static function () use ($priv, &$presa): bool {
        $h = fopen($priv . '/tentativas.json.lock', 'c');
        $presa = !flock($h, LOCK_EX | LOCK_NB); // outra descrição de arquivo: falha se a trava está presa
        fclose($h);
        return true;
    });
    igual(true, $presa, 'a trava de tentativas estava presa durante a avaliação');
    igual(true, $r['confiavel'], 'o resultado da avaliação volta ao chamador');
    igual(false, $r['inseriu']['c'], 'confiável não insere na chave de conta');
    apagarArvore($dir);
}, false);

teste('item 3: d26_dispositivo_confiavel lê a conta sob o lock de usuarios (trava presa = D26Indisponivel, fechado, nunca "livre")', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    d26_contas_criar($priv, 'chefe', 'h', false);
    $_COOKIE['__Host-d26disp'] = str_repeat('A', 43);
    $h = fopen($priv . '/usuarios.json.lock', 'c');
    flock($h, LOCK_EX);
    $erro = null;
    try {
        d26_dispositivo_confiavel($priv, 'chefe');
    } catch (D26Indisponivel $e) {
        $erro = $e;
    } finally {
        flock($h, LOCK_UN);
        fclose($h);
        unset($_COOKIE['__Host-d26disp']);
    }
    verdadeiro($erro !== null, 'levantou D26Indisponivel em vez de devolver false/true');
    apagarArvore($dir);
}, false);

// ---- Item 4: ator revalidado sob lock; último admin ------------------------------------------

teste('item 4: admin desativado entre a leitura da sessão e a ação NÃO cria usuário (401, nada gravado)', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $a->semearUsuario('segundo', 'SenhaSegundo123', true, false);
    $um = $a->entrar();
    $dois = $a->entrar('segundo', 'SenhaSegundo123');
    pausaLigar($a, 'usuarios-antes-agir', Ambiente::LOGIN_ADMIN); // só o primeiro admin pausa
    $req = postSemEsperar($um, '/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'intruso', 'senhaProvisoria' => 'Provisoria-Int1']);
    pausaEsperarChegada($req, $a, 'usuarios-antes-agir');
    igual(200, $dois->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => Ambiente::LOGIN_ADMIN])->status, 'o segundo admin desativa o primeiro, sem pausar');
    pausaSoltar($a, 'usuarios-antes-agir');
    [$status] = postConcluir($req);
    igual(401, $status, 'o ator já não é um admin ativo');
    igual(null, contaDe($a, 'intruso'), 'o usuário não foi criado');
});

teste('item 4: dois admins que se desativam ao mesmo tempo: só um consegue e sobra um admin ativo', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $a->semearUsuario('segundo', 'SenhaSegundo123', true, false);
    $um = $a->entrar();
    $dois = $a->entrar('segundo', 'SenhaSegundo123');
    pausaLigar($a, 'usuarios-antes-agir');
    $r1 = postSemEsperar($um, '/api/usuarios.php', ['acao' => 'desativar', 'usuario' => 'segundo']);
    pausaEsperarChegada($r1, $a, 'usuarios-antes-agir', 1); // um de cada vez: duas conexões simultâneas no php -S eram intermitentes
    $r2 = postSemEsperar($dois, '/api/usuarios.php', ['acao' => 'desativar', 'usuario' => Ambiente::LOGIN_ADMIN]);
    pausaEsperarChegada($r1, $a, 'usuarios-antes-agir', 2, [$r2]);
    pausaSoltar($a, 'usuarios-antes-agir');
    $s = [postConcluir($r1)[0], postConcluir($r2)[0]];
    sort($s);
    igual([200, 401], $s, 'um vence, o outro já não é admin ativo');
    $ativos = array_filter($a->lerUsuarios()['usuarios'], static fn (array $c): bool => $c['admin'] === true && $c['ativo'] === true);
    igual(1, count($ativos), 'sobra exatamente um admin ativo');
});

teste('item 4 (unidade): nenhuma ação pode deixar zero admins ativos (409 ultimo-admin, nada gravado)', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    d26_contas_criar($priv, 'chefe', 'h', true);
    d26_contas_criar($priv, 'ana', 'h', false);
    $ator = d26_contas_buscar($priv, 'chefe');
    $antes = file_get_contents($priv . '/usuarios.json');
    igual('ultimo-admin', d26_admin_agir($priv, $ator, 'desativar', 'chefe'));
    igual('ultimo-admin', d26_admin_agir($priv, $ator, 'excluir', 'chefe'));
    igual($antes, file_get_contents($priv . '/usuarios.json'), 'arquivo intacto');
    igual('ok', d26_admin_agir($priv, $ator, 'desativar', 'ana'), 'agir sobre outro continua valendo');
    igual('ator-invalido', d26_admin_agir($priv, ['usuario' => 'ana'] + $ator, 'criar', 'nova', 'h'), 'ator que não é o admin lido');
    apagarArvore($dir);
}, false);

// ---- Item 5: sucesso devolve só o que a reserva inseriu ---------------------------------------

teste('item 5: login confiável (reserva sem inserir na conta) NÃO apaga a falha de outro IP no mesmo segundo', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    $t = 1_800_000_000;
    igual(0, d26_limite_reservar($priv, 'chefe', '203.0.113.5', $t), 'falha alheia, chave de conta');
    $r = d26_limite_reservar_detalhado($priv, 'chefe', '192.0.2.7', $t, true);
    igual(false, $r['inseriu']['c'], 'a reserva confiável não inseriu na conta');
    d26_limite_sucesso($priv, 'chefe', '192.0.2.7', $t, $r['inseriu']['c']);
    $d = json_decode((string) file_get_contents($priv . '/tentativas.json'), true);
    igual(1, count(array_values($d['c'])[0]['f']), 'a falha do outro IP continua na chave de conta');
    apagarArvore($dir);
}, false);

// ---- Item 6, 7, 10: armazenamento ----------------------------------------------------------------

teste('item 6: lock preso não pendura: d26_atualizar_json levanta D26Indisponivel dentro do teto', function (): void {
    $dir = dirTemporario();
    $arq = $dir . '/x.json';
    $h = fopen($arq . '.lock', 'c');
    flock($h, LOCK_EX);
    $t0 = microtime(true);
    $erro = null;
    try {
        d26_atualizar_json($arq, ['n' => 0], static function (array &$d): void {
            $d['n']++;
        });
    } catch (D26Indisponivel $e) {
        $erro = $e;
    } finally {
        flock($h, LOCK_UN);
        fclose($h);
    }
    $dt = microtime(true) - $t0;
    verdadeiro($erro !== null, 'levantou D26Indisponivel');
    verdadeiro($dt >= D26_LOCK_TETO_MS / 1000 * 0.8 && $dt < 3, "esperou ~o teto e parou: $dt s");
    verdadeiro(!is_file($arq), 'nada foi gravado');
    apagarArvore($dir);
}, false);

teste('item 6/7 (HTTP, teto real de 2 s): lock de tentativas preso responde 503 indisponivel e o servidor continua vivo', function (): void {
    $a = Ambiente::novo(['workers' => 4]);
    $c = $a->clienteComSessao();
    $h = fopen($a->priv . '/tentativas.json.lock', 'c');
    flock($h, LOCK_EX);
    $t0 = microtime(true);
    $r = $c->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    $dt = microtime(true) - $t0;
    flock($h, LOCK_UN);
    fclose($h);
    igual(503, $r->status);
    igual('indisponivel', $r->json()['erro'] ?? null);
    verdadeiro($dt >= 1.5 && $dt < 8, "respondeu depois do teto, não pendurou: $dt s");
    igual(200, $a->entrar()->get('/api/sessao.php')->status, 'solta a trava, tudo volta');
});

teste('item 7 (HTTP): usuarios.json corrompido responde 503 indisponivel (não 500) e não vaza o motivo', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    file_put_contents($a->priv . '/usuarios.json', '{isto não é json');
    $r = $c->get('/api/sessao.php');
    igual(503, $r->status);
    igual('indisponivel', $r->json()['erro'] ?? null);
    naoContem('usuarios', $r->corpo, 'sem nome de arquivo');
    naoContem('JSON', $r->corpo, 'sem detalhe técnico');
});

teste('item 10: sem escrita no diretório, a gravação falha com D26Indisponivel e não cai no TMPDIR do sistema', function (): void {
    $dir = dirTemporario();
    $sis = $dir . '/tmp-sistema';
    mkdir($sis, 0700);
    $dados = $dir . '/dados';
    mkdir($dados, 0700);
    $arq = $dados . '/x.json';
    touch($arq . '.lock');
    $antes = getenv('TMPDIR');
    putenv('TMPDIR=' . $sis);
    chmod($dados, 0500);
    $erro = null;
    try {
        d26_atualizar_json($arq, ['n' => 0], static function (array &$d): void {
            $d['n'] = 1;
        });
    } catch (D26Indisponivel $e) {
        $erro = $e;
    } catch (Throwable $e) {
        $erro = $e;
    } finally {
        chmod($dados, 0700);
        putenv($antes === false ? 'TMPDIR' : 'TMPDIR=' . $antes);
    }
    verdadeiro($erro instanceof D26Indisponivel, 'D26Indisponivel, veio ' . ($erro === null ? 'nada' : get_class($erro)));
    igual([], glob($sis . '/*') ?: [], 'nenhum arquivo no TMPDIR do sistema');
    igual([], glob($dados . '/.tmp-*') ?: [], 'nenhum temporário sobrando');
    apagarArvore($dir);
}, false);

// ---- Item 8: tipos da conta -----------------------------------------------------------------------

teste('item 8: campo da conta com tipo errado (1, "true", "yes") nunca passa por booleano: 503 fechado', function (): void {
    foreach ([['deveTrocarSenha', 1], ['deveTrocarSenha', 'true'], ['admin', 'yes'], ['ativo', 1], ['versaoSessao', '12']] as [$campo, $valor]) {
        $a = Ambiente::novo();
        $c = $a->entrar();
        $d = $a->lerUsuarios();
        $d['usuarios'][0][$campo] = $valor;
        file_put_contents($a->priv . '/usuarios.json', json_encode($d, JSON_THROW_ON_ERROR));
        $r = $c->get('/api/conteudo.php');
        igual(503, $r->status, "$campo=" . var_export($valor, true));
        igual('indisponivel', $r->json()['erro'] ?? null);
        $a->parar();
    }
});

// ---- Item 9: tentativas.json provisionado e ausente ----------------------------------------------

teste('item 9: provisionado (usuarios.json existe) e tentativas.json ausente é 503, não limites zerados; antes do provisionamento nasce vazio', function (): void {
    $a = Ambiente::novo();
    unlink($a->priv . '/tentativas.json');
    $r = $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => Ambiente::LOGIN_ADMIN, 'senha' => Ambiente::SENHA_ADMIN]);
    igual(503, $r->status);
    igual('indisponivel', $r->json()['erro'] ?? null);
    verdadeiro(!is_file($a->priv . '/tentativas.json'), 'não recriou do zero em silêncio');

    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    igual(0, d26_limite_reservar($priv, 'ana', '192.0.2.1', 1000), 'sem contas (pré-provisionamento) o arquivo nasce');
    verdadeiro(is_file($priv . '/tentativas.json'), 'criado');
    file_put_contents($priv . '/usuarios.json', '{"versao":1,"usuarios":[]}');
    unlink($priv . '/tentativas.json');
    $erro = null;
    try {
        d26_limite_reservar($priv, 'ana', '192.0.2.1', 1000);
    } catch (D26Indisponivel $e) {
        $erro = $e;
    }
    verdadeiro($erro !== null, 'provisionado e sem tentativas.json: D26Indisponivel');
    apagarArvore($dir);
});

// ---- Item 12: revogar derruba as sessões do alvo ---------------------------------------------------

teste('item 12: revogar-aparelhos incrementa a versaoSessao do alvo (sessão cai, aparelhos vazios)', function (): void {
    $a = Ambiente::novo();
    $adm = admComAna($a);
    $ana = $a->entrar('ana', 'Provisoria-Ana1');
    $v0 = contaDe($a, 'ana')['versaoSessao'];
    igual(200, $adm->post('/api/usuarios.php', ['acao' => 'revogar-aparelhos', 'usuario' => 'ana'])->status);
    $c = contaDe($a, 'ana');
    igual($v0 + 1, $c['versaoSessao']);
    igual([], $c['aparelhos']);
    igual(false, $ana->get('/api/sessao.php')->json()['autenticado']);
});

// ---- Item 13: login inválido só conta no IP -----------------------------------------------------------

teste('item 13: login fora do regex grava só a chave de IP (nenhuma chave u nem c)', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    foreach (['a b', 'x', "x\0y", str_repeat('z', 80)] as $i => $ruim) {
        igual(0, d26_limite_reservar($priv, $ruim, '192.0.2.1', 1000 + $i));
    }
    $d = json_decode((string) file_get_contents($priv . '/tentativas.json'), true);
    igual([], $d['u'], 'sem chave usuário+IP');
    igual([], $d['c'], 'sem chave de conta');
    igual(1, count($d['ip']), 'só a de IP');
    apagarArvore($dir);
}, false);
