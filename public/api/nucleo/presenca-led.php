<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * O LED: a conta está com sessão aberta? Mesma regra de d26_sessao_avaliar, aplicada à presença gravada: conta ativa,
 * sem bloqueio, mesma versão, marcador conferindo e dentro das duas janelas.
 *
 * @param array<string, mixed> $conta
 * @param array{m: string, v: int, a: int, c: int}|null $presenca
 */
function d26_presenca_conectada(array $conta, ?array $presenca, int $agora): bool
{
    if ($presenca === null || ($conta['ativo'] ?? null) !== true || array_key_exists('bloqueada', $conta)) {
        return false;
    }
    // Presença com mais de 13 h conta como ausente, mesmo que ainda não tenha sido apagada pela faxina.
    if ($agora - $presenca['a'] > D26_PRESENCA_FAXINA) {
        return false;
    }
    if (!is_string($conta['sessaoVigente'] ?? null) || (int) ($conta['versaoSessao'] ?? -1) !== $presenca['v']) {
        return false;
    }
    if ($agora - $presenca['a'] > D26_SESSAO_OCIOSIDADE || $agora - $presenca['c'] > D26_SESSAO_VALIDADE) {
        return false;
    }
    return hash_equals($presenca['m'], d26_presenca_marcador($conta['sessaoVigente']));
}

/** Atalho da listagem: lê a presença da conta e aplica a regra. */
function d26_presenca_conectada_conta(string $priv, array $conta, int $agora): bool
{
    return d26_presenca_conectada($conta, d26_presenca_ler($priv, (string) $conta['usuario']), $agora);
}
