import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import esperado from './curriculo.esperado.json';
import { projetarCurriculo } from './projecoes';

/**
 * Caracterização do currículo montado (src/conteudo/curriculo.ts).
 *
 * Congela períodos, cadeiras, unidades, abas, estados, rótulos, títulos,
 * flag restrita e atalho. A referência (curriculo.esperado.json) foi gerada
 * uma vez a partir do HEAD 3f63040 e revisada; este teste só LÊ. Quando a
 * estrutura mudar de propósito, a referência muda no mesmo commit, com a
 * razão escrita na mensagem.
 */
describe('currículo montado: forma congelada', () => {
  const projetado = projetarCurriculo(curriculo);

  it('tem períodos para conferir (piso contra varredura vazia)', () => {
    expect(projetado.length).toBeGreaterThan(0);
    expect(projetado.some((periodo) => periodo.cadeiras.length > 0)).toBe(true);
  });

  it('é igual à referência congelada em curriculo.esperado.json', () => {
    expect(JSON.parse(JSON.stringify(projetado))).toEqual(esperado);
  });
});
