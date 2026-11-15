import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compararVersoes,
  ehVersao,
  LIMITE_ITEM_HISTORICO,
  validarHistorico,
  validarItem
} from '@/core/versoes/validacao';

/**
 * HIST-F1 (página Novidades e Changelog, ordem do líder de 14/11, item 62): validação pura do histórico
 * de versões. Versão no formato A.B.C.D, ordem estrita do arquivo (mais antiga primeiro, como
 * src/dados/versoes/historico.json está gravado), item de até 180 caracteres (proxy de duas linhas).
 */
const HISTORICO_REAL = JSON.parse(
  readFileSync(resolve(__dirname, '../../src/dados/versoes/historico.json'), 'utf-8')
);

function entrada(versao: string, sobrescrever: Record<string, unknown> = {}) {
  return {
    versao,
    data: '2026-11-15',
    didatico: ['Item didático.'],
    tecnico: ['Item técnico.'],
    ...sobrescrever
  };
}

describe('ehVersao', () => {
  it('aceita A.B.C.D e recusa outros formatos', () => {
    expect(ehVersao('1.13.0.0')).toBe(true);
    for (const ruim of [
      '1.13',
      '1.13.0',
      'v1.13.0.0',
      '1.13.0.0.0',
      'abc',
      '',
      1 as unknown as string
    ]) {
      expect(ehVersao(ruim as string), String(ruim)).toBe(false);
    }
  });
});

describe('compararVersoes', () => {
  it('compara por partes numéricas, não por texto', () => {
    expect(compararVersoes('1.10.0.0', '1.9.0.0')).toBeGreaterThan(0);
    expect(compararVersoes('1.9.0.0', '1.10.0.0')).toBeLessThan(0);
    expect(compararVersoes('1.2.3.4', '1.2.3.4')).toBe(0);
  });
});

describe('validarItem', () => {
  it('limite de 180 caracteres: 180 passa, 181 reprova', () => {
    expect(LIMITE_ITEM_HISTORICO).toBe(180);
    expect(validarItem('a'.repeat(180))).toEqual([]);
    expect(validarItem('a'.repeat(181))).not.toEqual([]);
  });

  it('item vazio, só espaços ou que não é texto reprova', () => {
    expect(validarItem('')).not.toEqual([]);
    expect(validarItem('   ')).not.toEqual([]);
    expect(validarItem(42)).not.toEqual([]);
  });
});

describe('validarHistorico', () => {
  it('o histórico gravado no repositório é válido', () => {
    expect(validarHistorico(HISTORICO_REAL)).toEqual({ ok: true });
  });

  it('recusa lista vazia, versão fora do formato e data inválida', () => {
    expect(validarHistorico([]).ok).toBe(false);
    expect(validarHistorico([entrada('1.13')]).ok).toBe(false);
    expect(validarHistorico([entrada('1.13.0.0', { data: '2026-13-40' })]).ok).toBe(false);
  });

  it('recusa entrada sem nenhum item (didático e técnico vazios)', () => {
    expect(validarHistorico([entrada('1.13.0.0', { didatico: [], tecnico: [] })]).ok).toBe(false);
  });

  it('recusa didático vazio com técnico preenchido, e o contrário (cada lista precisa de um item)', () => {
    expect(validarHistorico([entrada('1.13.0.0', { didatico: [] })]).ok).toBe(false);
    expect(validarHistorico([entrada('1.13.0.0', { tecnico: [] })]).ok).toBe(false);
  });

  it('valida o técnico como valida o didático (item de 181 caracteres reprova)', () => {
    expect(validarHistorico([entrada('1.13.0.0', { tecnico: ['x'.repeat(181)] })]).ok).toBe(false);
  });

  it('conta caracteres por código, não por unidade UTF-16 (180 caracteres com emoji passam)', () => {
    expect(validarItem('a'.repeat(179) + '😀')).toEqual([]);
    expect(validarItem('a'.repeat(180) + '😀')).not.toEqual([]);
  });

  it('recusa versões repetidas ou fora da ordem do arquivo (estrita, mais antiga primeiro)', () => {
    expect(validarHistorico([entrada('1.1.0.0'), entrada('1.1.0.0')]).ok).toBe(false);
    expect(validarHistorico([entrada('1.2.0.0'), entrada('1.1.0.0')]).ok).toBe(false);
    expect(validarHistorico([entrada('1.1.0.0'), entrada('1.2.0.0')]).ok).toBe(true);
  });

  it('recusa item acima de 180 caracteres e diz onde está', () => {
    const r = validarHistorico([entrada('1.13.0.0', { didatico: ['x'.repeat(181)] })]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.join(' ')).toContain('1.13.0.0');
  });
});
