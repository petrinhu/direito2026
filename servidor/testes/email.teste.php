<?php
declare(strict_types=1);

require_once __DIR__ . '/cli-apoio.php';

/*
 * E-mail na conta (EM-B1). Endereços deste arquivo: só @example.com. O endereço fora da lista do
 * portão é montado em tempo de execução, para o próprio teste não virar violação do portão.
 */

/** sha256 do usuarios.json inteiro: prova de que nada foi gravado. */
function emailHashArquivo(Ambiente $a): string
{
    return hash_file('sha256', $a->priv . '/usuarios.json');
}

/** Conta crua do usuarios.json (leitura de teste), ou null se não existe. @return array<string, mixed>|null */
function emailContaCrua(Ambiente $a, string $login): ?array
{
    foreach ($a->lerUsuarios()['usuarios'] as $c) {
        if ($c['usuario'] === $login) {
            return $c;
        }
    }
    return null;
}

/** E-mail gravado da conta, ou null se a conta não tem o campo. */
function emailDeConta(Ambiente $a, string $login): ?string
{
    $c = emailContaCrua($a, $login);
    return $c !== null && isset($c['email']) ? (string) $c['email'] : null;
}

/** Ação `email` pela API. @param array<string, mixed> $corpo */
function emailPedir(Cliente $c, array $corpo): Resposta
{
    return $c->post('/api/usuarios.php', ['acao' => 'email'] + $corpo);
}

/** Portão de e-mail, rodado sobre uma pasta-repositório. @return array{int, string} [rc, saída] */
function emailRodarPortao(string $raiz): array
{
    $cmd = 'bash ' . escapeshellarg(RAIZ_REPO . '/scripts/verificar-emails.sh') . ' ' . escapeshellarg($raiz) . ' 2>&1';
    exec($cmd, $linhas, $rc);
    return [$rc, implode("\n", $linhas)];
}

teste('e-mail: criar sem e-mail ou com e-mail inválido dá 400 e não altera usuarios.json', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $antes = emailHashArquivo($a);
    $casos = [
        'sem e-mail' => [],
        'sem arroba' => ['email' => 'pessoa.example.com'],
        '255 caracteres' => ['email' => str_repeat('a', 243) . '@example.com'],
        'com espaço' => ['email' => 'pes soa@example.com'],
        'com CR e LF' => ['email' => "pessoa@example.com\r\nBcc: outra@example.com"],
        'fora do ASCII' => ['email' => 'josé@example.com'],
    ];
    foreach ($casos as $nome => $extra) {
        $r = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'pessoa'] + $extra);
        igual(400, $r->status, "criar $nome");
        igual($antes, emailHashArquivo($a), "criar $nome: usuarios.json igual");
    }
});

teste('e-mail: grava em minúsculas e recusa outra conta com o mesmo endereço (409 email-em-uso)', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'Pessoa@Example.com'])->status);
    igual('pessoa@example.com', emailDeConta($a, 'ana'), 'gravado em minúsculas');
    $dup = $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia', 'email' => 'PESSOA@example.com']);
    igual(409, $dup->status, 'mesmo endereço em outra conta');
    igual('email-em-uso', $dup->json()['erro'] ?? null, 'código');
    igual(null, emailContaCrua($a, 'bia'), 'a conta duplicada não foi criada');
});

teste('e-mail: trocar o e-mail de outra conta apaga o convite pendente', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com'])->status);
    verdadeiro(array_key_exists('convite', emailContaCrua($a, 'ana') ?? []), 'a conta criada tem convite pendente');
    igual(200, emailPedir($admin, ['usuario' => 'ana', 'email' => 'nova@example.com'])->status, 'troca pelo painel');
    igual('nova@example.com', emailDeConta($a, 'ana'), 'e-mail trocado');
    verdadeiro(!array_key_exists('convite', emailContaCrua($a, 'ana') ?? []), 'o convite do endereço antigo some');
});

teste('e-mail: a própria conta troca o e-mail só com a senha atual; sem ela ou errada, 403 e nada gravado', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $antes = emailHashArquivo($a);
    $semSenha = emailPedir($admin, ['usuario' => Ambiente::LOGIN_ADMIN, 'email' => 'chefe@example.com']);
    igual(403, $semSenha->status, 'sem senha atual');
    igual($antes, emailHashArquivo($a), 'sem senha atual: nada gravado');
    $errada = emailPedir($admin, ['usuario' => Ambiente::LOGIN_ADMIN, 'email' => 'chefe@example.com', 'senhaAtual' => 'SenhaErrada-123456']);
    igual(403, $errada->status, 'senha atual errada');
    igual($antes, emailHashArquivo($a), 'senha errada: nada gravado');
    $certa = emailPedir($admin, ['usuario' => Ambiente::LOGIN_ADMIN, 'email' => 'chefe@example.com', 'senhaAtual' => Ambiente::SENHA_ADMIN]);
    igual(200, $certa->status, 'com a senha atual certa');
    igual('chefe@example.com', emailDeConta($a, Ambiente::LOGIN_ADMIN), 'trocado');
    igual(409, $admin->post('/api/usuarios.php', ['acao' => 'desativar', 'usuario' => Ambiente::LOGIN_ADMIN])->status, 'outra ação sobre si mesmo segue si-mesmo');
});

