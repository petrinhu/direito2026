// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AvisoArmazenamento from '@/ui/componentes/AvisoArmazenamento.vue';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

/**
 * Ordem do líder, 22/09/2026, verbatim: faixa discreta, exibida só na
 * primeira visita, avisando que o site guarda tema e progresso NESTE
 * navegador, sem cookies, sem rastreamento, sem enviar nada a servidor;
 * botão "Entendi" que fecha para sempre; link de apagar dados com
 * confirmação; região anunciada por leitor de tela sem roubar o foco.
 */
describe('AvisoArmazenamento', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('aparece na primeira visita (armazenamento saudável, nunca visto)', () => {
    const repositorio = new RepositorioMemoria();
    const wrapper = mount(AvisoArmazenamento, { props: { repositorio } });
    expect(wrapper.find('.aviso-armazenamento').exists()).toBe(true);
    expect(wrapper.text().toLowerCase()).toContain('neste navegador');
    // Diz explicitamente que NÃO usa cookie (linguagem simples, ordem do
    // líder), então a palavra aparece — negada, nunca afirmando uso.
    expect(wrapper.text().toLowerCase()).toContain('não usa cookies');
  });

  it('não aparece na segunda visita (já visto)', () => {
    const repositorio = new RepositorioMemoria();
    repositorio.marcarAvisoArmazenamentoVisto();
    const wrapper = mount(AvisoArmazenamento, { props: { repositorio } });
    expect(wrapper.find('.aviso-armazenamento').exists()).toBe(false);
  });

  it('clicar em Entendi marca como visto e fecha a faixa imediatamente', async () => {
    const repositorio = new RepositorioMemoria();
    const wrapper = mount(AvisoArmazenamento, { props: { repositorio } });
    await wrapper.find('.aviso-armazenamento__entendi').trigger('click');

    expect(wrapper.find('.aviso-armazenamento').exists()).toBe(false);
    expect(repositorio.lerAvisoArmazenamentoVisto()).toBe(true);
  });

  it('o link de apagar, confirmado, limpa progresso e tema', async () => {
    vi.stubGlobal('confirm', () => true);
    const reloadEspiao = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload: reloadEspiao });

    const repositorio = new RepositorioMemoria();
    repositorio.salvar('p1/intr-direito/u1', {
      versao: 1,
      atualizadoEm: 't0',
      blocosLidos: ['bloco-1'],
      ultimaAba: 'resumo'
    });
    repositorio.salvarTema('escuro');

    const wrapper = mount(AvisoArmazenamento, { props: { repositorio } });
    await wrapper.find('.aviso-armazenamento__apagar').trigger('click');

    expect(repositorio.ler('p1/intr-direito/u1')).toBeUndefined();
    expect(repositorio.lerTema()).toBeUndefined();
    expect(reloadEspiao).toHaveBeenCalled();
  });

  it('cancelando a confirmação, não apaga nada', async () => {
    vi.stubGlobal('confirm', () => false);
    const repositorio = new RepositorioMemoria();
    repositorio.salvarTema('escuro');

    const wrapper = mount(AvisoArmazenamento, { props: { repositorio } });
    await wrapper.find('.aviso-armazenamento__apagar').trigger('click');

    expect(repositorio.lerTema()).toBe('escuro');
  });

  it('região de status anunciada ao leitor de tela, sem roubar o foco (não é tabulável)', () => {
    const repositorio = new RepositorioMemoria();
    const wrapper = mount(AvisoArmazenamento, { props: { repositorio } });
    const regiao = wrapper.find('.aviso-armazenamento');
    expect(regiao.attributes('role')).toBe('status');
    expect(regiao.attributes('aria-live')).toBe('polite');
    expect(regiao.attributes('tabindex')).toBeUndefined();
  });

  it('com armazenamento indisponível (RepositorioMemoria), confirmar não entra em laço dentro da mesma sessão', async () => {
    const repositorio = new RepositorioMemoria();
    const primeiraMontagem = mount(AvisoArmazenamento, { props: { repositorio } });
    await primeiraMontagem.find('.aviso-armazenamento__entendi').trigger('click');

    // Mesma sessão (mesma instância de repositório): reabrir o componente
    // (equivalente a navegar para outra página da SPA) não mostra de novo.
    const segundaMontagem = mount(AvisoArmazenamento, { props: { repositorio } });
    expect(segundaMontagem.find('.aviso-armazenamento').exists()).toBe(false);
  });
});
