<?php
declare(strict_types=1);

/**
 * Apoio dos testes da área da Júri. A conta da Júri é semeada no diretório privado
 * DA JÚRI (privJuri), com fixtures sintéticas: o AUTH vem de texto inventado e o
 * salt e o embrulho são bytes fixos. O login é o endpoint real, com AUTH no lugar
 * da senha: esta área nunca recebe senha. Os arquivos de conteúdo e imagem também
 * vão para privJuri, nunca para o diretório do Interdisciplinar.
 */

const JURI_LOGIN_TESTE = 'admin';

/** AUTH de fixture: base64url canônico de 32 bytes, derivado de texto inventado. */
function juriAuthTeste(): string
{
    return rtrim(strtr(base64_encode(hash('sha256', 'auth-teste-juri', true)), '+/', '-_'), '=');
}

/**
 * Conta única da Júri (o admin) no diretório privado da Júri. Campos da conta
 * atual mais salt (16 B) e embrulho {v, iv, ct} (CEK 32 B + tag 16 B, IV 12 B).
 */
function juriSemearConta(Ambiente $a, bool $deveTrocar = false): void
{
    $conta = [
        'usuario' => JURI_LOGIN_TESTE,
        'uid' => bin2hex(random_bytes(16)),
        'hash' => Ambiente::hashPadrao(juriAuthTeste()),
        'admin' => true,
        'ativo' => true,
        'deveTrocarSenha' => $deveTrocar,
        'versaoSessao' => random_int(1 << 20, 1 << 40),
        'criadoEm' => gmdate('c'),
        'ultimoLogin' => null,
        'aparelhos' => [],
        'salt' => base64_encode(substr(hash('sha256', 'salt-teste-juri', true), 0, 16)),
        'embrulho' => [
            'v' => 1,
            'iv' => base64_encode(substr(hash('sha256', 'iv-teste-juri', true), 0, 12)),
            'ct' => base64_encode(hash('sha256', 'ct-teste-juri', true) . substr(hash('sha256', 'tag-teste-juri', true), 0, 16)),
        ],
    ];
    $arq = $a->privJuri . '/usuarios.json';
    file_put_contents($arq, json_encode(['versao' => 1, 'usuarios' => [$conta]], JSON_THROW_ON_ERROR));
    chmod($arq, 0600);
    $tentativas = $a->privJuri . '/tentativas.json';
    file_put_contents($tentativas, '{"u":[],"ip":[],"c":[]}');
    chmod($tentativas, 0600);
}

/**
 * Ambiente só da Júri (sem conta do Interdisciplinar), com a conta da Júri semeada.
 *
 * @param array{deveTrocar?: bool, docroot?: string, layout?: string} $opcoes
 */
function juriAmbiente(array $opcoes = []): Ambiente
{
    $deveTrocar = (bool) ($opcoes['deveTrocar'] ?? false);
    unset($opcoes['deveTrocar']);
    $a = Ambiente::novo($opcoes + ['admin' => false]);
    juriSemearConta($a, $deveTrocar);
    return $a;
}

/** AUTH de fixture diferente do válido: mesmo formato, outro valor (senha errada). */
function juriAuthErrado(): string
{
    return rtrim(strtr(base64_encode(hash('sha256', 'auth-errado-teste', true)), '+/', '-_'), '=');
}

/** Cliente anônimo da Júri, já com o csrf do pré-login (cookie __Host-juripre). */
function juriAnonimo(Ambiente $a): Cliente
{
    $c = $a->cliente();
    igual(200, $c->get('/api/juri/sessao.php')->status, 'sessão anônima da Júri');
    return $c;
}

/** Cliente logado na Júri pelo endpoint real: sessao.php (csrf do pré-login), depois entrar.php com AUTH. */
function juriCliente(Ambiente $a): Cliente
{
    $c = juriAnonimo($a);
    $r = $c->post('/api/juri/entrar.php', ['usuario' => JURI_LOGIN_TESTE, 'auth' => juriAuthTeste()]);
    igual(200, $r->status, 'login da Júri pelo endpoint real (AUTH de fixture)');
    return $c;
}

/** @return array<string, mixed> a conta da Júri como está gravada agora */
function juriLerConta(Ambiente $a): array
{
    $d = json_decode((string) file_get_contents($a->privJuri . '/usuarios.json'), true, 16, JSON_THROW_ON_ERROR);
    return $d['usuarios'][0];
}

/** Altera a conta da Júri gravada (fixture de cenário: conta quebrada, desativada, redefinida). @param callable(array<string, mixed>): array<string, mixed> $fn */
function juriAlterarConta(Ambiente $a, callable $fn): void
{
    $arq = $a->privJuri . '/usuarios.json';
    $d = json_decode((string) file_get_contents($arq), true, 16, JSON_THROW_ON_ERROR);
    $d['usuarios'][0] = $fn($d['usuarios'][0]);
    file_put_contents($arq, json_encode($d, JSON_THROW_ON_ERROR));
}

/** Fixture do conteúdo fixo da Júri: PRIV/conteudo/juri.json. */
function juriSemearConteudo(Ambiente $a, string $json): void
{
    $arq = $a->privJuri . '/conteudo/juri.json';
    file_put_contents($arq, $json);
    chmod($arq, 0600);
}

/**
 * Fixture de imagem cifrada: grava PRIV/imagens/<id>.juri e acrescenta o id ao
 * índice PRIV/acervo.json. Os bytes são sintéticos; o formato v1 não é lido aqui.
 */
function juriSemearImagem(Ambiente $a, string $bytes): string
{
    $id = bin2hex(random_bytes(16));
    $dir = $a->privJuri . '/imagens';
    if (!is_dir($dir)) {
        mkdir($dir, 0700);
    }
    $arqImagem = $dir . '/' . $id . '.juri';
    file_put_contents($arqImagem, $bytes);
    chmod($arqImagem, 0600);

    $arq = $a->privJuri . '/acervo.json';
    $acervo = is_file($arq)
        ? json_decode((string) file_get_contents($arq), true, 16, JSON_THROW_ON_ERROR)
        : ['kid' => bin2hex(random_bytes(16)), 'indice' => []];
    $acervo['indice'][] = ['id' => $id, 'tipo' => 'png', 'bytes' => strlen($bytes)];
    file_put_contents($arq, json_encode($acervo, JSON_THROW_ON_ERROR));
    chmod($arq, 0600);
    return $id;
}
