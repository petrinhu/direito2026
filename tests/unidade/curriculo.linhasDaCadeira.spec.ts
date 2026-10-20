import { describe, expect, it } from 'vitest';
import { linhasDaCadeira } from '@/app/curriculo/linhasDaCadeira';
import type { Cadeira, Periodo, ReferenciaUnidade } from '@/core/curriculo/tipos';

const u1: ReferenciaUnidade = {
  id: 'u1',
  rotulo: 'Unidade 1',
  titulo: 'Resumo de estudo e quiz',
  estado: 'publicado',
  abas: ['resumo', 'quiz']
};
const u2EmBreve: ReferenciaUnidade = {
  id: 'u2',
  rotulo: 'Unidade 2',
  titulo: 'Ainda não',
  estado: 'em-breve',
  abas: []
};
const u3: ReferenciaUnidade = {
  id: 'u3',
  rotulo: 'Unidade 3',
  titulo: 'Filosofia Moderna',
  estado: 'publicado',
  abas: ['resumo']
};
const interdisciplinar: Cadeira = {
  id: 'interdisciplinar',
  nome: 'Interdisciplinar',
  estado: 'publicado',
  restrita: true,
  unidades: []
};

function periodo(cadeiras: readonly Cadeira[]): Periodo {
  return { id: 'p1', numero: 1, rotulo: '1º período', cadeiras };
}

describe('linhasDaCadeira, linhas de uma placa da página inicial', () => {
  it('lista as unidades publicadas e põe o atalho logo depois da unidade indicada em apos', () => {
    const cadeira: Cadeira = {
      id: 'filosofia-juridica',
      nome: 'Filosofia Jurídica',
      estado: 'publicado',
      unidades: [u1, u3],
      atalhoUnidade: { rotulo: 'Interdisciplinar', apos: 'u1', cadeiraId: 'interdisciplinar' }
    };
    const linhas = linhasDaCadeira(periodo([cadeira, interdisciplinar]), cadeira);
    expect(linhas.map((l) => l.href)).toEqual([
      '/p/p1/filosofia-juridica/u1',
      '/p/p1/interdisciplinar',
      '/p/p1/filosofia-juridica/u3'
    ]);
    expect(linhas[0]).toMatchObject({
      rotulo: 'Unidade 1',
      texto: 'Resumo de estudo e quiz',
      restrita: false
    });
    expect(linhas[1]).toMatchObject({
      rotulo: 'Interdisciplinar',
      texto: 'Acesso restrito',
      restrita: true
    });
  });

  it('unidade em breve não vira linha: nada inventado nem link morto', () => {
    const cadeira: Cadeira = { id: 'c', nome: 'C', estado: 'publicado', unidades: [u2EmBreve] };
    expect(linhasDaCadeira(periodo([cadeira]), cadeira)).toEqual([]);
  });

  it('atalho para cadeira inexistente ou não publicada não vira link', () => {
    const cadeira: Cadeira = {
      id: 'c',
      nome: 'C',
      estado: 'publicado',
      unidades: [u1],
      atalhoUnidade: { rotulo: 'Interdisciplinar', apos: 'u1', cadeiraId: 'nao-existe' }
    };
    const linhas = linhasDaCadeira(periodo([cadeira]), cadeira);
    expect(linhas.map((l) => l.restrita)).toEqual([false]);
  });

  it('atalho cuja unidade de referência não aparece vai para o fim da lista', () => {
    const cadeira: Cadeira = {
      id: 'c',
      nome: 'C',
      estado: 'publicado',
      unidades: [u1],
      atalhoUnidade: { rotulo: 'Interdisciplinar', apos: 'u9', cadeiraId: 'interdisciplinar' }
    };
    const linhas = linhasDaCadeira(periodo([cadeira, interdisciplinar]), cadeira);
    expect(linhas.map((l) => l.href)).toEqual(['/p/p1/c/u1', '/p/p1/interdisciplinar']);
  });

  it('cadeira restrita não expõe linha de unidade nenhuma (nada do conteúdo restrito)', () => {
    expect(linhasDaCadeira(periodo([interdisciplinar]), interdisciplinar)).toEqual([]);
  });
});
