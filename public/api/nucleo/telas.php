<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Telas HTML geradas pelo PHP (plano do CTO do login único, seção 1.4). Sem <script>:
 * quem não tem JavaScript, ou tem JavaScript bloqueado, recebe a mesma tela. Todo
 * valor que entra no HTML passa por htmlspecialchars.
 */

/** CSP do shell do app (seção 1.3). Só o portão a emite, depois de confirmar a sessão. */
const PORTAO_CSP_SHELL = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'none'; manifest-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

/** CSP das telas de entrada, troca e indisponível (seção 1.3). A fonte vem do próprio site (OS-F1, R4=A). */
const PORTAO_CSP_TELA = "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

/** Cookie que diz o tema escolhido no site: só claro ou escuro (OS-F1, R7). */
const D26_TELA_COOKIE_TEMA = '__Host-d26tema';

function d26_tela_csp(): string
{
    return PORTAO_CSP_TELA;
}

/** Escapa para atributo ou texto de HTML. */
function d26_tela_e(string $valor): string
{
    return htmlspecialchars($valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Atributo do tema no <html>. Lista fechada: só "light" e "dark" passam. Qualquer outro valor
 * do cookie não escreve nada, nem escapado (o pedido é de quem manda o cabeçalho).
 */
function d26_tela_atributo_tema(): string
{
    $valor = $_COOKIE[D26_TELA_COOKIE_TEMA] ?? null;
    if (!is_string($valor)) {
        return '';
    }
    return match ($valor) {
        'light', 'dark' => ' data-theme="' . $valor . '"',
        default => '',
    };
}

/**
 * Doze primeiros hex do sha256 de entrada.css: o endereço muda quando o arquivo muda, e o cache
 * de dias da borda não segura a versão antiga. Sem o arquivo, cai em "0" e a tela continua de pé.
 */
function d26_tela_versao_css(): string
{
    static $versao = null;
    if ($versao !== null) {
        return $versao;
    }
    $arquivo = dirname(__DIR__, 2) . '/entrada.css';
    $versao = is_file($arquivo) ? substr((string) hash_file('sha256', $arquivo), 0, 12) : '0';
    return $versao;
}

/** Faixa da marca, com o templo do SeloHome do site. Sem link: antes do login não há home. */
function d26_tela_cabecalho(): string
{
    return '<header class="entrada-cabecalho"><div class="entrada-marca">'
        . '<svg class="entrada-templo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">'
        . '<g class="entrada-traco"><path d="M6 18 L24 7 L42 18 Z" /><path d="M6 18 H42 V21 H6 Z" />'
        . '<path d="M11 23 V35 M19 23 V35 M29 23 V35 M37 23 V35" /><path d="M8 35 H40 V38 H8 Z" />'
        . '<path d="M5 38 H43 V42 H5 Z" /></g></svg>'
        . '<span>Caderno de Direito</span></div></header>';
}

/**
 * Documento HTML mínimo: título fixo, tema do cookie, marca e o CSS público de entrada.css. Com $soOrigem
 * (página do convite, CV-B2), a marcação também pede "strict-origin": o token vai na URL, e o Referer dos
 * pedidos de entrada.css, do ícone e do formulário leva só a origem, sem caminho nem query. O valor é o mesmo
 * de D26_REFERRER_API em convite.php; a política que omite o Referer faria o POST sair com "Origin: null".
 * $rodape é o HTML que vai depois do <main> (hoje, o aviso legal da tela de entrada).
 */
function d26_tela_documento(string $titulo, string $corpo, bool $soOrigem = false, string $rodape = ''): string
{
    return '<!doctype html><html lang="pt-br"' . d26_tela_atributo_tema() . '><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow">'
        . ($soOrigem ? '<meta name="referrer" content="strict-origin">' : '')
        . '<link rel="icon" href="/icones/favicon.svg" type="image/svg+xml">'
        . '<title>' . d26_tela_e($titulo) . '</title>'
        . '<link rel="stylesheet" href="/entrada.css?v=' . d26_tela_versao_css() . '">'
        . '</head><body>' . d26_tela_cabecalho() . '<main>' . $corpo . '</main>' . $rodape . '</body></html>';
}

/**
 * Aviso legal de site não oficial, no rodapé da tela de entrada. O texto é o de
 * src/core/rodape/avisoLegal.ts, repetido aqui; servidor/testes/entrada-aviso.teste.php prova a igualdade.
 */
function d26_tela_aviso_legal(): string
{
    $rotulo = 'Aviso:';
    $corpo = 'este site não é oficial e não tem vínculo com a instituição de ensino nem com seus professores. É um projeto pessoal, independente e gratuito, feito para apoiar os estudos da turma de Direito. O conteúdo foi preparado a partir de materiais de aula, mas a seleção, a redação e eventuais erros são de responsabilidade exclusiva do autor, e não dos professores nem da instituição. O material é oferecido como está, apenas para estudo, sem garantia de exatidão ou atualização, e não substitui as aulas, a bibliografia indicada nem orientação jurídica profissional.';
    return '<footer class="entrada-rodape"><section class="aviso-legal" role="note" aria-label="Aviso legal">'
        . '<p class="aviso-legal__texto" lang="pt-BR"><strong>' . d26_tela_e($rotulo) . '</strong> ' . d26_tela_e($corpo) . '</p>'
        . '</section></footer>';
}

/** Textos do convite por link (CV-B2). M1, M2, M3 e a frase de sucesso são do líder (08/11/2026, R8), verbatim. */
const D26_CONVITE_M1 = 'Este link venceu. Peça um novo a quem administra o site.';
const D26_CONVITE_M2 = 'Este link já foi usado. Se não foi você, avise quem administra o site.';
const D26_CONVITE_M3 = 'Este link não vale. Peça um novo a quem administra o site.';
/** Decisão autônoma do orquestrador, a ratificar: a repetição que não confere com a senha nova. */
const D26_CONVITE_REPETICAO = 'A repetição não confere com a senha nova.';
const D26_CONVITE_CRIADA = 'Senha criada. Entre pela tela de entrada.';

/**
 * Tela do convite (CV-B2): usuário somente leitura, senha nova com a regra de 15 caracteres, repetição (R10),
 * token no campo oculto t (escapado) e CSRF do cookie pré. O formulário vai para o endereço fixo, sem o token.
 * Com $erro, a mensagem vai em role="alert" e repetida no título (F9), e a tela segue com o link.
 */
function d26_tela_convite(string $login, string $token, string $csrf, ?string $erro = null): string
{
    $titulo = $erro ?? 'Criar senha';
    $erroHtml = $erro === null ? '' : '<p role="alert">' . d26_tela_e($erro) . '</p>';
    return d26_tela_documento($titulo, '<h1>Criar senha</h1>' . $erroHtml
        . '<form method="post" action="/api/convite.php">'
        . '<label for="usuario">Usuário</label>'
        . '<input id="usuario" name="usuario" type="text" value="' . d26_tela_e($login) . '" autocomplete="username" readonly>'
        . '<label for="senhaNova">Senha nova (15 caracteres ou mais)</label>'
        . '<input id="senhaNova" name="senhaNova" type="password" autocomplete="new-password" minlength="15" required autofocus aria-describedby="senhaNova-ajuda">'
        . '<p id="senhaNova-ajuda">A senha precisa ter pelo menos 15 caracteres.</p>'
        . '<label for="senhaRepetida">Repita a senha</label>'
        . '<input id="senhaRepetida" name="senhaRepetida" type="password" autocomplete="new-password" minlength="15" required>'
        . '<input type="hidden" name="t" value="' . d26_tela_e($token) . '">'
        . '<input type="hidden" name="csrf" value="' . d26_tela_e($csrf) . '">'
        . '<button type="submit">Criar senha e entrar</button>'
        . '</form>', true);
}

/**
 * Tela de mensagem do convite (M1, M2, M3 ou limite): o texto em role="alert", repetido no título, sem formulário.
 * Com $comPedido (M1 e M3, EM-B4), o link "Esqueci a senha" vai abaixo da mensagem: quem recebeu um link sem valor
 * pode pedir outro. M2 (link já usado) não leva o link.
 */
function d26_tela_mensagem(string $texto, bool $comPedido = false): string
{
    return d26_tela_documento($texto, '<h1>Caderno de Direito</h1><p role="alert">' . d26_tela_e($texto) . '</p>'
        . ($comPedido ? D26_TELA_LINK_ESQUECI : ''), true);
}

/** Texto único do "Esqueci a senha" (8.1.3, decisão autônoma do orquestrador, a ratificar): sai igual para toda conta. */
const D26_ESQUECI_FRASE = 'Se houver uma conta com esse usuário ou e-mail, o link para criar a senha nova chega ao e-mail dela em alguns minutos. Confira também a pasta de spam.';
const D26_ESQUECI_ERRO_VAZIO = 'Escreva o seu usuário ou e-mail.';

/** Link "Esqueci a senha" (texto do líder, pedido de 08/11/2026): na entrada e nas telas M1 e M3. */
const D26_TELA_LINK_ESQUECI = '<p><a href="/api/esqueci.php">Esqueci a senha</a></p>';

/**
 * Página "Esqueci a senha" (8.1.3): usuário ou e-mail, CSRF do cookie pré (G8) e "Voltar para a entrada". Sem
 * script. Com $erro, a mensagem vai em role="alert" e repetida no título (como nas outras telas).
 */
function d26_tela_esqueci(string $token, ?string $erro = null): string
{
    $titulo = $erro ?? 'Esqueci a senha';
    $erroHtml = $erro === null ? '' : '<p role="alert">' . d26_tela_e($erro) . '</p>';
    return d26_tela_documento($titulo, '<h1>Esqueci a senha</h1>' . $erroHtml
        . '<form method="post" action="/api/esqueci.php">'
        . '<label for="usuario">Usuário ou e-mail</label>'
        . '<input id="usuario" name="usuario" type="text" autocomplete="username" maxlength="254" autofocus required>'
        . '<input type="hidden" name="csrf" value="' . d26_tela_e($token) . '">'
        . '<button type="submit">Enviar link</button>'
        . '</form>'
        . '<p><a href="/">Voltar para a entrada</a></p>');
}

/** Resposta do pedido: a mesma frase para toda conta, sem formulário e sem nada que dependa do pedido. */
function d26_tela_esqueci_enviado(): string
{
    return d26_tela_documento(D26_ESQUECI_FRASE, '<h1>Esqueci a senha</h1><p role="alert">' . d26_tela_e(D26_ESQUECI_FRASE) . '</p>'
        . '<p><a href="/">Voltar para a entrada</a></p>');
}

/** Senha criada sem entrar (o login automático falhou depois da gravação). Aviso informativo, com o endereço /. */
function d26_tela_criada(): string
{
    return d26_tela_documento(D26_CONVITE_CRIADA, '<h1>Caderno de Direito</h1><p class="entrada-aviso" role="alert">'
        . d26_tela_e(D26_CONVITE_CRIADA) . '</p><p><a href="/">Tela de entrada</a></p>', true);
}

/**
 * Texto da conta bloqueada por uso simultâneo (BL-B1), verbatim da ordem do líder de 08/11/2026. Usado na tela de
 * entrada (aviso e 403 do login) e no mapa de avisos. Não alterar sem nova ordem do líder.
 */
const D26_TEXTO_BLOQUEIO = 'Esta conta foi bloqueada porque foi usada em dois aparelhos ao mesmo tempo. Fale com Petrus para liberar.';

/** Texto do aviso da tela de entrada, por código da lista fechada (D26_AVISOS). */
function d26_tela_texto_aviso(string $codigo): ?string
{
    return match ($codigo) {
        D26_AVISO_OUTRO_APARELHO => 'Sua conta foi aberta em outro aparelho. Entre de novo para continuar aqui.',
        D26_AVISO_BLOQUEADA => D26_TEXTO_BLOQUEIO,
        default => null,
    };
}

/**
 * Tela de entrada: usuário, senha, token CSRF (HMAC do cookie pré) e destino oculto.
 * Com $erro, a mensagem vai em role="alert" e repetida no título: é o único jeito de um
 * leitor de tela anunciar o erro depois de um POST sem JavaScript (plano, seção 1.4).
 * Com $aviso (SU-B2), vale a mesma regra, em parágrafo próprio com estilo informativo, e o
 * campo usuário é descrito por ele. Se vierem os dois, o título segue o erro.
 */
function d26_tela_entrada(string $token, string $destino, ?string $erro = null, ?string $aviso = null): string
{
    $titulo = $erro ?? $aviso ?? 'Caderno de Direito';
    $avisoHtml = $aviso === null ? '' : '<p class="entrada-aviso" role="alert" id="aviso-sessao">' . d26_tela_e($aviso) . '</p>';
    $erroHtml = $erro === null ? '' : '<p role="alert">' . d26_tela_e($erro) . '</p>';
    $descrito = $aviso === null ? '' : ' aria-describedby="aviso-sessao"';
    return d26_tela_documento($titulo, '<h1>Caderno de Direito</h1>' . $avisoHtml . $erroHtml
        . '<form method="post" action="/api/acesso.php">'
        . '<label for="usuario">Usuário</label>'
        . '<input id="usuario" name="usuario" type="text" autocomplete="username" autofocus required' . $descrito . '>'
        . '<label for="senha">Senha</label>'
        . '<input id="senha" name="senha" type="password" autocomplete="current-password" required>'
        . '<input type="hidden" name="csrf" value="' . d26_tela_e($token) . '">'
        . '<input type="hidden" name="destino" value="' . d26_tela_e($destino) . '">'
        . '<button type="submit">Entrar</button>'
        . '</form>' . D26_TELA_LINK_ESQUECI, false, d26_tela_aviso_legal());
}

/**
 * Tela de troca obrigatória: nada do app sai antes dela. O formulário vai para troca.php e
 * leva o token do cookie pré, como a tela de entrada. Com $erro, a mensagem vai em role="alert".
 */
function d26_tela_troca(string $token, ?string $erro = null): string
{
    $titulo = $erro ?? 'Caderno de Direito';
    $aviso = $erro === null ? '' : '<p role="alert">' . d26_tela_e($erro) . '</p>';
    return d26_tela_documento($titulo, '<h1>Caderno de Direito</h1>'
        . '<p>Troca de senha obrigatória antes de continuar.</p>' . $aviso
        . '<form method="post" action="/api/troca.php">'
        . '<label for="senhaAtual">Senha atual</label>'
        . '<input id="senhaAtual" name="senhaAtual" type="password" autocomplete="current-password" required>'
        . '<label for="senhaNova">Senha nova (15 caracteres ou mais)</label>'
        . '<input id="senhaNova" name="senhaNova" type="password" autocomplete="new-password" minlength="15" required aria-describedby="senhaNova-ajuda">'
        . '<p id="senhaNova-ajuda">A senha precisa ter pelo menos 15 caracteres.</p>'
        . '<input type="hidden" name="csrf" value="' . d26_tela_e($token) . '">'
        . '<button type="submit">Trocar senha</button>'
        . '</form>');
}

/** Tela de serviço indisponível, em navegação (503 fechado). */
function d26_tela_indisponivel(): string
{
    return d26_tela_documento('Caderno de Direito', '<h1>Caderno de Direito</h1>'
        . '<p>Serviço indisponível no momento. Tente de novo em instantes.</p>');
}
