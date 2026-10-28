<?php
declare(strict_types=1);

/**
 * Apoio dos testes da área da Júri. Nenhuma função daqui mexe no código de
 * produção: a sessão nasce pelo login comum (Ambiente::entrar) e o id dela é
 * levado ao cookie da Júri, o único que os endpoints da Júri leem. Os arquivos
 * são fixtures sintéticas gravadas no diretório privado temporário do teste.
 */

/** Cliente autenticado na Júri: entra pelo login comum e leva o id ao cookie __Host-juri. */
function juriCliente(Ambiente $a): Cliente
{
    $entrou = $a->entrar();
    $c = $a->cliente();
    $c->cookies['__Host-juri'] = $entrou->cookies['__Host-d26'] ?? falhar('login não deixou o cookie de sessão');
    return $c;
}

/** Fixture do conteúdo fixo da Júri: PRIV/conteudo/juri.json. */
function juriSemearConteudo(Ambiente $a, string $json): void
{
    $arq = $a->priv . '/conteudo/juri.json';
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
