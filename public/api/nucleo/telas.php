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

/** Documento HTML mínimo: título fixo, tema do cookie, marca e o CSS público de entrada.css. */
function d26_tela_documento(string $titulo, string $corpo, string $rodape = ''): string
{
    return '<!doctype html><html lang="pt-br"' . d26_tela_atributo_tema() . '><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow">'
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

/**
 * Tela de entrada: usuário, senha, token CSRF (HMAC do cookie pré) e destino oculto.
 * Com $erro, a mensagem vai em role="alert" e repetida no título: é o único jeito de um
 * leitor de tela anunciar o erro depois de um POST sem JavaScript (plano, seção 1.4).
 */
function d26_tela_entrada(string $token, string $destino, ?string $erro = null): string
{
    $titulo = $erro ?? 'Caderno de Direito';
    $aviso = $erro === null ? '' : '<p role="alert">' . d26_tela_e($erro) . '</p>';
    return d26_tela_documento($titulo, '<h1>Caderno de Direito</h1>' . $aviso
        . '<form method="post" action="/api/acesso.php">'
        . '<label for="usuario">Usuário</label>'
        . '<input id="usuario" name="usuario" type="text" autocomplete="username" autofocus required>'
        . '<label for="senha">Senha</label>'
        . '<input id="senha" name="senha" type="password" autocomplete="current-password" required>'
        . '<input type="hidden" name="csrf" value="' . d26_tela_e($token) . '">'
        . '<input type="hidden" name="destino" value="' . d26_tela_e($destino) . '">'
        . '<button type="submit">Entrar</button>'
        . '</form>', d26_tela_aviso_legal());
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
