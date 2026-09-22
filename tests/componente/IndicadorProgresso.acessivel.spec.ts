// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import IndicadorProgresso from '@/ui/componentes/IndicadorProgresso.vue';

/**
 * Achado do axe-core (rodada de fechamento, verificação automática de
 * acessibilidade): `role="progressbar"` sem nome acessível (nem
 * aria-label, nem aria-labelledby, nem title) é violação "serious"
 * (WCAG 4.1.2 Nome, Função, Valor / 1.1.1). O componente já mostra o
 * texto "N de M blocos lidos" visível ao lado - o gêmeo certo é
 * referenciar esse mesmo texto via aria-labelledby, não duplicar a
 * frase num aria-label à parte.
 */
describe('IndicadorProgresso, nome acessível do progressbar', () => {
  it('a trilha (role=progressbar) tem aria-labelledby apontando para o texto visível', () => {
    const wrapper = mount(IndicadorProgresso, { props: { lidos: 3, total: 9 } });
    const trilha = wrapper.get('[role="progressbar"]');
    const idReferenciado = trilha.attributes('aria-labelledby');
    expect(idReferenciado, 'aria-labelledby ausente no progressbar').toBeTruthy();

    const alvo = wrapper.find(`#${idReferenciado}`);
    expect(alvo.exists(), `nenhum elemento com id="${idReferenciado}"`).toBe(true);
    expect(alvo.text()).toContain('3 de 9 blocos lidos');
  });
});
