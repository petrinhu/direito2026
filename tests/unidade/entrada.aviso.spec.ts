import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';

/**
 * Impressão e aviso da tela de entrada (public/entrada.css). A tela não tem JavaScript, então
 * a impressão precisa vencer sozinha os três caminhos de tema: o atributo data-theme escuro, o
 * atributo claro e a preferência escura do sistema (que vale sem atributo). Este spec prova três
 * coisas: (1) cada seletor de tema tem um seletor de impressão mais específico, sem !important;
 * (2) a paleta de impressão tem contraste de texto de pelo menos 4,5:1; (3) o aviso usa os mesmos
 * tokens de fundo e de borda do AvisoLegal.vue, com contraste medido contra o fundo real.
 */

const ENTRADA = readFileSync(
  fileURLToPath(new URL('../../public/entrada.css', import.meta.url)),
  'utf8'
);
const AVISO_VUE = readFileSync(
  fileURLToPath(new URL('../../src/ui/componentes/AvisoLegal.vue', import.meta.url)),
  'utf8'
);

const semComentarios = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Bloco inteiro `@media print { ... }`, por contagem de chaves. */
function blocoImpressao(css: string): string {
  const limpo = semComentarios(css);
  const inicio = limpo.indexOf('@media print {');
  if (inicio < 0) throw new Error('bloco @media print ausente em entrada.css');
  let profundidade = 0;
  for (let i = inicio + '@media print'.length; i < limpo.length; i++) {
    if (limpo[i] === '{') profundidade++;
    if (limpo[i] === '}') {
      profundidade--;
      if (profundidade === 0) return limpo.slice(inicio, i + 1);
    }
  }
  throw new Error('bloco @media print sem fechamento');
}

/** Regras (seletores e corpo) de dentro de um bloco. Os blocos da tela não aninham regras. */
function regras(bloco: string): Array<{ seletores: string[]; corpo: string }> {
  const dentro = bloco.slice(bloco.indexOf('{') + 1, bloco.lastIndexOf('}'));
  const saida: Array<{ seletores: string[]; corpo: string }> = [];
  for (const m of dentro.matchAll(/([^{}]+?)\s*\{([^{}]*)\}/g)) {
    const seletores = (m[1] ?? '').split(',').map((s) => s.trim());
    saida.push({ seletores, corpo: m[2] ?? '' });
  }
  return saida;
}

/** Declarações `propriedade: valor;` de um corpo de regra (variáveis e propriedades comuns), em minúsculas. */
function declaracoesDo(corpo: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const m of corpo.matchAll(/([\w-]+):\s*([^;]+);/g)) {
    if (m[1] !== undefined && m[2] !== undefined) mapa.set(m[1], m[2].trim().toLowerCase());
  }
  return mapa;
}

/** Corpo da primeira regra cujo seletor é exatamente o dado, fora do bloco de impressão. */
function corpoDoSeletor(css: string, seletor: string): string {
  const semPrint = semComentarios(css).replace(blocoImpressao(css), '');
  const inicio = semPrint.indexOf(`${seletor} {`);
  if (inicio < 0) throw new Error(`seletor ausente em entrada.css: ${seletor}`);
  const fim = semPrint.indexOf('}', inicio);
  return semPrint.slice(inicio + seletor.length + 2, fim);
}

/**
 * Especificidade simplificada (pseudo-classes e atributos; :not() conta o argumento). Basta para
 * os seletores de tema desta tela, que só usam :root, [data-theme] e :not().
 */
function especificidade(seletor: string): number {
  let total = 0;
  const semNot = seletor.replace(/:not\(([^()]*)\)/g, (_, dentro: string) => {
    total += especificidade(dentro);
    return '';
  });
  total += (semNot.match(/:[a-z-]+/g) ?? []).length;
  total += (semNot.match(/\[[^\]]*\]/g) ?? []).length;
  return total;
}

const GUARDAS_DE_TEMA = [
  ':root',
  ":root[data-theme='dark']",
  ":root:not([data-theme='light'])"
] as const;

const PAR_TEXTO: ReadonlyArray<readonly [string, string, number]> = [
  ['--cor-texto', '--cor-fundo-elevado', 4.5],
  ['--cor-texto', '--cor-fundo', 4.5],
  ['--cor-titulo-texto', '--cor-fundo', 4.5],
  ['--cor-texto-invertido', '--cor-primaria', 4.5],
  ['--cor-sidebar-texto', '--cor-sidebar-fundo', 4.5],
  ['--cor-erro-texto', '--cor-erro-bg', 4.5],
  ['--cor-texto', '--cor-fundo-sutil', 4.5],
  ['--cor-texto-suave', '--cor-fundo-elevado', 3]
];

function corDaImpressao(mapa: Map<string, string>, nome: string): string {
  const valor = mapa.get(nome);
  if (!valor) throw new Error(`impressão sem ${nome}`);
  return valor;
}

