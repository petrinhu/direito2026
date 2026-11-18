// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import axe from 'axe-core';
import Sobre from '@/ui/paginas/Sobre.vue';
import { TITULAR } from '@/app/rodape/titular';
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';
import { rotas } from '@/app/router/rotas';

/**
 * SB-F8, página Sobre (esqueleto). Os textos finais vêm da SB-F11 (ux-writer); aqui
 * a estrutura é a da seção 4 do plano, e o texto provisório fica marcado como tal.
 * O nome do titular entra SÓ por TITULAR (autoria.ts, via app/rodape/titular): nunca escrito à mão.
 */

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

function secaoComTitulo(titulo: string) {
  const secao = w!.findAll('section').find((s) => s.find('h2').text() === titulo);
  if (!secao) throw new Error(`seção "${titulo}" ausente`);
  return secao;
}

describe('página Sobre, estrutura (SB-F8)', () => {
  it('tem um único h1 "Sobre"', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(w.findAll('h1').map((h) => h.text())).toEqual(['Sobre']);
  });

  it('as seções saem na ordem: O projeto, Autoria, Tecnologias, Para nerds', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(w.findAll('h2').map((h) => h.text())).toEqual([
      'O projeto',
      'Autoria',
      'Tecnologias',
      'Para nerds'
    ]);
  });

  it('a seção Para nerds tem h2 próprio e nenhum conteúdo escondido', () => {
    w = mount(Sobre, { attachTo: document.body });
    const nerds = w.find('[data-secao="para-nerds"]');
    expect(nerds.exists()).toBe(true);
    expect(nerds.find('h2').text()).toBe('Para nerds');
    expect(nerds.find('details').exists()).toBe(false);
    expect(nerds.attributes('hidden')).toBeUndefined();
  });

  it('a lista do que o site oferece vem do mapa de rótulos de aba, sem reescrever nada', () => {
    w = mount(Sobre, { attachTo: document.body });
    const itens = secaoComTitulo('O projeto')
      .findAll('li')
      .map((li) => li.text());
    expect(itens).toEqual(Object.values(ROTULOS_ABA));
  });
});

describe('página Sobre, autoria e crédito', () => {
  it('a seção Autoria mostra o titular exatamente como TITULAR', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(TITULAR.length).toBeGreaterThan(0);
    expect(secaoComTitulo('Autoria').text()).toContain(TITULAR);
  });

  it('a seção Autoria traz o crédito do código (D8)', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(secaoComTitulo('Autoria').text()).toContain(
      'O código foi escrito por Claude, inteligência artificial da Anthropic.'
    );
  });
});

describe('página Sobre, texto', () => {
  it('não tem travessão (U+2014 nem U+2013) em lugar nenhum do texto da página', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(w.text()).not.toMatch(/[\u2013\u2014]/);
  });

  it('não usa aula, slide, "o material" nem "no material"', () => {
    w = mount(Sobre, { attachTo: document.body });
    const texto = w.text().toLowerCase();
    expect(texto).not.toMatch(/\b(aula|aulas|slide|slides)\b/);
    expect(texto).not.toContain('o material');
    expect(texto).not.toContain('no material');
  });
});

describe('página Sobre, acessibilidade', () => {
  it('não tem violação de axe', async () => {
    w = mount(Sobre, { attachTo: document.body });
    // Sem cor calculada no jsdom, o contraste é conferido no CSS, não aqui.
    const resultado = await axe.run(w.element as HTMLElement, {
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
  });
});

describe('rota /sobre', () => {
  it('existe com o nome sobre e import preguiçoso', () => {
    const rota = rotas.find((r) => r.name === 'sobre');
    expect(rota?.path).toBe('/sobre');
    expect(typeof rota?.component).toBe('function');
  });

  it('vem antes do coringa de não encontrado', () => {
    const indiceSobre = rotas.findIndex((r) => r.name === 'sobre');
    const indiceCoringa = rotas.findIndex((r) => r.name === 'nao-encontrado');
    expect(indiceSobre).toBeGreaterThanOrEqual(0);
    expect(indiceSobre).toBeLessThan(indiceCoringa);
  });
});
