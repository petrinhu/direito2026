import { describe, expect, it } from 'vitest';
import {
  executarAtualizacao,
  type PortaAtualizacao
} from '../../scripts/apoio/referencias/executarAtualizacao';
import type { Referencias } from '../../scripts/apoio/referencias/capturar';

/**
 * AV3-K4, portão do atualizar-referencias. A recusa de gravar reordenação ou remoção
 * é a decisão do script inteiro: vive numa função testada, e não só no script, que nenhum
 * spec executa (revisão k4-rev.md, f2).
 */
function referencia(alternativas: unknown): Referencias {
  return { alternativas } as unknown as Referencias;
}

function porta() {
  const gravados: Referencias[] = [];
  const linhas: string[] = [];
  const erros: string[] = [];
  const p: PortaAtualizacao = {
    gravar: async (atual) => {
      gravados.push(atual);
    },
    emitir: (l) => linhas.push(l),
    emitirErro: (l) => erros.push(l)
  };
  return { p, gravados, linhas, erros };
}

const ANTERIOR = {
  alternativas: { 'p1/x/u1': { '1': ['a', 'b', 'c', 'd'] } }
} as unknown as Partial<Referencias>;

describe('executarAtualizacao: a recusa é da decisão, não do script', () => {
  it('reordenação: não grava, emite RECUSADO e devolve 1', async () => {
    const { p, gravados, erros } = porta();
    const atual = referencia({ 'p1/x/u1': { '1': ['b', 'a', 'c', 'd'] } });
    const codigo = await executarAtualizacao(ANTERIOR, atual, p);
    expect(codigo).toBe(1);
    expect(gravados).toHaveLength(0);
    expect(erros.some((l) => l.includes('RECUSADO') && l.includes('reordenação'))).toBe(true);
  });

  it('sem mudança: grava e devolve 0', async () => {
    const { p, gravados } = porta();
    const codigo = await executarAtualizacao(ANTERIOR, referencia(ANTERIOR.alternativas), p);
    expect(codigo).toBe(0);
    expect(gravados).toHaveLength(1);
  });

  it('alternativa nova no fim: grava e devolve 0', async () => {
    const { p, gravados } = porta();
    const atual = referencia({ 'p1/x/u1': { '1': ['a', 'b', 'c', 'd', 'e'] } });
    expect(await executarAtualizacao(ANTERIOR, atual, p)).toBe(0);
    expect(gravados).toHaveLength(1);
  });

  it('primeira geração (sem referência anterior): grava e devolve 0', async () => {
    const { p, gravados } = porta();
    expect(await executarAtualizacao({}, referencia({ 'p1/x/u1': { '1': ['a'] } }), p)).toBe(0);
    expect(gravados).toHaveLength(1);
  });
});
