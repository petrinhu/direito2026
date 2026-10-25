// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Escada de tamanho do menu lateral (ordem do líder, 22/10/2026: "cada nível do
 * menu um pouco menor que o de cima ... nos três modos"). Medição rápida de
 * 22/10/2026 (docs/qa-menu-lateral.md, D1): no modo ampliado o nível 5 mede
 * 18 px e o 3 e o 4 medem 14 px, então a hierarquia estava invertida.
 *
 * Os níveis 3, 4 e 5 leem a escala de tokens (--escala-*), por uma
 * propriedade local por nível (--menu-tam-3/4/5), definida num único lugar por
 * modo. Este teste resolve os valores contra tokens.css, em px, como o
 * navegador faria. jsdom não aplica CSS, então a prova é a da regra no fonte.
 */
const fonte = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/MenuCurriculo.vue'),
  'utf-8'
);
const tokens = readFileSync(resolve(__dirname, '../../src/ui/estilos/tokens.css'), 'utf-8');

type Escala = Record<string, number>;

function blocoDe(texto: string, abertura: string): string {
  const inicio = texto.indexOf(abertura);
  expect(inicio, `bloco não encontrado: ${abertura}`).toBeGreaterThanOrEqual(0);
  return texto.slice(inicio, texto.indexOf('\n}', inicio));
}

function escalaDo(bloco: string): Escala {
  const escala: Escala = {};
  for (const m of bloco.matchAll(/--escala-(\w+):\s*([\d.]+)rem/g)) {
    escala[m[1]!] = Number(m[2]) * 16;
  }
  return escala;
}

const ESCALA_CLARO = escalaDo(blocoDe(tokens, ':root {'));
const ESCALA_AMPLIADO = escalaDo(blocoDe(tokens, ':root[data-modo-adaptado="on"] {'));

const estilo = fonte.slice(fonte.indexOf('<style>')).replace(/\/\*[\s\S]*?\*\//g, '');
const regras = [...estilo.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  seletor: m[1]!.trim(),
  corpo: m[2]!
}));

function valorDe(corpo: string, propriedade: string): string | undefined {
  const m = corpo.match(new RegExp(`(?:^|;|\\s)${propriedade}:\\s*([^;]+);`));
  return m?.[1]?.trim();
}

/**
 * font-size da primeira regra cujo seletor contém o trecho dado (ou, com
 * `noInicio`, começa por ele, para não casar a regra com prefixo :root).
 */
function fontSizeDe(trecho: string, noInicio = false): string {
  const casa = (seletor: string) =>
    noInicio ? seletor.startsWith(trecho) : seletor.includes(trecho);
  const achado = regras.find((r) => casa(r.seletor) && valorDe(r.corpo, 'font-size'));
  expect(achado, `regra de font-size não encontrada: ${trecho}`).toBeDefined();
  return valorDe(achado!.corpo, 'font-size')!;
}

/** Valor de uma propriedade local declarada na regra `.menu-curriculo` (claro) ou no modo ampliado. */
function propriedadeDoMenu(propriedade: string, modo: 'claro' | 'ampliado'): string {
  const seletor =
    modo === 'claro' ? '.menu-curriculo' : ":root[data-modo-adaptado='on'] .menu-curriculo";
  const regra = regras.find((r) => r.seletor === seletor);
  expect(regra, `regra ${seletor} não encontrada`).toBeDefined();
  const valor = valorDe(regra!.corpo, propriedade);
  expect(valor, `${propriedade} não definida em ${seletor}`).toBeDefined();
  return valor!;
}

