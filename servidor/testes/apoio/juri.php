<?php
declare(strict_types=1);

/**
 * Apoio dos testes da área da Júri depois da unificação (plano do CTO do login
 * único, seções 3 e 5). Não há conta, login nem cifra próprios: a Júri usa a conta
 * e a sessão do privado único, o login é o do Interdisciplinar (Ambiente::entrar),
 * e os arquivos de conteúdo e imagem ficam em direito2026_privado.
 *
 * Sai junto com o último teste que o usa (F2.3): require_once de arquivo ausente
 * derruba o runner inteiro.
 */

/** Cliente anônimo, para provar que o endpoint recusa sem sessão. */
function juriAnonimo(Ambiente $a): Cliente
{
    return $a->cliente();
}

/** Cliente logado pelo login único (a conta do ambiente). */
function juriCliente(Ambiente $a): Cliente
{
    return $a->entrar();
}

/**
 * Ambiente com a conta única. deveTrocar deixa a troca de senha pendente.
 *
 * @param array{deveTrocar?: bool, docroot?: string} $opcoes
 */
function juriAmbiente(array $opcoes = []): Ambiente
{
    return Ambiente::novo($opcoes);
}

/** @return array<string, mixed> a conta única como está gravada agora */
function juriLerConta(Ambiente $a): array
{
    $d = json_decode((string) file_get_contents($a->priv . '/usuarios.json'), true, 16, JSON_THROW_ON_ERROR);
    return $d['usuarios'][0];
}

/** Altera a conta gravada (fixture de cenário: conta editada à mão, desativada, redefinida). @param callable(array<string, mixed>): array<string, mixed> $fn */
function juriAlterarConta(Ambiente $a, callable $fn): void
{
    $arq = $a->priv . '/usuarios.json';
    $d = json_decode((string) file_get_contents($arq), true, 16, JSON_THROW_ON_ERROR);
    $d['usuarios'][0] = $fn($d['usuarios'][0]);
    file_put_contents($arq, json_encode($d, JSON_THROW_ON_ERROR));
}

/** Fixture do conteúdo fixo da Júri: PRIV/conteudo/juri.json (privado único). */
function juriSemearConteudo(Ambiente $a, string $json): void
{
    $arq = $a->priv . '/conteudo/juri.json';
    file_put_contents($arq, $json);
    chmod($arq, 0600);
}

/**
 * Fixture de imagem: grava PRIV/imagens/<id>.juri e acrescenta o id ao índice
 * PRIV/acervo.json. Formato antigo, que a F2.3 troca; os bytes são sintéticos.
 */
function juriSemearImagem(Ambiente $a, string $bytes): string
{
    $id = bin2hex(random_bytes(16));
    $dir = $a->priv . '/imagens';
    if (!is_dir($dir)) {
        mkdir($dir, 0700);
    }
    $arqImagem = $dir . '/' . $id . '.juri';
    file_put_contents($arqImagem, $bytes);
    chmod($arqImagem, 0600);

    $arq = $a->priv . '/acervo.json';
    $acervo = is_file($arq)
        ? json_decode((string) file_get_contents($arq), true, 16, JSON_THROW_ON_ERROR)
        : ['kid' => bin2hex(random_bytes(16)), 'indice' => []];
    $acervo['indice'][] = ['id' => $id, 'tipo' => 'png', 'bytes' => strlen($bytes)];
    file_put_contents($arq, json_encode($acervo, JSON_THROW_ON_ERROR));
    chmod($arq, 0600);
    return $id;
}
