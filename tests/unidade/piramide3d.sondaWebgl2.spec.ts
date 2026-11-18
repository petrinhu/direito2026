// @vitest-environment jsdom
// PIR-H4 (resíduo): a sondagem que pergunta se existe WebGL2 abre um contexto só para perguntar.
// Esse contexto tem de ser liberado, senão cada carga de página deixa um contexto a mais aberto.
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('temWebGL2 libera o contexto que a sondagem abriu', () => {
  it('pede o contexto webgl2, devolve true e chama loseContext uma vez', async () => {
    const perder = vi.fn();
    const contexto = { getExtension: vi.fn(() => ({ loseContext: perder })) };
    const tela = { getContext: vi.fn(() => contexto) };
    vi.spyOn(document, 'createElement').mockReturnValue(tela as unknown as HTMLElement);

    const { temWebGL2 } = await import('@/app/piramide3d/ambiente');

    expect(temWebGL2()).toBe(true);
    // Montagem válida: a sondagem de fato abriu o contexto antes de liberá-lo.
    expect(tela.getContext).toHaveBeenCalledWith('webgl2');
    expect(perder).toHaveBeenCalledTimes(1);
  });
  it('se liberar o contexto lança, a resposta da sondagem continua valendo', async () => {
    const contexto = {
      getExtension: vi.fn(() => ({
        loseContext: (): void => {
          throw new Error('perda recusada');
        }
      }))
    };
    const tela = { getContext: vi.fn(() => contexto) };
    vi.spyOn(document, 'createElement').mockReturnValue(tela as unknown as HTMLElement);

    const { temWebGL2 } = await import('@/app/piramide3d/ambiente');

    const resposta = temWebGL2();

    // Montagem válida: a liberação foi de fato tentada e falhou.
    expect(contexto.getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
    expect(resposta).toBe(true);
  });
});
