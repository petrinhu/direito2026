// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Defeito (QA em produção, 1280px): a faixa de armazenamento ficava fixa
 * (position: fixed) por cima do botão "Anterior" do quiz até o aluno clicar
 * em "Entendi". Correção: a faixa fica no fluxo do documento (position:
 * sticky, mesma técnica de reserva de espaço já usada para a BarraTopo em
 * LayoutBase.vue, padding-top do corpo), então ocupa altura real no fim da
 * página e o conteúdo final nunca fica atrás dela. jsdom não faz layout:
 * a prova de que nada fica coberto é visual (e2e, fora desta onda).
 */
const fonte = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/AvisoArmazenamento.vue'),
  'utf-8'
);
const regraFaixa = /\.aviso-armazenamento\s*\{([^}]*)\}/.exec(fonte)?.[1] ?? '';

describe('AvisoArmazenamento, faixa no fluxo (não cobre o conteúdo)', () => {
  it('a faixa usa position: sticky, não position: fixed', () => {
    expect(regraFaixa).toMatch(/position:\s*sticky/);
    expect(regraFaixa).not.toMatch(/position:\s*fixed/);
  });

  it('a faixa gruda na base da janela com a mesma folga de antes', () => {
    expect(regraFaixa).toMatch(/bottom:\s*var\(--esp-4,\s*1rem\)/);
  });
});
