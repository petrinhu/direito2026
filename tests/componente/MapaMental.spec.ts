// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import MapaMental from '@/ui/componentes/MapaMental.vue';
import { construirArvoreMapa } from '@/core/fichamento/arvoreMapa';
import { DADOS_SINTETICOS } from '../unidade/apoio/dadosFichamento';

const arvore = construirArvoreMapa(DADOS_SINTETICOS);
let wrapper: VueWrapper | undefined;

function montar() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  wrapper = mount(MapaMental, {
    props: { arvore, baseUnidade: '/p/p1/c/u1' },
    attachTo: host
  });
  return wrapper;
}

function item(id: string) {
  return wrapper!.find(`#${id}`);
}

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = '';
});

describe('MapaMental: estrutura e acessibilidade', () => {
  it('é uma árvore com nome acessível e itens de árvore', () => {
    montar();
    const arvoreEl = wrapper!.find('[role="tree"]');
    expect(arvoreEl.exists()).toBe(true);
    expect(arvoreEl.attributes('aria-label')).toContain('Mapa mental');
    expect(wrapper!.findAll('[role="treeitem"]').length).toBeGreaterThan(10);
  });

  it('só nó com filhos tem aria-expanded; folha não tem', () => {
    montar();
    expect(item('mapa-raiz').attributes('aria-expanded')).toBe('true');
    expect(item('mapa-pensador-alfa').attributes('aria-expanded')).toBe('false');
    expect(item('mapa-alfa-modo').attributes('aria-expanded')).toBeUndefined();
  });

  it('informa nível, tamanho do conjunto e posição', () => {
    montar();
    const fase2 = item('mapa-fase-f2');
    expect(fase2.attributes('aria-level')).toBe('3');
    expect(fase2.attributes('aria-setsize')).toBe('2');
    expect(fase2.attributes('aria-posinset')).toBe('2');
  });

  it('grupos de filhos têm role group', () => {
    montar();
    expect(item('mapa-era-antiga').find('[role="group"]').exists()).toBe(true);
  });

  it('exatamente um item está no ciclo de Tab (foco itinerante), e é a raiz', () => {
    montar();
    const comTab = wrapper!.findAll('[role="treeitem"][tabindex="0"]');
    expect(comTab).toHaveLength(1);
    expect(comTab[0]!.attributes('id')).toBe('mapa-raiz');
  });

  it('o nome acessível do item é o tipo mais o rótulo, não o texto dos filhos', () => {
    montar();
    const fase = item('mapa-fase-f1');
    const ids = (fase.attributes('aria-labelledby') ?? '').split(' ');
    const nome = ids.map((id) => wrapper!.find(`#${id}`).text()).join(' ');
    expect(nome).toBe('Fase Fase um');
  });

  it('o nível de cada nó aparece como texto, não só por cor', () => {
    montar();
    const textos = wrapper!.text();
    for (const rotulo of ['Período', 'Fase', 'Pensador', 'Modo de pensar', 'Para o Direito hoje']) {
      expect(textos).toContain(rotulo);
    }
  });

  it('a ligação com a ficha é um link para a âncora do fichamento', () => {
    montar();
    const link = item('mapa-alfa-ficha').find('a');
    expect(link.attributes('href')).toBe('/p/p1/c/u1/fichamento#ficha-alfa');
    expect(link.attributes('tabindex')).toBe('-1');
  });

  it('oferece a alternativa textual: aponta para a aba Fichamento', () => {
    montar();
    const link = wrapper!.find('a[href="/p/p1/c/u1/fichamento"]');
    expect(link.exists()).toBe(true);
  });
});

