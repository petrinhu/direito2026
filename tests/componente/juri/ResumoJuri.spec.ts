// @vitest-environment jsdom
/* global Element */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import ResumoJuri from '@/ui/area-juri/ResumoJuri.vue';
import { validarConteudoJuri } from '@/core/juri/validar';
import {
  conteudoJuriFalso,
  conteudoJuriValidadoFalso,
  idsFalsos
} from '../../unidade/apoio/conteudoJuriFalso';

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

/** Imagem que nunca chega: o teste do resumo não decifra nada. */
const abrirQueNaoChega = vi.fn(() => new Promise<never>(() => {}));

function montar(): VueWrapper {
  w = mount(ResumoJuri, {
    props: { conteudo: conteudoJuriValidadoFalso(), abrirImagem: abrirQueNaoChega },
    attachTo: document.body
  });
  return w;
}

describe('ResumoJuri', () => {
  it('mostra o quadro dos termos, com termo, região e fontes', () => {
    const texto = montar().text();
    expect(texto).toContain('Termo fictício 1');
    expect(texto).toContain('Região fictícia 2');
    expect(texto).toContain('Fonte fictícia do termo 3');
  });

  it('mostra as linhas A e B lado a lado, com os rótulos neutros', () => {
    const quadro = montar();
    expect(quadro.findAll('.juri-linhas')).toHaveLength(1);
    expect(quadro.text()).toContain('Laudo dos autos');
    expect(quadro.text()).toContain('Elementos do caso real');
    expect(quadro.text()).toContain('Linha A fictícia do bloco um.');
    expect(quadro.text()).toContain('Linha B fictícia do bloco um.');
  });

  it('bloco sem linhas A e B não mostra os rótulos', () => {
    const quadro = montar();
    const segundo = quadro.get('#bloco-2');
    expect(segundo.text()).not.toContain('Laudo dos autos');
  });

  it('as fontes de cada bloco aparecem discretas, dentro do próprio bloco', () => {
    const quadro = montar();
    expect(quadro.get('#bloco-1').text()).toContain('Fonte fictícia um');
    expect(quadro.get('#bloco-2').text()).toContain('Fonte fictícia dois');
  });

  it('mostra as perguntas da defesa com tese, resposta e limite', () => {
    const texto = montar().text();
    expect(texto).toContain('Tese fictícia da defesa.');
    expect(texto).toContain('Limite fictício da resposta.');
  });

  it('mostra as imagens cifradas com a legenda, pedindo cada uma ao abrir', () => {
    const quadro = montar();
    expect(quadro.text()).toContain('Legenda fictícia da imagem um');
    expect(quadro.text()).toContain('Legenda fictícia da imagem dois');
    expect(abrirQueNaoChega).toHaveBeenCalledWith('0'.repeat(31) + '0');
  });
});

describe('ResumoJuri: ids únicos com mais de um bloco com linhas A e B', () => {
  it('nenhum id se repete no DOM, e cada aria-labelledby aponta para um único alvo', () => {
    const bruto = conteudoJuriFalso() as { resumo: Record<string, unknown>[] };
    bruto.resumo[1] = {
      ...bruto.resumo[1],
      linhaA: '<p>Linha A fictícia do bloco dois.</p>',
      linhaB: '<p>Linha B fictícia do bloco dois.</p>'
    };
    const resultado = validarConteudoJuri(bruto, idsFalsos());
    if (!resultado.ok) throw new Error(JSON.stringify(resultado.erros));
    w = mount(ResumoJuri, {
      props: { conteudo: resultado.conteudo, abrirImagem: abrirQueNaoChega },
      attachTo: document.body
    });

    const raiz = w.element as HTMLElement;
    const ids = Array.from(raiz.querySelectorAll('[id]'), (el: Element) => el.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Dois blocos com linhas: quatro rótulos de coluna (laudo e caso, em cada bloco).
    const rotulos = Array.from(raiz.querySelectorAll('[aria-labelledby]'), (el: Element) =>
      el.getAttribute('aria-labelledby')
    ).filter((id): id is string => id !== null && /^juri-(laudo|caso)-/.test(id));
    expect(rotulos).toHaveLength(4);
    for (const id of rotulos) {
      expect(raiz.querySelectorAll(`#${id}`)).toHaveLength(1);
    }
  });
});
