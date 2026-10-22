// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import { curriculo as curriculoReal } from '@/conteudo/curriculo';
import type { Curriculo } from '@/core/curriculo/tipos';
import { lerIdDeUnidade } from '@/core/curriculo/idDeUnidade';

/**
 * Ordem do líder (20/10/2026): "A estrutura do menu lateral deve ser: Filosofia
 * Jurídica | -- Unidade 1 | -- Interdisciplinar | -- Unidade 3. Deve ser
 * recolhível, como já é. O mesmo pras outras cadeiras". O atalho é o item
 * "Interdisciplinar" dentro da lista recolhível da cadeira, logo depois da
 * Unidade 1.
 */

const RotuloAtalho = 'Interdisciplinar';
const NomeAcessivelAtalho = 'Interdisciplinar, atalho para a área restrita';

function curriculoComAtalho(): Curriculo {
  return [
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
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Conceito e fontes do Direito',
              estado: 'publicado',
              abas: ['resumo']
            }
          ],
          atalhoUnidade: {
            apos: 'u1',
            rotulo: RotuloAtalho,
            cadeiraId: 'interdisciplinar'
          }
        },
        {
          id: 'sem-atalho',
          nome: 'Cadeira Sem Atalho',
          estado: 'publicado',
          unidades: []
        },
        {
          id: 'interdisciplinar',
          nome: 'Interdisciplinar',
          estado: 'publicado',
          restrita: true,
          unidades: []
        }
      ]
    }
  ];
}

function curriculoFilosofia(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: [
        {
          id: 'filosofia-juridica',
          nome: 'Filosofia Jurídica',
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Idade Antiga',
              estado: 'publicado',
              abas: []
            },
            { id: 'u3', rotulo: 'Unidade 3', titulo: 'Moderna', estado: 'publicado', abas: [] }
          ],
          atalhoUnidade: { apos: 'u1', rotulo: RotuloAtalho, cadeiraId: 'interdisciplinar' }
        },
        {
          id: 'interdisciplinar',
          nome: 'Interdisciplinar',
          estado: 'publicado',
          restrita: true,
          unidades: []
        }
      ]
    }
  ];
}

const montados: VueWrapper[] = [];

function montar(curriculo: Curriculo, caminhoAtual = ''): VueWrapper {
  const w = mount(MenuCurriculo, {
    props: { curriculo, caminhoAtual },
    attachTo: document.body
  });
  montados.push(w);
  return w;
}

afterEach(() => {
  while (montados.length > 0) montados.pop()!.unmount();
});

async function abrirPeriodoECadeira(w: VueWrapper, cadeiraId: string): Promise<void> {
  await w.get('button[aria-controls="lista-p1"]').trigger('click');
  await w.get(`button[aria-controls="lista-${cadeiraId}"]`).trigger('click');
}

/** Textos dos itens que estão DENTRO da lista da cadeira, na ordem do DOM. */
function itensDaCadeira(w: VueWrapper, cadeiraId: string): string[] {
  return w.findAll(`#lista-${cadeiraId} > li`).map((li) =>
    li
      .text()
      .replace(/\u00a0/g, ' ')
      .trim()
  );
}

function atalhoDa(w: VueWrapper, cadeiraId: string) {
  return w.get(`#lista-${cadeiraId} a[href="/p/p1/interdisciplinar"]`);
}

