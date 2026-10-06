<?php
declare(strict_types=1);

/**
 * Apoio da suíte: registro de testes, asserções, ambiente isolado
 * (diretório privado temporário + php -S) e cliente HTTP com cookies
 * tratados à mão (Set-Cookie -> Cookie). Sem phpunit, sem curl.
 */

const RAIZ_REPO = __DIR__ . '/../../..';

final class Registro
{
    /** @var list<array{nome:string, corpo:callable, servidor:bool}> */
    public static array $testes = [];
}

function teste(string $nome, callable $corpo, bool $servidor = true): void
{
    Registro::$testes[] = ['nome' => $nome, 'corpo' => $corpo, 'servidor' => $servidor];
}

function falhar(string $mensagem): never
{
    throw new RuntimeException($mensagem);
}

function igual(mixed $esperado, mixed $real, string $contexto = ''): void
{
    if ($esperado !== $real) {
        falhar(
            ($contexto !== '' ? $contexto . ': ' : '')
            . 'esperado ' . var_export($esperado, true) . ', veio ' . var_export($real, true)
        );
    }
}

function verdadeiro(mixed $condicao, string $contexto): void
{
    if ($condicao !== true) {
        falhar('esperado true: ' . $contexto . ' (veio ' . var_export($condicao, true) . ')');
    }
}

function contem(string $trecho, string $texto, string $contexto = ''): void
{
    if (!str_contains($texto, $trecho)) {
        falhar(($contexto !== '' ? $contexto . ': ' : '') . "esperava encontrar '$trecho'");
    }
}

function naoContem(string $trecho, string $texto, string $contexto = ''): void
{
    if ($trecho !== '' && str_contains($texto, $trecho)) {
        falhar(($contexto !== '' ? $contexto . ': ' : '') . "não podia conter '$trecho'");
    }
}

function apagarArvore(string $caminho): void
{
    // Trava de segurança: só apaga o que esta suíte criou (L-53).
    $base = rtrim(getenv('TMPDIR') ?: '/var/tmp', '/') . '/d26-testes-';
    if (!str_starts_with($caminho, $base) || str_contains($caminho, '..')) {
        falhar("recusa apagar fora da área da suíte: $caminho");
    }
    if (!file_exists($caminho) && !is_link($caminho)) {
        return;
    }
    if (is_dir($caminho) && !is_link($caminho)) {
        foreach (scandir($caminho) ?: [] as $item) {
            if ($item !== '.' && $item !== '..') {
                apagarArvore($caminho . '/' . $item);
            }
        }
        @chmod($caminho, 0700);
        rmdir($caminho);
        return;
    }
    unlink($caminho);
}

function copiarArvore(string $origem, string $destino): void
{
    mkdir($destino, 0700, true);
    foreach (scandir($origem) ?: [] as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        is_dir("$origem/$item")
            ? copiarArvore("$origem/$item", "$destino/$item")
            : copy("$origem/$item", "$destino/$item");
    }
}

final class Resposta
{
    /** @param array<string, list<string>> $cabecalhos */
    public function __construct(
        public readonly int $status,
        public readonly array $cabecalhos,
        public readonly string $corpo
    ) {
    }

    /** @return array<string, mixed> */
    public function json(): array
    {
        $d = json_decode($this->corpo, true);
        if (!is_array($d)) {
            falhar("corpo não é JSON (HTTP {$this->status}): " . substr($this->corpo, 0, 200));
        }
        return $d;
    }

    public function cabecalho(string $nome): ?string
    {
        return $this->cabecalhos[strtolower($nome)][0] ?? null;
    }
}

final class Cliente
{
    /** @var array<string, string> */
    public array $cookies = [];
    public ?string $csrf = null;
    /** @var list<string> Set-Cookie bruto da última resposta */
    public array $ultimoSetCookie = [];

    public function __construct(private readonly string $base)
    {
    }

    public function origem(): string
    {
        return $this->base;
    }

    /** @param array<string, string|null> $cabecalhos null remove o cabeçalho padrão */
    public function get(string $caminho, array $cabecalhos = []): Resposta
    {
        return $this->enviar('GET', $caminho, null, $cabecalhos);
    }

