import { describe, expect, it } from 'vitest';
import { classificar } from '../../scripts/apoio/textoDeEstudo';

/**
 * A fonte da página Sobre (autoria e textos) é cifrada, mas não é texto de estudo: entra na
 * classe FORA com motivo escrito, para o portão de partição não reprovar por "sem classe" (E6).
 * Um caminho de estudo continua sendo fonte.
 */
describe('classificação do portão de partição: página Sobre fora da fonte (SB-F5)', () => {
  it('src/conteudo/sobre/autoria.ts é classe fora, com motivo ligado à página Sobre', () => {
    const c = classificar('src/conteudo/sobre/autoria.ts');
    expect(c?.classe).toBe('fora');
    expect(c).toMatchObject({ motivo: expect.stringContaining('Sobre') });
  });

  it('um texto de estudo continua sendo fonte, sem mudança de classe', () => {
    const c = classificar('src/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/resumo.ts');
    expect(c).toEqual({ classe: 'fonte' });
  });
});
