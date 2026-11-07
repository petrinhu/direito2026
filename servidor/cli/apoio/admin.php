<?php
declare(strict_types=1);

/**
 * Operações de administração sobre usuarios.json, para os CLIs do líder
 * (definir-admin, remover-conta). Cada operação é UMA mutação sob o lock do
 * arquivo (d26_atualizar_json), e só grava se a regra passa; recusa não escreve.
 *
 * Invariante, nomeada: ao sair do lock, sobra pelo menos um admin ativo, ou a
 * operação recusa e nada é gravado. É a mesma regra de d26_admin_agir
 * (public/api/nucleo/contas.php), repetida aqui porque o CLI não tem sessão de
 * ator. Os testes cli-definir-admin e cli-remover-conta fixam as duas.
 *
 * Papel de admin só muda no arquivo. Não incrementa versaoSessao: quem está
 * logado continua logado, e o papel é lido de novo a cada pedido.
 */

/** @return list<array<string, mixed>> contas validadas; conta com tipo errado levanta erro */
function d26_admin_cli_lidas(array $d): array
{
    return array_values(array_map('d26_conta_validar', $d['usuarios'] ?? []));
}

/** @param list<array<string, mixed>> $us */
function d26_admin_cli_indice(array $us, string $login): ?int
{
    foreach ($us as $i => $c) {
        if ($c['usuario'] === $login) {
            return $i;
        }
    }
    return null;
}

/** @param list<array<string, mixed>> $us */
function d26_admin_cli_admin_ativo(array $us): bool
{
    foreach ($us as $c) {
        if ($c['admin'] === true && $c['ativo'] === true) {
            return true;
        }
    }
    return false;
}

/**
 * Torna $login o ÚNICO admin: todos os outros viram comuns. Recusa login
 * inexistente ou inativo. Não mexe em senha, uid, versão de sessão nem aparelho.
 *
 * @return array{status: string, rebaixadas: int}
 */
function d26_admin_cli_unico(string $priv, string $login): array
{
    $rebaixadas = 0;
    $status = d26_atualizar_json(
        d26_contas_arquivo($priv),
        D26_CONTAS_PADRAO,
        static function (array &$d) use ($login, &$rebaixadas): string {
            $us = d26_admin_cli_lidas($d);
            $i = d26_admin_cli_indice($us, $login);
            if ($i === null) {
                return 'nao-encontrado';
            }
            if ($us[$i]['ativo'] !== true) {
                return 'inativo';
            }
            foreach ($us as $k => $c) {
                $deveSerAdmin = $k === $i;
                if ($c['admin'] !== $deveSerAdmin) {
                    if ($c['admin'] === true) {
                        $rebaixadas++;
                    }
                    $us[$k]['admin'] = $deveSerAdmin;
                }
            }
            $d['usuarios'] = $us;
            return 'ok';
        },
        true,
        false
    );
    return ['status' => (string) $status, 'rebaixadas' => $rebaixadas];
}

/**
 * Liga ($admin true) ou desliga o papel de admin de UM login. Desligar o último
 * admin ativo é recusado.
 *
 * @return string 'ok' | 'nao-encontrado' | 'inativo' | 'ultimo-admin'
 */
function d26_admin_cli_definir(string $priv, string $login, bool $admin): string
{
    return (string) d26_atualizar_json(
        d26_contas_arquivo($priv),
        D26_CONTAS_PADRAO,
        static function (array &$d) use ($login, $admin): string {
            $us = d26_admin_cli_lidas($d);
            $i = d26_admin_cli_indice($us, $login);
            if ($i === null) {
                return 'nao-encontrado';
            }
            if ($us[$i]['ativo'] !== true) {
                return 'inativo';
            }
            $era = $us[$i]['admin'] === true;
            $us[$i]['admin'] = $admin;
            if ($era && !$admin && !d26_admin_cli_admin_ativo($us)) {
                return 'ultimo-admin';
            }
            $d['usuarios'] = $us;
            return 'ok';
        },
        true,
        false
    );
}

/**
 * Remove a conta. Remover o último admin ativo é recusado; remover conta comum
 * ou admin que não é o último não mexe em admin nenhum.
 *
 * @return string 'ok' | 'nao-encontrado' | 'ultimo-admin'
 */
function d26_admin_cli_remover(string $priv, string $login): string
{
    return (string) d26_atualizar_json(
        d26_contas_arquivo($priv),
        D26_CONTAS_PADRAO,
        static function (array &$d) use ($login): string {
            $us = d26_admin_cli_lidas($d);
            $i = d26_admin_cli_indice($us, $login);
            if ($i === null) {
                return 'nao-encontrado';
            }
            $eraAdminAtivo = $us[$i]['admin'] === true && $us[$i]['ativo'] === true;
            unset($us[$i]);
            $us = array_values($us);
            if ($eraAdminAtivo && !d26_admin_cli_admin_ativo($us)) {
                return 'ultimo-admin';
            }
            $d['usuarios'] = $us;
            return 'ok';
        },
        true,
        false
    );
}
