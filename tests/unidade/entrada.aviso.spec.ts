import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';

/**
 * Impressão e aviso da tela de entrada (public/entrada.css). A tela não tem JavaScript, então
 * a impressão precisa vencer sozinha os três caminhos de tema: o atributo data-theme escuro, o
 * atributo claro e a preferência escura do sistema (que vale sem atributo). Este spec prova:
 * (1) para cada estado de tema, cada guarda que casa com ele é vencida por um seletor de
 * impressão que também casa com o estado, com especificidade ESTRITAMENTE maior (sem depender
 * da ordem do arquivo, sem !important); (2) a paleta de impressão cobre toda cor usada e tem
 * contraste de texto de pelo menos 4,5:1; (3) o botão impresso não depende de imprimir fundos;
 * (4) o aviso usa os mesmos tokens de fundo e de borda do AvisoLegal.vue, com contraste medido.
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

/** Intervalo [início, fim) do bloco de @media cujo cabeçalho contém o trecho, por contagem de chaves. */
function intervaloDeMedia(css: string, cabecalho: string): [number, number] {
  const inicio = css.indexOf(cabecalho);
  if (inicio < 0) throw new Error(`bloco ausente em entrada.css: ${cabecalho}`);
  let profundidade = 0;
  for (let i = css.indexOf('{', inicio); i < css.length; i++) {
    if (css[i] === '{') profundidade++;
    else if (css[i] === '}') {
      profundidade--;
      if (profundidade === 0) return [inicio, i + 1];
    }
  }
  throw new Error(`bloco sem fechamento: ${cabecalho}`);
}

const LIMPO = semComentarios(ENTRADA);
// Cabeçalhos de @media viram espaços de mesmo tamanho: as posições continuam batendo com LIMPO.
const PLANO = LIMPO.replace(/@[^{}]*\{/g, (m) => ' '.repeat(m.length - 1) + '{');
const BLOCO_IMPRESSAO = intervaloDeMedia(LIMPO, '@media print');
const BLOCO_PREFERENCIA_ESCURA = intervaloDeMedia(LIMPO, '@media (prefers-color-scheme: dark)');

interface Regra {
  seletor: string;
  corpo: string;
  posicao: number;
}

/** Regras simples (sem aninhamento), uma entrada por seletor da lista. */
function regrasDe(plano: string): Regra[] {
  const saida: Regra[] = [];
  for (const m of plano.matchAll(/([^{}]+?)\s*\{([^{}]*)\}/g)) {
    const inicio = m.index ?? 0;
    const bruto = m[1] ?? '';
    const deslocamento = bruto.length - bruto.trimStart().length;
    for (const parte of bruto.split(',')) {
      const seletor = parte.trim();
      if (seletor) saida.push({ seletor, corpo: m[2] ?? '', posicao: inicio + deslocamento });
    }
  }
  return saida;
}

const dentroDe = (posicao: number, [i, f]: [number, number]): boolean =>
  posicao >= i && posicao < f;

const TODAS = regrasDe(PLANO);
const REGRAS_IMPRESSAO = TODAS.filter((r) => dentroDe(r.posicao, BLOCO_IMPRESSAO));
const PALETA_IMPRESSAO = REGRAS_IMPRESSAO.filter((r) => /--cor-/.test(r.corpo));
const GUARDAS_DE_TEMA = TODAS.filter(
  (r) =>
    !dentroDe(r.posicao, BLOCO_IMPRESSAO) && r.seletor.includes(':root') && /--cor-/.test(r.corpo)
).map((r) => ({ ...r, so: dentroDe(r.posicao, BLOCO_PREFERENCIA_ESCURA) }));

/** Declarações `propriedade: valor;` de um corpo de regra, em minúsculas. */
function declaracoesDo(corpo: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const m of corpo.matchAll(/([\w-]+):\s*([^;]+);/g)) {
    if (m[1] !== undefined && m[2] !== undefined) mapa.set(m[1], m[2].trim().toLowerCase());
  }
  return mapa;
}

/** Corpo da regra fora do bloco de impressão cujo seletor é exatamente o dado. */
function corpoDoSeletor(css: string, seletor: string): string {
  const limpo = semComentarios(css);
  const print = intervaloDeMedia(limpo, '@media print');
  const fora = limpo.slice(0, print[0]) + limpo.slice(print[1]);
  const inicio = fora.indexOf(`${seletor} {`);
  if (inicio < 0) throw new Error(`seletor ausente em entrada.css: ${seletor}`);
  const fim = fora.indexOf('}', inicio);
  return fora.slice(inicio + seletor.length + 2, fim);
}

/**
 * Especificidade simplificada (pseudo-classes e atributos; :not() conta o argumento). Basta para
 * os seletores desta tela, que só usam :root, [data-theme], :not() e button (tipo, não conta).
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

type Atributo = 'light' | 'dark' | null;
interface Estado {
  atributo: Atributo;
  preferencia: 'light' | 'dark';
}

const ESTADOS: Estado[] = (['light', 'dark', null] as const).flatMap((atributo) =>
  (['light', 'dark'] as const).map((preferencia) => ({ atributo, preferencia }))
);

/** Um seletor casa com um estado de tema (atributo data-theme e preferência do sistema). */
function casa(seletor: string, estado: Estado): boolean {
  for (const m of seletor.matchAll(/:not\(\[data-theme='(\w+)'\]\)/g)) {
    if (estado.atributo === m[1]) return false;
  }
  for (const m of seletor.replace(/:not\([^()]*\)/g, '').matchAll(/\[data-theme='(\w+)'\]/g)) {
    if (estado.atributo !== m[1]) return false;
  }
  if (/\[data-theme\]/.test(seletor.replace(/:not\([^()]*\)/g, '')) && estado.atributo === null) {
    return false;
  }
  return true;
}

