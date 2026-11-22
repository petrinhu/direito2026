<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

// ---- EM-SMTP-TETO-TOTAL: teto total de envios do site (100 em 24 h, somando todos os caminhos) ----------
// Os sub-limites (60 do "Esqueci a senha", 20 dos avisos de primeira ocorrência) continuam valendo dentro do total.

/** Chave do total no tentativas.json, como d26_limite_envio_total a grava. */
function ttChaveTotal(): string
{
    return d26_limite_chave_envio('total');
}

/** Grava $n marcas de envio no total, todas no instante $quando, dentro do privado do teste. */
function ttEncherTotal(string $priv, int $n, int $quando): void
{
    $arq = $priv . '/tentativas.json';
    $d = json_decode((string) @file_get_contents($arq), true);
    $d = is_array($d) ? $d : D26_LIMITE_PADRAO;
    $d['e'][ttChaveTotal()] = ['f' => array_fill(0, $n, $quando)];
    file_put_contents($arq, json_encode($d, JSON_THROW_ON_ERROR));
    chmod($arq, 0600);
}

/** Mesmo que ttEncherTotal, para o Ambiente HTTP (que tem o privado em $a->priv). */
function ttEncherTotalAmbiente(Ambiente $a, int $n, int $quando): void
{
    ttEncherTotal($a->priv, $n, $quando);
}

/** Lê as linhas do erros.log do privado. */
function ttErros(Ambiente $a): string
{
    return (string) @file_get_contents($a->priv . '/erros.log');
}

// ---- Unidade: fronteira e janela, sem servidor ----------------------------------------------------

teste('teto total: a constante é 100 e o 100º envio do dia passa, o 101º é recusado', function (): void {
    igual(100, D26_ENVIO_TOTAL_DIA, 'a constante do total');
    $priv = privadoDeLimite();
    $agora = 1_700_000_000;
    for ($i = 1; $i <= 100; $i++) {
        verdadeiro(d26_limite_envio_total($priv, $agora), "envio $i do dia passa");
    }
    verdadeiro(!d26_limite_envio_total($priv, $agora), 'o 101º envio é recusado');
    verdadeiro(!d26_limite_envio_total($priv, $agora + 3600), 'uma hora depois, ainda dentro das 24 h, continua recusado');
    limparPrivadoDeLimite($priv);
}, false);

teste('teto total: envios com mais de 24 h não contam, e o envio volta a passar depois da janela', function (): void {
    $priv = privadoDeLimite();
    $agora = 1_700_000_000;
    // 100 envios no limite da janela: exatamente 86400 s atrás já saiu da contagem.
    ttEncherTotal($priv, 100, $agora - 86400);
    verdadeiro(d26_limite_envio_total($priv, $agora), 'marcas com 24 h exatas não contam: o envio passa');
    limparPrivadoDeLimite($priv);
}, false);

teste('teto total: envios a 24 h menos 1 s ainda contam e recusam o próximo', function (): void {
    $priv = privadoDeLimite();
    $agora = 1_700_000_000;
    ttEncherTotal($priv, 100, $agora - 86399);
    verdadeiro(!d26_limite_envio_total($priv, $agora), 'marcas dentro da janela ainda ocupam o teto');
    limparPrivadoDeLimite($priv);
}, false);

// ---- Caminhos de envio do servidor: cada um recusado com o total cheio ----------------------------

teste('teto total: S1 "Esqueci a senha" recusado com o total cheio: mesma frase, nada enviado, linha envio-teto-total', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        ttEncherTotalAmbiente($a, 100, time() - 10);
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        $r = emb4Enviar($c, $csrf, 'ana');
        igual(200, $r->status, 'responde 200');
        contem(EMB4_FRASE, $r->corpo, 'a mesma frase de sempre');
        igual(null, correioConversaFinal($falso, 1.0), 'nada chegou ao SMTP');
        contem('envio-teto-total', ttErros($a), 'linha envio-teto-total');
    });
});

teste('teto total: S2 criar pelo painel recusado com o total cheio: conta criada, "email": "teto", nada enviado', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        ttEncherTotalAmbiente($a, 100, time() - 10);
        $r = emailB3Criar($a, 'ana', 'ana@example.com');
        igual(200, $r->status, 'criar responde 200 mesmo sem envio');
        igual('teto', $r->json()['email'] ?? null, 'a resposta diz teto, e não falhou');
        igual(null, correioConversaFinal($falso, 1.0), 'nada chegou ao SMTP');
        verdadeiro(is_string(emailContaCrua($a, 'ana')['envioFalhouEm'] ?? null), 'a conta fica marcada como e-mail não saído');
        contem('envio-teto-total', ttErros($a), 'linha envio-teto-total');
    });
});

