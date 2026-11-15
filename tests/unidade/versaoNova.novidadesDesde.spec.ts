import { describe, expect, it } from 'vitest';
import { novidadesDesde, type EntradaHistorico } from '@/core/versaoNova/novidadesDesde';

/**
 * Versões puladas, teto de 3 e "e mais N", rollback e versão fora do histórico (AV-F2).
 * O histórico vem da mais nova para a mais velha, como o versao.json gravado no pacote.
 */
const HISTORICO: EntradaHistorico[] = [
  { versao: '1.11.0.0', novidades: ['Filosofia Jurídica (1º período) atualizada'] },
  { versao: '1.10.2.0', novidades: ['Novo: rádio para estudar', 'Melhoria técnica'] },
  { versao: '1.10.1.0', novidades: ['Melhoria técnica'] },
  { versao: '1.10.0.0', novidades: ['Direito Civil (2º período) atualizada'] }
];

describe('novidadesDesde: rótulos de uso (decisão 101)', () => {
  it('Melhorado e Corrigido ficam no grupo de uso, depois da cadeira e antes da técnica', () => {
    const historico: EntradaHistorico[] = [
      {
        versao: '2.0.0.0',
        novidades: [
          'Corrigido: menu lateral no celular',
          'Filosofia Jurídica (1º período) atualizada',
          'Melhorado: busca no índice',
          'Melhoria técnica'
        ]
      },
      { versao: '1.9.0.0', novidades: ['Novo: rádio'] }
    ];
    expect(novidadesDesde(historico, '1.9.0.0', '2.0.0.0').itens).toEqual([
      'Filosofia Jurídica (1º período) atualizada',
      'Corrigido: menu lateral no celular',
      'Melhorado: busca no índice'
    ]);
  });
});

describe('novidadesDesde: versões puladas entram, a da aba fica de fora', () => {
  it('a aba em 1.10.1.0 recebe o que veio depois: a cadeira, o recurso, e a técnica sai', () => {
    expect(novidadesDesde(HISTORICO, '1.10.1.0', '1.11.0.0')).toEqual({
      rollback: false,
      foraDoHistorico: false,
      itens: ['Filosofia Jurídica (1º período) atualizada', 'Novo: rádio para estudar'],
      mais: 0
    });
  });

  it('repetidas saem uma vez só, e a técnica fica quando é a única', () => {
    const historico: EntradaHistorico[] = [
      { versao: '2.0.0.0', novidades: ['Melhoria técnica'] },
      { versao: '1.9.0.0', novidades: ['Melhoria técnica', 'Melhoria técnica'] }
    ];
    expect(novidadesDesde(historico, '1.8.0.0', '2.0.0.0').itens).toEqual(['Melhoria técnica']);
  });

  it('mostra no máximo 3 e conta o resto em "mais"', () => {
    const historico: EntradaHistorico[] = [
      { versao: '1.5.0.0', novidades: ['Direito Civil (1º período) atualizada'] },
      { versao: '1.4.0.0', novidades: ['Direito Penal (1º período) atualizada'] },
      { versao: '1.3.0.0', novidades: ['Novo: rádio para estudar'] },
      { versao: '1.2.0.0', novidades: ['Filosofia Jurídica (1º período) atualizada'] },
      { versao: '1.1.0.0', novidades: ['Sociologia Jurídica (1º período) atualizada'] }
    ];
    const r = novidadesDesde(historico, '1.1.0.0', '1.5.0.0');
    expect(r.itens).toHaveLength(3);
    expect(r.mais).toBe(1);
  });

  it('versão da aba fora do histórico: as 3 mais novas e "outras", sem contar', () => {
    const r = novidadesDesde(HISTORICO, '0.1.0.0', '1.11.0.0');
    expect(r.foraDoHistorico).toBe(true);
    expect(r.itens).toHaveLength(3);
    expect(r.rollback).toBe(false);
  });

  it('versão igual à publicada não tem nada a mostrar', () => {
    expect(novidadesDesde(HISTORICO, '1.11.0.0', '1.11.0.0')).toEqual({
      rollback: false,
      foraDoHistorico: false,
      itens: [],
      mais: 0
    });
  });
});

describe('novidadesDesde: rollback não mostra lista, só que o site foi atualizado', () => {
  it('a publicada é mais velha que a da aba', () => {
    const r = novidadesDesde(HISTORICO, '1.11.0.0', '1.10.2.0');
    expect(r.rollback).toBe(true);
    expect(r.itens).toEqual([]);
  });

  it('compara o número por partes, então 1.10.10.0 é mais nova que 1.10.9.0', () => {
    const historico: EntradaHistorico[] = [
      { versao: '1.10.10.0', novidades: ['Novo: nova'] },
      { versao: '1.10.9.0', novidades: ['Novo: velha'] }
    ];
    expect(novidadesDesde(historico, '1.10.9.0', '1.10.10.0').itens).toEqual(['Novo: nova']);
    expect(novidadesDesde(historico, '1.10.10.0', '1.10.9.0').rollback).toBe(true);
  });
});
