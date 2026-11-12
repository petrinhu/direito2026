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

/** A conta como o painel a recebe: a listagem do administrador (campos públicos), ou null se não está nela. @return array<string, mixed>|null */
function emailListada(Ambiente $a, string $login): ?array
{
    foreach ($a->entrar()->get('/api/usuarios.php')->json()['usuarios'] as $c) {
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
        // Entre aspas, filter_var aceita bytes de controle: só o regex do portão os barra (D1 da revisão EM-B1).
        'byte de controle 0x01 entre aspas' => ['email' => "\"a\x01b\"@example.com"],
        'DEL 0x7F entre aspas' => ['email' => "\"a\x7Fb\"@example.com"],
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

teste('e-mail: redefinir-senha, definir-admin, remover-conta e criar-admin --adicionar preservam o e-mail das outras contas', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false], 'bia' => ['admin' => false], 'caro' => ['admin' => false]]);
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
    // remover-conta usa o mesmo apoio/admin.php (D2 da revisão EM-B1): a conta alvo sai, a de ana fica.
    [$rc4, , $err4] = rodarCliScript('remover-conta.php', [$priv, 'caro'], '');
    igual(0, $rc4, "remover-conta da caro: $err4");
    igual('ana@example.com', cliContasPorLogin($priv)['ana']['email'] ?? null, 'remover-conta preserva ana');
    igual(false, array_key_exists('caro', cliContasPorLogin($priv)), 'caro saiu');
    apagarArvore($dir);
}, false);

// D4 da revisão EM-B1: a unicidade do CLI (d26_contas_criar) não tinha teste de duplicado.
teste('e-mail: criar-admin --adicionar com e-mail já usado em outra conta dá recusa e não altera usuarios.json', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'ana' => ['admin' => false]]);
    d26_contas_mutar($priv, 'ana', static function (array &$c): string {
        $c['email'] = 'ana@example.com';
        return 'ok';
    });
    $antes = hash_file('sha256', $priv . '/usuarios.json');
    [$rc, $out, $err] = rodarCliScript('criar-admin.php', [$priv, 'novo.adm', '--adicionar', '--email=ANA@Example.com'], "SenhaCliAdmin-2026\n");
    verdadeiro($rc !== 0, 'e-mail repetido é recusado');
    contem('este e-mail já está em outra conta', $out . $err, 'mensagem de e-mail em uso');
    naoContem('ANA@Example.com', $out . $err, 'o valor não é ecoado');
    igual($antes, hash_file('sha256', $priv . '/usuarios.json'), 'usuarios.json igual');
    igual(null, cliContasPorLogin($priv)['novo.adm'] ?? null, 'a conta nova não foi criada');
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

/*
 * Envio do painel e aviso de senha criada (EM-B3, plano-sessao-unica.md 8.1.4 e 8.1.9). Os textos esperados
 * são LITERAIS deste arquivo, copiados dos textos ratificados pelo líder (R14). Não leem a constante de produção:
 * se a produção mudar um texto, o teste reprova. O SMTP é o falso de apoio/smtpFalso.php, só em 127.0.0.1 (TE2).
 */

const EMB3_SENHA_SMTP = 'SenhaSmtpSintetica-EM-B3-4417';
const EMB3_SENHA_CONTA = 'SenhaContaSintetica-EM-B3-2026';
const EMB3_SENHA_NOVA = 'SenhaDoEmailB3-2026';
const EMB3_ORIGEM = 'https://direito2026.drpetrus.top';

/**
 * Roda $corpo com um SMTP falso ligado ao php -S pelo ambiente. Sobe o falso ANTES do Ambiente (a porta vai na
 * variável), grava o smtp.senha sintético em modo 600 e, ao fim, desliga a variável e fecha o falso, mesmo com falha.
 *
 * @param array<string, mixed> $roteiro
 * @param callable(Ambiente, array): void $corpo
 * @param array{workers?:int} $opcoes repassadas a Ambiente::novo (corrida precisa de mais de um worker)
 */
function emailB3Com(array $roteiro, callable $corpo, array $opcoes = []): void
{
    $falso = correioSmtpFalso($roteiro);
    putenv('D26_SMTP_TESTE=tcp://127.0.0.1:' . $falso['porta']);
    try {
        $a = Ambiente::novo($opcoes);
        file_put_contents($a->priv . '/smtp.senha', EMB3_SENHA_SMTP);
        chmod($a->priv . '/smtp.senha', 0600);
        file_put_contents($a->priv . '/smtp.usuario', CORREIO_LOGIN_SINTETICO);
        chmod($a->priv . '/smtp.usuario', 0600);
        $corpo($a, $falso);
    } finally {
        putenv('D26_SMTP_TESTE=');
        correioFecharSmtpFalso($falso);
    }
}

/**
 * Conta com e-mail (ou sem, se $email for null) e campos extras, editada no usuarios.json (fixture de teste).
 *
 * @param array<string, mixed> $extras
 */
function emailB3Semear(Ambiente $a, string $login, ?string $email, array $extras = []): void
{
    $a->semearUsuario($login, EMB3_SENHA_CONTA, false, false);
    $arq = $a->priv . '/usuarios.json';
    $d = json_decode((string) file_get_contents($arq), true, 512, JSON_THROW_ON_ERROR);
    foreach ($d['usuarios'] as $i => $c) {
        if (($c['usuario'] ?? null) === $login) {
            if ($email !== null) {
                $c['email'] = $email;
            }
            $d['usuarios'][$i] = array_merge($c, $extras);
        }
    }
    file_put_contents($arq, json_encode($d, JSON_THROW_ON_ERROR));
}

/** Conta com convite pendente de 48 h, com o e-mail dado. Devolve o token do link (64 hex). */
function emailB3SemearConvite(Ambiente $a, string $login, ?string $email): string
{
    $token = bin2hex(random_bytes(32));
    emailB3Semear($a, $login, $email, ['convite' => ['hash' => hash('sha256', $token), 'expiraEm' => time() + 172800]]);
    return $token;
}

/**
 * Mensagem que o falso gravou no DATA: cabeçalhos (De, Assunto em encoded-word, Para) e corpo decodificados
 * (quoted-printable, TE5). Sem o CRLF final que o MIME acrescenta. Falha se não houver mensagem.
 *
 * @return array{de: string, assunto: string, corpo: string}
 */
/**
 * Valor do Subject com SÓ encoded-words UTF-8 B, separadas por CRLF e espaço (dobra RFC 5322). Texto solto entre elas,
 * ou fora delas, reprova (BL-B2, A5): o decodificador não pode ignorar o que não é encoded-word.
 */
