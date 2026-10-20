import { describe, expect, it } from 'vitest';
import { rotuloSemViuva } from '@/app/curriculo/rotuloSemViuva';

/**
 * Viúva tipográfica: a última palavra curta ("1", "II") sozinha na última
 * linha de uma quebra. Solução determinística no texto exibido (U+00A0 entre
 * a penúltima palavra e a última curta), não depende do navegador.
 */
describe('rotuloSemViuva', () => {
  it('une a última palavra curta à anterior com espaço não separável', () => {
    expect(rotuloSemViuva('Português e Redação Jurídica 1')).toBe('Português e Redação Jurídica 1');
  });

  it('mantém o rótulo quando a última palavra é longa', () => {
    expect(rotuloSemViuva('Introdução ao Direito')).toBe('Introdução ao Direito');
  });

  it('mantém texto de uma palavra só', () => {
    expect(rotuloSemViuva('Interdisciplinar')).toBe('Interdisciplinar');
  });

  it('mantém texto vazio', () => {
    expect(rotuloSemViuva('')).toBe('');
  });
});
