<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';

teste('I-2: o cenário do revisor; excluir e recriar o mesmo login não ressuscita a sessão antiga', function (): void {
    $a = Ambiente::novo();
    $admin = $a->entrar();
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'senhaProvisoria' => 'Provisoria-Ana1'])->status);
    $ana = $a->entrar('ana', 'Provisoria-Ana1');
    igual(true, $ana->get('/api/sessao.php')->json()['autenticado'], 'a sessão da Ana valia');
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'excluir', 'usuario' => 'ana'])->status);
    igual(200, $admin->post('/api/usuarios.php', ['acao' => 'criar', 'usuario' => 'ana', 'senhaProvisoria' => 'Outra-Provisoria2'])->status, 'recriada com o mesmo login');
    igual(false, $ana->get('/api/sessao.php')->json()['autenticado'], 'a sessão da conta excluída não pode valer na conta nova');
    igual(401, $ana->post('/api/trocar-senha.php', ['senhaAtual' => 'Outra-Provisoria2', 'senhaNova' => 'SenhaNovaDaAna123'])->status, 'nem para trocar a senha da conta nova');
});

teste('I-2: a sessão guarda o uid e a versão, e confere os dois (mesma versão com uid diferente não vale)', function (): void {
    $a = Ambiente::novo();
    $c = $a->entrar();
    igual(true, $c->get('/api/sessao.php')->json()['autenticado']);
    $d = $a->lerUsuarios();
    $d['usuarios'][0]['uid'] = bin2hex(random_bytes(16)); // outra identidade, mesma versaoSessao
    file_put_contents($a->priv . '/usuarios.json', json_encode($d, JSON_THROW_ON_ERROR));
    igual(false, $c->get('/api/sessao.php')->json()['autenticado'], 'uid diferente derruba a sessão');
});

teste('I-2: conta criada ganha uid aleatório (32 hex) e versaoSessao inicial aleatória, distintos entre contas', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    igual('ok', d26_contas_criar($priv, 'ana', 'hash-a', false));
    igual('ok', d26_contas_criar($priv, 'bia', 'hash-b', false));
    [$ana, $bia] = d26_contas_listar($priv);
    foreach ([$ana, $bia] as $c) {
        verdadeiro(is_string($c['uid']) && preg_match('/^[0-9a-f]{32}$/D', $c['uid']) === 1, 'uid hex de 32: ' . var_export($c['uid'], true));
        verdadeiro(is_int($c['versaoSessao']) && $c['versaoSessao'] >= (1 << 20), 'versão inicial aleatória, não 1: ' . var_export($c['versaoSessao'], true));
    }
    verdadeiro($ana['uid'] !== $bia['uid'], 'uids distintos');
    verdadeiro($ana['versaoSessao'] !== $bia['versaoSessao'], 'versões iniciais distintas');
    apagarArvore($dir);
}, false);

teste('C-4: rehash só grava se hash e versão da conta não mudaram desde a leitura (dentro do lock)', function (): void {
    $dir = dirTemporario();
    $priv = $dir . '/privado';
    mkdir($priv, 0700, true);
    d26_contas_criar($priv, 'ana', 'hash-velho', false);
    $lida = d26_contas_buscar($priv, 'ana');
    d26_contas_registrar_login($priv, 'ana', 'hash-rehash', $lida);
    igual('hash-rehash', d26_contas_buscar($priv, 'ana')['hash'], 'conta intacta desde a leitura: o rehash é gravado');

    $lida = d26_contas_buscar($priv, 'ana');
    d26_contas_redefinir($priv, 'ana', 'hash-do-admin'); // o admin redefine entre a leitura e a gravação
    d26_contas_registrar_login($priv, 'ana', 'hash-rehash-2', $lida);
    $depois = d26_contas_buscar($priv, 'ana');
    igual('hash-do-admin', $depois['hash'], 'o rehash velho não sobrescreve a senha redefinida');
    verdadeiro(is_string($depois['ultimoLogin']), 'o ultimoLogin continua sendo registrado');

    $lida = d26_contas_buscar($priv, 'ana');
    d26_contas_trocar_senha($priv, 'ana', 'hash-da-troca');
    d26_contas_registrar_login($priv, 'ana', 'hash-rehash-3', $lida);
    igual('hash-da-troca', d26_contas_buscar($priv, 'ana')['hash'], 'nem a senha trocada pelo próprio usuário');
    apagarArvore($dir);
}, false);
