import { describe, expect, it } from 'vitest';
import { caminhoEmAreaRestrita } from '@/core/curriculo/areaRestrita';
import { curriculo } from '@/conteudo/curriculo';
import type { Curriculo } from '@/core/curriculo/tipos';

const sintetico: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      { id: 'comum', nome: 'Comum', estado: 'publicado', unidades: [] },
      { id: 'secreta', nome: 'Secreta', estado: 'publicado', restrita: true, unidades: [] }
    ]
  }
];

describe('caminhoEmAreaRestrita', () => {
  it('a cadeira restrita e qualquer caminho abaixo dela', () => {
    expect(caminhoEmAreaRestrita(sintetico, '/p/p1/secreta')).toBe(true);
    expect(caminhoEmAreaRestrita(sintetico, 'p/p1/secreta')).toBe(true);
    expect(caminhoEmAreaRestrita(sintetico, '/p/p1/secreta/')).toBe(true);
    expect(caminhoEmAreaRestrita(sintetico, '/p/p1/secreta/u1/quiz')).toBe(true);
  });

  it('cadeira comum, período, home, busca e caminhos desconhecidos não são restritos', () => {
    for (const caminho of [
      '/',
      '/busca',
      '/p/p1',
      '/p/p1/comum',
      '/p/p1/comum/u1',
      '/p/p9/secreta',
      '/p/p1/outra',
      '/x/p1/secreta'
    ]) {
      expect(caminhoEmAreaRestrita(sintetico, caminho), caminho).toBe(false);
    }
  });

  it('um nome parecido não casa (secreta-2 não é secreta)', () => {
    expect(caminhoEmAreaRestrita(sintetico, '/p/p1/secreta-2')).toBe(false);
  });

  it('no currículo real, só o Interdisciplinar é restrito', () => {
    expect(caminhoEmAreaRestrita(curriculo, '/p/p1/interdisciplinar')).toBe(true);
    expect(caminhoEmAreaRestrita(curriculo, '/p/p1/filosofia-juridica/u1')).toBe(false);
  });
});