/** Guarda de tema casa com o estado; as guardas dentro de @media (prefers-color-scheme) exigem a preferência escura. */
function guardaCasa(guarda: { seletor: string; so: boolean }, estado: Estado): boolean {
  return (!guarda.so || estado.preferencia === 'dark') && casa(guarda.seletor, estado);
}

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

function paletaDeImpressao(): Map<string, string> {
  const paleta = new Map<string, string>();
  for (const r of PALETA_IMPRESSAO) {
    for (const [nome, valor] of declaracoesDo(r.corpo)) paleta.set(nome, valor);
  }
  return paleta;
}

/** Resolve `var(--token)` pela paleta de impressão; um valor literal passa como está. */
function resolver(valor: string | undefined, paleta: Map<string, string>): string {
  const m = /var\((--[\w-]+)/.exec(valor ?? '');
  if (!m) return valor ?? '';
  const resolvido = paleta.get(m[1] ?? '');
  if (!resolvido) throw new Error(`impressão sem ${m[1]}`);
  return resolvido;
}

describe('entrada.css: impressão vence os três caminhos de tema', () => {
  it('cada seletor de tema existe na tela, para o teste não passar sobre um CSS sem tema', () => {
    expect(GUARDAS_DE_TEMA.length, 'guardas de tema com variáveis').toBeGreaterThanOrEqual(3);
    expect(GUARDAS_DE_TEMA.map((g) => g.seletor)).toEqual(
      expect.arrayContaining([
        ':root',
        ":root[data-theme='dark']",
        ":root:not([data-theme='light'])"
      ])
    );
  });

  it('a impressão não usa !important', () => {
    expect(ENTRADA.slice(BLOCO_IMPRESSAO[0], BLOCO_IMPRESSAO[1])).not.toContain('!important');
  });

  it('em cada estado de tema, toda guarda que casa é vencida por seletor de impressão que casa, com especificidade estritamente maior', () => {
    for (const estado of ESTADOS) {
      for (const guarda of GUARDAS_DE_TEMA) {
        if (!guardaCasa(guarda, estado)) continue;
        const venceu = PALETA_IMPRESSAO.some(
          (p) =>
            casa(p.seletor, estado) && especificidade(p.seletor) > especificidade(guarda.seletor)
        );
        expect(
          venceu,
          `${guarda.seletor} sem seletor de impressão mais específico no estado ${JSON.stringify(estado)}`
        ).toBe(true);
      }
    }
  });

  it('a impressão redefine toda cor que a tela usa, para nenhuma ficar com o valor do tema escuro', () => {
    const usadas = new Set(
      [
        ...LIMPO.slice(0, BLOCO_IMPRESSAO[0])
          .concat(LIMPO.slice(BLOCO_IMPRESSAO[1]))
          .matchAll(/var\((--cor-[\w-]+)\)/g)
      ].map((m) => m[1] ?? '')
    );
    const definidas = new Set<string>();
    for (const r of PALETA_IMPRESSAO) {
      for (const nome of declaracoesDo(r.corpo).keys()) definidas.add(nome);
    }
    const faltando = [...usadas].filter((nome) => !definidas.has(nome));
    expect(faltando, 'cores usadas na tela sem valor de impressão').toEqual([]);
  });

  it('a paleta de impressão tem contraste de texto de pelo menos 4,5:1 e de texto suave de 3:1', () => {
    const paleta = paletaDeImpressao();
    for (const [frente, fundo, minimo] of PAR_TEXTO) {
      const razao = calcularContraste(
        resolver(`var(${frente})`, paleta),
        resolver(`var(${fundo})`, paleta)
      );
      expect(razao, `${frente} sobre ${fundo} na impressão`).toBeGreaterThanOrEqual(minimo);
    }
  });

  it('botão impresso: fundo transparente e texto escuro com 4,5:1 contra o papel branco, sem depender de imprimir fundos', () => {
    const botao = REGRAS_IMPRESSAO.find((r) => /(^|\s)button$/.test(r.seletor));
    expect(botao, 'regra de impressão para button').toBeDefined();
    const decl = declaracoesDo(botao?.corpo ?? '');
    expect(decl.get('background'), 'fundo do botão no papel').toBe('transparent');
    const paleta = paletaDeImpressao();
    const texto = resolver(decl.get('color'), paleta);
    expect(calcularContraste(texto, '#ffffff'), 'texto do botão no papel').toBeGreaterThanOrEqual(
      4.5
    );
    const borda = resolver(decl.get('border'), paleta);
    expect(calcularContraste(borda, '#ffffff'), 'borda do botão no papel').toBeGreaterThanOrEqual(
      3
    );
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
