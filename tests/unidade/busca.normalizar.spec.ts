import { describe, expect, it } from 'vitest';
import { normalizarTermo } from '@/core/busca/normalizar';
import { removerTags } from '@/core/busca/removerTags';

describe('normalizarTermo', () => {
  it('remove acentos e baixa a caixa', () => {
    expect(normalizarTermo('Petição')).toBe('peticao');
    expect(normalizarTermo('Zetética')).toBe('zetetica');
  });

  it('quem digita sem acento acha o que tem acento, e vice-versa', () => {
    expect(normalizarTermo('peticao')).toBe(normalizarTermo('petição'));
  });

  it('preserva espaços e não quebra em string vazia', () => {
    expect(normalizarTermo('')).toBe('');
    expect(normalizarTermo('a b')).toBe('a b');
  });
});

describe('removerTags', () => {
  it('remove marcação HTML simples e devolve texto puro', () => {
    expect(removerTags('<p>Olá <b>mundo</b></p>')).toBe('Olá mundo');
  });

  it('colapsa espaços resultantes da remoção', () => {
    expect(removerTags('<p>A</p>\n<p>B</p>')).toBe('A B');
  });

  it('remove o botão de citação e mantém só o texto visível dele', () => {
    const html = 'Ver o <button data-dispositivo="cc-186">art. 186 do Código Civil</button>.';
    expect(removerTags(html)).toBe('Ver o art. 186 do Código Civil.');
  });

  it('não usa lookbehind nem lookahead negativo (restrição do Safari < 16.4, guia de compatibilidade)', () => {
    const fonte = removerTags.toString();
    expect(fonte).not.toMatch(/\(\?<[=!]/);
    expect(fonte).not.toMatch(/\(\?!/);
  });
});
