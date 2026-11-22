import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ADM-F4 (fatia 1): a luz de sessão (.ar-led, em PainelAdmin.vue) precisa de contraste mínimo de 3:1
 * contra o fundo em que ela é desenhada, nos quatro temas do site (claro, escuro pelo sistema,
 * escuro escolhido, modo adaptado).
 *
 * O par medido é o real: a cor do LED (--led-verde, --led-vermelho) contra o fundo onde a linha da
 * tabela está. A luz fica no <th> da linha, e nenhuma regra da tabela, da linha ou do contêiner
 * pinta fundo. Então o fundo é o que o body pinta (base.css), e não um token de cartão. Os valores
 * saem de tokens.css; o token do fundo sai de base.css; e um guarda lê estilo.css para provar que
 * nenhum ancestral da luz pinta fundo próprio.
 */
const RAIZ = resolve(__dirname, '../..');
const css = readFileSync(resolve(RAIZ, 'src/ui/estilos/tokens.css'), 'utf-8');
const baseCss = readFileSync(resolve(RAIZ, 'src/ui/estilos/base.css'), 'utf-8');
const estiloArea = readFileSync(resolve(RAIZ, 'src/ui/area-restrita/estilo.css'), 'utf-8');

/** Ancestrais da luz em estilo.css (tabela de usuários, de PainelAdmin.vue): nenhum pode pintar fundo. */
const ANCESTRAIS_DA_LUZ = [
  '.ar-admin',
  '.ar-tabela-rolavel',
  '.ar-tabela',
  '.ar-tabela tbody',
  '.ar-tabela tr',
  '.ar-tabela th',
  '.ar-tabela td'
];

function bloco(marcador: RegExp, dentroDe?: RegExp): string {
  let base = css;
  if (dentroDe) {
    const m = dentroDe.exec(css);
    if (!m) throw new Error(`bloco externo ausente: ${dentroDe}`);
    base = css.slice(m.index);
  }
  const m = marcador.exec(base);
  if (!m) throw new Error(`bloco ausente: ${marcador}`);
  const inicio = m.index + m[0].length;
  return base.slice(inicio, base.indexOf('}', inicio));
}

function valor(texto: string, nome: string): string {
  const m = new RegExp(`${nome}:\\s*(#[0-9a-fA-F]{6})`).exec(texto);
  if (!m) throw new Error(`token ausente: ${nome}`);
  return m[1]!;
}

/** Token que o body pinta (base.css): o fundo de onde a luz da tabela herda. */
function tokenDoFundoDaPagina(): string {
  const corpo = /(?:^|\n)body \{([^}]*)\}/.exec(baseCss);
  const m = corpo ? /background:\s*var\((--[\w-]+)\)/.exec(corpo[1]!) : null;
  if (!m) throw new Error('background do body ausente em base.css');
  return m[1]!;
}

function regras(fonte: string): { seletores: string[]; corpo: string }[] {
  return [...fonte.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, corpo]) => ({
    seletores: sel!.split(',').map((s) => s.trim().replace(/^:root\[[^\]]*\]\s*/, '')),
    corpo: corpo!
  }));
}

function luminancia(hex: string): number {
  const canal = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}

function contraste(a: string, b: string): number {
  const [la, lb] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (la + 0.05) / (lb + 0.05);
}

const temas: [string, () => string][] = [
  ['claro', () => bloco(/:root \{/)],
  [
    'escuro pelo sistema',
    () =>
      bloco(/:root:not\(\[data-theme="light"\]\) \{/, /@media \(prefers-color-scheme: dark\) \{/)
  ],
  ['escuro escolhido', () => bloco(/:root\[data-theme="dark"\] \{/)],
  ['modo adaptado', () => bloco(/:root\[data-modo-adaptado="on"\] \{/)]
];

describe('LED de sessão: contraste mínimo de 3:1 contra o fundo onde ele é desenhado', () => {
  for (const [nome, lerBloco] of temas) {
    it(`no tema ${nome}, verde e vermelho ficam com 3:1 ou mais contra o fundo da página`, () => {
      const t = lerBloco();
      const fundo = valor(t, tokenDoFundoDaPagina());
      expect(contraste(valor(t, '--led-verde'), fundo)).toBeGreaterThanOrEqual(3);
      expect(contraste(valor(t, '--led-vermelho'), fundo)).toBeGreaterThanOrEqual(3);
    });
  }

  it('nenhum ancestral da luz pinta fundo, então o fundo do par é o da página', () => {
    const pintam = regras(estiloArea).filter(
      (r) => /background/.test(r.corpo) && r.seletores.some((s) => ANCESTRAIS_DA_LUZ.includes(s))
    );
    expect(pintam.map((r) => r.seletores)).toEqual([]);
  });

  it('a leitura das regras enxerga o fundo da própria luz verde (o guarda acima não é vazio)', () => {
    const pintaAVerde = regras(estiloArea).some(
      (r) => r.seletores.includes('.ar-led--verde') && /background/.test(r.corpo)
    );
    expect(pintaAVerde).toBe(true);
  });
});
