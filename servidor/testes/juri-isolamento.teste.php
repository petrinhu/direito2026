<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/juri.php';

/**
 * Isolamento entre as áreas com o layout de PRODUÇÃO: um só processo atende as
 * duas áreas, com os privados irmãos (direito2026_privado e juri2026_privado) e
 * sem D26_PRIVADO. Nada aqui usa o diretório de teste compartilhado.
 */
function juriAmbienteProducao(): Ambiente
{
    $a = Ambiente::novo(['layout' => 'producao']);
    juriSemearConta($a);
    return $a;
}

teste('juri: no layout de produção, cada área grava a sessão só no próprio privado irmão', function (): void {
    $a = juriAmbienteProducao();
    igual('direito2026_privado', basename($a->priv), 'privado do Interdisciplinar');
    igual('juri2026_privado', basename($a->privJuri), 'privado da Júri');
    $idInter = $a->entrar()->cookies['__Host-d26'] ?? falhar('login do Interdisciplinar sem cookie');
    $idJuri = juriCliente($a)->cookies['__Host-juri'] ?? falhar('login da Júri sem cookie');
    verdadeiro(is_file($a->priv . '/sessoes/sess_' . $idInter) && !is_file($a->privJuri . '/sessoes/sess_' . $idInter), 'sessão do Interdisciplinar só em direito2026_privado');
    verdadeiro(is_file($a->privJuri . '/sessoes/sess_' . $idJuri) && !is_file($a->priv . '/sessoes/sess_' . $idJuri), 'sessão da Júri só em juri2026_privado');
});

teste('juri: sessão do Interdisciplinar, presa ao cookie da Júri, não abre nenhum endpoint da Júri nem encerra a dela', function (): void {
    $a = juriAmbienteProducao();
    $inter = $a->entrar();
    $x = $a->cliente();
    $x->cookies['__Host-juri'] = $inter->cookies['__Host-d26'];
    igual(false, $x->get('/api/juri/sessao.php')->json()['autenticado'], 'sessao.php não autentica');
    igual(401, $x->get('/api/juri/conteudo.php')->status, 'conteudo.php');
    igual(401, $x->get('/api/juri/imagem.php?id=' . bin2hex(random_bytes(16)))->status, 'imagem.php');
    $destravar = $x->post('/api/juri/destravar.php', ['auth' => juriAuthTeste()]);
    igual(401, $destravar->status, 'destravar.php');
    naoContem('embrulho', $destravar->corpo, 'destravar.php não devolve embrulho');
    igual(200, $x->post('/api/juri/sair.php', [])->status, 'sair.php responde, sem efeito na outra área');
    igual(true, $inter->get('/api/sessao.php')->json()['autenticado'], 'a sessão do Interdisciplinar continua valendo');
});

teste('juri: sessão da Júri, presa ao cookie do Interdisciplinar, não abre o Interdisciplinar', function (): void {
    $a = juriAmbienteProducao();
    $a->entrar();
    $idJuri = juriCliente($a)->cookies['__Host-juri'];
    $y = $a->cliente();
    $y->cookies['__Host-d26'] = $idJuri;
    igual(false, $y->get('/api/sessao.php')->json()['autenticado'], 'sessao.php do Interdisciplinar não autentica');
    igual(401, $y->get('/api/conteudo.php')->status, 'conteudo.php do Interdisciplinar');
});

teste('juri: arquivo de sessão copiado para a pasta da OUTRA área não vale (a conta não existe lá)', function (): void {
    $a = juriAmbienteProducao();
    $idInter = $a->entrar()->cookies['__Host-d26'];
    copy($a->priv . '/sessoes/sess_' . $idInter, $a->privJuri . '/sessoes/sess_' . $idInter);
    $x = $a->cliente();
    $x->cookies['__Host-juri'] = $idInter;
    igual(false, $x->get('/api/juri/sessao.php')->json()['autenticado'], 'Júri: sessão do Interdisciplinar em disco não autentica');
    igual(401, $x->get('/api/juri/conteudo.php')->status, 'Júri: conteúdo fechado');

    $idJuri = juriCliente($a)->cookies['__Host-juri'];
    copy($a->privJuri . '/sessoes/sess_' . $idJuri, $a->priv . '/sessoes/sess_' . $idJuri);
    $y = $a->cliente();
    $y->cookies['__Host-d26'] = $idJuri;
    igual(false, $y->get('/api/sessao.php')->json()['autenticado'], 'Interdisciplinar: sessão da Júri em disco não autentica');
});
