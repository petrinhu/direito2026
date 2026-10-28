// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import ConteudoJuri from '@/ui/area-juri/ConteudoJuri.vue';
import type { ResultadoConteudoJuri } from '@/app/juri';
import { conteudoJuriValidadoFalso } from '../../unidade/apoio/conteudoJuriFalso';

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

const ROTULOS = ['Resumo', 'Mapa mental', 'Fichamento', 'Mnemônicos', 'Quiz'];

function montar(carregar: () => Promise<ResultadoConteudoJuri>): VueWrapper {
  w = mount(ConteudoJuri, {
    props: {
      carregar,
      abrirImagem: () => new Promise<never>(() => {})
    },
    attachTo: document.body
  });
  return w;
}

describe('ConteudoJuri: abas depois de aberta', () => {
  it('mostra as cinco abas, com Resumo selecionada', async () => {
    const conteudo = conteudoJuriValidadoFalso();
    const area = montar(async () => ({ ok: true, conteudo }) as const);
    await flushPromises();
    const abas = area.findAll('[role="tab"]');
    expect(abas.map((a) => a.text())).toEqual(ROTULOS);
    expect(abas[0]!.attributes('aria-selected')).toBe('true');
  });

  it('trocar de aba mostra o painel dela (fichamento)', async () => {
    const conteudo = conteudoJuriValidadoFalso();
    const area = montar(async () => ({ ok: true, conteudo }) as const);
    await flushPromises();
    const fichamento = area.findAll('[role="tab"]').find((a) => a.text() === 'Fichamento');
    await fichamento!.trigger('click');
    expect(area.text()).toContain('Ficha fictícia um');
    expect(area.text()).not.toContain('Termo fictício 1');
  });

  it('conteúdo inválido mostra erro claro e nunca o HTML cru', async () => {
    const area = montar(async () => ({ ok: false, motivo: 'invalido' }) as const);
    await flushPromises();
    expect(area.get('[role="alert"]').text()).toContain('não pode ser mostrado');
    expect(area.text()).not.toContain('Termo fictício 1');
    expect(area.findAll('[role="tab"]')).toHaveLength(0);
  });

  it('erro de rede oferece Tentar de novo, que refaz a busca', async () => {
    const carregar = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'indisponivel' })
      .mockResolvedValueOnce({ ok: true, conteudo: conteudoJuriValidadoFalso() });
    const area = montar(carregar);
    await flushPromises();
    expect(area.get('[role="alert"]').text()).toContain('Não foi possível carregar');
    const tentar = area.findAll('button').find((b) => b.text() === 'Tentar de novo');
    await tentar!.trigger('click');
    await flushPromises();
    expect(carregar).toHaveBeenCalledTimes(2);
    expect(area.findAll('[role="tab"]')).toHaveLength(5);
  });
});
