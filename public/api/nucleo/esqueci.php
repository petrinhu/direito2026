<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * "Esqueci a senha" por e-mail (EM-B4, plano 8.1.3). O pedido responde ANTES de ler usuarios.json (OWASP: resposta
 * e tempo iguais para conta existente ou não). Validade do link: 24 h (R18); convite e redefinir seguem com 48 h.
 */
const D26_ESQUECI_VALIDADE = 86400;

/**
 * Sequência do pedido (8.1.3, passos 3 e 4; TE4): responde, termina a resposta, só então busca e envia. Os três
 * passos entram como callables para que o teste prove a ordem por injeção, sem depender de tempo. Sem término de
 * resposta (php -S), o envio é síncrono e fica uma linha envio-sincrono, como no convite (EM-B3). Exceção na busca
 * vai ao erros.log só pela classe: a resposta já saiu e não muda.
 *
 * @param callable(): void $responder monta e envia a resposta sem encerrar o script
 * @param callable(): bool $terminar d26_terminar_resposta
 * @param callable(): void $buscar leitura de usuarios.json, convite e E2
 */
function d26_esqueci_sequencia(string $priv, callable $responder, callable $terminar, callable $buscar): void
{
    $responder();
    if (!$terminar()) {
        d26_log_erro_em($priv, 'envio', 'envio-sincrono');
    }
    try {
        $buscar();
    } catch (Throwable $e) {
        d26_log_erro_em($priv, 'esqueci', 'pedido: ' . get_class($e));
    }
}

/**
 * Passo 4 (8.1.3): acha a conta, confere elegibilidade (ativa, com e-mail), aplica os limites da conta e o teto
 * diário, grava o convite de 24 h sob o lock (só o convite) e envia o E2 FORA de qualquer lock (TE1). Falha do envio
 * marca envioFalhouEm; sucesso apaga a marca. Nada disto chega ao cliente.
 */
function d26_esqueci_tratar(string $priv, string $pedido, int $agora): void
{
    $conta = d26_contas_pedido_achar(d26_contas_listar($priv), $pedido);
    if ($conta === null || ($conta['ativo'] ?? null) !== true || !is_string($conta['email'] ?? null)) {
        return;
    }
    $destino = (string) $conta['email'];
    $login = (string) $conta['usuario'];
    $uidLido = is_string($conta['uid'] ?? null) ? $conta['uid'] : '';
    if ($uidLido === '') {
        return;
    }
    if (!d26_limite_envio_conta($priv, $login, $agora)) {
        return;
    }
    if (!d26_limite_envio_teto($priv, $agora)) {
        d26_log_erro_em($priv, 'envio', 'envio-teto');
        return;
    }
    d26_teste_pausar('esqueci-antes-pedir', $login); // janela entre a leitura e a gravação (no-op em produção)
    $token = d26_convite_token();
    $emailNoLock = null; // o destino do E2 é o e-mail que a conta tem DENTRO do lock (corrida com a troca de e-mail)
    if (d26_contas_pedir_senha($priv, $login, d26_convite_registro($token, $agora, D26_ESQUECI_VALIDADE), $uidLido, $destino, $emailNoLock) !== 'ok' || $emailNoLock === null) {
        return;
    }
    $saiu = d26_correio_avisar($priv, d26_correio_msg_esqueci($emailNoLock, $login, D26_ORIGEM . d26_convite_caminho($token)));
    d26_contas_marcar_envio($priv, $login, $saiu ? null : gmdate('c'));
}
