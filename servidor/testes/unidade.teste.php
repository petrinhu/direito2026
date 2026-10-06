<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

teste('config: diretório privado sobe 4 níveis a partir de api/nucleo', function (): void {
    igual(
        '/a/b/direito2026_privado',
        d26_dir_privado('/a/b/public_html/direito2026/api/nucleo', 'fpm-fcgi', null)
    );
}, false);

teste('config: D26_PRIVADO só vale no cli-server', function (): void {
    $nucleo = '/a/b/public_html/direito2026/api/nucleo';
    igual('/x/y', d26_dir_privado($nucleo, 'cli-server', '/x/y'));
    igual('/a/b/direito2026_privado', d26_dir_privado($nucleo, 'litespeed', '/x/y'));
    igual('/a/b/direito2026_privado', d26_dir_privado($nucleo, 'fpm-fcgi', '/x/y'));
    igual('/a/b/direito2026_privado', d26_dir_privado($nucleo, 'cli', '/x/y'));
}, false);

teste('senha nova: 10 a 128 caracteres contados em caracteres, não bytes', function (): void {
    igual('senha-curta', null === d26_validar_senha_nova('123456789', 'ana', 'x') ? null : 'senha-curta');
    igual(null, d26_validar_senha_nova('1234567890', 'ana', 'x'));
    igual(null, d26_validar_senha_nova(str_repeat('a', 128), 'ana', 'x'));
    verdadeiro(is_string(d26_validar_senha_nova(str_repeat('a', 129), 'ana', 'x')), '129 caracteres recusados');
    igual(null, d26_validar_senha_nova(str_repeat('ç', 10), 'ana', 'x'));
    verdadeiro(is_string(d26_validar_senha_nova(str_repeat('ç', 9), 'ana', 'x')), '9 caracteres de 2 bytes recusados');
}, false);

teste('senha nova: diferente do login e da senha atual; UTF-8 inválido recusado', function (): void {
    verdadeiro(is_string(d26_validar_senha_nova('usuario.longo', 'usuario.longo', 'x')), 'igual ao login');
    verdadeiro(is_string(d26_validar_senha_nova('SenhaAtual123', 'ana', 'SenhaAtual123')), 'igual à atual');
    igual(null, d26_validar_senha_nova('SenhaAtual124', 'ana', 'SenhaAtual123'));
    verdadeiro(is_string(d26_validar_senha_nova("\xff\xfe\xfd\xfc\xfb\xfa\xf9\xf8\xf7\xf6", 'ana', 'x')), 'UTF-8 inválido');
}, false);

teste('login: regex exata, case-sensitive e sem quebra de linha final', function (): void {
    verdadeiro(d26_login_valido('abc'), 'mínimo 3');
    verdadeiro(d26_login_valido('A.b_c-9'), 'alfabeto permitido');
    verdadeiro(d26_login_valido(str_repeat('a', 32)), 'máximo 32');
    igual(false, d26_login_valido('ab'));
    igual(false, d26_login_valido(str_repeat('a', 33)));
    igual(false, d26_login_valido("abc\n"));
    igual(false, d26_login_valido('ab c'));
    igual(false, d26_login_valido('açb'));
}, false);

teste('limite: espera 2^(n-5) s depois de 5 falhas livres, com teto de 900 s', function (): void {
    $p = dirTemporario();
    $t = 1000;
    for ($i = 1; $i <= 6; $i++) {
        igual(0, d26_limite_reservar($p, 'ana', '10.0.0.1', $t), "tentativa $i passa (5 livres + a que arma a espera)");
    }
    $esperado = [2, 4, 8, 16, 32, 64, 128, 256, 512, 900, 900];
    foreach ($esperado as $k => $espera) {
        igual($espera, d26_limite_reservar($p, 'ana', '10.0.0.1', $t), 'espera após a tentativa ' . (6 + $k));
        $t += $espera;
        igual(0, d26_limite_reservar($p, 'ana', '10.0.0.1', $t), 'liberado ao fim da espera');
    }
    igual(0, d26_limite_reservar($p, 'bia', '10.0.0.1', $t), 'outro usuário não é afetado pelo bloqueio usuário+IP');
    igual(0, d26_limite_reservar($p, 'ana', '10.0.0.2', $t), 'outro IP não é afetado');
    apagarArvore($p);
}, false);

