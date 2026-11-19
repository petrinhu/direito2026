// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TrilhaNavegacao from '@/ui/componentes/TrilhaNavegacao.vue';
import { curriculo } from '@/conteudo/curriculo';

/**
 * WCAG 2.5.3 (Label in Name): o nome acessível de cada link da trilha tem de
 * conter o texto visível. Como o aria-label é o próprio texto visível sem o
 * hífen mole (U+00AD), a igualdade vale para TODO link, e não só para o
 * caso das abas com hífen. O U+00A0 de rotuloSemViuva fica no nome (é texto
 * visível), por isso a comparação é com o texto visível inteiro, sem trim.
 *
 * Varre o currículo real (src/conteudo), caminho a caminho: período, cadeira,
 * unidade e cada aba de cada unidade. Varredura sem piso de tamanho vira
 * falso verde (L-36), então o teste exige que cada nível tenha sido visitado.
 */
const SHY = '­';

interface CaminhoVarrido {
  readonly caminho: string;
  readonly nivel: 'periodo' | 'cadeira' | 'unidade' | 'aba';
}

function caminhosDoCurriculo(): CaminhoVarrido[] {
  const caminhos: CaminhoVarrido[] = [];
  for (const periodo of curriculo) {
    caminhos.push({ caminho: `p/${periodo.id}`, nivel: 'periodo' });
    for (const cadeira of periodo.cadeiras) {
      const baseCadeira = `p/${periodo.id}/${cadeira.id}`;
      caminhos.push({ caminho: baseCadeira, nivel: 'cadeira' });
      for (const unidade of cadeira.unidades) {
        const baseUnidade = `${baseCadeira}/${unidade.id}`;
        caminhos.push({ caminho: baseUnidade, nivel: 'unidade' });
        for (const aba of unidade.abas) {
          const caminho = aba === 'resumo' ? baseUnidade : `${baseUnidade}/${aba}`;
          caminhos.push({ caminho, nivel: 'aba' });
        }
      }
    }
  }
  return caminhos;
}

describe('TrilhaNavegacao: nome acessível igual ao texto visível (dados reais)', () => {
  const caminhos = caminhosDoCurriculo();

  it('a varredura cobre todos os níveis do currículo real (piso, L-36)', () => {
    const niveis = new Set(caminhos.map((c) => c.nivel));
    expect(niveis).toEqual(new Set(['periodo', 'cadeira', 'unidade', 'aba']));
    expect(caminhos.length).toBeGreaterThan(0);
  });

  it('para todo caminho do currículo real, aria-label === texto visível sem U+00AD', () => {
    const falhas: string[] = [];
    let linksConferidos = 0;

    for (const { caminho } of caminhos) {
      const wrapper = mount(TrilhaNavegacao, {
        props: { curriculo, caminhoAtual: caminho }
      });
      for (const link of wrapper.findAll('nav a')) {
        linksConferidos += 1;
        const visivel = link.element.textContent ?? '';
        const nome = link.attributes('aria-label') ?? '';
        if (nome !== visivel.replaceAll(SHY, '')) {
          falhas.push(`${caminho} :: visível="${visivel}" aria-label="${nome}"`);
        }
      }
      wrapper.unmount();
    }

    expect(linksConferidos, 'nenhum link da trilha foi conferido').toBeGreaterThan(0);
    expect(falhas).toEqual([]);
  });
});
