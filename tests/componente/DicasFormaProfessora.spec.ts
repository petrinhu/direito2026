// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DicasFormaProfessora from '@/ui/componentes/DicasFormaProfessora.vue';
import { resumo } from '@/conteudo/p1/redacao-juridica-1/u1/resumo';
import type { DicasDeForma } from '@/core/unidade/tipos';

/**
 * Extra (c) da unidade de Redação Jurídica 1: dicas de forma anotadas pela
 * professora no quadro. O texto mora na unidade (resumo.ts, campo
 * dicasDeForma do bloco de dicas) e chega ao componente por prop (opção (b),
 * E10). Este arquivo não guarda texto de estudo: compara a tela com os dados
 * da unidade. Antes da mudança, o texto visível foi caracterizado com os
 * mesmos valores (f13d-antes-dicas.log), e passou.
 */
function dadosDaUnidade(): DicasDeForma | undefined {
  const bloco = resumo.find((b) => b.componenteExtra === 'dicas-forma-professora');
  return bloco?.dicasDeForma;
}

/** Dados da unidade, com falha explícita se o campo faltar (o teste de existência acusa antes). */
function dadosObrigatorios(): DicasDeForma {
  const dados = dadosDaUnidade();
  if (dados === undefined) throw new Error('resumo.ts sem dicasDeForma no bloco de dicas');
  return dados;
}

describe('DicasFormaProfessora: conteúdo vem da unidade', () => {
  it('o bloco de dicas da unidade traz dicasDeForma', () => {
    expect(dadosDaUnidade(), 'resumo.ts deve trazer dicasDeForma no bloco de dicas').toBeDefined();
  });

  it('o título renderizado é o título dos dados, sem mudança de texto', () => {
    const dados = dadosObrigatorios();
    const wrapper = mount(DicasFormaProfessora, { props: { dados } });
    expect(wrapper.find('h3').text()).toBe(dados.titulo);
  });

  it('cada item renderizado tem o texto exato dos dados, com o destaque em negrito', () => {
    const dados = dadosObrigatorios();
    const wrapper = mount(DicasFormaProfessora, { props: { dados } });
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual(dados.itens.map((i) => i.texto));
    expect(wrapper.findAll('strong').map((s) => s.text())).toEqual(
      dados.itens.map((i) => i.destaque)
    );
  });

  it('o destaque de cada item está dentro do próprio texto, senão o item sairia sem negrito', () => {
    for (const item of dadosObrigatorios().itens) {
      expect(item.texto).toContain(item.destaque);
    }
  });
});
