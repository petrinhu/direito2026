import { describe, expect, it } from 'vitest';
import { lerIdDeUnidade, rotuloDaAv } from '@/core/curriculo/idDeUnidade';

/**
 * Id de unidade: uN (AV simples) ou uN-grupo-topico (tópico de um grupo da AV).
 * O número da pasta é o que vale para ordem e para o rótulo AVN.
 */
describe('lerIdDeUnidade', () => {
  it('uN simples dá só o número', () => {
    expect(lerIdDeUnidade('u3')).toEqual({ numero: 3 });
  });

  it('uN-grupo-topico dá número, grupo e tópico', () => {
    expect(lerIdDeUnidade('u3-livro-textura-aberta')).toEqual({
      numero: 3,
      grupo: 'livro',
      topico: 'textura-aberta'
    });
  });

  it('recusa grupo sem tópico e prefixo que não é u', () => {
    expect(lerIdDeUnidade('u3-livro')).toBeUndefined();
    expect(lerIdDeUnidade('x3')).toBeUndefined();
  });

  it('um tópico sem grupo (uN-topico) não é id válido', () => {
    expect(lerIdDeUnidade('u3-textura')).toBeUndefined();
  });
});

describe('rotuloDaAv', () => {
  it('monta AV seguido do número, sem espaço', () => {
    expect(rotuloDaAv(3)).toBe('AV3');
    expect(rotuloDaAv(1)).toBe('AV1');
  });
});