function emailB3SubjectEstrito(string $valor): bool
{
    return preg_match('/^=\?UTF-8\?B\?[A-Za-z0-9+\/=]+\?=(?:\r\n =\?UTF-8\?B\?[A-Za-z0-9+\/=]+\?=)*$/', $valor) === 1;
}

function emailB3Mensagem(?string $conversa): array
{
    verdadeiro($conversa !== null, 'o SMTP falso recebeu a conexão e gravou a conversa');
    $inicio = strpos($conversa, 'Date: ');
    verdadeiro($inicio !== false, 'a mensagem tem o cabeçalho Date');
    $mensagem = substr($conversa, $inicio);
    $separador = strpos($mensagem, "\r\n\r\n");
    verdadeiro($separador !== false, 'linha em branco entre cabeçalhos e corpo');
    $cabecalhos = substr($mensagem, 0, $separador);
    $resto = substr($mensagem, $separador + 4);
    $fimDoCorpo = strpos($resto, "\r\n.\r\n");
    verdadeiro($fimDoCorpo !== false, 'a mensagem fecha com o ponto do DATA');
    // Transparência SMTP (RFC 5321, 4.5.2): a linha que começa com ponto saiu como ".."; desfaz antes do quoted-printable.
    $codificado = preg_replace('/^\.\./m', '.', substr($resto, 0, $fimDoCorpo + 2));
    preg_match('/^From: (.*)\r$/m', $cabecalhos, $de) === 1 || falhar('cabeçalho From ausente');
    // Assunto dobrado (BL-B2): uma ou mais encoded-words, separadas por CRLF e espaço; juntas dão o assunto.
    preg_match('/^Subject: ((?:[^\r\n]|\r\n )*)\r$/m', $cabecalhos, $assunto) === 1 || falhar('Subject ausente');
    emailB3SubjectEstrito($assunto[1]) || falhar('Subject com texto fora das encoded-words (só encoded-word UTF-8 B, separada por CRLF e espaço)');
    preg_match_all('/=\?UTF-8\?B\?([A-Za-z0-9+\/=]+)\?=/', $assunto[1], $palavras);
    $textoAssunto = '';
    foreach ($palavras[1] as $palavra) {
        $parte = base64_decode($palavra, true);
        $parte !== false || falhar('encoded-word do Subject inválida');
        $textoAssunto .= $parte;
    }
    $corpo = quoted_printable_decode($codificado);
    $corpo = str_replace("\r\n", "\n", $corpo);
    if (str_ends_with($corpo, "\n")) {
        $corpo = substr($corpo, 0, -1);
    }
    return ['de' => $de[1], 'assunto' => $textoAssunto, 'corpo' => $corpo];
}

teste('e-mail: decodificador do Subject recusa texto solto entre encoded-words (A5, BL-B2)', function (): void {
    $palavra = static fn (string $texto): string => '=?UTF-8?B?' . base64_encode($texto) . '?=';
    $montar = static fn (string $assunto): string => "Date: Tue, 10 Nov 2026 14:00:00 +0000\r\nFrom: nao-responda@example.com\r\n"
        . "To: aviso@example.com\r\nSubject: $assunto\r\nMessage-ID: <x@example.com>\r\nMIME-Version: 1.0\r\n\r\ncorpo\r\n.\r\n";
    igual('Conta ana', emailB3Mensagem($montar($palavra('Conta ana')))['assunto'], 'controle: uma encoded-word passa');
    igual('Conta ana', emailB3Mensagem($montar($palavra('Conta ') . "\r\n " . $palavra('ana')))['assunto'], 'controle: duas encoded-words dobradas passam');
    $recusou = false;
    try {
        emailB3Mensagem($montar($palavra('Conta ') . ' solto ' . $palavra('ana')));
    } catch (RuntimeException $e) {
        $recusou = str_contains($e->getMessage(), 'Subject');
    }
    verdadeiro($recusou, 'texto solto entre encoded-words é recusado no Subject, não ignorado');
});

/** Endereço do RCPT TO da conversa. */
function emailB3Destinatario(string $conversa): string
{
    preg_match('/^RCPT TO:<([^>]*)>\r$/m', $conversa, $m) === 1 || falhar('RCPT TO ausente na conversa');
    return $m[1];
}

/** Texto ratificado do E1 (convite), byte a byte, com o login e o link preenchidos. */
function emailB3CorpoConvite(string $login, string $link): string
{
    return "Olá.\n\n"
        . "Foi criado um acesso para você, com o usuário {$login}.\n\n"
        . "Para criar a sua senha, abra o link abaixo. Ele vale por 48 horas e só pode ser usado uma vez.\n"
        . "{$link}\n\n"
        . "Se você não esperava esta mensagem, pode ignorá-la.\n\n"
        . "Seu e-mail fica guardado só para enviar links de acesso como este e é apagado quando a conta é excluída. Esta caixa não recebe respostas.";
}

/** Texto ratificado do E3 (redefinir), byte a byte. */
function emailB3CorpoRedefinicao(string $login, string $link): string
{
    return "Olá.\n\n"
        . "Quem administra o site redefiniu a senha do usuário {$login}. A senha antiga parou de valer.\n\n"
        . "Para criar a senha nova, abra o link abaixo. Ele vale por 48 horas e só pode ser usado uma vez.\n"
        . "{$link}\n\n"
        . "Esta caixa não recebe respostas.";
}

/** Texto ratificado do E4 (senha criada), byte a byte. */
function emailB3CorpoSenhaCriada(string $login): string
{
    return "Olá.\n\n"
        . "A senha do usuário {$login} acabou de ser criada pelo link enviado a este e-mail.\n\n"
        . "Se não foi você, avise quem administra o site. Esta caixa não recebe respostas.";
}

/** Criar pela API de admin. @param array<string, mixed> $corpo */
function emailB3Criar(Ambiente $a, string $login, string $email): Resposta
{
    return $a->entrar()->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => $login, 'email' => $email]);
}

teste('e-mail: E20t criar envia E1 ao endereço informado, com o link da resposta e "email": "enviado"', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        $r = emailB3Criar($a, 'ana', 'ana@example.com');
        igual(200, $r->status, 'criar: ' . $r->corpo);
        igual('enviado', $r->json()['email'] ?? null, 'a resposta diz enviado');
        $conversa = correioConversaFinal($falso);
        $m = emailB3Mensagem($conversa);
        igual('ana@example.com', emailB3Destinatario((string) $conversa), 'destinatário');
        igual('nao-responda@drpetrus.top', $m['de'], 'remetente exato');
        igual('Crie a sua senha de acesso', $m['assunto'], 'assunto');
        igual(emailB3CorpoConvite('ana', EMB3_ORIGEM . $r->json()['convite']), $m['corpo'], 'corpo igual ao ratificado, com o link da resposta');
    });
});

