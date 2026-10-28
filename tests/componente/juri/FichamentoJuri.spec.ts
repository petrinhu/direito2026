// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import FichamentoJuri from '@/ui/area-juri/FichamentoJuri.vue';
import { conteudoJuriValidadoFalso } from '../../unidade/apoio/conteudoJuriFalso';

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

describe('FichamentoJuri', () => {
  it('mostra uma ficha por item, com o nome dela como resumo recolhível', () => {
    w = mount(FichamentoJuri, {
      props: { fichamento: conteudoJuriValidadoFalso().fichamento },
      attachTo: document.body
    });
    const fichas = w.findAll('details');
    expect(fichas).toHaveLength(1);
    expect(fichas[0]!.get('summary').text()).toBe('Ficha fictícia um');
  });

  it('dentro da ficha: conceito, o que a fonte diz, uso da acusação, ataque da defesa e fontes', () => {
    w = mount(FichamentoJuri, {
      props: { fichamento: conteudoJuriValidadoFalso().fichamento },
      attachTo: document.body
    });
    const texto = w.text();
    expect(texto).toContain('Conceito fictício.');
    expect(texto).toContain('Fonte fictícia diz isto.');
    expect(texto).toContain('Uso fictício na acusação.');
    expect(texto).toContain('Ataque fictício da defesa.');
    expect(texto).toContain('Fonte fictícia da ficha');
  });
});
