import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Ordem do líder de 20/10/2026 (ver design.trilhaSemCorte.spec.ts): o nome da
 * página atual aparece INTEIRO, quebrando em até 2 linhas se precisar, sem
 * reticências. No modo normal, a 360px, "Mnemônicos", "Resumo" e "Fichamento"
 * cortavam sem quebrar: uma palavra longa não quebra no min-content do item
 * flex (overflow-wrap: break-word não reduz o min-content), e o `ol` com
 * overflow:hidden recortava o excedente.
 *
 * Decisão do CPO (19/11/2026, hifenização silábica): o link do modo normal usa
 * hyphens: auto, com overflow-wrap: anywhere como rede para palavra que o
 * dicionário não hifeniza. O piso de 64px fica no `li` da página atual, porque
 * o `ol` (flex, nowrap) encolhe o `li` (flex item, min-width 0), e um piso no
 * `a` filho transborda o próprio `li`.
 *
 * Mesmo padrão de design.trilhaSemCorte.spec.ts: lê a regra CSS no arquivo-fonte
 * (comentários removidos), porque jsdom não avalia media/container query.
 * O modo adaptado não pode ganhar o piso.
 */
const CAMINHO = resolve(__dirname, '../../src/ui/componentes/TrilhaNavegacao.vue');
const PREFIXO_NORMAL = ":root:not([data-modo-adaptado='on']) ";
const SELETOR_LINK_NORMAL = `${PREFIXO_NORMAL}.trilha-navegacao a`;
const SELETOR_ATUAL_NORMAL = `${PREFIXO_NORMAL}.trilha-navegacao .trilha-navegacao__atual`;
const SELETOR_LINK_ATUAL_NORMAL = `${PREFIXO_NORMAL}.trilha-navegacao .trilha-navegacao__atual a`;

interface Regra {
  readonly seletores: readonly string[];
  readonly corpo: string;
}

/** Só o bloco <style scoped>, sem comentários: o script não tem regra CSS. */
function estiloSemComentarios(): string {
  const bloco = readFileSync(CAMINHO, 'utf-8').match(/<style[^>]*>([\s\S]*?)<\/style>/);
  return (bloco?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Cada regra com seus seletores (separados por vírgula, espaços colapsados). */
function regrasDo(estilo: string): Regra[] {
  return [...estilo.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    seletores: (m[1] ?? '').split(',').map((s) => s.replace(/\s+/g, ' ').trim()),
    corpo: m[2] ?? ''
  }));
}

/** Corpo da primeira regra que tem exatamente este seletor; '' se não existir. */
function corpoDoSeletor(regras: readonly Regra[], seletor: string): string {
  return regras.find((r) => r.seletores.includes(seletor))?.corpo ?? '';
}

describe('trilha de navegação, modo normal: nome inteiro em até 2 linhas', () => {
  const estilo = estiloSemComentarios();
  const regras = regrasDo(estilo);

  it('o link do modo normal quebra palavra longa no min-content (overflow-wrap: anywhere)', () => {
    const corpo = corpoDoSeletor(regras, SELETOR_LINK_NORMAL);
    expect(corpo, 'regra do link no modo normal não encontrada').not.toBe('');
    expect(corpo).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('o link do modo normal hifeniza por sílaba (hyphens: auto, sem prefixo de fornecedor)', () => {
    const corpo = corpoDoSeletor(regras, SELETOR_LINK_NORMAL);
    expect(corpo).toMatch(/(?<![-\w])hyphens:\s*auto\s*;/);
  });

  it('a página atual (o li, flex item que o ol encolhe) não fica abaixo de 64px no modo normal', () => {
    const corpo = corpoDoSeletor(regras, SELETOR_ATUAL_NORMAL);
    expect(corpo, 'regra do li da página atual no modo normal não encontrada').not.toBe('');
    expect(corpo).toMatch(/min-width:\s*64px/);
  });

  it('o piso de 64px não fica no link (a): o a é filho do li e transborda o item', () => {
    expect(corpoDoSeletor(regras, SELETOR_LINK_ATUAL_NORMAL)).not.toMatch(/min-width:\s*64px/);
  });

  it('o piso de 64px existe só sob o prefixo do modo normal (nenhum seletor sem ele o aplica)', () => {
    const pisos = regras.filter((r) => /min-width:\s*64px/.test(r.corpo));
    expect(pisos.length, 'nenhuma regra com min-width: 64px').toBeGreaterThan(0);
    for (const piso of pisos) {
      for (const seletor of piso.seletores) {
        expect(
          seletor.startsWith(PREFIXO_NORMAL),
          `piso sem prefixo do modo normal: ${seletor}`
        ).toBe(true);
      }
    }
  });

  it('o modo adaptado mantém a quebra de linha (nowrap ausente e white-space normal)', () => {
    const corpo = corpoDoSeletor(regras, ":root[data-modo-adaptado='on'] .trilha-navegacao li");
    expect(corpo).toMatch(/white-space:\s*normal/);
    expect(estilo).not.toMatch(/white-space:\s*nowrap/);
  });
});

/**
 * Modo adaptado: o hífen mole (U+00AD) dos rótulos não pode mudar nada. Com
 * hyphens: manual (padrão do navegador) o U+00AD vira quebra com hífen visível
 * na trilha, que quebra mais linhas nesse modo. Por isso o link do modo
 * adaptado leva hyphens: none, e o navegador ignora o U+00AD.
 */
describe('trilha de navegação, modo adaptado: hífen mole inerte', () => {
  const regras = regrasDo(estiloSemComentarios());
  const SELETOR_LINK_ADAPTADO = ":root[data-modo-adaptado='on'] .trilha-navegacao a";

  it('o link do modo adaptado tem hyphens: none (o U+00AD não vira hífen visível)', () => {
    const corpo = corpoDoSeletor(regras, SELETOR_LINK_ADAPTADO);
    expect(corpo, 'regra do link no modo adaptado não encontrada').not.toBe('');
    expect(corpo).toMatch(/(?<![-\w])hyphens:\s*none\s*;/);
  });
});