teste('e-mail: E21t criar com o SMTP recusando (550): conta criada, convite válido, "email": "falhou", envioFalhouEm e erros.log só com etapa e código', function (): void {
    emailB3Com(['rcpt' => ['550 caixa de destino recusada']], function (Ambiente $a): void {
        $r = emailB3Criar($a, 'ana', 'ana@example.com');
        igual(200, $r->status, 'criar mesmo com o e-mail falhando');
        igual('falhou', $r->json()['email'] ?? null, 'a resposta diz falhou');
        $token = conviteTokenDe($r);
        $c = emailContaCrua($a, 'ana');
        igual('ana@example.com', $c['email'] ?? null, 'a conta foi criada com o e-mail');
        verdadeiro(is_string($c['envioFalhouEm'] ?? null), 'envioFalhouEm gravado');
        igual($c['envioFalhouEm'], emailListada($a, 'ana')['envioFalhouEm'] ?? null, 'a listagem do administrador devolve a marca da falha (EM-F1-ENVIOFALHOU)');
        igual(hash('sha256', $token), $c['convite']['hash'] ?? null, 'o convite continua válido');
        $log = (string) @file_get_contents($a->priv . '/erros.log');
        contem('envio etapa=destinatario codigo=550', $log, 'a etapa e o código no erros.log');
        naoContem('ana@example.com', $log, 'o endereço não vai ao log');
        naoContem($token, $log, 'o token não vai ao log');
        naoContem('caixa de destino', $log, 'o texto do servidor não vai ao log');
    });
});

teste('e-mail: E22t redefinir envia E3 quando a conta tem e-mail; sem e-mail, "sem-email" e nenhuma conexão', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $r = $a->entrar()->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana']);
        igual(200, $r->status, 'redefinir: ' . $r->corpo);
        igual('enviado', $r->json()['email'] ?? null, 'a resposta diz enviado');
        $m = emailB3Mensagem(correioConversaFinal($falso));
        igual('Sua senha foi redefinida', $m['assunto'], 'assunto do E3');
        igual(emailB3CorpoRedefinicao('ana', EMB3_ORIGEM . $r->json()['convite']), $m['corpo'], 'corpo do E3 igual ao ratificado');
    });
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'sem.email', null);
        $r = $a->entrar()->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'sem.email']);
        igual(200, $r->status, 'redefinir sem e-mail');
        igual('sem-email', $r->json()['email'] ?? null, 'a resposta diz sem-email');
        verdadeiro(is_string($r->json()['convite'] ?? null), 'o link continua na resposta, para copiar');
        igual(false, is_file($falso['conversa']), 'nenhuma conexão com o SMTP');
    });
});

teste('e-mail: E23t senha criada pelo link envia E4 depois do 303; sem e-mail, nenhuma conexão; falha do E4 não muda o 303 nem a sessão', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        // O aviso sai depois de terminar a resposta: uma pausa logo depois do término segura a conexão ao SMTP.
        $token = emailB3SemearConvite($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
        verdadeiro($csrf !== '', 'a página traz o CSRF');
        file_put_contents($a->priv . '/pausa-senha-criada-antes-aviso', '*');
        $req = cvb2PostSemEsperar($c, cvb2Campos($token, $csrf, EMB3_SENHA_NOVA));
        pausaEsperarChegada($req, $a, 'senha-criada-antes-aviso');
        igual(false, is_file($falso['conversa']), 'parado na pausa, nenhuma conexão: o E4 ainda não saiu');
        pausaSoltar($a, 'senha-criada-antes-aviso');
        $r = cvb2ConcluirPost($req);
        igual(303, $r->status, 'o 303 sai');
        $m = emailB3Mensagem(correioConversaFinal($falso));
        igual('Sua senha foi criada', $m['assunto'], 'assunto do E4');
        igual(emailB3CorpoSenhaCriada('ana'), $m['corpo'], 'corpo do E4 igual ao ratificado');
    });
    emailB3Com([], function (Ambiente $a, array $falso): void {
        $token = emailB3SemearConvite($a, 'sem.email', null);
        $c = $a->cliente();
        $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
        igual(303, cvb2Enviar($c, cvb2Campos($token, $csrf, EMB3_SENHA_NOVA))->status, 'criou a senha');
        igual(false, is_file($falso['conversa']), 'conta sem e-mail: nenhuma conexão');
    });
    emailB3Com(['rcpt' => ['550 caixa de destino recusada']], function (Ambiente $a): void {
        $token = emailB3SemearConvite($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
        $r = cvb2Enviar($c, cvb2Campos($token, $csrf, EMB3_SENHA_NOVA));
        igual(303, $r->status, 'a falha do E4 não muda o 303');
        igual('/', $r->cabecalho('location'), 'destino continua /');
        igual('ana', $c->get('/api/sessao.php')->json()['usuario'] ?? null, 'a sessão é da conta');
        contem('envio etapa=destinatario codigo=550', (string) @file_get_contents($a->priv . '/erros.log'), 'a falha fica no erros.log');
    });
});

teste('e-mail: E24t envio bem-sucedido depois de uma falha apaga envioFalhouEm', function (): void {
    // A falha anterior é a precondição gravada na conta; a falha em si é coberta pelo E21t.
    emailB3Com([], function (Ambiente $a): void {
        emailB3Semear($a, 'ana', 'ana@example.com', ['envioFalhouEm' => '2026-11-08T10:00:00+00:00']);
        igual('2026-11-08T10:00:00+00:00', emailListada($a, 'ana')['envioFalhouEm'] ?? null, 'antes do envio, a listagem devolve a marca gravada (EM-F1-ENVIOFALHOU)');
        $r = $a->entrar()->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana']);
        igual('enviado', $r->json()['email'] ?? null, 'o envio deu certo');
        verdadeiro(!array_key_exists('envioFalhouEm', emailContaCrua($a, 'ana') ?? []), 'envioFalhouEm foi apagado');
        $lista = emailListada($a, 'ana') ?? [];
        verdadeiro(array_key_exists('envioFalhouEm', $lista) && $lista['envioFalhouEm'] === null, 'depois do envio que deu certo, a listagem devolve envioFalhouEm null (EM-F1-ENVIOFALHOU)');
    });
});

