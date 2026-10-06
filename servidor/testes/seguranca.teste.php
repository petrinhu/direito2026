<?php
declare(strict_types=1);

teste('hash Argon2id nunca aparece em nenhuma resposta (nem em erro)', function (): void {
    $a = Ambiente::novo();
    $a->semearUsuario('ivo', 'SenhaDoIvo123456', false, true);
    $admin = $a->entrar();
    $ivo = $a->entrar('ivo', 'SenhaDoIvo123456');
    $todas = [
        $admin->get('/api/usuarios.php'),
        $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'jose']),
        $admin->post('/api/usuarios.php', ['acao' => 'redefinir', 'usuario' => 'ivo']),
        $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'jose']),
        $admin->get('/api/sessao.php'),
        $ivo->get('/api/conteudo.php'),
        $ivo->post('/api/trocar-senha.php', ['senhaAtual' => 'x', 'senhaNova' => 'y']),
        $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'ivo', 'senha' => 'errada-errada']),
    ];
    foreach ($todas as $i => $r) {
        naoContem('$argon2', $r->corpo, "resposta $i");
        naoContem('"hash"', $r->corpo, "resposta $i");
    }
});

teste('todo arquivo sob o diretório privado é 600 e todo diretório é 700', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'kleber']);
    $a->clienteComSessao()->post('/api/entrar.php', ['usuario' => 'x', 'senha' => 'errada-errada']);
    $a->semearConteudo('{}');
    $admin->get('/api/conteudo.php');
    $vistos = ['arquivos' => 0, 'diretorios' => 0];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($a->priv, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
    $maus = [];
    foreach ($it as $item) {
        $perm = fileperms($item->getPathname()) & 0777;
        if ($item->isDir()) {
            $vistos['diretorios']++;
            if ($perm !== 0700) {
                $maus[] = sprintf('dir %s %o', substr($item->getPathname(), strlen($a->priv)), $perm);
            }
        } else {
            $vistos['arquivos']++;
            if ($perm !== 0600) {
                $maus[] = sprintf('arq %s %o', substr($item->getPathname(), strlen($a->priv)), $perm);
            }
        }
    }
    igual(0, count($maus), 'permissões fora do padrão: ' . implode(', ', $maus));
    verdadeiro($vistos['arquivos'] >= 5 && $vistos['diretorios'] >= 2, 'varredura não-vazia: ' . json_encode($vistos));
    igual(0700, fileperms($a->priv) & 0777, 'raiz privada 700');
    foreach (['usuarios.json', 'tentativas.json'] as $f) {
        verdadeiro(is_file($a->priv . "/$f"), "$f existe");
    }
    verdadeiro(count(glob($a->priv . '/sessoes/sess_*') ?: []) >= 1, 'há arquivo de sessão');
});

teste('sem roteador: /api/nucleo/*.php por acesso direto não executa lógica (404 e corpo vazio)', function (): void {
    $a = Ambiente::novo(['semRoteador' => true]);
    igual(200, $a->cliente()->get('/api/saude.php')->status, 'controle: endpoint normal funciona neste servidor');
    $arqs = glob(RAIZ_REPO . '/public/api/nucleo/*.php') ?: [];
    verdadeiro(count($arqs) >= 6, 'varredura não-vazia');
    foreach ($arqs as $arq) {
        $r = $a->cliente()->get('/api/nucleo/' . basename($arq));
        igual(404, $r->status, basename($arq));
        igual('', $r->corpo, basename($arq));
    }
});

teste('entrada gigante é recusada sem processar (400)', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    $r = $c->post('/api/entrar.php', '{"usuario":"x","senha":"' . str_repeat('a', 100000) . '"}');
    igual(400, $r->status);
});

teste('injeção clássica e caracteres estranhos no login não quebram nada', function (): void {
    $a = Ambiente::novo();
    $c = $a->clienteComSessao();
    foreach (["' OR '1'='1", '../../x', '<script>', "chefe\0", '{"$ne":1}'] as $u) {
        igual(401, $c->post('/api/entrar.php', ['usuario' => $u, 'senha' => "' OR '1'='1"])->status, json_encode($u));
        $a->zerarTentativas();
    }
});
