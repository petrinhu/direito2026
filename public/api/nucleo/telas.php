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

/** CSP das telas de entrada, troca e indisponível (seção 1.3). */
const PORTAO_CSP_TELA = "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

function d26_tela_csp(): string
{
    return PORTAO_CSP_TELA;
}

/** Escapa para atributo ou texto de HTML. */
function d26_tela_e(string $valor): string
{
    return htmlspecialchars($valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Documento HTML mínimo: título fixo e o CSS público de entrada.css. */
function d26_tela_documento(string $titulo, string $corpo): string
{
    return '<!doctype html><html lang="pt-br"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow">'
        . '<title>' . d26_tela_e($titulo) . '</title>'
        . '<link rel="stylesheet" href="/entrada.css">'
        . '</head><body><main>' . $corpo . '</main></body></html>';
}

/**
 * Tela de entrada: usuário, senha, token CSRF (HMAC do cookie pré) e destino oculto.
 * O formulário vai para acesso.php, que a F2.5 implementa.
 */
function d26_tela_entrada(string $token, string $destino): string
{
    return d26_tela_documento('Caderno de Direito', '<h1>Caderno de Direito</h1>'
        . '<form method="post" action="/api/acesso.php">'
        . '<label for="usuario">Usuário</label>'
        . '<input id="usuario" name="usuario" type="text" autocomplete="username" autofocus required>'
        . '<label for="senha">Senha</label>'
        . '<input id="senha" name="senha" type="password" autocomplete="current-password" required>'
        . '<input type="hidden" name="csrf" value="' . d26_tela_e($token) . '">'
        . '<input type="hidden" name="destino" value="' . d26_tela_e($destino) . '">'
        . '<button type="submit">Entrar</button>'
        . '</form>');
}

/** Tela de troca obrigatória: nada do app sai antes dela. O formulário é ligado na F2.5. */
function d26_tela_troca(): string
{
    return d26_tela_documento('Caderno de Direito', '<h1>Caderno de Direito</h1>'
        . '<p>Troca de senha obrigatória antes de continuar.</p>');
}

/** Tela de serviço indisponível, em navegação (503 fechado). */
function d26_tela_indisponivel(): string
{
    return d26_tela_documento('Caderno de Direito', '<h1>Caderno de Direito</h1>'
        . '<p>Serviço indisponível no momento. Tente de novo em instantes.</p>');
}
