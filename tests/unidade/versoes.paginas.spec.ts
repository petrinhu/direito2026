import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  carregarHistorico,
  formatarData,
  paginaChangelog,
  paginaNovidades
} from '@/app/versoes/paginas';

/**
 * HIST-F2: camada de app das páginas Novidades (didático) e Changelog (técnico). Ordem da página: a mais
 * nova primeiro, qualquer que seja a ordem do arquivo. Datas em dd/mm/aaaa.
 */
const HISTORICO_REAL = JSON.parse(
  readFileSync(resolve(__dirname, '../../src/dados/versoes/historico.json'), 'utf-8')
);

const TRES = [
  { versao: '1.1.0.0', data: '2026-10-22', didatico: ['D1'], tecnico: ['T1'] },
  { versao: '1.0.0.0', data: '2026-10-20', didatico: ['D0'], tecnico: ['T0'] },
  { versao: '1.2.0.0', data: '2026-11-01', didatico: ['D2'], tecnico: ['T2'] }
];

describe('formatarData', () => {
  it('troca AAAA-MM-DD por DD/MM/AAAA', () => {
    expect(formatarData('2026-11-15')).toBe('15/11/2026');
  });
});

describe('paginaNovidades e paginaChangelog', () => {
  it('a mais nova primeiro, mesmo que o arquivo esteja em outra ordem', () => {
    expect(paginaNovidades(TRES).map((e) => e.versao)).toEqual(['1.2.0.0', '1.1.0.0', '1.0.0.0']);
    expect(paginaChangelog(TRES).map((e) => e.versao)).toEqual(['1.2.0.0', '1.1.0.0', '1.0.0.0']);
  });

  it('Novidades mostra só o didático; Changelog só o técnico', () => {
    expect(paginaNovidades(TRES)[0]!.itens).toEqual(['D2']);
    expect(paginaChangelog(TRES)[0]!.itens).toEqual(['T2']);
  });

  it('cada entrada leva a data já formatada', () => {
    expect(paginaNovidades(TRES)[0]!.dataFormatada).toBe('01/11/2026');
  });
});

describe('carregarHistorico', () => {
  it('o histórico gravado carrega sem erro e tem todas as versões', () => {
    const r = carregarHistorico(HISTORICO_REAL);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.entradas.length).toBe(HISTORICO_REAL.length);
  });

  it('um histórico inválido não carrega: devolve os erros, sem lançar', () => {
    const r = carregarHistorico([
      { versao: 'v1', data: '2026-11-15', didatico: ['x'], tecnico: [] }
    ]);
    expect(r.ok).toBe(false);
  });
});
