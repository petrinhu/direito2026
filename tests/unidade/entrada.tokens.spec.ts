import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';

/**
 * A tela de entrada (public/entrada.css) não tem JavaScript nem lê o tema do site, então
 * repete os tokens de src/ui/estilos/tokens.css. Este portão prova que a repetição é igual:
 * cada variável tem o mesmo valor do token, nas três guardas de tema, e o contraste de cada
 * texto é medido contra o fundo real onde ele está (L-17).
 */

const ENTRADA = readFileSync(
  fileURLToPath(new URL('../../public/entrada.css', import.meta.url)),
  'utf8'
);
const TOKENS = readFileSync(
  fileURLToPath(new URL('../../src/ui/estilos/tokens.css', import.meta.url)),
  'utf8'
);

/** Guardas de tema: o seletor exato de cada bloco, nos dois arquivos. */
const GUARDAS = {
  claro: { entrada: ':root {', token: ':root {' },
  escuroPreferencia: {
    entrada: ':root:not([data-theme="light"]) {',
    token: ':root:not([data-theme="light"]) {'
  },
  escuroEscolha: { entrada: ':root[data-theme="dark"] {', token: ':root[data-theme="dark"] {' }
} as const;

/**
 * Aspas simples e duplas são o mesmo seletor. O formatador escolhe uma delas por arquivo, então
 * o portão compara sempre na forma com aspas simples.
 */
const normalizarAspas = (texto: string): string => texto.replace(/"/g, "'");

/** Lê as declarações `--nome: valor;` do bloco que começa no seletor dado. */
function declaracoes(css: string, seletor: string): Map<string, string> {
  const alvo = normalizarAspas(seletor);
  // Comentário pode trazer chaves: sai antes de procurar o fim do bloco.
  const fonte = normalizarAspas(css.replace(/\/\*[\s\S]*?\*\//g, ''));
  const inicio = fonte.indexOf(alvo);
  if (inicio < 0) throw new Error(`seletor ausente: ${alvo}`);
  const fim = fonte.indexOf('}', inicio);
  const mapa = new Map<string, string>();
  for (const linha of fonte.slice(inicio + alvo.length, fim).split('\n')) {
    const m = linha.match(/^\s*(--[\w-]+):\s*([^;]+);/);
    if (m?.[1] !== undefined && m[2] !== undefined) mapa.set(m[1], m[2].trim().toLowerCase());
  }
  return mapa;
}

function corDe(paleta: Map<string, string>, nome: string): string {
  const valor = paleta.get(nome);
  if (!valor) throw new Error(`variável ausente: ${nome}`);
  return valor;
}

describe('entrada.css: repetição dos tokens do site', () => {
  for (const [guarda, seletores] of Object.entries(GUARDAS)) {
    it(`guarda ${guarda}: cada variável tem o mesmo valor do token de mesmo nome`, () => {
      const daEntrada = declaracoes(ENTRADA, seletores.entrada);
      const doToken = declaracoes(TOKENS, seletores.token);
      expect(daEntrada.size, 'piso: a guarda tem variáveis').toBeGreaterThanOrEqual(10);
      for (const [nome, valor] of daEntrada) {
        expect(doToken.get(nome), `${nome} em ${guarda}`).toBe(valor);
      }
    });
  }

  it('as duas guardas escuras declaram o mesmo conjunto de variáveis', () => {
    const preferencia = [...declaracoes(ENTRADA, GUARDAS.escuroPreferencia.entrada).keys()].sort();
    const escolha = [...declaracoes(ENTRADA, GUARDAS.escuroEscolha.entrada).keys()].sort();
    expect(preferencia).toEqual(escolha);
  });

  it('nenhuma cor fora de declaração de variável: o resto do CSS só usa var()', () => {
    const semComentarios = ENTRADA.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const linha of semComentarios.split('\n')) {
      if (!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(linha)) continue;
      expect(linha, 'cor literal fora de --variável').toMatch(
        /^\s*--[\w-]+:\s*#[0-9a-fA-F]{3,8};\s*$/
      );
    }
  });

  it('color-scheme acompanha a escolha: light com data-theme light, dark com data-theme dark', () => {
    expect(normalizarAspas(ENTRADA)).toMatch(/\[data-theme='light'\][^}]*color-scheme:\s*light/);
    expect(normalizarAspas(ENTRADA)).toMatch(/\[data-theme='dark'\][^}]*color-scheme:\s*dark/);
  });
});

describe('entrada.css: contraste de cada par de texto contra o fundo real', () => {
  const guardasParaMedir = [
    ['claro', declaracoes(ENTRADA, GUARDAS.claro.entrada)],
    ['escuro por preferência', declaracoes(ENTRADA, GUARDAS.escuroPreferencia.entrada)],
    ['escuro por escolha', declaracoes(ENTRADA, GUARDAS.escuroEscolha.entrada)]
  ] as const;

  const textos: ReadonlyArray<readonly [string, string, string, number]> = [
    ['corpo e rótulo', '--cor-texto', '--cor-fundo', 4.5],
    ['título', '--cor-titulo-texto', '--cor-fundo', 4.5],
    ['campo', '--cor-texto', '--cor-fundo-elevado', 4.5],
    ['botão', '--cor-texto-invertido', '--cor-primaria', 4.5],
    ['erro', '--cor-erro-texto', '--cor-erro-bg', 4.5],
    ['marca do topo', '--cor-sidebar-texto', '--cor-sidebar-fundo', 4.5],
    ['borda do campo (não é texto)', '--cor-texto-suave', '--cor-fundo-elevado', 3],
    ['foco visível (não é texto)', '--cor-primaria', '--cor-fundo', 3]
  ];

  for (const [guarda, paleta] of guardasParaMedir) {
    for (const [nome, frente, fundo, minimo] of textos) {
      it(`${guarda}: ${nome} tem ao menos ${minimo}:1`, () => {
        const razao = calcularContraste(corDe(paleta, frente), corDe(paleta, fundo));
        expect(razao, `${frente} sobre ${fundo}`).toBeGreaterThanOrEqual(minimo);
      });
    }
  }
});
