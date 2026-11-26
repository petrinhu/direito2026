<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/**
 * Poda de 90 dias do registro de limite (LGPD-LIMITE, ordem do líder de 25/11/2026).
 *
 * Alcance: só as linhas de contexto `limite-conta` do erros.log, no formato de d26_log_erro_em
 * (data UTC ISO 8601, contexto, detalhe). Outras linhas do erros.log ficam como estão.
 *
 * Interruptor: $priv/poda-lgpd.json, criado à mão pelo líder. É a assinatura da sub-fase 5.3:
 *   {"publicado_em": <unix, instante da publicação>, "assinatura": "<nome do líder>"}
 * Sem o arquivo, ilegível, sem assinatura ou com menos de D26_PODA_CARENCIA (48 h) desde a
 * publicação, a poda não muda nada: o erros.log fica byte a byte igual.
 *
 * Rito de cada poda, na ordem (na dúvida, a linha fica):
 *  1. linha com data legível, de no máximo D26_PODA_LINHA_MAX (90 dias) fica;
 *  2. linha de incidente confirmado (data listada em incidentes-linhas.txt) vai inteira para
 *     incidentes.log, que esta poda não apaga;
 *  3. as demais linhas vencidas vão, inteiras, para poda-quarentena/q-<instante>.log (600),
 *     que a própria poda purga D26_PODA_QUARENTENA (30 dias) depois da entrada;
 *  4. só depois de gravar e conferir 2 e 3, o erros.log é reescrito no mesmo inode, sob flock
 *     exclusivo, com as linhas que ficaram.
 *
 * Sem linha nova: a poda não grava no erros.log e não chama d26_log_erro_em sob a trava.
 * O gancho d26_poda_oportunista roda dentro da reserva de login, no máximo uma vez por hora
 * (marcador poda-lgpd.marca), e nunca derruba o login: qualquer falha vira uma linha no erros.log.
 */
const D26_PODA_CARENCIA = 172800;
const D26_PODA_LINHA_MAX = 7776000;
const D26_PODA_QUARENTENA = 2592000;
const D26_PODA_INTERVALO = 3600;
const D26_PODA_CONTEXTO = 'limite-conta';

/** Interruptor válido ou null. Qualquer defeito conta como desligado (falha fechada). @return array{publicado_em:int, assinatura:string}|null */
function d26_poda_estado(string $priv): ?array
{
    $arq = $priv . '/poda-lgpd.json';
    if (!is_file($arq)) {
        return null;
    }
    $d = json_decode((string) @file_get_contents($arq), true);
    if (!is_array($d) || !is_int($d['publicado_em'] ?? null)) {
        return null;
    }
    $assinatura = $d['assinatura'] ?? null;
    if (!is_string($assinatura) || trim($assinatura) === '') {
        return null;
    }
    return ['publicado_em' => $d['publicado_em'], 'assinatura' => $assinatura];
}

/** Instante da linha (data do formato de d26_log_erro_em) ou null se não for legível. */
function d26_poda_instante(string $palavra): ?int
{
    if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/', $palavra) !== 1) {
        return null;
    }
    $t = strtotime($palavra);
    return $t === false ? null : $t;
}

/** Grava (anexa) em arquivo 600, com fsync, e confere os bytes. Falha dispara exceção, e nada depois dela roda. */
function d26_poda_gravar(string $arq, string $dados): void
{
    if (!file_exists($arq)) {
        // Cria já em 600: o arquivo nunca fica legível pela umask do processo.
        if (@touch($arq) === false) {
            throw new RuntimeException('não criou ' . basename($arq));
        }
        @chmod($arq, 0600);
    }
    $h = @fopen($arq, 'ab');
    if ($h === false) {
        throw new RuntimeException('não abriu ' . basename($arq));
    }
    try {
        if (!flock($h, LOCK_EX)) {
            throw new RuntimeException('trava de ' . basename($arq));
        }
        $escritos = fwrite($h, $dados);
        fflush($h);
        fsync($h);
        flock($h, LOCK_UN);
        if ($escritos !== strlen($dados)) {
            throw new RuntimeException('escrita incompleta em ' . basename($arq));
        }
    } finally {
        fclose($h);
    }
}

/**
 * Poda do erros.log. Devolve o que fez: situacao (desarmada|armada), saiu, incidentes e purgadas.
 * Lança exceção em falha de gravação; nesse caso o erros.log não foi reescrito.
 *
 * @return array{situacao: string, saiu: int, incidentes: int, purgadas: int}
 */
function d26_poda_erros(string $priv, int $agora): array
{
    $vazio = ['situacao' => 'desarmada', 'saiu' => 0, 'incidentes' => 0, 'purgadas' => 0];
    $estado = d26_poda_estado($priv);
    if ($estado === null || $agora < $estado['publicado_em'] + D26_PODA_CARENCIA) {
        return $vazio;
    }
    $res = ['situacao' => 'armada', 'saiu' => 0, 'incidentes' => 0, 'purgadas' => 0];
    $arq = $priv . '/erros.log';
    if (is_file($arq)) {
        $res = array_merge($res, d26_poda_reescrever($priv, $arq, $agora));
    }
    $res['purgadas'] = d26_poda_purgar_quarentena($priv, $agora);
    return $res;
}