    /**
     * @param array<string, mixed>|string|null $corpo array vira JSON; string vai crua
     * @param array<string, string|null> $cabecalhos
     */
    public function post(string $caminho, array|string|null $corpo = [], array $cabecalhos = []): Resposta
    {
        return $this->enviar('POST', $caminho, $corpo, $cabecalhos);
    }

    /**
     * @param array<string, mixed>|string|null $corpo
     * @param array<string, string|null> $cabecalhos
     */
    public function enviar(string $metodo, string $caminho, array|string|null $corpo, array $cabecalhos): Resposta
    {
        $h = [];
        if ($metodo === 'POST') {
            $h['Content-Type'] = 'application/json';
            $h['Origin'] = $this->base;
            if ($this->csrf !== null) {
                $h['X-CSRF-Token'] = $this->csrf;
            }
        }
        foreach ($cabecalhos as $k => $v) {
            if ($v === null) {
                unset($h[$k]);
            } else {
                $h[$k] = $v;
            }
        }
        if ($this->cookies !== []) {
            $pares = [];
            foreach ($this->cookies as $n => $v) {
                $pares[] = "$n=$v";
            }
            $h['Cookie'] = implode('; ', $pares);
        }
        $linhas = [];
        foreach ($h as $k => $v) {
            $linhas[] = "$k: $v";
        }
        $conteudo = is_array($corpo) ? json_encode($corpo, JSON_THROW_ON_ERROR) : (string) $corpo;
        $ctx = stream_context_create(['http' => [
            'method' => $metodo,
            'header' => implode("\r\n", $linhas),
            'content' => $metodo === 'GET' ? '' : $conteudo,
            'ignore_errors' => true,
            'follow_location' => 0,
            'timeout' => 30,
        ]]);
        $http_response_header = [];
        $corpoResp = @file_get_contents($this->base . $caminho, false, $ctx);
        if ($corpoResp === false) {
            falhar("sem resposta de {$this->base}$caminho");
        }
        $status = 0;
        $cabs = [];
        $this->ultimoSetCookie = [];
        foreach ($http_response_header as $linha) {
            if (preg_match('#^HTTP/\S+ (\d{3})#', $linha, $m) === 1) {
                $status = (int) $m[1];
                continue;
            }
            $pos = strpos($linha, ':');
            if ($pos === false) {
                continue;
            }
            $nome = strtolower(trim(substr($linha, 0, $pos)));
            $valor = trim(substr($linha, $pos + 1));
            $cabs[$nome][] = $valor;
            if ($nome === 'set-cookie') {
                $this->ultimoSetCookie[] = $valor;
                $this->aplicarCookie($valor);
            }
        }
        $resp = new Resposta($status, $cabs, $corpoResp);
        $j = json_decode($corpoResp, true);
        if (is_array($j) && isset($j['csrf']) && is_string($j['csrf'])) {
            $this->csrf = $j['csrf'];
        }
        return $resp;
    }

    private function aplicarCookie(string $setCookie): void
    {
        $partes = array_map('trim', explode(';', $setCookie));
        $nv = explode('=', (string) array_shift($partes), 2);
        $nome = $nv[0];
        $valor = $nv[1] ?? '';
        $expirado = false;
        foreach ($partes as $p) {
            if (stripos($p, 'expires=') === 0 && strtotime(substr($p, 8)) < time()) {
                $expirado = true;
            }
            if (stripos($p, 'max-age=') === 0 && (int) substr($p, 8) <= 0) {
                $expirado = true;
            }
        }
        if ($valor === '' || $valor === 'deleted' || $expirado) {
            unset($this->cookies[$nome]);
        } else {
            $this->cookies[$nome] = $valor;
        }
    }
}

/** Servidor php -S + diretório privado temporário, tudo isolado por teste. */
final class Ambiente
{
    /** @var list<Ambiente> */
    private static array $vivos = [];
    private static ?string $hashPadrao = null;

    public const LOGIN_ADMIN = 'chefe';
    public const SENHA_ADMIN = 'ProvisoriaTeste1';