teste('e-mail: duas trocas simultâneas do mesmo endereço; a que grava depois dá 409 email-em-uso', function (): void {
    // Dois workers do php -S, e DOIS administradores: sessão única faz o último login de uma conta derrubar a
    // anterior, e a trava de sessão serializaria B atrás de A pausado. Por isso cada pedido tem a sua conta.
    $a = Ambiente::novo(['workers' => 4]);
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com'])->status);
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'bia', 'email' => 'bia@example.com'])->status);
    $a->semearUsuario('outra', 'SenhaOutraAdmin-2026', true, false);
    $outro = $a->entrar('outra', 'SenhaOutraAdmin-2026');
    file_put_contents($a->priv . '/pausa-email-antes-gravar', 'ana');
    $reqA = postSemEsperar($admin, '/api/usuarios.php', ['acao' => 'email', 'usuario' => 'ana', 'email' => 'mesmo@example.com']);
    pausaEsperarChegada($reqA, $a, 'email-antes-gravar');
    $rB = emailPedir($outro, ['usuario' => 'bia', 'email' => 'mesmo@example.com']);
    igual(200, $rB->status, 'B grava primeiro: ' . $rB->corpo);
    pausaSoltar($a, 'email-antes-gravar');
    [$statusA, $jsonA] = postConcluir($reqA);
    igual(409, $statusA, 'A, que gravaria depois, recebe 409');
    igual('email-em-uso', $jsonA['erro'] ?? null, 'código de A');
    igual('mesmo@example.com', emailDeConta($a, 'bia'), 'quem gravou primeiro fica');
    igual('ana@example.com', emailDeConta($a, 'ana'), 'A não gravou');
});

teste('e-mail: e-mail de tipo errado no arquivo dá indisponível (503) e a API não grava', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com'])->status);
    $d = $a->lerUsuarios();
    foreach ($d['usuarios'] as $i => $c) {
        if ($c['usuario'] === 'ana') {
            $d['usuarios'][$i]['email'] = 42;
        }
    }
    file_put_contents($a->priv . '/usuarios.json', json_encode($d, JSON_THROW_ON_ERROR));
    $antes = emailHashArquivo($a);
    igual(503, $admin->get('/api/usuarios.php')->status, 'listagem com tipo errado');
    igual(503, emailPedir($admin, ['usuario' => 'bia', 'email' => 'bia@example.com'])->status, 'troca com tipo errado');
    igual($antes, emailHashArquivo($a), 'nada gravado com tipo errado');
});

teste('e-mail: auditar-contas mostra só se há e-mail, nunca o endereço; excluir apaga o e-mail', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'bia' => ['admin' => false]]);
    d26_contas_mutar($priv, 'bia', static function (array &$c): string {
        $c['email'] = 'bia@example.com';
        return 'ok';
    });
    [$rc, $out, $err] = rodarCliScript('auditar-contas.php', [$priv, '--login=bia'], '');
    igual(0, $rc, "saída: $out $err");
    contem('email_bia=1', $out, 'há e-mail');
    naoContem('bia@example.com', $out . $err, 'o endereço não sai no terminal');
    [$rc2, $out2] = rodarCliScript('auditar-contas.php', [$priv, '--login=petrus'], '');
    igual(0, $rc2);
    contem('email_petrus=0', $out2, 'sem e-mail');
    igual('excluida', d26_contas_excluir($priv, 'bia'), 'excluir');
    naoContem('bia@example.com', (string) file_get_contents($priv . '/usuarios.json'), 'excluir apaga o e-mail');
    apagarArvore($dir);
}, false);

