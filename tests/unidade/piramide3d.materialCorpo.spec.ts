import { describe, expect, it } from 'vitest';
import { OPCOES_DO_CORPO_COMUM } from '@/ui/piramide3d/materialCorpo';

/**
 * Face de texto em voo (captura do líder, 17/11): o corpo comum, transparente e com opacidade 1, escrevia
 * profundidade e cobria a face de texto desenhada depois dele. Sem escrita de profundidade, a face de texto
 * aparece por inteiro (medido no build de teste: com o corpo escondido, o texto aparece legível).
 */
describe('material do corpo comum da pirâmide', () => {
  it('é transparente e não escreve profundidade, para a face de texto aparecer por cima', () => {
    expect(OPCOES_DO_CORPO_COMUM.transparent).toBe(true);
    expect(OPCOES_DO_CORPO_COMUM.depthWrite).toBe(false);
  });

  it('mantém a face dupla, a cor por vértice e o sombreado chapado', () => {
    expect(OPCOES_DO_CORPO_COMUM.side).toBe(2);
    expect(OPCOES_DO_CORPO_COMUM.vertexColors).toBe(true);
    expect(OPCOES_DO_CORPO_COMUM.flatShading).toBe(true);
  });
});