    public string $raiz;
    public string $priv;
    public string $docroot;
    public string $base = '';
    public int $porta = 0;
    /** @var resource|null */
    private $processo = null;

    private int $workers = 0;

    /** @param array{docroot?:string, semRoteador?:bool, admin?:bool, deveTrocar?:bool, workers?:int} $opcoes */
    public static function novo(array $opcoes = []): self
    {
        $a = new self();
        $a->raiz = rtrim(getenv('TMPDIR') ?: '/var/tmp', '/') . '/d26-testes-' . bin2hex(random_bytes(6));
        mkdir($a->raiz, 0700, true);
        $a->priv = $a->raiz . '/privado';
        foreach ([$a->priv, $a->priv . '/sessoes', $a->priv . '/conteudo'] as $d) {
            mkdir($d, 0700, true);
        }
        $a->docroot = RAIZ_REPO . '/public';
        if (($opcoes['docroot'] ?? '') === 'copia') {
            $a->docroot = $a->raiz . '/site';
            copiarArvore(RAIZ_REPO . '/public/api', $a->docroot . '/api');
            file_put_contents($a->docroot . '/index.html', '<!doctype html><title>spa</title>');
            file_put_contents($a->docroot . '/arquivo.txt', 'estatico');
        }
        if ($opcoes['admin'] ?? true) {
            $a->semearUsuario(self::LOGIN_ADMIN, self::SENHA_ADMIN, true, $opcoes['deveTrocar'] ?? false);
        }
        $a->workers = (int) ($opcoes['workers'] ?? 0);
        self::$vivos[] = $a; // antes de iniciar: se o php -S falhar, ainda assim é limpo
        $a->iniciar((bool) ($opcoes['semRoteador'] ?? false));
        return $a;
    }

