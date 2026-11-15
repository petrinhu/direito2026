import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';
import { extrairVariaveisHex } from '@/core/design/tokens';

/**
 * Ordem do líder (15/11): "Separe os setores do menu com linhas douradas no tom do site". A linha
 * usa um dourado que o site já tem, nunca cor à mão. O token é --cor-friso (ouro claro, já usado
 * sobre o azul da fachada): --cor-acento mede 2,70:1 no tema claro contra a lateral, abaixo do piso
 * de 3:1 (WCAG 1.4.11, objeto gráfico não textual), por isso não serve. Nos quatro blocos de tema
 * (claro, escuro por preferência, escuro por escolha e modo adaptado) o token tem de dar 3:1 contra
 * o fundo real da lateral. Lê tokens.css e MenuCurriculo.vue de verdade, sem duplicar valor aqui.
 */
const TOKENS = readFileSync(resolve(__dirname, '../../src/ui/estilos/tokens.css'), 'utf-8');
const MENU = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/MenuCurriculo.vue'),
  'utf-8'
);
const PISO_NAO_TEXTO = 3;
const DOURADO = '--cor-friso';

const BLOCOS: ReadonlyArray<readonly [string, string]> = [
  ['claro', ':root {'],
  ['escuro por preferência', ':root:not([data-theme="light"]) {'],
  ['escuro por escolha', ':root[data-theme="dark"] {'],
  ['modo adaptado', ':root[data-modo-adaptado="on"] {']
];

/** Recorte do bloco até a chave que fecha o seletor (conta chaves; um comentário não encurta). */
function blocoDoSeletor(seletor: string): string {
  const inicio = TOKENS.indexOf(seletor);
  if (inicio < 0) throw new Error(`bloco ausente em tokens.css: ${seletor}`);
  let profundidade = 0;
  for (let i = TOKENS.indexOf('{', inicio); i < TOKENS.length; i++) {
    if (TOKENS[i] === '{') profundidade++;
    else if (TOKENS[i] === '}') {
      profundidade--;
      if (profundidade === 0) return TOKENS.slice(inicio, i + 1);
    }
  }
  throw new Error(`bloco sem fechamento em tokens.css: ${seletor}`);
}

function variaveisDoBloco(seletor: string): Record<string, string> {
  return extrairVariaveisHex(blocoDoSeletor(seletor));
}

/** Valor efetivo no tema: o do bloco, ou, se ele não redefine a variável, o da raiz (cascata). */
function efetivo(seletor: string, variavel: string): string | undefined {
  return variaveisDoBloco(seletor)[variavel] ?? variaveisDoBloco(':root {')[variavel];
}

describe('separador dourado do menu: contraste contra a lateral nos quatro blocos', () => {
  it.each(BLOCOS)('%s: o dourado tem 3:1 contra o fundo da lateral', (_nome, seletor) => {
    const dourado = efetivo(seletor, DOURADO);
    const fundo = efetivo(seletor, '--cor-sidebar-fundo');
    expect(dourado, 'dourado ausente').toBeDefined();
    expect(fundo, 'fundo da lateral ausente').toBeDefined();
    expect(calcularContraste(dourado!, fundo!)).toBeGreaterThanOrEqual(PISO_NAO_TEXTO);
  });
});

describe('separador dourado do menu: a linha usa o token do site', () => {
  const regra = MENU.match(/\n\.menu-curriculo__separador\s*\{([^}]*)\}/)?.[1];

  it('existe uma regra .menu-curriculo__separador no componente', () => {
    expect(regra).toBeDefined();
  });

  it('a borda do separador usa var(--cor-friso), sem cor escrita à mão', () => {
    expect(regra).toMatch(/border[-a-z]*:[^;]*var\(--cor-friso[,)]/);
    expect(regra).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  it('o separador é um <hr> do próprio menu, fora das listas (ARIA não aceita separador como filho de lista)', () => {
    expect(MENU).toMatch(/<hr\b[^>]*class="menu-curriculo__separador"/);
  });
});
