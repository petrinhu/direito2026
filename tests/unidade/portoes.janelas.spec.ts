import { describe, expect, it } from 'vitest';
import { TAMANHO_JANELA, janelasDe } from '../../scripts/apoio/janelas';
import { TAMANHO_JANELA as TAMANHO_NO_TEXTO } from '../../scripts/apoio/textoDeEstudo';

/**
 * Janelas deslizantes de texto (LU-F4.2-N6). Módulo único usado pelo portão do webroot
 * (scripts/verificar-webroot-sem-conteudo.ts) e pelo índice da partição
 * (scripts/apoio/textoDeEstudo.ts). Texto inventado: nenhum conteúdo real entra aqui.
 */
describe('janelas deslizantes de texto (LU-F4.2-N6)', () => {
  it('a janela padrão é de 40 caracteres, a mesma que o texto de estudo usa', () => {
    expect(TAMANHO_JANELA).toBe(40);
    expect(TAMANHO_NO_TEXTO).toBe(TAMANHO_JANELA);
  });

  it('texto vazio dá zero janelas', () => {
    expect([...janelasDe('')]).toEqual([]);
  });

  it('texto de 39 caracteres, abaixo da janela, dá zero janelas', () => {
    expect([...janelasDe('a'.repeat(39))]).toEqual([]);
  });

  it('texto de exatamente 40 caracteres dá uma janela, igual ao texto', () => {
    const texto = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN';
    expect(texto.length).toBe(40);
    expect([...janelasDe(texto)]).toEqual([texto]);
  });

  it('texto de 41 caracteres dá duas janelas, deslizando um caractere', () => {
    const texto = `${'x'.repeat(39)}yz`;
    expect(texto.length).toBe(41);
    expect([...janelasDe(texto)]).toEqual([texto.slice(0, 40), texto.slice(1, 41)]);
  });

  it('o tamanho pode ser outro: abcdef com janela de 3 dá abc, bcd, cde, def', () => {
    expect([...janelasDe('abcdef', 3)]).toEqual(['abc', 'bcd', 'cde', 'def']);
  });

  it('janelas repetidas são devolvidas todas, na ordem original (o contador do portão depende disso)', () => {
    const texto = 'a'.repeat(45);
    const janelas = [...janelasDe(texto)];
    expect(janelas).toHaveLength(6);
    expect(janelas.every((j) => j === 'a'.repeat(40))).toBe(true);
  });

  it('a ordem é a da posição no texto', () => {
    const texto = 'abcdefghij'.repeat(5);
    const janelas = [...janelasDe(texto, 4)];
    expect(janelas[0]).toBe('abcd');
    expect(janelas[1]).toBe('bcde');
    expect(janelas[janelas.length - 1]).toBe(texto.slice(-4));
    expect(janelas).toHaveLength(texto.length - 3);
  });
});