teste('e-mail: redefinir-senha, definir-admin e criar-admin --adicionar preservam o e-mail das outras contas', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false], 'bia' => ['admin' => false]]);
    d26_contas_mutar($priv, 'ana', static function (array &$c): string {
        $c['email'] = 'ana@example.com';
        return 'ok';
    });
    [$rc1] = rodarRedefinir([$priv, 'bia'], "NovaSenhaCli-2026\n");
    igual(0, $rc1, 'redefinir-senha da bia');
    igual('ana@example.com', cliContasPorLogin($priv)['ana']['email'] ?? null, 'redefinir-senha preserva ana');
    [$rc2] = rodarCliScript('definir-admin.php', [$priv, 'bia', '1'], '');
    igual(0, $rc2, 'definir-admin da bia');
    igual('ana@example.com', cliContasPorLogin($priv)['ana']['email'] ?? null, 'definir-admin preserva ana');
    [$rc3] = rodarCliScript('criar-admin.php', [$priv, 'novo.adm', '--adicionar'], "SenhaCliAdmin-2026\n");
    igual(0, $rc3, 'criar-admin --adicionar');
    igual('ana@example.com', cliContasPorLogin($priv)['ana']['email'] ?? null, 'criar-admin preserva ana');
    apagarArvore($dir);
}, false);

teste('e-mail: criar-admin --email grava o e-mail normalizado; inválido é recusado sem ecoar o valor', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    [$rc, $out, $err] = rodarCliScript('criar-admin.php', [$priv, 'chefe2', '--email=Chefe2@Example.com'], "SenhaCliAdmin-2026\n");
    igual(0, $rc, "criar com e-mail: $out $err");
    igual('chefe2@example.com', cliContasPorLogin($priv)['chefe2']['email'] ?? null, 'normalizado');
    $dir2 = dirTemporario();
    $priv2 = $dir2 . '/privado';
    [$rc2, $out2, $err2] = rodarCliScript('criar-admin.php', [$priv2, 'chefe3', '--email=sem-arroba'], "SenhaCliAdmin-2026\n");
    verdadeiro($rc2 !== 0, 'e-mail inválido recusa');
    naoContem('sem-arroba', $out2 . $err2, 'o valor não é ecoado');
    apagarArvore($dir);
    apagarArvore($dir2);
}, false);

teste('e-mail: portão scripts/verificar-emails.sh reprova endereço fora da lista e imprime encontrados/analisados', function (): void {
    $raiz = dirTemporario();
    $repo = $raiz . '/repo';
    mkdir($repo, 0700, true);
    exec('git -C ' . escapeshellarg($repo) . ' init -q 2>&1', $_, $rcInit);
    igual(0, $rcInit, 'git init do repositório de prova');
    file_put_contents($repo . '/ok.txt', "contato@example.com\n");
    file_put_contents($repo . '/fora.txt', 'contato' . '@' . 'exemplo.invalido' . "\n");
    exec('git -C ' . escapeshellarg($repo) . ' add ok.txt fora.txt 2>&1', $_, $rcAdd);
    igual(0, $rcAdd, 'git add da prova');
    [$rc, $out] = emailRodarPortao($repo);
    igual(1, $rc, 'endereço fora da lista reprova');
    contem('encontrados=2', $out, 'imprime encontrados');
    contem('analisados=2', $out, 'imprime analisados');
    contem('falharam=1', $out, 'imprime falharam');
    naoContem('exemplo.invalido', $out, 'o endereço não sai na saída');
    $limpo = $raiz . '/limpo';
    mkdir($limpo, 0700, true);
    exec('git -C ' . escapeshellarg($limpo) . ' init -q 2>&1');
    file_put_contents($limpo . '/ok.txt', "contato@example.com\n");
    exec('git -C ' . escapeshellarg($limpo) . ' add ok.txt 2>&1');
    [$rc2, $out2] = emailRodarPortao($limpo);
    igual(0, $rc2, 'sem endereço fora da lista, passa');
    contem('encontrados=1', $out2);
    contem('analisados=1', $out2);
    apagarArvore($raiz);
}, false);

teste('e-mail: portão de e-mail com zero arquivos rastreados reprova (piso de varredura, L-36)', function (): void {
    $raiz = dirTemporario();
    exec('git -C ' . escapeshellarg($raiz) . ' init -q 2>&1');
    [$rc, $out] = emailRodarPortao($raiz);
    igual(1, $rc, 'zero arquivos é varredura quebrada');
    contem('encontrados=0', $out, 'imprime o zero');
    apagarArvore($raiz);
}, false);

teste('e-mail: portão aceita o domínio em maiúsculas (domínio de e-mail não diferencia caixa)', function (): void {
    $raiz = dirTemporario();
    $repo = $raiz . '/repo';
    mkdir($repo, 0700, true);
    exec('git -C ' . escapeshellarg($repo) . ' init -q 2>&1');
    file_put_contents($repo . '/maiusc.txt', 'contato' . '@Example.com' . "\n");
    exec('git -C ' . escapeshellarg($repo) . ' add maiusc.txt 2>&1');
    [$rc, $out] = emailRodarPortao($repo);
    igual(0, $rc, 'Example.com é example.com');
    contem('falharam=0', $out, 'nenhum falhou');
    apagarArvore($raiz);
}, false);
