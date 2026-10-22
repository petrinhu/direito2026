// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BarraTopo from '@/ui/layout/BarraTopo.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

/**
 * Botão "Abrir menu do currículo" (celular, QA seção 7, observação): o leitor
 * de tela precisa saber se a gaveta está aberta, então o botão expõe
 * aria-expanded e aria-controls apontando para a gaveta.
 */
function montar(gavetaAberta: boolean) {
  const repo = new RepositorioMemoria();
  return mount(BarraTopo, {
    props: {
      curriculo: [],
      caminhoAtual: '',
      storeTema: criarStoreTema(repo),
      storeBusca: criarStoreBusca(),
      storeModoAdaptado: criarStoreModoAdaptado(repo),
      gavetaAberta
    }
  });
}

describe('BarraTopo: botão que abre o menu do currículo', () => {
  it('com a gaveta fechada, aria-expanded é false e aponta para a gaveta', () => {
    const botao = montar(false).find('button[aria-label="Abrir menu do currículo"]');
    expect(botao.attributes('aria-expanded')).toBe('false');
    expect(botao.attributes('aria-controls')).toBe('gaveta-do-curriculo');
  });

  it('com a gaveta aberta, aria-expanded é true', () => {
    const botao = montar(true).find('button[aria-label="Abrir menu do currículo"]');
    expect(botao.attributes('aria-expanded')).toBe('true');
  });
});