    public static function hashPadrao(string $senha): string
    {
        // Um hash por senha, reaproveitado entre testes (custo real do Argon2id, 1 vez).
        static $cache = [];
        return $cache[$senha] ??= password_hash(
            $senha,
            PASSWORD_ARGON2ID,
            ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1]
        );
    }

    public function semearUsuario(string $login, string $senha, bool $admin, bool $deveTrocar, bool $ativo = true): void
    {
        $arq = $this->priv . '/usuarios.json';
        $d = is_file($arq) ? json_decode((string) file_get_contents($arq), true) : ['versao' => 1, 'usuarios' => []];
        $d['usuarios'][] = [
            'usuario' => $login,
            'hash' => self::hashPadrao($senha),
            'admin' => $admin,
            'ativo' => $ativo,
            'deveTrocarSenha' => $deveTrocar,
            'versaoSessao' => 1,
            'criadoEm' => gmdate('c'),
            'ultimoLogin' => null,
        ];
        file_put_contents($arq, json_encode($d, JSON_THROW_ON_ERROR));
        chmod($arq, 0600);
    }

    public function semearConteudo(string $json): void
    {
        $arq = $this->priv . '/conteudo/interdisciplinar.json';
        file_put_contents($arq, $json);
        chmod($arq, 0600);
    }

    /** @return array<string, mixed> */
    public function lerUsuarios(): array
    {
        return json_decode((string) file_get_contents($this->priv . '/usuarios.json'), true, 16, JSON_THROW_ON_ERROR);
    }

    public function zerarTentativas(): void
    {
        $arq = $this->priv . '/tentativas.json';
        if (is_file($arq)) {
            unlink($arq);
        }
    }

    public function cliente(): Cliente
    {
        return new Cliente($this->base);
    }

    /** Cliente já com sessão anônima e csrf. */
    public function clienteComSessao(): Cliente
    {
        $c = $this->cliente();
        $c->get('/api/sessao.php');
        return $c;
    }

    /** Cliente autenticado (falha o teste se o login não for 200). */
    public function entrar(string $login = self::LOGIN_ADMIN, string $senha = self::SENHA_ADMIN): Cliente
    {
        $c = $this->clienteComSessao();
        $r = $c->post('/api/entrar.php', ['usuario' => $login, 'senha' => $senha]);
        igual(200, $r->status, "login de $login");
        return $c;
    }

    private function iniciar(bool $semRoteador): void
    {
        $sock = stream_socket_server('tcp://127.0.0.1:0', $codigo, $msg);
        if ($sock === false) {
            falhar("sem porta livre: $msg");
        }
        $this->porta = (int) substr((string) stream_socket_get_name($sock, false), strrpos((string) stream_socket_get_name($sock, false), ':') + 1);
        fclose($sock);
        $this->base = 'http://127.0.0.1:' . $this->porta;

        $cmd = [PHP_BINARY, '-S', '127.0.0.1:' . $this->porta, '-t', $this->docroot];
        if (!$semRoteador) {
            $cmd[] = RAIZ_REPO . '/servidor/dev/roteador.php';
        }
        $env = getenv();
        $env['D26_PRIVADO'] = $this->priv;
        if ($this->workers > 1) {
            $env['PHP_CLI_SERVER_WORKERS'] = (string) $this->workers;
        }
        $saida = $this->raiz . '/servidor.log';
        $this->processo = proc_open(
            $cmd,
            [0 => ['file', '/dev/null', 'r'], 1 => ['file', $saida, 'a'], 2 => ['file', $saida, 'a']],
            $pipes,
            null,
            $env
        ) ?: null;
        if ($this->processo === null) {
            falhar('não consegui iniciar php -S');
        }
        for ($i = 0; $i < 100; $i++) {
            $f = @fsockopen('127.0.0.1', $this->porta, $en, $es, 0.2);
            if ($f !== false) {
                fclose($f);
                return;
            }
            usleep(50000);
        }
        falhar('php -S não respondeu: ' . (string) @file_get_contents($saida));
    }

    public function parar(): void
    {
        if ($this->processo !== null) {
            $pid = (int) (proc_get_status($this->processo)['pid'] ?? 0);
            // Com workers, o pai morre e os filhos ficam órfãos: coleta antes.
            $filhos = $pid > 0 ? self::descendentes($pid) : [];
            proc_terminate($this->processo);
            proc_close($this->processo);
            $this->processo = null;
            self::matar($filhos);
        }
        apagarArvore($this->raiz);
    }

    /** @return list<int> pids descendentes de $pid (varre /proc, sem posix). */
    public static function descendentes(int $pid): array
    {
        $pais = [];
        foreach (glob('/proc/[0-9]*/stat') ?: [] as $arq) {
            $txt = @file_get_contents($arq);
            if ($txt !== false && preg_match('/^(\d+) \(.*\) \S (\d+) /s', $txt, $m) === 1) {
                $pais[(int) $m[2]][] = (int) $m[1];
            }
        }
        $achados = [];
        $fila = [$pid];
        while ($fila !== []) {
            $p = array_shift($fila);
            foreach ($pais[$p] ?? [] as $f) {
                $achados[] = $f;
                $fila[] = $f;
            }
        }
        return $achados;
    }

    /** @param list<int> $pids */
    private static function matar(array $pids): void
    {
        foreach ($pids as $p) {
            $k = proc_open(['kill', '-TERM', (string) $p], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $x);
            if (is_resource($k)) {
                proc_close($k);
            }
        }
        for ($i = 0; $i < 40 && array_filter($pids, static fn (int $p): bool => is_dir("/proc/$p")) !== []; $i++) {
            usleep(50000);
        }
    }

    /** Intervalos [início, fim] de cada password_verify que rodou (só php -S). @return list<array{float, float}> */
    public function verificacoes(): array
    {
        $arq = $this->priv . '/verificacoes.log';
        $abertas = [];
        $feitas = [];
        foreach (is_file($arq) ? (file($arq, FILE_IGNORE_NEW_LINES) ?: []) : [] as $linha) {
            [$fase, $t] = explode(' ', $linha) + ['', '0'];
            if ($fase === 'i') {
                $abertas[] = (float) $t;
            } elseif ($fase === 'f' && $abertas !== []) {
                $feitas[] = [array_shift($abertas), (float) $t];
            }
        }
        return $feitas;
    }

    public static function limparTudo(): void
    {
        foreach (self::$vivos as $a) {
            $a->parar();
        }
        self::$vivos = [];
    }
}

register_shutdown_function(static function (): void {
    Ambiente::limparTudo();
});
