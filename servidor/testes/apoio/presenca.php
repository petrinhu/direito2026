<?php
declare(strict_types=1);

/**
 * Apoio dos casos de presença (V17-P3): helpers que antes moravam em presenca.teste.php. Carregado com
 * require_once pelos arquivos presenca-*.teste.php; fora do glob *.teste.php, então não vira suíte.
 */

const PRESENCA_SENHA_ANA = 'SenhaDaAna-2026';

/** Arquivo de presença da conta: o nome não traz o login (hash com prefixo, como as chaves de tentativas). */
function presencaArquivo(Ambiente $a, string $login): string
{
    return $a->priv . '/presenca/' . hash('sha256', 'presenca' . "\0" . $login) . '.json';
}

/** Cria a pasta como o provisionamento do CLI faz (o web nunca cria). */
function presencaPasta(Ambiente $a): void
{
    if (!is_dir($a->priv . '/presenca')) {
        mkdir($a->priv . '/presenca', 0700);
    }
}

/** Conta comum de teste, ativa e sem troca pendente. */
function presencaAna(Ambiente $a): void
{
    $a->semearUsuario('ana', PRESENCA_SENHA_ANA, false, false);
}

/** Linha da conta na listagem do admin (GET /api/usuarios.php). */
function presencaLinha(Cliente $adm, string $login): array
{
    $r = $adm->get('/api/usuarios.php');
    igual(200, $r->status, 'listagem do admin');
    foreach ($r->json()['usuarios'] as $u) {
        if (($u['usuario'] ?? null) === $login) {
            return $u;
        }
    }
    throw new RuntimeException('conta ausente na listagem');
}

/** Edita a conta em usuarios.json (mesma técnica de conviteEditarConta). */
function presencaEditar(Ambiente $a, string $login, callable $fn): void
{
    $arq = $a->priv . '/usuarios.json';
    $d = json_decode((string) file_get_contents($arq), true, 512, JSON_THROW_ON_ERROR);
    foreach ($d['usuarios'] as $i => $c) {
        if (($c['usuario'] ?? null) === $login) {
            $d['usuarios'][$i] = $fn($c);
        }
    }
    file_put_contents($arq, json_encode($d, JSON_THROW_ON_ERROR));
}

/** Lê o arquivo de presença da conta; falha de forma explícita se ele ainda não existe. */
function presencaLerArquivo(Ambiente $a, string $login): array
{
    $arq = presencaArquivo($a, $login);
    verdadeiro(is_file($arq), 'arquivo de presença ausente: ainda não foi gravado');
    return json_decode((string) file_get_contents($arq), true, 512, JSON_THROW_ON_ERROR);
}

/** Edita o arquivo de presença da conta (idade e data, para simular o tempo). */
function presencaEditarArquivo(Ambiente $a, string $login, callable $fn): void
{
    $dados = presencaLerArquivo($a, $login);
    $arq = presencaArquivo($a, $login);
    file_put_contents($arq, json_encode($fn($dados), JSON_THROW_ON_ERROR));
}

/** Presença velha (13 h e um minuto), gravada direto: simula conta que parou de usar o sistema há muito tempo. */
function presencaEscreverVelha(Ambiente $a, string $login): void
{
    $velha = time() - 13 * 3600 - 60;
    file_put_contents(presencaArquivo($a, $login), json_encode(['m' => str_repeat('0', 64), 'v' => 1, 'a' => $velha, 'c' => $velha], JSON_THROW_ON_ERROR));
    chmod(presencaArquivo($a, $login), 0600);
}

/** Marcador da faxina oportunista: o mtime dele é a última faxina. Envelhecê-lo libera a próxima. */
function presencaEnvelhecerFaxina(Ambiente $a, int $segundos): void
{
    $m = $a->priv . '/presenca/.faxina';
    verdadeiro(is_file($m), 'o marcador da faxina existe depois do primeiro login');
    touch($m, time() - $segundos);
    clearstatcache();
}

/** Pasta no lugar do arquivo da conta: a gravação da presença falha sem depender de permissão (ADM-F6h). */
function presencaFalharGravacao(Ambiente $a): void
{
    presencaAna($a);
    presencaPasta($a);
    mkdir(presencaArquivo($a, 'ana'), 0700);
    // Marcador fresco: a faxina não roda nos logins e o glob de *.json não é o assunto destes casos.
    touch($a->priv . '/presenca/.faxina');
}

/** Linhas do erros.log cujo resto, depois do primeiro espaço, é exatamente "presenca <frase>" (sem casar pedaço). */
function presencaAvisosNoLog(Ambiente $a, string $frase): int
{
    $n = 0;
    foreach (explode("\n", (string) @file_get_contents($a->priv . '/erros.log')) as $linha) {
        $partes = explode(' ', $linha, 2);
        if (count($partes) === 2 && $partes[1] === 'presenca ' . $frase) {
            $n++;
        }
    }
    return $n;
}