teste('limite: sucesso zera o contador do usuário+IP', function (): void {
    $p = dirTemporario();
    for ($i = 0; $i < 3; $i++) {
        d26_limite_reservar($p, 'ana', '10.0.0.1', 1000);
    }
    d26_limite_reservar($p, 'ana', '10.0.0.1', 1000);
    d26_limite_sucesso($p, 'ana', '10.0.0.1', 1000);
    for ($i = 0; $i < 5; $i++) {
        igual(0, d26_limite_reservar($p, 'ana', '10.0.0.1', 1000), "tentativa $i depois do sucesso");
    }
    igual(0, d26_limite_reservar($p, 'ana', '10.0.0.1', 1000), 'sem o zeramento já estaria bloqueada');
    verdadeiro(d26_limite_reservar($p, 'ana', '10.0.0.1', 1000) > 0, 'e a seguinte espera (controle)');
    apagarArvore($p);
}, false);

teste('limite: 30 tentativas do mesmo IP em 15 min bloqueiam o IP por 15 min (qualquer usuário)', function (): void {
    $p = dirTemporario();
    for ($i = 0; $i < 29; $i++) {
        igual(0, d26_limite_reservar($p, "u$i", '10.0.0.9', 1000), "tentativa $i");
    }
    igual(0, d26_limite_reservar($p, 'novo', '10.0.0.9', 1000), 'a 30ª ainda passa');
    igual(900, d26_limite_reservar($p, 'outro', '10.0.0.9', 1000), 'depois dela o IP está bloqueado');
    igual(0, d26_limite_reservar($p, 'novo', '10.0.0.8', 1000), 'outro IP livre');
    igual(0, d26_limite_reservar($p, 'novo', '10.0.0.9', 1900), 'libera depois de 15 min');
    apagarArvore($p);
}, false);

teste('limite: tentativas fora da janela de 15 min não somam', function (): void {
    $p = dirTemporario();
    for ($i = 0; $i < 29; $i++) {
        d26_limite_reservar($p, "u$i", '10.0.0.7', 1000);
    }
    d26_limite_reservar($p, 'u30', '10.0.0.7', 2000);
    igual(0, d26_limite_reservar($p, 'x', '10.0.0.7', 2000), '29 velhas + 1 nova não bloqueia');
    apagarArvore($p);
}, false);

teste('armazenamento: gravação cria arquivo 600 e diretório pai intacto', function (): void {
    $p = dirTemporario();
    $arq = "$p/dados.json";
    d26_atualizar_json($arq, ['n' => 0], static function (array &$d): void {
        $d['n'] = 7;
    });
    igual(0600, fileperms($arq) & 0777, 'permissão do arquivo');
    igual(0600, fileperms("$arq.lock") & 0777, 'permissão do .lock');
    igual(['n' => 7], d26_ler_json($arq, ['n' => 0]));
    igual(['n' => 0], d26_ler_json("$p/inexistente.json", ['n' => 0]), 'padrão quando o arquivo não existe');
    igual(['dados.json', 'dados.json.lock'], array_values(array_diff(scandir($p) ?: [], ['.', '..'])), 'nenhum temporário sobrando');
    apagarArvore($p);
}, false);

teste('armazenamento: 6 processos concorrentes não perdem nenhuma atualização (flock)', function (): void {
    $p = dirTemporario();
    $arq = "$p/c.json";
    $procs = [];
    for ($i = 0; $i < 6; $i++) {
        $procs[] = proc_open(
            [PHP_BINARY, __DIR__ . '/apoio/incrementar.php', $arq, '25'],
            [0 => ['file', '/dev/null', 'r'], 1 => ['file', '/dev/null', 'w'], 2 => ['file', "$p/err$i.txt", 'w']],
            $pipes
        );
    }
    foreach ($procs as $pr) {
        proc_close($pr);
    }
    igual(['n' => 150], d26_ler_json($arq, ['n' => 0]));
    apagarArvore($p);
}, false);

teste('armazenamento: JSON corrompido levanta erro em vez de zerar os dados', function (): void {
    $p = dirTemporario();
    file_put_contents("$p/x.json", '{quebrado');
    $caiu = false;
    try {
        d26_ler_json("$p/x.json", ['n' => 0]);
    } catch (Throwable) {
        $caiu = true;
    }
    verdadeiro($caiu, 'ler JSON corrompido deve lançar');
    igual('{quebrado', (string) file_get_contents("$p/x.json"), 'arquivo intocado');
    apagarArvore($p);
}, false);
