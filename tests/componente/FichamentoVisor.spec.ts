// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import FichamentoVisor from '@/ui/componentes/FichamentoVisor.vue';
import { DADOS_SINTETICOS } from '../unidade/apoio/dadosFichamento';

let wrapper: VueWrapper | undefined;

function montar() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  wrapper = mount(FichamentoVisor, {
    props: { dados: DADOS_SINTETICOS, baseUnidade: '/p/p1/c/u1' },
    attachTo: host
  });
  return wrapper;
}

const botaoDaFicha = (id: string) => wrapper!.find(`#ficha-${id} button.ficha__botao`);
const corpoDaFicha = (id: string) => wrapper!.find(`#ficha-${id} .ficha__corpo`);

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = '';
  window.location.hash = '';
});

describe('FichamentoVisor: estrutura', () => {
  it('uma ficha por pensador, cada uma com âncora própria', () => {
    montar();
    expect(wrapper!.findAll('article.ficha')).toHaveLength(3);
    expect(wrapper!.find('#ficha-alfa').exists()).toBe(true);
  });

  it('agrupa por período e fase, na ordem, com título de cada grupo', () => {
    montar();
    const titulos = wrapper!.findAll('.fichamento__grupo-titulo').map((h) => h.text());
    expect(titulos).toEqual([
      'Idade Antiga, Fase um',
      'Idade Antiga, Fase dois',
      'Idade Média, Fase três'
    ]);
  });

  it('o índice lista as fichas com link para a âncora', () => {
    montar();
    const links = wrapper!.findAll('nav.fichamento__indice a');
    expect(links.map((a) => a.attributes('href'))).toEqual([
      '#ficha-alfa',
      '#ficha-beta',
      '#ficha-gama'
    ]);
  });

  it('o cabeçalho da ficha é um botão que abre e fecha, com aria-expanded e aria-controls', () => {
    montar();
    const botao = botaoDaFicha('alfa');
    expect(botao.attributes('aria-expanded')).toBe('false');
    expect(botao.attributes('aria-controls')).toBe(corpoDaFicha('alfa').attributes('id'));
    expect(botao.text()).toContain('Alfa');
    expect(botao.text()).toContain('1-2');
  });
});

describe('FichamentoVisor: abrir e fechar', () => {
  it('começa fechada e abre ao clicar, mostrando os campos do fichamento', async () => {
    montar();
    expect(corpoDaFicha('alfa').isVisible()).toBe(false);
    await botaoDaFicha('alfa').trigger('click');
    expect(botaoDaFicha('alfa').attributes('aria-expanded')).toBe('true');
    const corpo = corpoDaFicha('alfa');
    expect(corpo.isVisible()).toBe(true);
    for (const campo of [
      'Período',
      'Obras de referência',
      'Ideia central',
      'Conceitos-chave',
      'Citação',
      'Comentário: para o Direito hoje',
      'Ressalva das fontes',
      'Referências'
    ]) {
      expect(corpo.text(), campo).toContain(campo);
    }
    expect(corpo.text()).toContain('Idade Antiga, Fase um');
    expect(corpo.text()).toContain('Pensa em açúcar.');
    expect(corpo.find('blockquote').text()).toContain('texto literal');
    expect(corpo.text()).toContain('Fonte A');
  });

  it('omite o que a ficha não tem: sem citação, sem obras e sem ressalva não aparecem esses campos', async () => {
    montar();
    await botaoDaFicha('beta').trigger('click');
    const corpo = corpoDaFicha('beta');
    expect(corpo.text()).not.toContain('Citação');
    expect(corpo.text()).not.toContain('Obras de referência');
    expect(corpo.text()).not.toContain('Ressalva das fontes');
    expect(corpo.text()).not.toContain('undefined');
  });

  it('liga a ficha ao bloco do resumo', async () => {
    montar();
    await botaoDaFicha('alfa').trigger('click');
    expect(corpoDaFicha('alfa').find('a[href="/p/p1/c/u1#bloco-0"]').exists()).toBe(true);
  });

  it('"Abrir todas" e "Fechar todas"', async () => {
    montar();
    const [abrir, fechar] = wrapper!.findAll('button.fichamento__acao');
    expect(abrir!.text()).toBe('Abrir todas as fichas');
    expect(fechar!.text()).toBe('Fechar todas as fichas');
    await abrir!.trigger('click');
    expect(wrapper!.findAll('button.ficha__botao[aria-expanded="true"]')).toHaveLength(3);
    await fechar!.trigger('click');
    expect(wrapper!.findAll('button.ficha__botao[aria-expanded="true"]')).toHaveLength(0);
  });

  it('o endereço com âncora de ficha abre aquela ficha', async () => {
    window.location.hash = '#ficha-beta';
    montar();
    await wrapper!.vm.$nextTick();
    expect(botaoDaFicha('beta').attributes('aria-expanded')).toBe('true');
    expect(botaoDaFicha('alfa').attributes('aria-expanded')).toBe('false');
  });
});

describe('FichamentoVisor: filtro', () => {
  it('filtra por período e anuncia o total em região de status', async () => {
    montar();
    await wrapper!.find('select.fichamento__periodo').setValue('era:antiga');
    expect(wrapper!.findAll('article.ficha')).toHaveLength(2);
    expect(wrapper!.find('[role="status"]').text()).toBe('2 fichas');
  });

  it('filtra por fase', async () => {
    montar();
    await wrapper!.find('select.fichamento__periodo').setValue('fase:f3');
    expect(wrapper!.findAll('article.ficha').map((a) => a.attributes('id'))).toEqual([
      'ficha-gama'
    ]);
    expect(wrapper!.find('[role="status"]').text()).toBe('1 ficha');
  });

  it('filtra por termo, sem diferenciar acento e maiúscula', async () => {
    montar();
    await wrapper!.find('input.fichamento__busca').setValue('ACUCAR');
    expect(wrapper!.findAll('article.ficha').map((a) => a.attributes('id'))).toEqual([
      'ficha-alfa'
    ]);
  });

  it('o índice acompanha o filtro', async () => {
    montar();
    await wrapper!.find('input.fichamento__busca').setValue('sal');
    expect(wrapper!.findAll('nav.fichamento__indice a')).toHaveLength(1);
  });

  it('sem resultado mostra mensagem e um botão que limpa os filtros', async () => {
    montar();
    await wrapper!.find('input.fichamento__busca').setValue('inexistente');
    expect(wrapper!.findAll('article.ficha')).toHaveLength(0);
    expect(wrapper!.find('[role="status"]').text()).toBe('Nenhuma ficha encontrada');
    await wrapper!.find('button.fichamento__limpar').trigger('click');
    expect(wrapper!.findAll('article.ficha')).toHaveLength(3);
  });

  it('os controles têm rótulo associado, não só placeholder', () => {
    montar();
    for (const seletor of ['select.fichamento__periodo', 'input.fichamento__busca']) {
      const id = wrapper!.find(seletor).attributes('id');
      expect(id, seletor).toBeTruthy();
      expect(wrapper!.find(`label[for="${id}"]`).exists(), seletor).toBe(true);
    }
  });
});