teste('e-mail: E25t token e endereço gerados na suíte não aparecem em erros.log, tentativas.json nem sessoes/ (C10)', function (): void {
    $tokens = [];
    $privs = [];
    emailB3Com(['rcpt' => ['550 caixa de destino recusada']], function (Ambiente $a) use (&$tokens, &$privs): void {
        $r = emailB3Criar($a, 'ana', 'ana@example.com');
        igual('falhou', $r->json()['email'] ?? null, 'envio que falha');
        $tokens[] = conviteTokenDe($r);
        $privs[] = $a->priv;
        contem('envio etapa=', (string) @file_get_contents($a->priv . '/erros.log'), 'piso: o erros.log tem a linha de etapa');
    });
    emailB3Com([], function (Ambiente $a, array $falso) use (&$tokens, &$privs): void {
        $r = emailB3Criar($a, 'bia', 'bia@example.com');
        igual('enviado', $r->json()['email'] ?? null, 'envio que chega');
        $tokens[] = conviteTokenDe($r);
        $privs[] = $a->priv;
        emailB3Mensagem(correioConversaFinal($falso));
    });
    // O e-mail mora em usuarios.json (8.1.1), por desenho; o C10 cobre só os lugares de registro e de sessão.
    $arquivos = 0;
    foreach ($privs as $priv) {
        foreach (conviteArquivosDo($priv) as $arq) {
            $lugarDeRegistro = in_array(basename($arq), ['erros.log', 'tentativas.json'], true) || str_contains($arq, '/sessoes/');
            if (!$lugarDeRegistro) {
                continue;
            }
            $arquivos++;
            $texto = (string) file_get_contents($arq);
            foreach ($tokens as $token) {
                naoContem($token, $texto, basename($arq) . ': token');
            }
            naoContem('ana@example.com', $texto, basename($arq) . ': endereço');
            naoContem('bia@example.com', $texto, basename($arq) . ': endereço');
        }
    }
    verdadeiro($arquivos > 0, 'piso: a varredura leu arquivos do privado');
});

teste('e-mail: EM-B3 envioFalhouEm de tipo errado no arquivo dá indisponível (503) e nada é gravado', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    emailB3Semear($a, 'ana', 'ana@example.com', ['envioFalhouEm' => 42]);
    $antes = emailHashArquivo($a);
    igual(503, $admin->get('/api/usuarios.php')->status, 'listagem com envioFalhouEm de tipo errado');
    igual(503, $admin->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana'])->status, 'redefinir com o mesmo arquivo');
    igual($antes, emailHashArquivo($a), 'nada gravado');
});

teste('e-mail: EM-B3 sem término de resposta do servidor, o aviso E4 registra envio-sincrono no erros.log (uma linha)', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        $token = emailB3SemearConvite($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(cvb2Pagina($c, $token)->corpo, 'csrf');
        igual(303, cvb2Enviar($c, cvb2Campos($token, $csrf, EMB3_SENHA_NOVA))->status, 'criou a senha');
        emailB3Mensagem(correioConversaFinal($falso));
        $log = (string) @file_get_contents($a->priv . '/erros.log');
        igual(1, substr_count($log, 'envio envio-sincrono'), 'uma linha envio-sincrono por aviso');
    });
});

teste('e-mail: corrida P9: o E3 do redefinir vai ao endereço que a conta tinha no lock, mesmo se outro admin trocar o e-mail na janela', function (): void {
    // Janela do bug: o redefinir solta o lock, e a leitura do e-mail vinha depois, fora dele. Por isso o pedido de
    // redefinir pausa DEPOIS do agir e ANTES do envio; o outro admin troca o e-mail nesse intervalo.
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $admin = $a->entrar();
        $a->semearUsuario('outra', 'SenhaOutraAdmin-2026', true, false);
        $outro = $a->entrar('outra', 'SenhaOutraAdmin-2026');
        file_put_contents($a->priv . '/pausa-redefinir-antes-enviar', 'ana');
        $reqA = postSemEsperar($admin, '/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana']);
        pausaEsperarChegada($reqA, $a, 'redefinir-antes-enviar');
        $rB = emailPedir($outro, ['usuario' => 'ana', 'email' => 'nova@example.com']);
        igual(200, $rB->status, 'a troca de e-mail na janela: ' . $rB->corpo);
        pausaSoltar($a, 'redefinir-antes-enviar');
        [$statusA, $jsonA] = postConcluir($reqA);
        igual(200, $statusA, 'redefinir de A');
        igual('enviado', $jsonA['email'] ?? null, 'a resposta diz enviado');
        igual('ana@example.com', emailB3Destinatario((string) correioConversaFinal($falso)), 'o E3 vai ao endereço do lock, não ao endereço trocado na janela');
        igual('nova@example.com', emailDeConta($a, 'ana'), 'a troca de B ficou gravada');
    }, ['workers' => 4]);
});

// ---- EM-B4: "Esqueci a senha" por e-mail (plano 8.1.3, 8.1.7; OS EM-B4) ----

const EMB4_FRASE = 'Se houver uma conta com esse usuário ou e-mail, o link para criar a senha nova chega ao e-mail dela em alguns minutos. Confira também a pasta de spam.';
const EMB4_ERRO_VAZIO = 'Escreva o seu usuário ou e-mail.';

/** Carrega os módulos do pedido (sem executar nenhum endpoint). */
function emb4Carregar(): void
{
    if (!defined('D26_API')) {
        define('D26_API', true);
    }
    foreach (['config', 'armazenamento', 'respostas', 'contas', 'limite', 'telas', 'correio', 'esqueci'] as $m) {
        require_once RAIZ_REPO . '/public/api/nucleo/' . $m . '.php';
    }
}

/** GET da página, como a navegação faz. */
function emb4Pagina(Cliente $c): Resposta
{
    return $c->get('/api/esqueci.php', PORTAO_NAVEGACAO);
}

/** POST de formulário, como o navegador envia a página (sem JSON e sem X-CSRF-Token). @param mixed $usuario string ou lista */
function emb4Enviar(Cliente $c, string $csrf, mixed $usuario, array $cabecalhos = []): Resposta
{
    return $c->enviar('POST', '/api/esqueci.php', http_build_query(['usuario' => $usuario, 'csrf' => $csrf]), [
        'Content-Type' => 'application/x-www-form-urlencoded',
        'X-CSRF-Token' => null,
    ] + $cabecalhos);
}

/** Mesmo POST, com o IP de origem amarrado (127.0.0.x é loopback): devolve só o status. */
function emb4PostDeIp(Cliente $c, string $ip, string $csrf, string $usuario): int
{
    $pares = [];
    foreach ($c->cookies as $n => $v) {
        $pares[] = "$n=$v";
    }
    $ctx = stream_context_create(['socket' => ['bindto' => $ip . ':0'], 'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\nOrigin: " . $c->origem() . "\r\nCookie: " . implode('; ', $pares),
        'content' => http_build_query(['usuario' => $usuario, 'csrf' => $csrf]),
        'ignore_errors' => true,
        'timeout' => 30,
    ]]);
    $http_response_header = [];
    @file_get_contents($c->origem() . '/api/esqueci.php', false, $ctx);
    return (int) preg_replace('#^HTTP/\S+ (\d{3}).*#', '$1', (string) ($http_response_header[0] ?? ''));
}

