// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import QuadroProva from '@/ui/componentes/QuadroProva.vue';

/**
 * Quadro de contagem minimizado encolhe também na largura (ordem do líder,
 * 20/10/2026: "quando minimiza, apenas reduz o tamanho vertical, mas pode
 * reduzir o horizontal também"). Minimizado sobram só a pílula e o botão
 * Mostrar; a largura fixa de 22rem fica só no estado expandido.
 *
 * O estado vem por classe no elemento raiz (jsdom não aplica a cascata do CSS
 * importado, vitest roda com css: false), então a regra é travada no
 * arquivo-fonte, no mesmo padrão de design.gavetaSemMovimento.
 *
 * Nasce vermelho: antes da correção não existia a classe de estado nem a
 * regra de largura para o estado minimizado.
 */
const CAMINHO = resolve(__dirname, '../../src/ui/componentes/QuadroProva.vue');
const fonte = readFileSync(CAMINHO, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

const AGORA_20_10 = new Date('2026-10-20T15:00:00Z');

/**
 * Corpo da regra cujo seletor começa a linha (sem casar com seletores
 * compostos que apenas contêm o mesmo trecho, como `:root[...] .quadro-prova`).
 */
function corpoDaRegra(seletor: string): string {
  const escapado = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const achado = fonte.match(new RegExp(`(?:^|\\n)${escapado}\\s*\\{([^}]*)\\}`));
  return achado?.[1] ?? '';
}

describe('QuadroProva minimizado: classe de estado no elemento raiz', () => {
  beforeEach(() => window.localStorage.clear());

  it('aberto, a raiz não tem a classe quadro-prova--minimizado', () => {
    const w = mount(QuadroProva, { props: { agora: AGORA_20_10 } });
    expect(w.find('.quadro-prova').classes()).not.toContain('quadro-prova--minimizado');
  });

  it('minimizado, a raiz ganha a classe quadro-prova--minimizado', async () => {
    const w = mount(QuadroProva, { props: { agora: AGORA_20_10 } });
    await w.find('button[aria-expanded]').trigger('click');
    expect(w.find('.quadro-prova').classes()).toContain('quadro-prova--minimizado');
  });
});

describe('QuadroProva minimizado: regra CSS de largura', () => {
  it('o estado expandido mantém a largura de 22rem como hoje', () => {
    expect(corpoDaRegra('.quadro-prova')).toMatch(/width:\s*min\(100%,\s*22rem\)/);
  });

  it('o estado minimizado troca a largura fixa por max-content', () => {
    expect(corpoDaRegra('.quadro-prova--minimizado')).toMatch(/width:\s*max-content/);
  });

  it('o estado minimizado mantém o teto de 22rem e o encaixe no contêiner', () => {
    expect(corpoDaRegra('.quadro-prova--minimizado')).toMatch(/max-width:\s*min\(100%,\s*22rem\)/);
  });

  it('a ancoragem à direita (margin-left: auto) continua valendo quando minimizado', () => {
    expect(corpoDaRegra('.quadro-prova')).toMatch(/margin-left:\s*auto/);
    expect(corpoDaRegra('.quadro-prova--minimizado')).not.toMatch(/margin-left/);
  });
});
