import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Cinco abas (Resumo, Mapa mental, Fichamento, Mnemônicos, Quiz) não cabem
 * numa linha só em 320px nem em 360px. A lista de abas quebra de linha em
 * QUALQUER modo, e não só no adaptado, para nenhuma aba sair da tela. A
 * medida real é o e2e tests/e2e/abas-novas-largura.spec.ts; este teste só
 * impede que a regra suma da folha.
 */
function regraBase(css: string, seletor: string): string {
  const inicio = css.indexOf(`\n${seletor} {`);
  expect(inicio, `regra ${seletor} ausente`).toBeGreaterThanOrEqual(0);
  return css.slice(inicio, css.indexOf('}', inicio));
}

describe('AbasUnidade em tela estreita', () => {
  const fonte = readFileSync(
    resolve(__dirname, '../../src/ui/componentes/AbasUnidade.vue'),
    'utf-8'
  );

  it('a lista de abas quebra de linha também fora do modo adaptado', () => {
    expect(regraBase(fonte, '.abas-unidade__lista')).toMatch(/flex-wrap:\s*wrap/);
  });
});

describe('texto do mapa mental usa a escala de corpo', () => {
  const fonte = readFileSync(
    resolve(__dirname, '../../src/ui/componentes/NoMapaMental.vue'),
    'utf-8'
  );

  it('o detalhe do nó segue --escala-base (24px no modo adaptado), nunca a escala pequena', () => {
    const regra = regraBase(fonte, '.no-mapa__detalhe');
    expect(regra).toContain('var(--escala-base');
    expect(regra).not.toContain('--escala-sm');
  });
});

describe('texto do mapa mental em tela estreita', () => {
  const fonte = readFileSync(
    resolve(__dirname, '../../src/ui/componentes/NoMapaMental.vue'),
    'utf-8'
  );

  it('quebra a linha só entre palavras: break-word, nunca anywhere (que parte palavra no meio)', () => {
    expect(fonte).not.toContain('overflow-wrap: anywhere');
    expect(regraBase(fonte, '.no-mapa__corpo')).toContain('overflow-wrap: break-word');
  });

  it('o recuo por nível é pequeno na base (tela estreita) e só cresce a partir de 640px', () => {
    const grupo = regraBase(fonte, '.no-mapa__grupo');
    expect(grupo).toContain('var(--esp-1, 0.25rem)');
    expect(grupo).toContain('var(--esp-2, 0.5rem)');
  });
});

describe('acabamento das abas novas (QA, cosméticos)', () => {
  const ler = (arquivo: string) =>
    readFileSync(resolve(__dirname, '../../src/ui/componentes', arquivo), 'utf-8');

  it('resposta dos mnemônicos: todos os termos no mesmo estilo (cada item em bloco, termo e explicação em linhas próprias)', () => {
    const fonte = ler('CartaoMnemonico.vue');
    expect(regraBase(fonte, '.mnemonico__item')).not.toContain('display: flex');
    expect(regraBase(fonte, '.mnemonico__item dt')).toContain('display: block');
  });

  it('impressão: a faixa de abas some', () => {
    const fonte = ler('AbasUnidade.vue');
    const impressao = fonte.slice(fonte.indexOf('@media print'));
    expect(impressao).toContain('.abas-unidade__lista');
    expect(impressao).toContain('display: none');
  });

  it('impressão: os triângulos de mapa e de ficha saem como abertos', () => {
    for (const arquivo of ['NoMapaMental.vue', 'FichaPensadorCartao.vue']) {
      const fonte = ler(arquivo);
      const impressao = fonte.slice(fonte.indexOf('@media print'));
      expect(impressao, arquivo).toContain('rotate(90deg)');
    }
  });
});

describe('modo adaptado na aba do mapa: preto e branco puro', () => {
  const ler = (arquivo: string) =>
    readFileSync(resolve(__dirname, '../../src/ui/componentes', arquivo), 'utf-8');

  it('o contêiner da aba troca os tokens de marca (#0d2440) por preto', () => {
    const fonte = ler('MapaMentalVisor.vue');
    const bloco = fonte.slice(fonte.indexOf(":root[data-modo-adaptado='on'] .mapa-mental {"));
    for (const variavel of [
      '--cor-primaria',
      '--cor-titulo-texto',
      '--cor-acento',
      '--cor-bordo'
    ]) {
      expect(bloco, variavel).toMatch(new RegExp(`${variavel}:\\s*#000000`));
    }
  });

  it('nenhum componente do mapa escreve #0d2440 à mão', () => {
    for (const arquivo of [
      'MapaVisual.vue',
      'MapaMentalVisor.vue',
      'MapaMental.vue',
      'NoMapaMental.vue'
    ]) {
      // Valor reserva dentro de var(--token, #hex) não conta: o token é que vale.
      const semReservas = ler(arquivo)
        .replace(/var\([^)]*\)/g, '')
        .toLowerCase();
      expect(semReservas, arquivo).not.toContain('#0d2440');
    }
  });
});
