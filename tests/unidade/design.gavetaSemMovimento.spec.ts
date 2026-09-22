import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Achado 2 da revisão (docs/revisao-modo-adaptado.md): a transição da
 * gaveta lateral em tela estreita (LayoutBase.vue) nunca era desligada, nem
 * pelo modo adaptado nem por prefers-reduced-motion, apesar de
 * docs/modo-adaptado.md §6 pedir isso nominalmente ("Transição da gaveta
 * lateral em tela estreita: removida (transition: none)").
 *
 * Mesmo padrão de tests/unidade/design.textSizeAdjustWebkit.spec.ts: trava
 * a REGRA CSS declarada no arquivo-fonte, porque jsdom não avalia media
 * query combinada com atributo de :root de forma confiável. Nasce vermelho
 * antes da correção (nenhuma das duas regras existia).
 */
const CAMINHO = resolve(__dirname, '../../src/ui/layout/LayoutBase.vue');

describe('gaveta lateral: transição desliga no modo adaptado e em prefers-reduced-motion', () => {
  const fonte = readFileSync(CAMINHO, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

  it('desliga a transição da gaveta quando o modo adaptado está ligado', () => {
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\][^{]*\.layout-base__gaveta\s*\{[^}]*transition:\s*none/
    );
  });

  it('desliga a transição da gaveta sob prefers-reduced-motion', () => {
    expect(fonte).toMatch(
      /prefers-reduced-motion:\s*reduce\)[\s\S]{0,80}\.layout-base__gaveta\s*\{[^}]*transition:\s*none/
    );
  });
});