/** Link de criar senha que o E2 carrega (o único link do corpo). */
function emb4Link(?string $conversa): string
{
    $m = emailB3Mensagem($conversa);
    preg_match('#https://direito2026\.drpetrus\.top/api/convite\.php\?t=[0-9a-f]{64}#', $m['corpo'], $x) === 1 || falhar('o E2 traz o link de criar senha');
    return $x[0];
}

/** Caminho + query de um link absoluto (o teste abre o link pelo servidor local). */
function emb4Caminho(string $link): string
{
    return (string) parse_url($link, PHP_URL_PATH) . '?' . (string) parse_url($link, PHP_URL_QUERY);
}

/** Linhas do erros.log que registram tentativa de envio (etapa=...): sobe quando algum envio tenta conectar. */
function emb4LinhasEnvio(Ambiente $a): int
{
    return substr_count((string) @file_get_contents($a->priv . '/erros.log'), 'envio etapa=');
}

/**
 * Resposta sem o que muda entre pedidos sem ser o pedido: Date (relógio) e host (porta do processo de teste, que
 * troca a cada Ambiente). @return array<string, mixed>
 */
function emb4SemData(Resposta $r): array
{
    $c = $r->cabecalhos;
    unset($c['date'], $c['host']);
    return ['status' => $r->status, 'cabecalhos' => $c, 'corpo' => $r->corpo];
}

teste('e-mail: E26t a tela de entrada tem o link "Esqueci a senha"; M1 e M3 também; M2 não', function (): void {
    emailB3Com([], function (Ambiente $a): void {
        $entrada = $a->cliente()->get('/', PORTAO_NAVEGACAO);
        igual(200, $entrada->status, 'tela de entrada');
        contem('<a href="/api/esqueci.php">Esqueci a senha</a>', $entrada->corpo, 'link na entrada');
        $vencido = bin2hex(random_bytes(32));
        emailB3Semear($a, 'ana', 'ana@example.com', ['convite' => ['hash' => hash('sha256', $vencido), 'expiraEm' => time() - 60]]);
        $m1 = $a->cliente()->get('/api/convite.php?t=' . $vencido, PORTAO_NAVEGACAO);
        cvb2Mensagem($m1, 410, CVB2_M1);
        contem('<a href="/api/esqueci.php">Esqueci a senha</a>', $m1->corpo, 'M1 tem o link');
        $m3 = $a->cliente()->get('/api/convite.php?t=' . bin2hex(random_bytes(32)), PORTAO_NAVEGACAO);
        cvb2Mensagem($m3, 404, CVB2_M3);
        contem('<a href="/api/esqueci.php">Esqueci a senha</a>', $m3->corpo, 'M3 tem o link');
        $usado = cvb2Convidar($a, 'bia');
        $c = $a->cliente();
        $csrf = cvb2Campo(cvb2Pagina($c, $usado)->corpo, 'csrf');
        igual(303, cvb2Enviar($c, cvb2Campos($usado, $csrf, EMB3_SENHA_NOVA))->status, 'consome o link');
        $m2 = cvb2Pagina($a->cliente(), $usado);
        cvb2Mensagem($m2, 410, CVB2_M2);
        naoContem('esqueci.php', $m2->corpo, 'M2 sem o link');
    });
});

teste('e-mail: E27t GET de esqueci.php: 200, CSP da tela, private no-store, zero script, campo com autocomplete e CSRF', function (): void {
    emailB3Com([], function (Ambiente $a): void {
        $r = emb4Pagina($a->cliente());
        igual(200, $r->status, 'GET');
        igual(PORTAO_CSP_TELA, $r->cabecalho('content-security-policy'), 'CSP da tela');
        igual('private, no-store', $r->cabecalho('cache-control'), 'cache');
        naoContem('<script', $r->corpo, 'sem script');
        naoContem('id="app"', $r->corpo, 'nenhum byte do app');
        contem('autocomplete="username"', $r->corpo, 'campo usuário');
        verdadeiro(cvb2Campo($r->corpo, 'csrf') !== '', 'CSRF no formulário');
        contem('<h1>Esqueci a senha</h1>', $r->corpo, 'título');
        contem('>Enviar link<', $r->corpo, 'botão');
        contem('>Voltar para a entrada<', $r->corpo, 'volta à entrada');
    });
});

teste('e-mail: E28t conta existente com e-mail, login inexistente, e-mail inexistente, conta desativada e conta sem e-mail: resposta igual; só a primeira manda E2', function (): void {
    $semear = static function (Ambiente $a): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        emailB3Semear($a, 'desativada', 'desativada@example.com', ['ativo' => false]);
        emailB3Semear($a, 'sem.email', null);
    };
    $primeira = null;
    emailB3Com([], function (Ambiente $a, array $falso) use ($semear, &$primeira): void {
        $semear($a);
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        $primeira = emb4Enviar($c, $csrf, 'ana');
        igual(200, $primeira->status, 'login existente com e-mail');
        $m = emailB3Mensagem(correioConversaFinal($falso));
        igual('ana@example.com', emailB3Destinatario((string) correioConversaFinal($falso)), 'E2 vai ao e-mail da conta');
        igual('Link para criar uma senha nova', $m['assunto'], 'assunto do E2');
        contem(EMB4_FRASE, $primeira->corpo, 'frase única na resposta');
    });
    $demais = [];
    emailB3Com([], function (Ambiente $a, array $falso) use ($semear, &$demais): void {
        $semear($a);
        foreach (['nao-existe', 'naoexiste@example.com', 'desativada', 'sem.email'] as $pedido) {
            $c = $a->cliente();
            $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
            $demais[$pedido] = emb4Enviar($c, $csrf, $pedido);
        }
        igual(null, correioConversaFinal($falso, 1.0), 'nenhum dos quatro manda E2');
    });
    foreach ($demais as $pedido => $r) {
        igual(emb4SemData($primeira), emb4SemData($r), "a resposta de '$pedido' é igual, byte a byte, à de conta existente");
    }
});

