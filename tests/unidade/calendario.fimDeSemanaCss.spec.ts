import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Colunas de fim de semana da grade e item "Fim de semana" da legenda (ordem
 * do líder, 20/10/2026: "nos sábados e domingos ponha cor diferente nas
 * colunas do calendário"). O CSS do FullCalendar é injetado em runtime, então
 * o portão lê o arquivo-fonte, no mesmo padrão de calendario.estiloGrade.
 *
 * Nasce vermelho: a regra de .fc-day-sat/.fc-day-sun e a classe do chip não
 * existiam nesta forma.
 */
const CAMINHO = resolve(__dirname, '../../src/ui/estilos/calendario.css');
const css = readFileSync(CAMINHO, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Pares [seletor normalizado, corpo] de todas as regras do arquivo. */
function regras(): Array<{ seletor: string; corpo: string }> {
  const achados: Array<{ seletor: string; corpo: string }> = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    achados.push({ seletor: (m[1] ?? '').replace(/\s+/g, ' ').trim(), corpo: m[2] ?? '' });
  }
  return achados;
}

const VAR_FUNDO = 'background-color: var(--cor-cal-fimdesemana-fundo)';

describe('colunas de fim de semana da grade', () => {
  it('as células de sábado e domingo recebem o tom próprio, exceto o dia de hoje', () => {
    const celulas = regras().filter(
      (r) =>
        r.seletor.includes('.fc-daygrid-day.fc-day-sat') &&
        r.seletor.includes('.fc-daygrid-day.fc-day-sun')
    );
    expect(celulas.length).toBeGreaterThan(0);
    const regra = celulas.find((r) => r.corpo.replace(/\s+/g, ' ').includes(VAR_FUNDO));
    expect(regra, 'sem regra de fundo para as células de fim de semana').toBeDefined();
    expect(regra?.seletor).toContain(':not(.fc-day-today)');
  });

  it('o cabeçalho das colunas de sábado e domingo recebe o mesmo tom', () => {
    const cabecalho = regras().filter(
      (r) =>
        r.seletor.includes('.fc-col-header-cell.fc-day-sat') &&
        r.seletor.includes('.fc-col-header-cell.fc-day-sun')
    );
    expect(cabecalho.length).toBeGreaterThan(0);
    expect(
      cabecalho.some((r) => r.corpo.replace(/\s+/g, ' ').includes(VAR_FUNDO)),
      'cabeçalho de fim de semana sem o tom'
    ).toBe(true);
  });

  it('o dia de hoje mantém o próprio fundo quando cai num fim de semana', () => {
    const celulas = regras().filter((r) => r.seletor.includes('.fc-day-sat'));
    expect(celulas.length).toBeGreaterThan(0);
    expect(celulas.every((r) => r.seletor.includes(':not(.fc-day-today)'))).toBe(true);
  });
});

describe('chip "Fim de semana" da legenda', () => {
  it('a classe do chip usa as mesmas variáveis --cal-fundo/--cal-texto das categorias', () => {
    const chip = regras().find((r) => r.seletor === '.cal-fim-de-semana');
    expect(chip, 'sem regra .cal-fim-de-semana').toBeDefined();
    expect(chip?.corpo).toContain('--cal-fundo: var(--cor-cal-fimdesemana-fundo)');
    expect(chip?.corpo).toContain('--cal-texto: var(--cor-cal-fimdesemana-texto)');
  });

  it('no modo adaptado o chip mostra o mesmo cinza das colunas, não o branco do chip padrão', () => {
    const chip = regras().find(
      (r) => r.seletor === ":root[data-modo-adaptado='on'] .cal-fim-de-semana"
    );
    expect(chip, 'sem regra de chip de fim de semana no modo adaptado').toBeDefined();
    expect(chip?.corpo.replace(/\s+/g, ' ')).toContain('background: var(--cal-fundo)');
  });
});
