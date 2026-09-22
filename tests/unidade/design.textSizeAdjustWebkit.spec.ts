import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Defeito relatado pelo líder (22/09/2026): "no safari o cabeçalho está com
 * fonte grande demais" (iPhone, Safari/iOS = WebKit).
 *
 * Causa confirmada em fonte (não é hipótese): o WebKit no iOS aplica, por
 * padrão (`text-size-adjust: auto`), um algoritmo de inflação de texto que
 * aumenta a fonte de blocos considerados "de largura cheia" do container,
 * mesmo com `font-size` fixo em `rem`. `.barra-topo__trilha` (BarraTopo.vue)
 * usa `flex: 1; min-width: 0`, exatamente o padrão que dispara o algoritmo,
 * com texto curto (breadcrumb) dentro de viewport estreita — o caso clássico
 * descrito pela documentação do recurso.
 * Fontes: MDN ("text-size-adjust" CSS property, consultado 22/09/2026,
 * https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-size-adjust)
 * e BrowserStack ("What does -webkit-text-size-adjust do", consultado
 * 22/09/2026, https://www.browserstack.com/guide/webkit-text-size-adjust).
 * MDN confirma que o Safari (desktop e iOS) só respeita a versão prefixada
 * `-webkit-text-size-adjust`, então a declaração sem prefixo sozinha não
 * corrige nada nele — as duas formas precisam estar presentes.
 *
 * Este teste não abre Safari (não existe nesta máquina, ver
 * docs/compatibilidade-navegadores.md, seção 8): ele só trava a REGRA
 * declarada em CSS, que é o que dá para provar sem o navegador real. Nasce
 * vermelho (base.css não declara a propriedade em nenhuma forma antes desta
 * correção) e prova a si mesmo com uma checagem sintética que precisa
 * reprovar quando a declaração falta.
 */
const CAMINHO_BASE_CSS = resolve(__dirname, '../../src/ui/estilos/base.css');

function temRegraHtmlComPropriedade(css: string, propriedade: string): boolean {
  const matchHtml = css.match(/(?:^|\n|,)\s*html\s*\{([^}]*)\}/);
  if (!matchHtml) return false;
  const corpoSemComentarios = matchHtml[1]!.replace(/\/\*[\s\S]*?\*\//g, '');
  const regexPropriedade = new RegExp(`(?:^|[;{])\\s*${propriedade}\\s*:\\s*100%\\s*;`);
  return regexPropriedade.test(corpoSemComentarios);
}

describe('text-size-adjust: bloqueia a inflação automática de texto do WebKit no cabeçalho', () => {
  const css = readFileSync(CAMINHO_BASE_CSS, 'utf-8');

  it('html declara -webkit-text-size-adjust: 100% (forma que o Safari respeita)', () => {
    expect(temRegraHtmlComPropriedade(css, '-webkit-text-size-adjust')).toBe(true);
  });

  it('html declara text-size-adjust: 100% sem prefixo (forma padronizada, futuro dos demais motores)', () => {
    expect(temRegraHtmlComPropriedade(css, 'text-size-adjust')).toBe(true);
  });

  it('prova vermelha: o detector REPROVA quando a propriedade falta na regra html', () => {
    const cssSemAPropriedade = 'html { min-height: 100vh; }';
    expect(temRegraHtmlComPropriedade(cssSemAPropriedade, '-webkit-text-size-adjust')).toBe(false);
  });

  it('prova vermelha: o detector não aceita valor diferente de 100% (ex.: auto, o próprio bug)', () => {
    const cssComValorErrado = 'html { -webkit-text-size-adjust: auto; }';
    expect(temRegraHtmlComPropriedade(cssComValorErrado, '-webkit-text-size-adjust')).toBe(false);
  });
});
