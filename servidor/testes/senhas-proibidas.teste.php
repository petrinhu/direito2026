<?php
declare(strict_types=1);

/**
 * NIST-SENHAS-PROIBIDAS (SP 800-63B-4): a senha que está na lista pública de senhas comuns
 * (servidor/dados/senhas-proibidas.txt, 100k do NCSC via SecLists, MIT) é recusada na criação pelo
 * convite, na redefinição pelo admin e na troca pelo próprio usuário. A comparação não diferencia
 * maiúsculas. Nome de teste começa com "senhas-proibidas:" (filtro do rodar.php).
 */

const SP_MENSAGEM = 'Essa senha é muito comum. Escolha outra.';
const SP_SENHA_DA_LISTA = 'password12345678';
const SP_SENHA_DA_LISTA_MAIUSCULAS = 'PassWord12345678';
const SP_SENHA_FORTE = 'Cadeira-Forte-Teste-2026';

/** Nenhum arquivo do privado guarda a senha testada, em nenhuma capitalização (sem log da senha). */
function spSenhaNaoGravada(string $priv, string $senha): void
{
    $achados = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($priv, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $arquivo) {
        if ($arquivo->getFilename() === 'senhas-proibidas.txt') {
            continue; // a própria lista contém a senha de propósito: a varredura é dos outros arquivos
        }
        $conteudo = (string) file_get_contents($arquivo->getPathname());
        if (stripos($conteudo, $senha) !== false) {
            $achados[] = $arquivo->getFilename();
        }
    }
    igual([], $achados, 'a senha recusada não vai para arquivo nenhum do privado');
}

teste('senhas-proibidas: a lista está no repositório, normalizada, com a entrada de teste', function (): void {
    $arq = RAIZ_REPO . '/servidor/dados/senhas-proibidas.txt';
    verdadeiro(is_file($arq), 'lista versionada em servidor/dados');
    $linhas = file($arq, FILE_IGNORE_NEW_LINES);
    verdadeiro(in_array(SP_SENHA_DA_LISTA, $linhas, true), 'a senha de teste está na lista');
    igual(count($linhas), count(array_unique($linhas)), 'sem repetidas');
    igual(true, $linhas === array_map(static fn (string $l): string => mb_strtolower($l, 'UTF-8'), $linhas), 'minúsculas');
});

teste('senhas-proibidas: convite (criar) recusa a senha da lista, sem diferenciar maiúsculas, e aceita a forte', function (): void {
    $a = Ambiente::novo();
    $token = cvb2Convidar($a, 'ana');
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Casca($c)->corpo, 'csrf');
    foreach ([SP_SENHA_DA_LISTA, SP_SENHA_DA_LISTA_MAIUSCULAS] as $ruim) {
        $r = cvb2Enviar($c, cvb2Campos($token, $csrf, $ruim));
        igual(400, $r->status, 'criar: senha da lista recusada');
        contem(SP_MENSAGEM, $r->corpo, 'criar: mensagem em pt-br');
        naoContem($ruim, $r->corpo, 'criar: a tela não repete a senha');
        spSenhaNaoGravada($a->priv, $ruim);
    }
    igual(303, cvb2Enviar($c, cvb2Campos($token, $csrf, SP_SENHA_FORTE))->status, 'criar: senha forte fora da lista entra');
});

teste('senhas-proibidas: redefinição pelo admin recusa a senha da lista e aceita a forte', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('ana', 'SenhaAnaAntiga-123', false, false);
    $r = $a->entrar()->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana']);
    igual(200, $r->status, 'admin redefine ana');
    $token = conviteTokenDe($r);
    $c = $a->cliente();
    $csrf = cvb2Campo(cvb2Casca($c)->corpo, 'csrf');
    foreach ([SP_SENHA_DA_LISTA, SP_SENHA_DA_LISTA_MAIUSCULAS] as $ruim) {
        $resp = cvb2Enviar($c, cvb2Campos($token, $csrf, $ruim));
        igual(400, $resp->status, 'redefinir: senha da lista recusada');
        contem(SP_MENSAGEM, $resp->corpo, 'redefinir: mensagem em pt-br');
        spSenhaNaoGravada($a->priv, $ruim);
    }
    igual(303, cvb2Enviar($c, cvb2Campos($token, $csrf, SP_SENHA_FORTE))->status, 'redefinir: senha forte fora da lista entra');
});

teste('senhas-proibidas: troca pelo próprio usuário recusa a senha da lista, sem diferenciar maiúsculas, e aceita a forte', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    foreach ([SP_SENHA_DA_LISTA, SP_SENHA_DA_LISTA_MAIUSCULAS] as $ruim) {
        $r = $c->post('/api/trocar-senha.php', ['senhaAtual' => Ambiente::SENHA_ADMIN, 'senhaNova' => $ruim]);
        igual(400, $r->status, 'trocar: senha da lista recusada');
        igual(SP_MENSAGEM, $r->json()['mensagem'] ?? null, 'trocar: mensagem em pt-br');
        naoContem($ruim, $r->corpo, 'trocar: a resposta não repete a senha');
        spSenhaNaoGravada($a->priv, $ruim);
    }
    igual(200, $c->post('/api/trocar-senha.php', ['senhaAtual' => Ambiente::SENHA_ADMIN, 'senhaNova' => SP_SENHA_FORTE])->status, 'trocar: senha forte entra');
});

teste('senhas-proibidas: sem a lista no privado, a troca recusa tudo (fail secure), com mensagem sem falar de lista', function (): void {
    $a = Ambiente::novo();
    unlink($a->priv . '/senhas-proibidas.txt');
    $r = $a->entrar()->post('/api/trocar-senha.php', ['senhaAtual' => Ambiente::SENHA_ADMIN, 'senhaNova' => SP_SENHA_FORTE]);
    igual(400, $r->status, 'sem lista: a senha forte não passa');
    contem('Não foi possível conferir a senha agora', (string) ($r->json()['mensagem'] ?? ''), 'sem lista: mensagem de falha segura');
    naoContem('lista', (string) ($r->json()['mensagem'] ?? ''), 'a mensagem não diz qual lista');
});

teste('senhas-proibidas: a lista não é servida pelo webroot', function (): void {
    $a = Ambiente::novo();
    $c = $a->cliente();
    foreach (['/senhas-proibidas.txt', '/api/senhas-proibidas.txt', '/servidor/dados/senhas-proibidas.txt'] as $caminho) {
        $r = $c->get($caminho);
        verdadeiro($r->status !== 200, "GET $caminho não responde 200 com a lista");
        naoContem(SP_SENHA_DA_LISTA, $r->corpo, "GET $caminho não devolve trecho da lista");
    }
});
