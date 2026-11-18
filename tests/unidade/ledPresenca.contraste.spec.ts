import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ADM-F4 (fatia 1): o LED de sessão precisa de contraste mínimo de 3:1 contra o fundo da linha, nos quatro
 * temas do site (claro, escuro pelo sistema, escuro escolhido, modo adaptado). Lê os valores reais de tokens.css.
 */
const css = readFileSync(resolve(__dirname, '../../src/ui/estilos/tokens.css'), 'utf-8');

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

describe('LED de sessão: contraste mínimo de 3:1 contra o fundo da linha', () => {
  for (const [nome, lerBloco] of temas) {
    it(`no tema ${nome}`, () => {
      const t = lerBloco();
      const fundo = valor(t, '--cor-fundo-elevado');
      expect(contraste(valor(t, '--led-verde'), fundo)).toBeGreaterThanOrEqual(3);
      expect(contraste(valor(t, '--led-vermelho'), fundo)).toBeGreaterThanOrEqual(3);
    });
  }
});