teste('e-mail: E29t o pedido não muda hash, versaoSessao, aparelhos nem sessão; o link de E2 abre o convite e a senha nova entra', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $a->entrar('ana', EMB3_SENHA_CONTA);
        $antes = emailContaCrua($a, 'ana');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        igual(200, emb4Enviar($c, $csrf, 'ana')->status, 'pedido');
        $depois = emailContaCrua($a, 'ana');
        foreach (['hash', 'versaoSessao', 'aparelhos', 'sessaoVigente', 'uid', 'deveTrocarSenha'] as $campo) {
            igual($antes[$campo] ?? null, $depois[$campo] ?? null, "o pedido não muda $campo");
        }
        $link = emb4Link(correioConversaFinal($falso));
        $cp = $a->cliente();
        $pagina = $cp->get(emb4Caminho($link), PORTAO_NAVEGACAO);
        igual(200, $pagina->status, 'o link de E2 abre a página do convite');
        $token = cvb2Campo($pagina->corpo, 't');
        igual(303, cvb2Enviar($cp, cvb2Campos($token, cvb2Campo($pagina->corpo, 'csrf'), EMB3_SENHA_NOVA))->status, 'cria a senha nova');
        $entrou = $a->entrar('ana', EMB3_SENHA_NOVA);
        verdadeiro($entrou instanceof Cliente, 'a senha nova entra');
    });
});

teste('e-mail: E30t ordem: responde antes de qualquer leitura de usuarios.json, com terminador e busca injetados', function (): void {
    emb4Carregar();
    $dir = dirTemporario();
    $ordem = [];
    d26_esqueci_sequencia($dir, static function () use (&$ordem): void { $ordem[] = 'resposta'; },
        static function () use (&$ordem): bool { $ordem[] = 'terminar'; return true; },
        static function () use (&$ordem): void { $ordem[] = 'buscar'; });
    igual(['resposta', 'terminar', 'buscar'], $ordem, 'a ordem é responde, termina, busca');
    // Busca que lança: a resposta já saiu (o teste não vê exceção) e a falha vai só ao log, pela classe.
    $ordem = [];
    d26_esqueci_sequencia($dir, static function () use (&$ordem): void { $ordem[] = 'resposta'; },
        static function () use (&$ordem): bool { $ordem[] = 'terminar'; return true; },
        static function (): void { throw new RuntimeException('segredo-do-pedido-EM-B4'); });
    igual(['resposta', 'terminar'], $ordem, 'exceção na busca não muda a ordem');
    $log = (string) @file_get_contents($dir . '/erros.log');
    contem('RuntimeException', $log, 'o log traz a classe');
    naoContem('segredo-do-pedido-EM-B4', $log, 'o log não traz a mensagem');
});

teste('e-mail: E31t limite por IP: 11º em 15 min dá 429 e outro IP segue 200; limite por conta: o 2º em 15 min não envia e responde igual', function (): void {
    emailB3Com([], function (Ambiente $a): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        for ($i = 1; $i <= 10; $i++) {
            igual(200, emb4Enviar($c, $csrf, 'ana')->status, "pedido $i do IP");
        }
        $r11 = emb4Enviar($c, $csrf, 'ana');
        igual(429, $r11->status, 'o 11º do IP dá 429');
        contem('Aguarde', $r11->corpo, 'frase de espera');
        igual(200, emb4PostDeIp($c, '127.0.0.2', $csrf, 'ana'), 'outro IP segue 200');
    });
    // SMTP falso com duas conversas (EM-B4, S47): a 1ª é o E2 do pedido 1; uma 2ª só existe se o pedido 2 enviar.
    // A resposta sai antes do envio (esqueci.php dá flush), então cada pedido espera o sinal do próprio fim.
    emailB3Com(['conversas' => 2], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        $r1 = emb4Enviar($c, $csrf, 'ana');
        contem(EMB4_FRASE, $r1->corpo, 'frase única na resposta do 1º');
        pausaEsperarSinal($a, 'esqueci-fim');
        verdadeiro(is_file($falso['conversa'] . '.1'), 'controle: o 1º pedido abriu a 1ª conversa com o SMTP falso');
        @unlink($a->priv . '/sinal-esqueci-fim');
        $antes = emb4LinhasEnvio($a);
        $r2 = emb4Enviar($c, $csrf, 'ana');
        igual(emb4SemData($r1), emb4SemData($r2), 'o 2º pedido responde igual ao 1º');
        pausaEsperarSinal($a, 'esqueci-fim');
        igual(false, is_file($falso['conversa'] . '.2'), 'o 2º pedido não enviou: nenhuma 2ª conversa chegou ao SMTP falso (limite por conta)');
        igual($antes, emb4LinhasEnvio($a), 'o 2º pedido não tenta enviar');
    });
});

teste('e-mail: E31t teto diário: o 61º pedido não envia, responde igual e grava envio-teto', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        // Chave do teto em limite.php (d26_limite_chave_envio('teto')): sha256 de "eteto" + NUL + vazio.
        $chaveTeto = hash('sha256', "eteto\0");
        file_put_contents($a->priv . '/tentativas.json', json_encode(['u' => [], 'ip' => [], 'c' => [], 'e' => [$chaveTeto => ['f' => array_fill(0, 60, time() - 10)]]], JSON_THROW_ON_ERROR));
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        $r = emb4Enviar($c, $csrf, 'ana');
        igual(200, $r->status, 'o 61º responde 200');
        contem(EMB4_FRASE, $r->corpo, 'a mesma frase');
        igual(null, correioConversaFinal($falso, 1.0), 'o 61º não envia');
        contem('envio-teto', (string) @file_get_contents($a->priv . '/erros.log'), 'linha envio-teto');
    });
});

teste('e-mail: E32t POST sem cookie pré, com Origin de outro site, ou com corpo JSON: 403 ou 400, nada enviado', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        igual(403, emb4Enviar($a->cliente(), $csrf, 'ana')->status, 'sem cookie pré');
        igual(403, emb4Enviar($c, $csrf, 'ana', ['Origin' => 'https://outro.example'])->status, 'Origin de outro site');
        igual(400, $c->post('/api/esqueci.php', ['usuario' => 'ana'])->status, 'corpo JSON');
        igual(null, correioConversaFinal($falso, 1.0), 'nada enviado');
    });
});

teste('e-mail: E33t corpo vazio dá 400 com a frase de erro; texto longo, lista e CRLF dão a frase única ou 400, sem exceção, e o texto não vai ao erros.log', function (): void {
    emailB3Com([], function (Ambiente $a): void {
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        $vazio = emb4Enviar($c, $csrf, '');
        igual(400, $vazio->status, 'corpo vazio');
        contem(EMB4_ERRO_VAZIO, $vazio->corpo, 'frase de erro');
        $longo = 'Texto-Secreto-EM-B4-' . str_repeat('y', 240);
        $crlf = "Texto-Secreto-EM-B4\r\nana@example.com";
        foreach ([$longo, $crlf, ['Texto-Secreto-EM-B4-lista']] as $caso) {
            $r = emb4Enviar($c, $csrf, $caso);
            verdadeiro(in_array($r->status, [200, 400], true), 'a resposta é 200 ou 400, nunca 500');
            if ($r->status === 200) {
                contem(EMB4_FRASE, $r->corpo, 'a frase única');
            }
        }
        $log = (string) @file_get_contents($a->priv . '/erros.log');
        naoContem('Texto-Secreto-EM-B4', $log, 'o texto digitado não vai ao erros.log');
    });
});

