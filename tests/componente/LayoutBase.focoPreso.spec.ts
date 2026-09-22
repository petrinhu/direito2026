// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import LayoutBase from '@/ui/layout/LayoutBase.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Item 7 do briefing (pendência da onda, não estava na especificação
 * original): com a gaveta aberta (celular, largura <=880px), o foco do
 * teclado não pode escapar para o conteúdo atrás dela, e fechar devolve o
 * foco ao botão que abriu.
 */
function curriculoDeTeste(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1o período',
      cadeiras: [
        {
          id: 'intr-direito',
          nome: 'Introdução ao Direito',
          estado: 'publicado',
          unidades: [
            { id: 'u1', rotulo: 'Unidade 1', titulo: 'Unidade 1', estado: 'publicado', abas: ['resumo'] }
          ]
        }
      ]
    }
  ];
}

function montarProps() {
  const repo = new RepositorioMemoria();
  return {
    curriculo: curriculoDeTeste(),
    caminhoAtual: '',
    repositorio: repo,
    storeTema: criarStoreTema(repo),
    storeBusca: criarStoreBusca(),
    storeModoAdaptado: criarStoreModoAdaptado(repo)
  };
}

describe('LayoutBase, foco preso na gaveta (mobile)', () => {
  it('abrir a gaveta move o foco para dentro dela', async () => {
    const wrapper = mount(LayoutBase, { props: montarProps(), attachTo: document.body });
    const botaoAbrir = wrapper.find('.barra-topo__botao-gaveta');
    (botaoAbrir.element as HTMLElement).focus();
    await botaoAbrir.trigger('click');
    await wrapper.vm.$nextTick();

    const gaveta = wrapper.find('.layout-base__gaveta').element as HTMLElement;
    expect(gaveta.contains(document.activeElement)).toBe(true);
    wrapper.unmount();
  });

  it('Tab no último elemento focável da gaveta volta para o primeiro (armadilha de foco)', async () => {
    const wrapper = mount(LayoutBase, { props: montarProps(), attachTo: document.body });
    const botaoAbrir = wrapper.find('.barra-topo__botao-gaveta');
    (botaoAbrir.element as HTMLElement).focus();
    await botaoAbrir.trigger('click');
    await wrapper.vm.$nextTick();

    const gaveta = wrapper.find('.layout-base__gaveta').element as HTMLElement;
    const focaveis = gaveta.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    expect(focaveis.length).toBeGreaterThan(0);
    const ultimo = focaveis[focaveis.length - 1]!;
    const primeiro = focaveis[0]!;
    ultimo.focus();

    await wrapper.find('.layout-base__gaveta').trigger('keydown', { key: 'Tab' });

    expect(document.activeElement).toBe(primeiro);
    wrapper.unmount();
  });

  it('Escape fecha a gaveta e devolve o foco ao botão que abriu', async () => {
    const wrapper = mount(LayoutBase, { props: montarProps(), attachTo: document.body });
    const botaoAbrir = wrapper.find('.barra-topo__botao-gaveta');
    (botaoAbrir.element as HTMLElement).focus();
    await botaoAbrir.trigger('click');
    await wrapper.vm.$nextTick();

    await wrapper.find('.layout-base__gaveta').trigger('keydown', { key: 'Escape' });
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(botaoAbrir.element);
    wrapper.unmount();
  });
});
