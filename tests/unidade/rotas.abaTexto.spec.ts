import { describe, expect, it } from 'vitest';
import { rotas } from '@/app/router/rotas';

type ProvedorDeProps = (rota: { params: Record<string, string> }) => Record<string, unknown>;

function rotaTexto() {
  const rota = rotas.find((r) => r.name === 'unidade-texto');
  if (!rota) throw new Error('rota unidade-texto ausente');
  return rota;
}

describe('rota da aba Texto integral', () => {
  it('fica em /p/:periodo/:cadeira/:unidade/texto', () => {
    expect(rotaTexto().path).toBe('/p/:periodo/:cadeira/:unidade/texto');
  });

  it('entrega aba "texto" para a página da unidade, com os parâmetros da URL', () => {
    const props = (rotaTexto().props as unknown as ProvedorDeProps)({
      params: { periodo: 'p1', cadeira: 'intr-direito', unidade: 'u3-livro-textura-aberta' }
    });
    expect(props).toEqual({
      periodo: 'p1',
      cadeira: 'intr-direito',
      unidade: 'u3-livro-textura-aberta',
      aba: 'texto'
    });
  });
});