describe('MapaMental: teclado', () => {
  it('Enter abre o pensador, e Enter de novo fecha', async () => {
    montar();
    const alfa = item('mapa-pensador-alfa');
    await alfa.trigger('keydown', { key: 'Enter' });
    expect(alfa.attributes('aria-expanded')).toBe('true');
    await alfa.trigger('keydown', { key: 'Enter' });
    expect(alfa.attributes('aria-expanded')).toBe('false');
  });

  it('Espaço também alterna, e não rola a página', async () => {
    montar();
    const alfa = item('mapa-pensador-alfa');
    const evento = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    alfa.element.dispatchEvent(evento);
    await wrapper!.vm.$nextTick();
    expect(alfa.attributes('aria-expanded')).toBe('true');
    expect(evento.defaultPrevented).toBe(true);
  });

  it('seta para a direita abre; para a esquerda fecha', async () => {
    montar();
    const alfa = item('mapa-pensador-alfa');
    await alfa.trigger('keydown', { key: 'ArrowRight' });
    expect(alfa.attributes('aria-expanded')).toBe('true');
    await alfa.trigger('keydown', { key: 'ArrowLeft' });
    expect(alfa.attributes('aria-expanded')).toBe('false');
  });

  it('seta para baixo move o foco para o próximo item visível e passa o tabindex 0 para ele', async () => {
    montar();
    await item('mapa-raiz').trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement?.id).toBe('mapa-era-antiga');
    expect(item('mapa-era-antiga').attributes('tabindex')).toBe('0');
    expect(item('mapa-raiz').attributes('tabindex')).toBe('-1');
  });

  it('o evento de um item filho não dispara a ação do pai', async () => {
    montar();
    await item('mapa-fase-f1').trigger('keydown', { key: 'ArrowLeft' });
    expect(item('mapa-fase-f1').attributes('aria-expanded')).toBe('false');
    expect(item('mapa-era-antiga').attributes('aria-expanded')).toBe('true');
  });

  it('tecla desconhecida não é capturada (Tab segue o caminho do navegador)', async () => {
    montar();
    const evento = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    item('mapa-raiz').element.dispatchEvent(evento);
    expect(evento.defaultPrevented).toBe(false);
  });
});

describe('MapaMental: mouse e botões', () => {
  it('clicar no corpo do nó alterna o ramo', async () => {
    montar();
    await item('mapa-pensador-alfa').find('.no-mapa__corpo').trigger('click');
    expect(item('mapa-pensador-alfa').attributes('aria-expanded')).toBe('true');
  });

  it('"Abrir todos os ramos" abre tudo e "Fechar até as fases" volta ao começo', async () => {
    montar();
    const botoes = wrapper!.findAll('button.mapa-mental__acao');
    expect(botoes.map((b) => b.text())).toEqual(['Abrir todos os ramos', 'Fechar até as fases']);
    await botoes[0]!.trigger('click');
    expect(item('mapa-pensador-alfa').attributes('aria-expanded')).toBe('true');
    expect(item('mapa-alfa-conceitos').attributes('aria-expanded')).toBe('true');
    await botoes[1]!.trigger('click');
    expect(item('mapa-pensador-alfa').attributes('aria-expanded')).toBe('false');
    expect(item('mapa-fase-f1').attributes('aria-expanded')).toBe('true');
  });

  it('ao fechar até as fases, o foco itinerante que estava num ramo fechado volta à raiz', async () => {
    montar();
    await wrapper!.findAll('button.mapa-mental__acao')[0]!.trigger('click');
    await item('mapa-alfa-modo').trigger('click');
    await item('mapa-alfa-modo').trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper!.findAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
    await wrapper!.findAll('button.mapa-mental__acao')[1]!.trigger('click');
    const comTab = wrapper!.findAll('[role="treeitem"][tabindex="0"]');
    expect(comTab).toHaveLength(1);
    expect(comTab[0]!.attributes('id')).toBe('mapa-raiz');
  });

  it('ao fechar até as fases, um foco que continua visível (pensador fechado) é mantido', async () => {
    montar();
    await item('mapa-fase-f1').trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement?.id).toBe('mapa-pensador-alfa');
    await wrapper!.findAll('button.mapa-mental__acao')[1]!.trigger('click');
    expect(item('mapa-pensador-alfa').attributes('tabindex')).toBe('0');
  });
});