/** @return array{saiu: int, incidentes: int} */
function d26_poda_reescrever(string $priv, string $arq, int $agora): array
{
    $h = @fopen($arq, 'c+');
    if ($h === false) {
        throw new RuntimeException('erros.log indisponível');
    }
    try {
        if (!flock($h, LOCK_EX)) {
            throw new RuntimeException('trava do erros.log');
        }
        rewind($h);
        $bruto = (string) stream_get_contents($h);
        $incidentes = d26_poda_datas_de_incidente($priv);
        [$manter, $sairQuarentena, $irIncidente] = d26_poda_separar($bruto, $agora, $incidentes);
        if ($sairQuarentena === '' && $irIncidente === '') {
            return ['saiu' => 0, 'incidentes' => 0];
        }
        if ($irIncidente !== '') {
            d26_poda_gravar($priv . '/incidentes.log', $irIncidente);
        }
        if ($sairQuarentena !== '') {
            $dir = $priv . '/poda-quarentena';
            if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
                throw new RuntimeException('pasta de quarentena');
            }
            chmod($dir, 0700);
            d26_poda_gravar($dir . '/q-' . $agora . '.log', $sairQuarentena);
        }
        // Reescrita no mesmo inode: o gravador abre em append e trava o mesmo arquivo, então nenhuma linha concorrente se perde.
        rewind($h);
        $escritos = fwrite($h, $manter);
        if ($escritos !== strlen($manter)) {
            throw new RuntimeException('reescrita incompleta do erros.log');
        }
        fflush($h);
        ftruncate($h, strlen($manter));
        fsync($h);
        return [
            'saiu' => substr_count($sairQuarentena, "\n"),
            'incidentes' => substr_count($irIncidente, "\n"),
        ];
    } finally {
        flock($h, LOCK_UN);
        fclose($h);
    }
}

/** @return array<string, true> datas (texto exato da primeira palavra da linha) marcadas como incidente. */
function d26_poda_datas_de_incidente(string $priv): array
{
    $arq = $priv . '/incidentes-linhas.txt';
    $datas = [];
    if (!is_file($arq)) {
        return $datas;
    }
    foreach (explode("\n", (string) file_get_contents($arq)) as $l) {
        $l = trim($l);
        if ($l !== '') {
            $datas[$l] = true;
        }
    }
    return $datas;
}

/**
 * Separa o conteúdo em [manter, quarentena, incidente]. Linha incompleta (sem quebra final) fica.
 *
 * @param array<string, true> $incidentes
 * @return array{0: string, 1: string, 2: string}
 */
function d26_poda_separar(string $bruto, int $agora, array $incidentes): array
{
    $partes = explode("\n", $bruto);
    $resto = (string) array_pop($partes);
    $manter = '';
    $quarentena = '';
    $incidente = '';
    foreach ($partes as $p) {
        $linha = $p . "\n";
        if (!preg_match('/^(\S+) (\S+) /', $p, $m)) {
            $manter .= $linha;
            continue;
        }
        $t = d26_poda_instante($m[1]);
        $venceu = $m[2] === D26_PODA_CONTEXTO && $t !== null && $t <= $agora && $agora - $t > D26_PODA_LINHA_MAX;
        if (!$venceu) {
            $manter .= $linha;
        } elseif (isset($incidentes[$m[1]])) {
            $incidente .= $linha;
        } else {
            $quarentena .= $linha;
        }
    }
    return [$manter . $resto, $quarentena, $incidente];
}

/** Purga cópias de quarentena com D26_PODA_QUARENTENA ou mais. Só mexe nos arquivos q-<instante>.log. */
function d26_poda_purgar_quarentena(string $priv, int $agora): int
{
    $dir = $priv . '/poda-quarentena';
    if (!is_dir($dir)) {
        return 0;
    }
    $n = 0;
    foreach (glob($dir . '/q-*.log') ?: [] as $arq) {
        if (preg_match('/\/q-(\d+)\.log$/', $arq, $m) === 1 && $agora - (int) $m[1] >= D26_PODA_QUARENTENA) {
            if (@unlink($arq)) {
                $n++;
            }
        }
    }
    return $n;
}

/**
 * Gancho do login: a poda roda no máximo uma vez por D26_PODA_INTERVALO. Sem interruptor não toca em nada
 * (nem marcador). Qualquer falha vira uma linha no erros.log, depois de liberada a trava, e não derruba o login.
 */
function d26_poda_oportunista(string $priv, int $agora): void
{
    if (!is_file($priv . '/poda-lgpd.json')) {
        return;
    }
    $marca = $priv . '/poda-lgpd.marca';
    clearstatcache(true, $marca);
    if (is_file($marca) && $agora - (int) filemtime($marca) < D26_PODA_INTERVALO) {
        return;
    }
    @touch($marca, $agora);
    @chmod($marca, 0600);
    try {
        d26_poda_erros($priv, $agora);
    } catch (Throwable $e) {
        d26_log_erro_em($priv, 'poda-limite', 'poda do registro de limite falhou (' . $e->getMessage() . ')');
    }
}
