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
 */
function emailB3Com(array $roteiro, callable $corpo): void
{
    $falso = correioSmtpFalso($roteiro);
    putenv('D26_SMTP_TESTE=tcp://127.0.0.1:' . $falso['porta']);
    try {
        $a = Ambiente::novo();
        file_put_contents($a->priv . '/smtp.senha', EMB3_SENHA_SMTP);
        chmod($a->priv . '/smtp.senha', 0600);
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
    $codificado = substr($resto, 0, $fimDoCorpo + 2);
    preg_match('/^From: (.*)\r$/m', $cabecalhos, $de) === 1 || falhar('cabeçalho From ausente');
    preg_match('/^Subject: =\?UTF-8\?B\?([A-Za-z0-9+\/=]+)\?=\r$/m', $cabecalhos, $assunto) === 1 || falhar('Subject em encoded-word ausente');
    $corpo = quoted_printable_decode($codificado);
    $corpo = str_replace("\r\n", "\n", $corpo);
    if (str_ends_with($corpo, "\n")) {
        $corpo = substr($corpo, 0, -1);
    }
    return ['de' => $de[1], 'assunto' => (string) base64_decode($assunto[1], true), 'corpo' => $corpo];
}

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
        $r = $a->entrar()->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana']);
        igual('enviado', $r->json()['email'] ?? null, 'o envio deu certo');
        verdadeiro(!array_key_exists('envioFalhouEm', emailContaCrua($a, 'ana') ?? []), 'envioFalhouEm foi apagado');
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
