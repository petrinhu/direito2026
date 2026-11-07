<?php
declare(strict_types=1);

require_once __DIR__ . '/cli-apoio.php';

teste('cli auditar-contas: só totais, sem nome, hash nem uid de nenhuma conta', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'zeca.fulano' => ['admin' => false, 'ativo' => false]]);
    $uid = (string) cliContasPorLogin($priv)['petrus']['uid'];
    [$rc, $out, $err] = rodarCliScript('auditar-contas.php', [$priv], '');
    igual(0, $rc, "saída: $out $err");
    $linhas = array_values(array_filter(explode("\n", trim($out)), static fn (string $l): bool => $l !== ''));
    igual(5, count($linhas), 'uma linha por total');
    foreach ($linhas as $l) {
        verdadeiro(preg_match('/^[a-z_]+=\d+$/D', $l) === 1, "linha só com chave=número: $l");
    }
    igual(['contas=2', 'ativas=1', 'admins=1', 'admins_ativos=1', 'troca_pendente=2'], $linhas, 'totais');
    naoContem('zeca', $out . $err, 'nome de conta não aparece sem --login');
    naoContem('petrus', $out . $err, 'nome de conta não aparece sem --login');
    naoContem('$argon2', $out . $err, 'hash não impresso');
    naoContem($uid, $out . $err, 'uid não impresso');
    apagarArvore($dir);
}, false);

teste('cli auditar-contas --login=<x>: existe, admin, ativo, troca pendente, aparelhos e tempo do último login, só por número ou booleano', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true], 'bia' => ['admin' => false]]);
    d26_contas_mutar($priv, 'bia', static function (array &$c): string {
        $c['ultimoLogin'] = gmdate('c', time() - 120);
        return 'ok';
    });
    [$rc, $out, $err] = rodarCliScript('auditar-contas.php', [$priv, '--login=bia'], '');
    igual(0, $rc, "saída: $out $err");
    foreach (['existe_bia=1', 'admin_bia=0', 'ativo_bia=1', 'troca_pendente_bia=1', 'aparelhos_bia=0', 'nunca_logou_bia=0'] as $linha) {
        contem($linha, $out, 'linha esperada');
    }
    verdadeiro(preg_match('/ultimo_login_ha_segundos_bia=(\d+)/', $out, $m) === 1, 'tempo do último login presente');
    verdadeiro((int) ($m[1] ?? -1) >= 120, 'tempo medido a partir do ultimoLogin gravado');
    naoContem('petrus', $out . $err, 'outra conta não aparece');
    [$rc2, $out2] = rodarCliScript('auditar-contas.php', [$priv, '--login=fantasma'], '');
    igual(0, $rc2, 'login inexistente é resposta de auditoria, não erro');
    contem('existe_fantasma=0', $out2, 'inexistente');
    apagarArvore($dir);
}, false);

teste('cli auditar-contas: pasta sem usuarios.json falha, em vez de mostrar zero contas', function (): void {
    [$dir, $priv] = cliPrivComContas([]);
    [$rc, $out, $err] = rodarCliScript('auditar-contas.php', [$priv], '');
    verdadeiro($rc !== 0, 'falha fechada');
    contem('auditar-contas:', $err, 'a falha vem do próprio CLI');
    naoContem('contas=0', $out, 'não diz zero contas');
    apagarArvore($dir);
}, false);

teste('cli auditar-contas: login inválido, opção desconhecida ou argumento extra são recusados', function (): void {
    [$dir, $priv] = cliPrivComContas(['petrus' => ['admin' => true]]);
    $casos = [[$priv, '--login=a b'], [$priv, '--login='], [$priv, '--senha=SegredoNaoPodeSair'], [$priv, 'extra']];
    foreach ($casos as $args) {
        [$rc, $out, $err] = rodarCliScript('auditar-contas.php', $args, '');
        verdadeiro($rc !== 0, 'recusado: ' . implode(' ', array_slice($args, 1)));
        contem('auditar-contas:', $err, 'a recusa vem do próprio CLI');
        naoContem('SegredoNaoPodeSair', $out . $err, 'valor não ecoado');
    }
    apagarArvore($dir);
}, false);
