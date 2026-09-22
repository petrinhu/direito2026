import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';
import { extrairVariaveisHex, recortarBlocoDeSeletorTopoDeArquivo } from '@/core/design/tokens';

/**
 * Achado 4 da revisão (docs/revisao-modo-adaptado.md): o contorno de foco
 * do modo adaptado usava a cor azul-escura herdada de --cor-primaria
 * (14,84:1), não o preto (#000000, 21:1) que docs/modo-adaptado.md §2/§3
 * fixam por escrito para o par "contorno de foco / fundo da página", e o
 * outline-offset não crescia dentro do modo (ficava em 2px nos dois
 * estados, base.css e BotaoModoAdaptado.vue).
 */
const CAMINHO_TOKENS = resolve(__dirname, '../../src/ui/estilos/tokens.css');
const CAMINHO_BASE_CSS = resolve(__dirname, '../../src/ui/estilos/base.css');
const CAMINHO_BOTAO = resolve(
  __dirname,
  '../../src/ui/componentes/BotaoModoAdaptado.vue'
);

function carregarBlocoModoAdaptado(): Record<string, string> {
  const cssTexto = readFileSync(CAMINHO_TOKENS, 'utf-8');
  const bloco = recortarBlocoDeSeletorTopoDeArquivo(cssTexto, ':root[data-modo-adaptado="on"]');
  if (!bloco) throw new Error('não achei o bloco :root[data-modo-adaptado="on"] em ' + CAMINHO_TOKENS);
  return extrairVariaveisHex(bloco);
}

describe('contorno de foco do modo adaptado', () => {
  const tokens = carregarBlocoModoAdaptado();

  it('--cor-foco, dentro do modo, é #000000 (21:1 contra o fundo branco)', () => {
    expect(tokens['--cor-foco']).toBe('#000000');
    const contraste = calcularContraste(tokens['--cor-foco'] as string, tokens['--cor-fundo'] as string);
    expect(contraste).toBeGreaterThanOrEqual(20);
  });

  it('base.css usa var(--cor-foco) e var(--foco-deslocamento) na regra :focus-visible', () => {
    const css = readFileSync(CAMINHO_BASE_CSS, 'utf-8');
    const matchRegra = css.match(/:focus-visible\s*\{([^}]*)\}/);
    expect(matchRegra, 'regra :focus-visible não encontrada em base.css').not.toBeNull();
    const corpo = matchRegra![1]!;
    expect(corpo).toMatch(/outline:\s*var\(--foco-espessura[^)]*\)\s*solid\s*var\(--cor-foco/);
    expect(corpo).toMatch(/outline-offset:\s*var\(--foco-deslocamento/);
  });

  it('BotaoModoAdaptado.vue (twin do mesmo achado) também usa var(--cor-foco)/var(--foco-deslocamento)', () => {
    const fonte = readFileSync(CAMINHO_BOTAO, 'utf-8');
    const matchRegra = fonte.match(/\.botao-modo-adaptado:focus-visible\s*\{([^}]*)\}/);
    expect(matchRegra, 'regra :focus-visible do botão não encontrada').not.toBeNull();
    const corpo = matchRegra![1]!;
    expect(corpo).toMatch(/outline:\s*var\(--foco-espessura[^)]*\)\s*solid\s*var\(--cor-foco/);
    expect(corpo).toMatch(/outline-offset:\s*var\(--foco-deslocamento/);
  });
});