describe('MenuCurriculo, atalho Interdisciplinar dentro da cadeira', () => {
  it('o texto visível do atalho é exatamente "Interdisciplinar", sem "Unidade 2"', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(atalhoDa(w, 'intr-direito').text()).toBe('Interdisciplinar');
  });

  it('na Introdução ao Direito a ordem da lista é Unidade 1, depois o atalho', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(itensDaCadeira(w, 'intr-direito')).toEqual(['Unidade 1', 'Interdisciplinar']);
  });

  it('em Filosofia Jurídica a ordem é Unidade 1, Interdisciplinar, Unidade 3', async () => {
    const w = montar(curriculoFilosofia());
    await abrirPeriodoECadeira(w, 'filosofia-juridica');

    expect(itensDaCadeira(w, 'filosofia-juridica')).toEqual([
      'Unidade 1',
      'Interdisciplinar',
      'Unidade 3'
    ]);
  });

  it('o atalho fica DENTRO da lista recolhível: some quando a cadeira está fechada', async () => {
    const w = montar(curriculoComAtalho());
    await w.get('button[aria-controls="lista-p1"]').trigger('click');

    expect(atalhoDa(w, 'intr-direito').isVisible()).toBe(false);

    await w.get('button[aria-controls="lista-intr-direito"]').trigger('click');
    expect(atalhoDa(w, 'intr-direito').isVisible()).toBe(true);

    await w.get('button[aria-controls="lista-intr-direito"]').trigger('click');
    expect(atalhoDa(w, 'intr-direito').isVisible()).toBe(false);
  });

  /**
   * Ordem do líder (20/10/2026, verbatim): "O link do interdisciplinar deve ser
   * ter a seta lateral também, mesmo sem expandir, pois conta como se fosse a
   * unidade 2. Para não parecer que foi esquecimento." A seta é decorativa
   * (aria-hidden), fica na mesma coluna do triângulo das unidades, não é botão
   * e não expande nada: o atalho continua sendo um link.
   */
  it('o atalho ganha a seta lateral, decorativa, sem virar botão nem expandir', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    const atalho = atalhoDa(w, 'intr-direito');
    const linhaAtalho = atalho.element.parentElement!;
    const coluna = linhaAtalho.querySelector('.menu-curriculo__recuo');
    expect(coluna, 'coluna do triângulo ausente na linha do atalho').not.toBeNull();
    expect(coluna!.getAttribute('aria-hidden')).toBe('true');
    expect(coluna!.querySelector('.menu-curriculo__seta')).not.toBeNull();
    expect(linhaAtalho.querySelector('button')).toBeNull();
    expect(atalho.element.tagName).toBe('A');
    expect(atalho.attributes('aria-expanded')).toBeUndefined();
  });

  it('o atalho não é um segundo botão de submenu e não cria link para unidade falsa', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(w.findAll('.menu-curriculo__toggle')).toHaveLength(1);
    expect(w.find('a[href="/p/p1/intr-direito/u2"]').exists()).toBe(false);
  });

  it('o item próprio Interdisciplinar continua existindo, ao lado do atalho', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(w.findAll('a[href="/p/p1/interdisciplinar"]')).toHaveLength(2);
  });

  it('o atalho tem nome acessível que o distingue do item próprio Interdisciplinar', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    const atalho = atalhoDa(w, 'intr-direito');
    expect(atalho.attributes('aria-label')).toBe(NomeAcessivelAtalho);
    // Label in Name (WCAG 2.5.3): o nome acessível começa pelo texto visível.
    expect(NomeAcessivelAtalho.startsWith(atalho.text())).toBe(true);

    const itemProprio = w.get('#lista-p1 > li > a[href="/p/p1/interdisciplinar"]');
    expect(itemProprio.attributes('aria-label')).toBeUndefined();
    expect(itemProprio.text()).toBe('Interdisciplinar');
  });

  it('marca aria-current no atalho quando a página aberta é a cadeira restrita', () => {
    const w = montar(curriculoComAtalho(), 'p/p1/interdisciplinar');
    const atalho = w.get('a[href="/p/p1/interdisciplinar"]');
    expect(atalho.attributes('aria-current')).toBe('page');
  });

  it('cadeira sem atalho não ganha link extra', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'sem-atalho');

    expect(w.find('#lista-sem-atalho a[href="/p/p1/interdisciplinar"]').exists()).toBe(false);
  });
});

describe('MenuCurriculo com o currículo real: o atalho está em todas as cadeiras públicas', () => {
  // Cadeiras públicas do 1º período lidas do currículo (publicada e não restrita):
  // nenhuma listada à mão. O atalho Interdisciplinar é conferido só no 1º período,
  // como documentado em docs/como-adicionar-conteudo.md (seção 2) e no spec de unidade.
  const publicas = curriculoReal
    .filter((p) => p.id === 'p1')
    .flatMap((p) => p.cadeiras)
    .filter((c) => c.estado === 'publicado' && !c.restrita);

  it('há cadeiras públicas para conferir (piso contra varredura vazia)', () => {
    expect(publicas.length).toBeGreaterThan(0);
  });

  it.each(publicas.map((c) => c.id))(
    '%s: a lista é a ordem do currículo, com o atalho logo depois da unidade "apos"',
    async (cadeiraId) => {
      const cadeira = publicas.find((c) => c.id === cadeiraId)!;
      expect(cadeira.atalhoUnidade, `${cadeiraId} sem bloco atalhoUnidade`).toBeDefined();
      const atalho = cadeira.atalhoUnidade!;
      const w = montar(curriculoReal);
      await abrirPeriodoECadeira(w, cadeiraId);

      const itens = itensDaCadeira(w, cadeiraId);
      // Tópicos de grupo (uN-grupo-topico) não são itens próprios: entram na AV (D7).
      const simples = cadeira.unidades.filter((u) => lerIdDeUnidade(u.id)?.grupo === undefined);
      const posicaoDoAtalho = simples.findIndex((u) => u.id === atalho.apos) + 1;

      // Cada AV com grupos declarados (cadeira.ts) entra como item próprio do menu (D7).
      const avs = new Set((cadeira.grupos ?? []).map((g) => g.unidade)).size;
      expect(itens).toHaveLength(simples.length + 1 + avs);
      expect(itens[posicaoDoAtalho]).toBe(RotuloAtalho);
      const semAtalho = itens.filter((texto) => texto !== RotuloAtalho);
      // "Unidade 3 em breve" começa pelo rótulo da unidade: basta o prefixo.
      simples.forEach((unidade, i) => {
        expect(semAtalho[i]?.startsWith(unidade.rotulo), unidade.id).toBe(true);
      });
    }
  );
});
