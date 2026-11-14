import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LIMITE_CONTINUA_CONECTADO_MIN } from '@/core/versaoNova/limites';

/**
 * Teste gêmeo (L-17, AV-F2): o limite do cliente para a frase "e continua conectado"
 * tem de ficar ABAIXO da ociosidade do servidor. Lê o valor de config.php por expressão
 * regular, sem editar nada. Se a ociosidade do servidor cair, o gêmeo reprova.
 */
const CONFIG = resolve(__dirname, '../../public/api/nucleo/config.php');

describe('limite do cliente abaixo da ociosidade do servidor', () => {
  it('110 min fica abaixo de D26_SESSAO_OCIOSIDADE', () => {
    const fonte = readFileSync(CONFIG, 'utf-8');
    const casa = /const\s+D26_SESSAO_OCIOSIDADE\s*=\s*(\d+)\s*;/.exec(fonte);
    expect(casa, 'constante D26_SESSAO_OCIOSIDADE em config.php').not.toBeNull();
    const ociosidadeSegundos = Number(casa![1]);
    expect(LIMITE_CONTINUA_CONECTADO_MIN * 60).toBeLessThan(ociosidadeSegundos);
  });
});
