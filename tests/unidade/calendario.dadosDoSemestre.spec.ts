import { describe, expect, it } from 'vitest';
import { PROVAS_2026_2 } from '@/conteudo/calendario/provas';
import { FERIADOS_2026_2 } from '@/conteudo/calendario/feriados';
import {
  EVENTOS_ACADEMICOS_2026_2,
  OBSERVACOES_ACADEMICAS_2026_2
} from '@/conteudo/calendario/calendarioAcademico';
import { ehDataIso } from '@/core/calendario/datas';

/**
 * Fatos transcritos das fontes do líder (provas por cadeira, 2026) e do
 * calendário discente 2026.2 (PDF oficial). Estes testes travam os números:
 * se alguém mudar uma data sem conferir a fonte, o teste reprova.
 */
const INICIO_DA_JANELA = '2026-07-01';
const FIM_DA_JANELA = '2027-01-31';

describe('provas de 2026.2, por cadeira', () => {
  it('são 20 provas: 4 cadeiras x 5 avaliações', () => {
    expect(PROVAS_2026_2).toHaveLength(20);
  });

  it.each([
    ['intr-direito', 'AV1', '2026-09-22'],
    ['intr-direito', 'AV2', '2026-10-16'],
    ['intr-direito', 'AV3', '2026-11-24'],
    ['intr-direito', 'chamada', '2026-12-09'],
    ['intr-direito', 'final', '2026-12-15'],
    ['redacao-juridica-1', 'AV1', '2026-09-28'],
    ['redacao-juridica-1', 'AV2', '2026-10-16'],
    ['redacao-juridica-1', 'AV3', '2026-11-30'],
    ['redacao-juridica-1', 'chamada', '2026-12-10'],
    ['redacao-juridica-1', 'final', '2026-12-16'],
    ['sociologia-juridica', 'AV1', '2026-09-30'],
    ['sociologia-juridica', 'AV2', '2026-10-16'],
    ['sociologia-juridica', 'AV3', '2026-12-02'],
    ['sociologia-juridica', 'chamada', '2026-12-11'],
    ['sociologia-juridica', 'final', '2026-12-17'],
    ['filosofia-juridica', 'AV1', '2026-10-01'],
    ['filosofia-juridica', 'AV2', '2026-10-16'],
    ['filosofia-juridica', 'AV3', '2026-12-03'],
    ['filosofia-juridica', 'chamada', '2026-12-09'],
    ['filosofia-juridica', 'final', '2026-12-15']
  ])('%s, %s -> %s', (cadeiraId, tipo, data) => {
    const achadas = PROVAS_2026_2.filter((p) => p.cadeiraId === cadeiraId && p.tipo === tipo);
    expect(achadas.map((p) => p.data)).toEqual([data]);
  });

  it('cada prova tem data ISO válida e nome de cadeira preenchido', () => {
    for (const p of PROVAS_2026_2) {
      expect(ehDataIso(p.data)).toBe(true);
      expect(p.cadeiraNome.length).toBeGreaterThan(0);
    }
  });
});

describe('feriados', () => {
  it('são exatamente os confirmados nas fontes (nacionais e Recife; PE não tem feriado estadual na janela)', () => {
    expect(FERIADOS_2026_2.map((f) => f.inicio)).toEqual([
      '2026-07-16',
      '2026-09-07',
      '2026-10-12',
      '2026-11-02',
      '2026-11-15',
      '2026-11-20',
      '2026-12-08',
      '2026-12-25',
      '2027-01-01'
    ]);
  });

  it('todo feriado é da categoria feriado e tem uma linha de descrição', () => {
    for (const f of FERIADOS_2026_2) {
      expect(f.categoria).toBe('feriado');
      expect(f.descricao.length).toBeGreaterThan(0);
    }
  });
});

describe('eventos acadêmicos e observações', () => {
  it('todo evento tem datas ISO válidas, em ordem, dentro da janela do semestre', () => {
    for (const e of EVENTOS_ACADEMICOS_2026_2) {
      expect(ehDataIso(e.inicio)).toBe(true);
      expect(ehDataIso(e.fim)).toBe(true);
      expect(e.inicio <= e.fim).toBe(true);
      expect(e.inicio >= INICIO_DA_JANELA && e.fim <= FIM_DA_JANELA).toBe(true);
    }
  });

  it('traz as datas-chave do calendário discente', () => {
    const porTitulo = (trecho: string) =>
      EVENTOS_ACADEMICOS_2026_2.find((e) => e.titulo.includes(trecho));
    expect(porTitulo('Início das aulas')?.inicio).toBe('2026-08-10');
    expect(porTitulo('Período de inclusão')?.fim).toBe('2026-09-08');
    expect(porTitulo('dispensa')?.inicio).toBe('2026-09-14');
    expect(porTitulo('colação')?.inicio).toBe('2026-09-10');
    expect(porTitulo('Rematrícula')?.inicio).toBe('2027-01-04');
    expect(porTitulo('Rematrícula')?.fim).toBe('2027-01-22');
    expect(porTitulo('Dia do Professor')?.inicio).toBe('2026-10-15');
  });

  it('guarda a observação de revisão de prova (até 10 dias após a nota)', () => {
    expect(OBSERVACOES_ACADEMICAS_2026_2.join(' ')).toContain('10 dias');
  });
});