function seletoresDeImpressao(css: string): string[] {
  return regras(blocoImpressao(css)).flatMap((r) => r.seletores);
}

describe('entrada.css: impressão vence os três caminhos de tema', () => {
  it('cada seletor de tema existe na tela, para o teste não passar sobre um CSS sem tema', () => {
    for (const guarda of GUARDAS_DE_TEMA) {
      expect(semComentarios(ENTRADA).replace(blocoImpressao(ENTRADA), ''), guarda).toContain(
        `${guarda} {`
      );
    }
  });

  it('cada seletor de tema tem um seletor de impressão com especificidade maior, sem !important', () => {
    const impressao = seletoresDeImpressao(ENTRADA);
    expect(blocoImpressao(ENTRADA)).not.toContain('!important');
    for (const guarda of GUARDAS_DE_TEMA) {
      const vence = impressao.some((p) => especificidade(p) > especificidade(guarda));
      expect(vence, `nenhum seletor de impressão vence ${guarda}`).toBe(true);
    }
  });

  it('a impressão redefine toda cor que a tela usa, para nenhuma ficar com o valor do tema escuro', () => {
    const usadas = new Set(
      [
        ...semComentarios(ENTRADA)
          .replace(blocoImpressao(ENTRADA), '')
          .matchAll(/var\((--cor-[\w-]+)\)/g)
      ].map((m) => m[1] ?? '')
    );
    const definidas = new Set<string>();
    for (const r of regras(blocoImpressao(ENTRADA))) {
      for (const nome of declaracoesDo(r.corpo).keys()) definidas.add(nome);
    }
    const faltando = [...usadas].filter((nome) => !definidas.has(nome));
    expect(faltando, 'cores usadas na tela sem valor de impressão').toEqual([]);
  });

  it('a paleta de impressão tem contraste de texto de pelo menos 4,5:1 e de texto suave de 3:1', () => {
    const paleta = new Map<string, string>();
    for (const r of regras(blocoImpressao(ENTRADA))) {
      for (const [nome, valor] of declaracoesDo(r.corpo)) paleta.set(nome, valor);
    }
    for (const [frente, fundo, minimo] of PAR_TEXTO) {
      const razao = calcularContraste(
        corDaImpressao(paleta, frente),
        corDaImpressao(paleta, fundo)
      );
      expect(razao, `${frente} sobre ${fundo} na impressão`).toBeGreaterThanOrEqual(minimo);
    }
  });
});

describe('aviso legal da entrada: visual do AvisoLegal.vue e contraste nos três temas', () => {
  it('fundo e borda do aviso usam os mesmos tokens do AvisoLegal.vue, com largura de 70ch', () => {
    const avisoEntrada = corpoDoSeletor(ENTRADA, '.aviso-legal');
    const avisoInterno = corpoDoSeletor(
      AVISO_VUE.slice(AVISO_VUE.indexOf('<style scoped>')),
      '.aviso-legal'
    );
    const fundoEntrada = declaracoesDo(avisoEntrada).get('background') ?? '';
    const fundoInterno = declaracoesDo(avisoInterno).get('background') ?? '';
    // Aceita var(--token) e var(--token, reserva): o componente tem valor de reserva, a tela não precisa.
    expect(fundoEntrada).toMatch(/var\(--cor-fundo-sutil[,)]/);
    expect(fundoInterno).toMatch(/var\(--cor-fundo-sutil[,)]/);
    expect(avisoEntrada).toMatch(/border:\s*2px solid var\(--cor-acento[,)]/);
    expect(avisoInterno).toMatch(/border:\s*2px solid var\(--cor-acento[,)]/);
    expect(avisoEntrada).toMatch(/max-width:\s*70ch/);
    expect(avisoInterno).toMatch(/max-width:\s*70ch/);
  });

  it('texto do aviso tem 4,5:1 e a borda de acento 3:1 contra o fundo real, em cada tema', () => {
    const guardas: ReadonlyArray<readonly [string, string]> = [
      ['claro', ':root'],
      ['escuro por escolha', ":root[data-theme='dark']"],
      ['escuro por preferência', ":root:not([data-theme='light'])"]
    ];
    for (const [nome, seletor] of guardas) {
      const cores = declaracoesDo(corpoDoSeletor(ENTRADA, seletor));
      const texto = cores.get('--cor-texto') ?? '';
      const fundoAviso = cores.get('--cor-fundo-sutil') ?? '';
      const acento = cores.get('--cor-acento') ?? '';
      const fundoPagina = cores.get('--cor-fundo') ?? '';
      expect(
        calcularContraste(texto, fundoAviso),
        `texto do aviso (${nome})`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        calcularContraste(acento, fundoPagina),
        `borda do aviso (${nome})`
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
