import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Regras CSS da grade do calendário (achados D2, D3 e D4 do QA visual,
 * 20/10/2026). jsdom não aplica a cascata do CSS importado (vitest roda com
 * css: false) e o FullCalendar injeta o próprio CSS em tempo de execução, então
 * o portão lê o arquivo-fonte, no mesmo padrão de design.gavetaSemMovimento.
 *
 * Nasce vermelho: as regras de texto do modo adaptado, do opacity dos dias
 * de outro mês e do ellipsis não existiam nesta forma.
 */
const CAMINHO = resolve(__dirname, '../../src/ui/estilos/calendario.css');
const css = readFileSync(CAMINHO, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Corpos das regras cujo seletor contém o trecho (normalizando espaços). */
function corposDeRegras(trecho: string): string[] {
  const achados: string[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const seletor = (m[1] ?? '').replace(/\s+/g, ' ').trim();
    if (seletor.includes(trecho)) achados.push(m[2] ?? '');
  }
  return achados;
}

const ADAPTADO = ":root[data-modo-adaptado='on'] .grade-calendario";

describe('modo adaptado: texto do evento da grade visível (D2)', () => {
  it('o texto interno do evento vira preto, não branco herdado da categoria', () => {
    const corpos = corposDeRegras(`${ADAPTADO} .fc-event`);
    expect(corpos.some((c) => /--fc-event-text-color:\s*#000000/.test(c))).toBe(true);
  });

  it('o título interno (.fc-event-main e .cal-evento__titulo) tem cor preta no modo adaptado', () => {
    for (const interno of ['.fc-event-main', '.cal-evento__titulo']) {
      const corpos = corposDeRegras(`${ADAPTADO} .fc-event ${interno}`);
      expect(
        corpos.some((c) => /color:\s*#000000/.test(c)),
        `${interno} sem cor preta no modo adaptado`
      ).toBe(true);
    }
  });

  it('no modo adaptado o rótulo curto da categoria fica visível em qualquer largura', () => {
    const corpos = corposDeRegras(`${ADAPTADO} .cal-evento__rotulo`);
    expect(corpos.some((c) => /clip-path:\s*none/.test(c))).toBe(true);
    expect(corpos.some((c) => /position:\s*static/.test(c))).toBe(true);
  });
});

describe('dias de outro mês: número legível (D3)', () => {
  it('o número dos dias fora do mês não sai com opacity 0,3 do FullCalendar', () => {
    const corpos = corposDeRegras(`${'.grade-calendario'} .fc-day-other .fc-daygrid-day-top`);
    expect(corpos.some((c) => /opacity:\s*1\b/.test(c))).toBe(true);
  });
});

/** Corpos das regras do seletor que estão fora do modo adaptado. */
function corposBase(trecho: string): string[] {
  const achados: string[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const seletor = (m[1] ?? '').replace(/\s+/g, ' ').trim();
    if (seletor.includes(trecho) && !seletor.includes(':root')) achados.push(m[2] ?? '');
  }
  return achados;
}

describe('títulos dos chips: quebra em palavras, no máximo 2 linhas (D4)', () => {
  it('o título quebra nas palavras (normal, sem nowrap) e corta em 2 linhas com reticências', () => {
    const corpos = corposBase('.grade-calendario .cal-evento__titulo');
    const ok = corpos.some(
      (c) =>
        /white-space:\s*normal/.test(c) &&
        /overflow-wrap:\s*normal/.test(c) &&
        /hyphens:\s*none/.test(c) &&
        /display:\s*-webkit-box/.test(c) &&
        /-webkit-box-orient:\s*vertical/.test(c) &&
        /-webkit-line-clamp:\s*2\b/.test(c) &&
        /overflow:\s*hidden/.test(c) &&
        /max-height:/.test(c)
    );
    expect(ok).toBe(true);
  });

  it('o rótulo curto também quebra nas palavras e tem o mesmo limite de 2 linhas', () => {
    const corpos = corposBase('.grade-calendario .cal-evento__rotulo');
    const ok = corpos.some(
      (c) =>
        /white-space:\s*normal/.test(c) &&
        /overflow-wrap:\s*normal/.test(c) &&
        /-webkit-line-clamp:\s*2\b/.test(c)
    );
    expect(ok).toBe(true);
  });

  it('o rótulo curto de tela estreita usa fonte de 0,6875rem para caber na célula', () => {
    const corpos = corposBase('.grade-calendario .cal-evento__rotulo');
    expect(corpos.some((c) => /font-size:\s*0\.6875rem/.test(c))).toBe(true);
  });

  it('a mesma regra da tela estreita tira o padding lateral (sobra largura para "Feriado" caber)', () => {
    const corpos = corposBase('.grade-calendario .cal-evento__rotulo');
    expect(
      corpos.some((c) => /font-size:\s*0\.6875rem/.test(c) && /padding:\s*0\s*;/.test(c))
    ).toBe(true);
  });

  it('no modo adaptado o rótulo herda o tamanho base (não os 0,6875rem da tela estreita)', () => {
    const corpos = corposDeRegras(`${ADAPTADO} .cal-evento__rotulo`);
    expect(corpos.some((c) => /font-size:\s*inherit/.test(c))).toBe(true);
  });

  it('abaixo de 641px o título sai da vista e o rótulo curto fica (mobile-first)', () => {
    const base = corposDeRegras('.grade-calendario .cal-evento__titulo');
    expect(base.some((c) => /clip-path:\s*inset\(50%\)/.test(c))).toBe(true);
    const telaLarga = css.slice(css.indexOf('@media (min-width: 641px)'));
    expect(telaLarga).toContain('.cal-evento__titulo');
    expect(telaLarga).toContain('.cal-evento__rotulo');
  });
});

describe('barras de vários dias: continuam numa linha só (D4)', () => {
  it('o título da barra não quebra linha e corta com reticências', () => {
    const corpos = corposBase('.grade-calendario .cal-evento--barra .cal-evento__titulo');
    const ok = corpos.some(
      (c) =>
        /white-space:\s*nowrap/.test(c) &&
        /overflow:\s*hidden/.test(c) &&
        /text-overflow:\s*ellipsis/.test(c)
    );
    expect(ok).toBe(true);
  });

  it('o rótulo da barra em tela estreita também fica numa linha', () => {
    const corpos = corposBase('.grade-calendario .cal-evento--barra .cal-evento__rotulo');
    expect(corpos.some((c) => /white-space:\s*nowrap/.test(c))).toBe(true);
  });
});
