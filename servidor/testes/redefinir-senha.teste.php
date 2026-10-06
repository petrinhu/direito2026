<?php
declare(strict_types=1);

/** @return array{int, string, string} [código, stdout, stderr] */
function rodarRedefinir(array $args, string $stdin): array
{
    $p = proc_open(
        array_merge([PHP_BINARY, RAIZ_REPO . '/servidor/cli/redefinir-senha.php'], $args),
        [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes
    );
    fwrite($pipes[0], $stdin);
    fclose($pipes[0]);
    $out = (string) stream_get_contents($pipes[1]);
    $err = (string) stream_get_contents($pipes[2]);
    return [proc_close($p), $out, $err];
}

/** Dois logins (um admin, um comum) já em uso: aparelho, sessão avançada e contadores sujos. @return array{string, string} [dir, priv] */
function privParaRedefinir(): array
{
    $dir = dirTemporarioCli();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    d26_garantir_estrutura($priv);
    igual('ok', d26_contas_criar($priv, 'chefe', d26_hash_senha('SenhaAntiga123'), true));
    igual('ok', d26_contas_criar($priv, 'outra', d26_hash_senha('SenhaDaOutra123'), false));
    foreach (['chefe', 'outra'] as $l) {
        d26_contas_mutar($priv, $l, static function (array &$c): string {
            $c['deveTrocarSenha'] = false;
            d26_dispositivo_anexar($c, bin2hex(random_bytes(16)), time());
            return 'ok';
        });
        saturarConta($priv, $l);
    }
    return [$dir, $priv];
}

teste('cli redefinir-senha: nova senha vale, a antiga não, troca obrigatória, sessões e aparelhos derrubados, contadores zerados', function (): void {
    [$dir, $priv] = privParaRedefinir();
    $antes = d26_contas_buscar($priv, 'chefe');
    verdadeiro(count($antes['aparelhos']) === 1, 'aparelho de partida');
    [$rc, $out, $err] = rodarRedefinir([$priv, 'chefe'], "Curta\n");
    igual(0, $rc, "saída: $out $err");
    igual("Senha redefinida: chefe (deve trocar no próximo acesso)\n", $out);
    naoContem('Curta', $out . $err, 'senha não é ecoada');
    naoContem('$argon2', $out . $err, 'hash não é impresso');
    $c = d26_contas_buscar($priv, 'chefe');
    verdadeiro(password_verify('Curta', $c['hash']), 'senha nova confere');
    verdadeiro(!password_verify('SenhaAntiga123', $c['hash']), 'senha antiga não confere');
    verdadeiro(str_starts_with($c['hash'], '$argon2id$'), 'argon2id');
    igual(true, $c['deveTrocarSenha']);
    igual($antes['versaoSessao'] + 1, $c['versaoSessao']);
    igual([], $c['aparelhos']);
    igual(true, $c['admin'], 'admin intacto');
    igual(true, $c['ativo'], 'ativo intacto');
    igual($antes['uid'], $c['uid']);
    igual(0, d26_limite_reservar($priv, 'chefe', '192.0.2.99', time()), 'contadores da conta zerados');
    apagarArvore($dir);
}, false);

teste('cli redefinir-senha: outra conta e os contadores dela ficam intactos; desativada continua desativada', function (): void {
    [$dir, $priv] = privParaRedefinir();
    d26_contas_definir_ativo($priv, 'chefe', false);
    $outraAntes = d26_contas_buscar($priv, 'outra');
    igual(0, rodarRedefinir([$priv, 'chefe'], "Provisoria\n")[0]);
    igual($outraAntes, d26_contas_buscar($priv, 'outra'), 'outra conta idêntica');
    verdadeiro(d26_limite_reservar($priv, 'outra', '192.0.2.99', time()) > 0, 'outra continua trancada');
    igual(false, d26_contas_buscar($priv, 'chefe')['ativo'], 'não reativa');
    apagarArvore($dir);
}, false);

teste('cli redefinir-senha: conta inexistente (ou de outra caixa), login inválido, senha ausente e argumentos faltando falham sem gravar', function (): void {
    [$dir, $priv] = privParaRedefinir();
    $arquivo = (string) file_get_contents($priv . '/usuarios.json');
    verdadeiro(rodarRedefinir([$priv, 'fantasma'], "Nova\n")[0] !== 0, 'inexistente');
    verdadeiro(rodarRedefinir([$priv, 'CHEFE'], "Nova\n")[0] !== 0, 'case-sensitive');
    verdadeiro(rodarRedefinir([$priv, 'a b'], "Nova\n")[0] !== 0, 'login inválido');
    verdadeiro(rodarRedefinir([$priv, 'chefe'], "\n")[0] !== 0, 'senha vazia');
    verdadeiro(rodarRedefinir([$priv, 'chefe'], '')[0] !== 0, 'sem STDIN');
    verdadeiro(rodarRedefinir([$priv], "Nova\n")[0] !== 0, 'sem login');
    verdadeiro(rodarRedefinir([$dir . '/nao-existe', 'chefe'], "Nova\n")[0] !== 0, 'pasta inexistente');
    verdadeiro(!file_exists($dir . '/nao-existe'), 'não criou a pasta');
    igual($arquivo, (string) file_get_contents($priv . '/usuarios.json'), 'usuarios.json intocado');
    apagarArvore($dir);
}, false);
