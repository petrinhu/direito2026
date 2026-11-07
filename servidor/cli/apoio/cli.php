<?php
declare(strict_types=1);

/**
 * Apoio dos CLIs de conta (definir-admin, remover-conta, auditar-contas).
 * Estes CLIs vão ao servidor junto com a pasta apoio/. criar-admin.php é
 * autocontido de propósito: o runbook de V6 copia só ele.
 */

/** Recusa curta em pt-br. Nunca ecoa argumento: a mensagem não pode carregar senha. */
function d26_cli_falha(string $cmd, string $msg): never
{
    fwrite(STDERR, "$cmd: $msg\n");
    exit(1);
}

/**
 * Erro inesperado sai em uma linha, sem pilha de chamadas: a pilha mostra os
 * argumentos das funções, e um hash ou uma senha pode estar entre eles.
 */
function d26_cli_protegido(string $cmd): void
{
    set_exception_handler(static function (Throwable $e) use ($cmd): void {
        fwrite(STDERR, "$cmd: erro interno ao acessar o arquivo de contas (detalhes omitidos de propósito)\n");
        exit(1);
    });
}

/**
 * Carrega o núcleo: D26_NUCLEO, ou public/api/nucleo do repositório. Falha
 * fechada se faltar módulo.
 *
 * @param list<string> $modulos
 */
function d26_cli_carregar_nucleo(string $cmd, array $modulos): void
{
    $nucleo = getenv('D26_NUCLEO') ?: dirname(__DIR__) . '/../../public/api/nucleo';
    define('D26_API', true);
    foreach ($modulos as $modulo) {
        $arquivo = rtrim($nucleo, '/') . "/$modulo.php";
        if (!is_file($arquivo)) {
            d26_cli_falha($cmd, 'núcleo não encontrado; defina D26_NUCLEO com a pasta api/nucleo');
        }
        require_once $arquivo;
    }
    umask(0077);
}

/**
 * Separa opções (--chave ou --chave=valor) dos posicionais. Opção fora de
 * $permitidas, ou repetida, é recusada sem ecoar o valor: um --senha=... digitado
 * por engano não pode aparecer em erro nem em log.
 *
 * @param list<string> $args
 * @param list<string> $permitidas nomes sem "--"
 * @return array{0: list<string>, 1: array<string, string>} [posicionais, opções]
 */
function d26_cli_separar(string $cmd, array $args, array $permitidas): array
{
    $posicionais = [];
    $opcoes = [];
    foreach ($args as $a) {
        if (!str_starts_with($a, '--')) {
            $posicionais[] = $a;
            continue;
        }
        [$nome, $valor] = array_pad(explode('=', substr($a, 2), 2), 2, '');
        if (!in_array($nome, $permitidas, true)) {
            d26_cli_falha($cmd, 'opção desconhecida (o valor informado não foi lido nem mostrado)');
        }
        if (array_key_exists($nome, $opcoes)) {
            d26_cli_falha($cmd, "opção --$nome repetida");
        }
        $opcoes[$nome] = $valor;
    }
    return [$posicionais, $opcoes];
}

/** Pasta privada existente, com usuarios.json. Sem ele, falha em vez de mostrar zero contas. */
function d26_cli_privado(string $cmd, string $priv): string
{
    $priv = rtrim($priv, '/');
    if (!is_dir($priv) || !is_file(d26_contas_arquivo($priv))) {
        d26_cli_falha($cmd, 'diretório privado ou usuarios.json não encontrado');
    }
    return $priv;
}

function d26_cli_login(string $cmd, string $login): void
{
    if (!d26_login_valido($login)) {
        d26_cli_falha($cmd, 'login inválido (3 a 32 caracteres: letras, números, ponto, hífen, sublinhado)');
    }
}
