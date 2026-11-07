<?php
declare(strict_types=1);

/**
 * Custo do login igual para conta inexistente e existente (plano do CTO do login único, seção 1.5;
 * LU-F2.5). A prova é por CONTAGEM de verificações Argon2id (verificacoes(), marcas 'i'/'f' de
 * d26_senha_confere), nunca por relógio: relógio em teste é ruído (medição da revisão: 12% a 19%
 * sem diferença de código). Os testes de tempo existentes continuam como estão.
 * Sintético: senha errada, só pelo Ambiente.
 */

teste('login: conta inexistente e conta existente com senha errada gastam exatamente uma verificação cada', function (): void {
    $a = Ambiente::novo();
    portaoSemearApp($a);
    $c = $a->cliente();
    [$token] = acessoTela($c);
    foreach ([Ambiente::LOGIN_ADMIN, 'naoexiste01'] as $usuario) {
        $antes = count($a->verificacoes());
        igual(401, acessoEnviar($c, $token, '/', $usuario, 'senha-errada-1')->status, "$usuario: 401");
        igual($antes + 1, count($a->verificacoes()), "$usuario: uma verificação de Argon2id, nem zero nem duas");
    }
});