teste('e-mail: E34t o pedido substitui o convite pendente que o admin gerou: o link antigo dá M3', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        // Convite do admin sem E1: cvb2Convidar mandaria o E1 pelo mesmo SMTP falso e o teste leria o link errado.
        $antigo = emailB3SemearConvite($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        igual(200, emb4Enviar($c, $csrf, 'ana')->status, 'pedido');
        $novo = substr(emb4Caminho(emb4Link(correioConversaFinal($falso))), strlen('/api/convite.php?t='));
        cvb2Mensagem(cvb2Pagina($a->cliente(), $antigo), 404, CVB2_M3);
        igual(200, cvb2Pagina($a->cliente(), $novo)->status, 'o link novo abre');
    });
});

teste('e-mail: E35t tentativas.json gerado pelo pedido (categoria e) é relido pela v1.6.1.0 sem quebrar (K6, primeira metade)', function (): void {
    $dir = dirTemporario();
    $arvore = $dir . '/v161';
    mkdir($arvore, 0700, true);
    exec('git -C ' . escapeshellarg(RAIZ_REPO) . ' archive v1.6.1.0 public/api | tar -x -C ' . escapeshellarg($arvore) . ' 2>&1', $saidaTar, $rcTar);
    igual(0, $rcTar, 'extração da v1.6.1.0 (tag)');
    $prova = $dir . '/prova.php';
    file_put_contents($prova, "<?php\ndeclare(strict_types=1);\ndefine('D26_API', true);\n"
        . "foreach (['config', 'armazenamento', 'respostas', 'contas', 'limite'] as \$m) { require \$argv[1] . '/nucleo/' . \$m . '.php'; }\n"
        . "echo json_encode(d26_limite_reservar_detalhado(\$argv[2], 'ana', '127.0.0.1', time(), false));\n");
    emailB3Com([], function (Ambiente $a) use ($prova, $arvore): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        igual(200, emb4Enviar($c, $csrf, 'ana')->status, 'o pedido grava a categoria e');
        $tentativas = json_decode((string) file_get_contents($a->priv . '/tentativas.json'), true);
        verdadeiro(is_array($tentativas) && isset($tentativas['e']), 'tentativas.json tem a categoria e');
        exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($prova) . ' ' . escapeshellarg($arvore . '/public/api') . ' ' . escapeshellarg($a->priv) . ' 2>&1', $saida, $rc);
        igual(0, $rc, 'a v1.6.1.0 roda sobre o arquivo com e: ' . implode(' ', $saida));
        $json = json_decode(implode('', $saida), true);
        igual(0, is_array($json) ? ($json['espera'] ?? null) : null, 'sem espera indevida');
    });
});

teste('e-mail: EM-B4 falha do E2 grava envioFalhouEm na conta e só etapa e código no erros.log; a resposta é a mesma', function (): void {
    emailB3Com(['rcpt' => ['550 caixa de destino recusada']], function (Ambiente $a): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        igual(200, emb4Enviar($c, $csrf, 'ana')->status, 'pedido');
        verdadeiro(is_string(emailContaCrua($a, 'ana')['envioFalhouEm'] ?? null), 'envioFalhouEm gravado');
        igual(emailContaCrua($a, 'ana')['envioFalhouEm'], emailListada($a, 'ana')['envioFalhouEm'] ?? null, 'a listagem do administrador mostra a marca da falha do Esqueci a senha (EM-F1-ENVIOFALHOU)');
        $log = (string) @file_get_contents($a->priv . '/erros.log');
        contem('envio etapa=destinatario codigo=550', $log, 'etapa e código');
        naoContem('ana@example.com', $log, 'o endereço não vai ao log');
        naoContem('caixa de destino', $log, 'o texto do servidor não vai ao log');
    });
});

// ---- EM-B3, revisão L-12 (rev-em-b3.md): D1 lock do envio, D2 ordem do E4, D3 prazo total de 20 s ----

