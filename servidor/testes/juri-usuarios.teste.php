<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

teste('juri: não existe api/juri/usuarios.php (um usuário só: nada cria, lista ou redefine conta pelo navegador)', function (): void {
    verdadeiro(!file_exists(RAIZ_REPO . '/public/api/juri/usuarios.php'), 'o arquivo não existe no código');
    $a = juriAmbiente();
    $c = juriCliente($a);
    igual(404, $c->get('/api/juri/usuarios.php')->status, 'GET logado: 404');
    igual(404, $c->post('/api/juri/usuarios.php', ['acao' => 'criar', 'usuario' => 'intruso', 'senhaProvisoria' => 'Intruso123'])->status, 'POST logado: 404');
    igual(404, juriAnonimo($a)->get('/api/juri/usuarios.php')->status, 'GET anônimo: 404');
    igual([JURI_LOGIN_TESTE], array_column(juriLerUsuarios($a), 'usuario'), 'continua uma conta só');
});

/** @return list<array<string, mixed>> */
function juriLerUsuarios(Ambiente $a): array
{
    return json_decode((string) file_get_contents($a->privJuri . '/usuarios.json'), true, 16, JSON_THROW_ON_ERROR)['usuarios'];
}
