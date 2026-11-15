import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Disclaimer de rodapé (ordem do líder, 20/10/2026): o parágrafo do aviso
 * legal fica justificado, com recuo de primeira linha, e o idioma pt-BR no
 * elemento para a hifenização não quebrar em outra língua. No modo adaptado
 * (baixa visão, docs/modo-adaptado.md) volta a alinhamento à esquerda sem
 * recuo, porque a WCAG 1.4.8 recomenda não justificar. Mesmo mecanismo de
 * design.contrasteModoAdaptado.spec.ts: lê o próprio componente, nunca
 * duplica valor aqui. Layout real (buracos entre palavras) não cabe em jsdom.
 */
const CAMINHO_COMPONENTE = resolve(__dirname, '../../src/ui/componentes/AvisoLegal.vue');
const fonte = readFileSync(CAMINHO_COMPONENTE, 'utf-8');
const template = fonte.slice(0, fonte.indexOf('<style'));
const estilo = fonte.slice(fonte.indexOf('<style'));

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function corpoDaRegra(seletor: string): string | undefined {
  const regra = new RegExp(`(?:^|\\n)${escaparRegex(seletor)}\\s*\\{([^}]*)\\}`);
  return estilo.match(regra)?.[1];
}

const SELETOR_TEXTO = '.aviso-legal__texto';
const SELETOR_TEXTO_MODO_ADAPTADO = ":root[data-modo-adaptado='on'] .aviso-legal__texto";

describe('AvisoLegal: parágrafo justificado com recuo (modo padrão)', () => {
  const regraPadrao = corpoDaRegra(SELETOR_TEXTO);

  it('a regra padrão do parágrafo existe', () => {
    expect(regraPadrao).toBeDefined();
  });

  it('até 880 px o texto fica alinhado à esquerda (text-align: left), sem buraco entre palavras', () => {
    expect(regraPadrao).toMatch(/text-align:\s*left\s*;/);
  });

  it('acima de 880 px o texto volta a ser justificado (achado do QA: em 360 px o texto justificado abria espaços largos)', () => {
    expect(estilo).toMatch(
      /@media \(min-width:\s*881px\)\s*\{\s*\.aviso-legal__texto\s*\{\s*text-align:\s*justify\s*;/
    );
  });

  it('a primeira linha de cada parágrafo tem recuo de 2em (text-indent)', () => {
    expect(regraPadrao).toMatch(/text-indent:\s*2em\s*;/);
  });

  it('a hifenização automática fica ligada (hyphens: auto), contra buracos entre palavras', () => {
    expect(regraPadrao).toMatch(/hyphens:\s*auto\s*;/);
  });

  it('o elemento de texto declara lang="pt-BR" (a hifenização depende do idioma)', () => {
    const abertura = template.match(/<p\b[^>]*\bclass="aviso-legal__texto"[^>]*>/);
    expect(abertura).not.toBeNull();
    expect(abertura![0]).toMatch(/\blang="pt-BR"/);
  });
});

describe('AvisoLegal: modo adaptado sem justificar e sem recuo', () => {
  const regraAdaptado = corpoDaRegra(SELETOR_TEXTO_MODO_ADAPTADO);

  it('no modo adaptado existe regra própria do parágrafo', () => {
    expect(regraAdaptado).toBeDefined();
  });

  it('no modo adaptado o texto fica alinhado à esquerda (text-align: left)', () => {
    expect(regraAdaptado).toMatch(/text-align:\s*left\s*;/);
  });

  it('no modo adaptado não há recuo de primeira linha (text-indent: 0)', () => {
    expect(regraAdaptado).toMatch(/text-indent:\s*0\s*;/);
  });
});

const ENTRADA_CSS = readFileSync(resolve(__dirname, '../../public/entrada.css'), 'utf-8');

describe('tela de entrada: mesmo alinhamento do componente (revisão R1 do QA)', () => {
  const regraEntrada = ENTRADA_CSS.match(/(?:^|\n)\.aviso-legal__texto\s*\{([^}]*)\}/)?.[1];

  it('até 880 px o texto da entrada fica alinhado à esquerda', () => {
    expect(regraEntrada).toMatch(/text-align:\s*left\s*;/);
  });

  it('acima de 880 px o texto da entrada volta a ser justificado', () => {
    expect(ENTRADA_CSS).toMatch(
      /@media \(min-width:\s*881px\)\s*\{\s*\.aviso-legal__texto\s*\{\s*text-align:\s*justify\s*;/
    );
  });
});