/** Converte um valor (rem, var(--escala-x), var(--menu-tam-N)) para px no modo dado. */
function px(valor: string, modo: 'claro' | 'ampliado'): number {
  const escala = modo === 'claro' ? ESCALA_CLARO : ESCALA_AMPLIADO;
  const porToken = valor.match(/var\(--escala-(\w+)/);
  if (porToken) return escala[porToken[1]!]!;
  const porNivel = valor.match(/var\(--menu-tam-(\d)/);
  if (porNivel) return px(propriedadeDoMenu(`--menu-tam-${porNivel[1]}`, modo), modo);
  const rem = valor.match(/^([\d.]+)rem$/);
  expect(rem, `valor não resolvido: ${valor}`).not.toBeNull();
  return Number(rem![1]) * 16;
}

function tamanhosDoMenu(modo: 'claro' | 'ampliado') {
  const nivel1 =
    modo === 'claro'
      ? px(fontSizeDe(":root:not([data-modo-adaptado='on']) .menu-curriculo__nivel-1"), modo)
      : NaN;
  const nivel2 =
    modo === 'claro'
      ? px(fontSizeDe(":root:not([data-modo-adaptado='on']) .menu-curriculo__nivel-2"), modo)
      : px(fontSizeDe('.menu-curriculo__nivel-2 > li > .menu-curriculo__botao', true), modo);
  return {
    nivel1,
    nivel2,
    nivel3: px(
      fontSizeDe('nivel-3 > li > .menu-curriculo__linha .menu-curriculo__link-unidade'),
      modo
    ),
    nivel4: px(fontSizeDe('.menu-curriculo__nivel-4 > li > .menu-curriculo__botao'), modo),
    nivel5: px(fontSizeDe('.menu-curriculo__nivel-5 > li > a'), modo)
  };
}

describe('MenuCurriculo, escada de tamanho decrescente por nível', () => {
  it('claro e escuro: cada nível é menor que o de cima (1 > 2 > 3 > 4 > 5)', () => {
    const t = tamanhosDoMenu('claro');
    expect(t.nivel1).toBeGreaterThan(t.nivel2);
    expect(t.nivel2).toBeGreaterThan(t.nivel3);
    expect(t.nivel3).toBeGreaterThan(t.nivel4);
    expect(t.nivel4).toBeGreaterThan(t.nivel5);
  });

  it('leitura ampliada: o nível 2 continua maior que o 3, e nenhum nível fica maior que o de cima', () => {
    const t = tamanhosDoMenu('ampliado');
    expect(t.nivel2).toBeGreaterThan(t.nivel3);
    expect(t.nivel3).toBeGreaterThanOrEqual(t.nivel4);
    expect(t.nivel4).toBeGreaterThanOrEqual(t.nivel5);
  });

  it('o nível 5 não usa mais o token que o modo ampliado leva a 18 px acima dos níveis 3 e 4', () => {
    const t = tamanhosDoMenu('ampliado');
    expect(t.nivel5).toBeLessThanOrEqual(t.nivel3);
  });

  it('os níveis 3, 4 e 5 leem a escala de tokens, por propriedade local (--menu-tam-N), não valor fixo', () => {
    for (const trecho of [
      'nivel-3 > li > .menu-curriculo__linha .menu-curriculo__link-unidade',
      '.menu-curriculo__nivel-4 > li > .menu-curriculo__botao',
      '.menu-curriculo__nivel-5 > li > a'
    ]) {
      expect(fontSizeDe(trecho)).toMatch(/var\(--menu-tam-[345]\)/);
    }
  });
});

/**
 * Item direto da AV (ordem do líder, 25/10/2026): o rótulo do grupo e o "em breve"
 * ficam na lista da AV, que é o nível 4. Leem --menu-tam-4, como os demais itens dele.
 */
describe('MenuCurriculo: item direto da AV segue a escada do nível 4', () => {
  it.each([
    '.menu-curriculo__nivel-4 > li > .menu-curriculo__linha .menu-curriculo__link-unidade',
    '.menu-curriculo__nivel-4 > li > .menu-curriculo__linha .estado-em-breve'
  ])('%s usa --menu-tam-4', (trecho) => {
    expect(fontSizeDe(trecho)).toBe('var(--menu-tam-4)');
  });
});
