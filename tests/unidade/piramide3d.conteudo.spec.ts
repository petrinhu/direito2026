import { describe, expect, it } from 'vitest';
import { resumo } from '@/conteudo/p1/intr-direito/u3-material-norma-interpretacao/resumo';
import { PERFIS } from '@/core/piramide3d/perfil';
import type { ChaveFigura3d } from '@/core/piramide3d/tipos';

/**
 * Elo entre o conteúdo da u3 e o desenho: cada bloco com figura traz o <figure> com a versão plana
 * dentro do corpoHtml, e os dados do 3D cobrem exatamente os níveis que o desenho tem. O teste só
 * confere estrutura (ids, chaves, contagens); nenhum trecho de texto de estudo mora aqui.
 */
const ESPERADO: readonly {
  bloco: string;
  chave: ChaveFigura3d;
  alvo: string;
  figura: 'kelsen' | 'brasil';
}[] = [
  { bloco: 'bloco-13', chave: 'piramide-kelsen', alvo: 'figura-piramide-kelsen', figura: 'kelsen' },
  { bloco: 'bloco-14', chave: 'piramide-brasil', alvo: 'figura-piramide-brasil', figura: 'brasil' }
];

function niveisDoPerfil(figura: 'kelsen' | 'brasil'): string[] {
  const perfil = PERFIS[figura];
  return [
    ...perfil.fantasma,
    ...perfil.camadas.map((c) => c.nivel),
    ...perfil.setas.map((s) => s.nivel)
  ];
}

function figuraDoBloco(idBloco: string) {
  const bloco = resumo.find((b) => b.id === idBloco);
  if (!bloco) throw new Error(`bloco ${idBloco} sumiu da u3`);
  const item = bloco.figuras3d?.[0];
  if (!item) throw new Error(`bloco ${idBloco} sem figuras3d`);
  return { bloco, item };
}

/** O trecho do corpoHtml que é o <figure> do alvo. */
function htmlDaFigura(corpoHtml: string, alvo: string): string {
  const ini = corpoHtml.indexOf(`<figure id="${alvo}"`);
  const fim = corpoHtml.indexOf('</figure>', ini);
  return ini < 0 || fim < 0 ? '' : corpoHtml.slice(ini, fim + '</figure>'.length);
}

describe.each(ESPERADO)('u3, $bloco: figura $figura', ({ bloco: idBloco, chave, alvo, figura }) => {
  const { bloco, item } = figuraDoBloco(idBloco);
  const html = htmlDaFigura(bloco.corpoHtml, alvo);

  it('há uma figura 3d só, com a chave e o alvo certos', () => {
    expect(bloco.figuras3d).toHaveLength(1);
    expect(item.chave).toBe(chave);
    expect(item.alvo).toBe(alvo);
  });

  it('o alvo existe UMA vez no corpoHtml, como id do <figure> com a marca da figura', () => {
    expect(bloco.corpoHtml.split(`id="${alvo}"`)).toHaveLength(2);
    expect(html).toContain(`data-figura-3d="${figura}"`);
    expect(html).toContain('class="figura-piramide__plana"');
  });

  it('os dados do 3D cobrem exatamente os níveis do desenho, todos com texto', () => {
    const doDado = item.dados.niveis.map((n) => n.nivel).sort();
    expect(doDado).toEqual(niveisDoPerfil(figura).sort());
    for (const n of item.dados.niveis) {
      expect(n.nome.length, `nome de ${n.nivel}`).toBeGreaterThan(0);
      expect(n.rotulo.length, `rótulo de ${n.nivel}`).toBeGreaterThan(0);
      expect(n.explicacao.length, `explicação de ${n.nivel}`).toBeGreaterThan(0);
      expect(n.exemplo.length, `exemplo de ${n.nivel}`).toBeGreaterThan(0);
    }
    expect(item.dados.aria.length).toBeGreaterThan(0);
  });

  it('a lista do <figure> traz um item por nível, com os mesmos níveis do dado', () => {
    const naLista = [...html.matchAll(/<li data-nivel="([^"]+)"/g)].map((m) => m[1]).sort();
    expect(naLista).toEqual(item.dados.niveis.map((n) => n.nivel).sort());
  });

  it('a versão plana desenha um rótulo por nível, na mesma ordem e com o rótulo do dado', () => {
    const svg = html.slice(html.indexOf('<svg'), html.indexOf('</svg>'));
    const textos = [...svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
      [...(m[1] ?? '').matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((t) => t[1]).join(' ')
    );
    // Só os níveis que têm rótulo no desenho plano (os dois do fim da Figura 1 são as setas).
    expect(textos).toEqual(item.dados.niveis.map((n) => n.rotulo));
  });
});

describe('u3, bloco-14: o rótulo de atribuição saiu da Figura 2', () => {
  const { bloco, item } = figuraDoBloco('bloco-14');
  const html = htmlDaFigura(bloco.corpoHtml, 'figura-piramide-brasil');

  it('o desenho plano não tem o rótulo "Adaptação brasileira" nem a frase que ele trazia', () => {
    const svg = html.slice(html.indexOf('<svg'), html.indexOf('</svg>'));
    expect(svg).not.toContain('Adaptação brasileira');
    expect(svg).not.toContain('Kelsen não trata do Brasil');
  });

  it('a lista não tem o item de atribuição: todo item da lista é um nível', () => {
    const itens = [...html.matchAll(/<li[ >]/g)].length;
    const niveis = [...html.matchAll(/<li data-nivel=/g)].length;
    expect(itens).toBe(niveis);
  });

  it('o rótulo e a descrição para leitor de tela do 3D não falam da nota de atribuição', () => {
    for (const n of item.dados.niveis) expect(n.rotulo).not.toContain('Adaptação brasileira');
    expect(item.dados.aria).not.toContain('nota de adaptação');
  });
});