teste('e-mail: D1 o envio sai FORA do lock: com a saudação do SMTP segurada, um pedido que precisa do lock de usuarios.json termina antes do envio', function (): void {
    $marca = dirTemporario() . '/segura-saudacao';
    file_put_contents($marca, "1\n");
    emailB3Com(['esperarArquivo' => $marca], function (Ambiente $a, array $falso) use ($marca): void {
        emailB3Semear($a, 'bia', 'bia@example.com');
        $a->semearUsuario('outra', 'SenhaOutraAdmin-2026', true, false);
        $outro = $a->entrar('outra', 'SenhaOutraAdmin-2026');
        $admin = $a->entrar();
        $reqA = postSemEsperar($admin, '/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'email' => 'ana@example.com']);
        $chegou = $falso['dir'] . '/conversa.bin.chegou';
        $limite = microtime(true) + 15;
        while (!is_file($chegou) && microtime(true) < $limite) {
            curl_multi_exec($reqA[0], $ativos);
            usleep(20000);
        }
        verdadeiro(is_file($chegou), 'o envio de A chegou à saudação segurada');
        $reqB = postSemEsperar($outro, '/api/usuarios.php', ['acao' => 'email', 'usuario' => 'bia', 'email' => 'nova@example.com']);
        $codigoB = 0;
        $limite = microtime(true) + 5;
        while ($codigoB === 0 && microtime(true) < $limite) {
            curl_multi_exec($reqB[0], $ativos);
            usleep(20000);
            $codigoB = (int) curl_getinfo($reqB[1], CURLINFO_RESPONSE_CODE);
        }
        igual(200, $codigoB, 'B termina enquanto o envio de A segura a saudação (o envio está fora do lock)');
        igual(0, (int) curl_getinfo($reqA[1], CURLINFO_RESPONSE_CODE), 'A ainda não respondeu: o envio segue no meio');
        @unlink($marca);
        [$statusA, $jsonA] = postConcluir($reqA);
        postConcluir($reqB);
        igual(200, $statusA, 'criar de A termina depois de liberar o envio');
        igual('enviado', $jsonA['email'] ?? null, 'o E1 saiu');
    }, ['workers' => 4]);
});

teste('e-mail: D2 ordem: responde, termina a resposta, depois manda o E4 (injeção de sequência, como E30t)', function (): void {
    correioCarregar();
    $dir = dirTemporario();
    $ordem = [];
    d26_responder_e_depois($dir, static function () use (&$ordem): void { $ordem[] = 'resposta'; },
        static function () use (&$ordem): bool { $ordem[] = 'terminar'; return true; },
        static function () use (&$ordem): void { $ordem[] = 'aviso'; });
    igual(['resposta', 'terminar', 'aviso'], $ordem, 'a ordem é responde, termina, avisa');
    d26_responder_e_depois($dir, static fn () => null, static fn (): bool => false, static fn () => null);
    contem('envio envio-sincrono', (string) @file_get_contents($dir . '/erros.log'), 'sem término, uma linha envio-sincrono');
});

teste('e-mail: D3 o prazo total de 20 s já corre no connect: a sessão recebe o instante de antes da conexão', function (): void {
    correioCarregar();
    [$lado, $outro] = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
    // Simula um connect que levou 2,5 s de um total de 3 s: a saudação tem só ~0,5 s, não 3 s.
    $sessao = new D26SmtpSessao($lado, 10, 3, microtime(true) - 2.5);
    $inicio = microtime(true);
    correioEsperarFalha(fn () => $sessao->esperar('conexao', 220));
    $decorrido = microtime(true) - $inicio;
    fclose($outro);
    $sessao->fechar();
    verdadeiro($decorrido <= 1.5, "a saudação respeitou o que sobrava do total: $decorrido s (esperado ~0,5 s)");
});

/** Envio com servidor mudo no roteiro, com prazos explícitos. @return float segundos até o fim do envio */
function emb4MedirEnvioMudo(array $roteiro, int $leitura, int $total): float
{
    correioCarregar();
    $priv = correioPriv();
    $falso = correioSmtpFalso($roteiro);
    try {
        $inicio = microtime(true);
        correioEsperarFalha(fn () => d26_correio_enviar(
            ['destinatario' => 'pessoa@example.com', 'assunto' => 'Prazo', 'corpo' => "Oi.\n"],
            $priv,
            ['endereco' => 'tcp://127.0.0.1:' . $falso['porta'], 'tls' => false, 'prazoLeituraS' => $leitura, 'prazoTotalS' => $total]
        ));
        return microtime(true) - $inicio;
    } finally {
        correioFecharSmtpFalso($falso);
    }
}

teste('e-mail: D3 servidor mudo em cada etapa: nenhum envio passa do total (3 s) mais uma folga de 1 s', function (): void {
    $etapas = [
        'saudação' => ['mudoNoHandshake' => true],
        'EHLO' => ['mudoEm' => 'EHLO'],
        'AUTH' => ['mudoEm' => 'AUTH PLAIN'],
        'MAIL FROM' => ['mudoEm' => 'MAIL FROM'],
        'RCPT TO' => ['mudoEm' => 'RCPT TO'],
        'DATA' => ['mudoEm' => 'DATA'],
    ];
    foreach ($etapas as $etapa => $roteiro) {
        $decorrido = emb4MedirEnvioMudo($roteiro, 2, 3);
        verdadeiro($decorrido <= 4.0, "mudo em $etapa: $decorrido s, passou do total de 3 s mais a folga de 1 s");
    }
});

teste('e-mail: D3 com os prazos de produção (10 s de leitura, 20 s de total), o servidor mudo na saudação não passa de 21 s', function (): void {
    $decorrido = emb4MedirEnvioMudo(['mudoNoHandshake' => true], D26_SMTP_PRAZO_LEITURA_S, D26_SMTP_PRAZO_TOTAL_S);
    verdadeiro($decorrido <= D26_SMTP_PRAZO_TOTAL_S + 1.0, "envio com prazos de produção levou $decorrido s (teto: 20 s mais folga de 1 s)");
});

/** POST de formulário do "Esqueci a senha" sem esperar a resposta. @return array{resource, \CurlHandle} */
function emb4PostAsync(Cliente $c, string $csrf, string $usuario): array
{
    $pares = [];
    foreach ($c->cookies as $n => $v) {
        $pares[] = "$n=$v";
    }
    $h = curl_init($c->origem() . '/api/esqueci.php');
    curl_setopt_array($h, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query(['usuario' => $usuario, 'csrf' => $csrf]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded', 'Origin: ' . $c->origem(), 'Cookie: ' . implode('; ', $pares), 'Connection: close'],
    ]);
    $m = curl_multi_init();
    curl_multi_add_handle($m, $h);
    return [$m, $h];
}

/** Espera o POST assíncrono e devolve [status, corpo bruto]. @param array{resource, \CurlHandle} $req @return array{int, string} */
function emb4Concluir(array $req): array
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
    return [$status, $corpo];
}

teste('e-mail: EM-B4 corrida: o admin troca o e-mail entre a leitura e o pedido; o pedido não abre conexão SMTP, não grava convite e responde a frase única', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $admin = $a->entrar();
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        pausaLigar($a, 'esqueci-antes-pedir', 'ana');
        $req = emb4PostAsync($c, $csrf, 'ana');
        pausaEsperarChegada($req, $a, 'esqueci-antes-pedir');
        igual(200, $admin->post('/api/usuarios.php', ['acao' => 'email', 'usuario' => 'ana', 'email' => 'nova@example.com'])->status, 'o admin troca o e-mail na janela');
        pausaSoltar($a, 'esqueci-antes-pedir');
        // A resposta sai antes da busca e da gravação (TE4): só o sinal de fim prova que o pedido acabou.
        pausaEsperarSinal($a, 'esqueci-fim');
        [$status, $corpo] = emb4Concluir($req);
        igual(200, $status, 'a resposta pública é 200');
        contem(EMB4_FRASE, $corpo, 'a frase única');
        $conversa = correioConversaFinal($falso, 2.0);
        verdadeiro($conversa === null, 'nenhuma conexão SMTP: o pedido que leu o e-mail antigo não envia' . ($conversa !== null ? ' (o E2 foi para ' . emailB3Destinatario($conversa) . ')' : ''));
        $conta = conviteConta($a, 'ana');
        igual('nova@example.com', $conta['email'] ?? null, 'a troca de e-mail ficou gravada');
        igual(false, array_key_exists('convite', $conta ?? []), 'o pedido que leu o e-mail antigo não grava convite');
    }, ['workers' => 4]); // a requisição pausada segura um worker: sem mais de um, o admin nunca entra na janela
});

teste('e-mail: EM-B4 E2 depois da troca de e-mail vai ao endereço novo', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        $admin = $a->entrar();
        igual(200, $admin->post('/api/usuarios.php', ['acao' => 'email', 'usuario' => 'ana', 'email' => 'nova@example.com'])->status, 'o admin troca o e-mail antes do pedido');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        [$status] = emb4Concluir(emb4PostAsync($c, $csrf, 'ana'));
        igual(200, $status, 'a resposta pública é 200');
        $conversa = correioConversaFinal($falso, 10.0);
        verdadeiro($conversa !== null, 'o E2 chegou ao SMTP falso');
        igual('nova@example.com', emailB3Destinatario($conversa), 'o E2 vai ao endereço novo');
    });
});
