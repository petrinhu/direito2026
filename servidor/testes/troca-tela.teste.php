<?php
declare(strict_types=1);

/**
 * Tela de troca obrigatória com formulário (plano do CTO do login único, seção 1.3, item 5 e
 * seção 3; LU-F2.5). Sem JavaScript: o formulário vai para troca.php, com CSRF pelo cookie pré.
 * Nenhum byte do app sai antes da troca. Senha sintética, só pelo Ambiente.
 */

const TROCA_NOVA_VALIDA = 'NovaSenhaDeTeste17';

/** Cliente com troca pendente, já logado pelo formulário de entrada. */
function trocaTelaEntrar(Ambiente $a): Cliente
{
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    igual(303, acessoEnviar($c, $token, '/', Ambiente::LOGIN_ADMIN, Ambiente::SENHA_ADMIN)->status, 'login do admin com troca pendente');
    return $c;
}

/** POST do formulário da tela de troca, como o navegador envia. */
function trocaTelaEnviar(Cliente $c, string $token, string $atual, string $nova): Resposta
{
    return $c->enviar('POST', '/api/troca.php', http_build_query([
        'senhaAtual' => $atual,
        'senhaNova' => $nova,
        'csrf' => $token,
    ]), [
        'Content-Type' => 'application/x-www-form-urlencoded',
        'X-CSRF-Token' => null,
    ]);
}

teste('troca: a tela de troca tem formulário com CSRF oculto, sem script e sem o app', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = trocaTelaEntrar($a);
    $r = $c->get('/', PORTAO_NAVEGACAO);
    igual(200, $r->status, 'tela de troca em navegação');
    contem('action="/api/troca.php"', $r->corpo, 'formulário aponta para troca.php');
    contem('name="senhaAtual"', $r->corpo, 'campo da senha atual');
    contem('name="senhaNova"', $r->corpo, 'campo da senha nova');
    verdadeiro(acessoCampo($r->corpo, 'csrf') !== '', 'token oculto na tela');
    naoContem('<script', $r->corpo, 'sem JavaScript');
    naoContem('CONTEUDO-SINTETICO-APP', $r->corpo, 'nenhum byte do app');
});

teste('troca: formulário certo troca a senha, manda ao destino e libera o app', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = trocaTelaEntrar($a);
    $tela = $c->get('/', PORTAO_NAVEGACAO);
    $r = trocaTelaEnviar($c, acessoCampo($tela->corpo, 'csrf'), Ambiente::SENHA_ADMIN, TROCA_NOVA_VALIDA);
    igual(303, $r->status, 'troca aceita');
    igual('/', $r->cabecalho('location'));
    igual(200, $c->get('/', PORTAO_NAVEGACAO)->status, 'depois da troca, o app sai');
    contem('CONTEUDO-SINTETICO-APP', $c->get('/', PORTAO_NAVEGACAO)->corpo);
    igual(false, $a->lerUsuarios()['usuarios'][0]['deveTrocarSenha'], 'a conta deixa de exigir troca');
});

teste('troca: senha atual errada, senha curta e anônimo são recusados na tela', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = trocaTelaEntrar($a);
    $tela = $c->get('/', PORTAO_NAVEGACAO);
    $token = acessoCampo($tela->corpo, 'csrf');
    $errada = trocaTelaEnviar($c, $token, 'senha-errada-1', TROCA_NOVA_VALIDA);
    igual(401, $errada->status, 'senha atual errada');
    contem('A senha atual não confere.', $errada->corpo);
    $curta = trocaTelaEnviar($c, $token, Ambiente::SENHA_ADMIN, 'curta-demais-1');
    igual(400, $curta->status, 'senha nova com 14 caracteres');
    contem('pelo menos 15 caracteres', $curta->corpo);
    igual(401, trocaTelaEnviar($a->cliente(), $token, Ambiente::SENHA_ADMIN, TROCA_NOVA_VALIDA)->status, 'anônimo sem sessão');
    igual(true, $a->lerUsuarios()['usuarios'][0]['deveTrocarSenha'], 'nada trocou');
});

teste('troca: formulário sem token é recusado (403)', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = trocaTelaEntrar($a);
    igual(403, trocaTelaEnviar($c, '', Ambiente::SENHA_ADMIN, TROCA_NOVA_VALIDA)->status, 'sem token');
    igual(true, $a->lerUsuarios()['usuarios'][0]['deveTrocarSenha'], 'nada trocou sem o token');
});

teste('troca: o campo da senha nova liga o texto do mínimo de 15 caracteres por aria-describedby, e a recusa vai em role="alert"', function (): void {
    $a = Ambiente::novo(['deveTrocar' => true]);
    $c = trocaTelaEntrar($a);
    $tela = $c->get('/', PORTAO_NAVEGACAO);
    verdadeiro(
        preg_match('/<input id="senhaNova"[^>]*aria-describedby="([^"]+)"/', $tela->corpo, $m) === 1,
        'o campo da senha nova tem aria-describedby'
    );
    $idAjuda = $m[1] ?? '';
    verdadeiro(
        preg_match('/<p id="' . preg_quote($idAjuda, '/') . '">[^<]*15 caracteres[^<]*<\/p>/', $tela->corpo) === 1,
        'o id citado é um texto visível com o mínimo de 15 caracteres'
    );
    $curta = trocaTelaEnviar($c, acessoCampo($tela->corpo, 'csrf'), Ambiente::SENHA_ADMIN, 'curta-demais-1');
    igual(400, $curta->status, 'senha nova com 14 caracteres');
    contem('role="alert"', $curta->corpo, 'recusa da senha curta anunciada em role=alert');
    contem('pelo menos 15 caracteres', $curta->corpo, 'texto da recusa do servidor');
});
