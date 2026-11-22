// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Cadeira from '@/ui/paginas/Cadeira.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import type { Curriculo, ReferenciaUnidade } from '@/core/curriculo/tipos';

/**
 * EP-F11-CADEIRA-SECOES: a página da cadeira agrupa as unidades nas mesmas
 * seções que o menu lateral usa (AV, depois grupo), com o mesmo rótulo e a
 * mesma ordem. A fonte é itensDaCadeira, a mesma que o MenuCurriculo lê.
 */
function unidade(id: string, titulo: string): ReferenciaUnidade {
  return { id, rotulo: titulo, titulo, estado: 'publicado', abas: ['resumo'] };
}

const curriculo: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      {
        id: 'intr-direito',
        nome: 'Introdução ao Direito',
        estado: 'publicado',
        unidades: [
          unidade('u1', 'Unidade um'),
          unidade('u2', 'Unidade dois'),
          unidade('u3-livro-a', 'Livro A'),
          unidade('u3-livro-b', 'Livro B'),
          unidade('u3-material-c', 'Material C'),
          unidade('u4-prova-unica', 'Prova única')
        ],
        grupos: [
          { unidade: 'u3', id: 'livro', rotulo: 'Livro' },
          { unidade: 'u3', id: 'material', rotulo: 'Material de estudo' },
          { unidade: 'u3', id: 'extra', rotulo: 'Extra' },
          { unidade: 'u4', id: 'prova', rotulo: 'Prova', direto: true }
        ]
      }
    ]
  }
];

function montar() {
  return mount(Cadeira, {
    props: { periodo: 'p1', cadeira: 'intr-direito' },
    global: { provide: { [CHAVE_CURRICULO as symbol]: curriculo } }
  });
}

/** Títulos de seção (AV, grupo), sem os títulos que ficam dentro de um cartão (link). */
function titulosDe(
  nivel: number,
  raiz: {
    querySelectorAll: (
      seletor: string
    ) => ArrayLike<{ textContent: string | null; closest: (s: string) => unknown }>;
  }
): string[] {
  return Array.from(raiz.querySelectorAll(`h${nivel}`))
    .filter((h) => !h.closest('a'))
    .map((h) => h.textContent?.trim() ?? '');
}

describe('Cadeira, seções por AV com os mesmos rótulos do menu', () => {
  it('cada AV vira uma seção com título de nível 2 usando o rótulo do menu', () => {
    const wrapper = montar();
    const titulosNivel2 = titulosDe(2, wrapper.element);
    expect(titulosNivel2).toContain('AV3');
    expect(titulosNivel2).toContain('AV4');
  });

  it('cada grupo vira título de nível 3, com o rótulo do menu, na ordem declarada', () => {
    const wrapper = montar();
    expect(titulosDe(3, wrapper.element)).toEqual(['Livro', 'Material de estudo', 'Extra']);
  });

  it('os tópicos ficam dentro da seção do próprio grupo', () => {
    const wrapper = montar();
    const titulo = Array.from(wrapper.element.querySelectorAll('h3')).find(
      (h) => h.textContent?.trim() === 'Material de estudo'
    );
    const secao = titulo?.closest('section');
    const hrefs = Array.from(secao?.querySelectorAll('a') ?? []).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/p/p1/intr-direito/u3-material-c']);
  });

  it('grupo direto vira cartão na seção da AV, sem título de grupo próprio', () => {
    const wrapper = montar();
    const titulo = Array.from(wrapper.element.querySelectorAll('h2')).find(
      (h) => h.textContent?.trim() === 'AV4'
    );
    const secao = titulo?.closest('section');
    const hrefs = Array.from(secao?.querySelectorAll('a') ?? []).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/p/p1/intr-direito/u4-prova-unica']);
    expect(titulosDe(3, secao ?? wrapper.element)).toHaveLength(0);
  });

  it('grupo sem tópico mostra o estado em breve, sem cartão vazio', () => {
    const wrapper = montar();
    const titulo = Array.from(wrapper.element.querySelectorAll('h3')).find(
      (h) => h.textContent?.trim() === 'Extra'
    );
    const secao = titulo?.closest('section');
    expect(secao?.querySelectorAll('a')).toHaveLength(0);
    expect(secao?.textContent).toContain('em breve');
  });

  it('unidades simples vêm antes das AVs, na ordem de número, e fora de seção de AV', () => {
    const wrapper = montar();
    const hrefs = Array.from(wrapper.element.querySelectorAll('a')).map((a) =>
      a.getAttribute('href')
    );
    expect(hrefs).toEqual([
      '/p/p1/intr-direito/u1',
      '/p/p1/intr-direito/u2',
      '/p/p1/intr-direito/u3-livro-a',
      '/p/p1/intr-direito/u3-livro-b',
      '/p/p1/intr-direito/u3-material-c',
      '/p/p1/intr-direito/u4-prova-unica'
    ]);
  });

  it('a hierarquia de títulos não pula nível (h1, depois h2, h3, h4)', () => {
    const wrapper = montar();
    const niveis = Array.from(wrapper.element.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) =>
      Number(h.tagName.slice(1))
    );
    expect(niveis[0]).toBe(1);
    for (let i = 1; i < niveis.length; i++) {
      expect(niveis[i]).toBeLessThanOrEqual(niveis[i - 1] + 1);
    }
  });
});
