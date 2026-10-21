import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Texto do resumo não passa da largura da tela (QA final, 20/10/2026, leitura
 * ampliada a 320px: a página rolava 358px contra 320). Medido no navegador com
 * o diagnóstico isolado: o culpado não é a tabela (ela rola dentro do próprio
 * quadro) nem o quadro de contagem. É um item da lista do resumo com a palavra
 * "incondicionalmente", sem ponto de quebra, que na leitura ampliada (24px,
 * espaçamento de letra do modo) é mais larga que a caixa do item. A tabela já
 * tem overflow-wrap: break-word nas células; o texto corrido não tinha.
 *
 * Nasce vermelho: nenhuma regra de .bloco-teorico__corpo põe overflow-wrap,
 * então o texto herda o padrão (normal) e não quebra a palavra.
 */
const VUE = readFileSync(resolve(__dirname, '../../src/ui/componentes/BlocoTeorico.vue'), 'utf-8');
const ESTILO = VUE.slice(VUE.indexOf('<style scoped>'), VUE.indexOf('</style>')).replace(
  /\/\*[\s\S]*?\*\//g,
  ''
);

/** Corpo normalizado da regra cujo seletor é exatamente o informado. */
function corpoDe(seletor: string): string {
  const achados = [...ESTILO.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => (m[1] ?? '').replace(/\s+/g, ' ').trim() === seletor)
    .map((m) => (m[2] ?? '').replace(/\s+/g, ' '));
  expect(achados.length, `sem regra para ${seletor}`).toBeGreaterThan(0);
  return achados.join(' ');
}

describe('texto do resumo: palavra longa quebra dentro da caixa', () => {
  it('o contêiner do corpo do bloco põe overflow-wrap: break-word, herdado por parágrafos e itens', () => {
    expect(corpoDe('.bloco-teorico__corpo')).toContain('overflow-wrap: break-word');
  });
});