teste('teto total: S3 redefinir pelo painel recusado com o total cheio: "email": "teto", nada enviado', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        ttEncherTotalAmbiente($a, 100, time() - 10);
        $r = $a->entrar()->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ana']);
        igual(200, $r->status, 'redefinir responde 200');
        igual('teto', $r->json()['email'] ?? null, 'a resposta diz teto');
        igual(null, correioConversaFinal($falso, 1.0), 'nada chegou ao SMTP');
    });
});

teste('teto total: S4 senha criada recusada com o total cheio: 303 sai, nenhuma conexão, linha envio-teto-total', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        $token = emailB3SemearConvite($a, 'ana', 'ana@example.com');
        ttEncherTotalAmbiente($a, 100, time() - 10);
        $c = $a->cliente();
        $csrf = cvb2Campo(cvb2Casca($c)->corpo, 'csrf');
        $r = cvb2Enviar($c, cvb2Campos($token, $csrf, EMB3_SENHA_NOVA));
        igual(303, $r->status, 'a senha foi criada: o 303 sai');
        igual(null, correioConversaFinal($falso, 1.0), 'o E4 não saiu');
        contem('envio-teto-total', ttErros($a), 'linha envio-teto-total');
    });
});

teste('teto total: S5 aviso A1 de primeira ocorrência recusado com o total cheio: nenhuma conexão', function (): void {
    usB2Com(function (Ambiente $a, array $falso): void {
        usB2Destino($a);
        ttEncherTotalAmbiente($a, 100, time() - 10);
        $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoA->get('/api/conteudo.php');
        naoContem('MAIL FROM', usB2Conversa($falso), 'o A1 não sai com o total cheio');
        contem('envio-teto-total', ttErros($a), 'linha envio-teto-total');
    });
});

teste('teto total: S6 aviso A2 de bloqueio também recusado com o total cheio (decisão do líder, 21/11/2026)', function (): void {
    usB2Com(function (Ambiente $a, array $falso): void {
        usB2Destino($a);
        ttEncherTotalAmbiente($a, 100, time() - 10);
        $aparelhoA = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoA->get('/api/conteudo.php');
        $aparelhoC = $a->entrar('ana', US_SENHA_ANA);
        $aparelhoB->get('/api/conteudo.php');
        verdadeiro(array_key_exists('bloqueada', usB2Conta($a)), 'a conta ficou bloqueada');
        naoContem('MAIL FROM', usB2Conversa($falso), 'o A2 não sai com o total cheio');
        contem('envio-teto-total', ttErros($a), 'linha envio-teto-total');
    });
});

// ---- Soma cruzada entre caminhos e volta depois da janela -----------------------------------------

teste('teto total: S7 a soma cruza os caminhos: 99 envios de outros caminhos, o painel usa o 100º e o próximo, do Esqueci, é recusado', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        emailB3Semear($a, 'ana', 'ana@example.com');
        ttEncherTotalAmbiente($a, 99, time() - 10);
        $r1 = emailB3Criar($a, 'bia', 'bia@example.com');
        igual('enviado', $r1->json()['email'] ?? null, 'o 100º envio do dia (painel) sai');
        correioConversaFinal($falso, 1.0); // espera a conexão do 100º terminar
        $conexoesAntes = count(glob($falso['conversa'] . '*') ?: []);
        verdadeiro($conexoesAntes >= 1, 'controle: o 100º envio abriu conexão com o SMTP falso');
        $c = $a->cliente();
        $csrf = cvb2Campo(emb4Pagina($c)->corpo, 'csrf');
        emb4Enviar($c, $csrf, 'ana');
        correioConversaFinal($falso, 1.0);
        igual($conexoesAntes, count(glob($falso['conversa'] . '*') ?: []), 'o 101º (Esqueci) não abriu conexão nova');
        contem('envio-teto-total', ttErros($a), 'linha envio-teto-total');
    });
});

teste('teto total: S8 com o total cheio, o painel recusa; depois da janela de 24 h, o mesmo envio sai', function (): void {
    emailB3Com([], function (Ambiente $a, array $falso): void {
        // 100 envios, todos com mais de 24 h: o total já está livre.
        ttEncherTotalAmbiente($a, 100, time() - 86401);
        $r = emailB3Criar($a, 'ana', 'ana@example.com');
        igual('enviado', $r->json()['email'] ?? null, 'depois da janela, o envio volta a sair');
        verdadeiro(correioConversaFinal($falso) !== null, 'a conexão ao SMTP aconteceu');
    });
});
