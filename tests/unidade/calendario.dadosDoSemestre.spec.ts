import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { PERIODOS_ONLINE, PRAZOS, PROVAS } from '@/conteudo/calendario/provas';
import { FERIADOS } from '@/conteudo/calendario/feriados';
import {
  EVENTOS_ACADEMICOS,
  OBSERVACOES_ACADEMICAS
} from '@/conteudo/calendario/calendarioAcademico';
import { validarCalendario, type DadosDoCalendario } from '@/core/calendario/validarCalendario';
import type { EventoDoSemestre } from '@/core/calendario/tipos';

/**
 * Dado real do calendário. Os fatos abaixo são do semestre 2026.2 (filtrados
 * pelo campo semestre), para que acrescentar outro semestre ao dado não quebre
 * estes testes. A forma e as regras do dado são travadas pelo validador.
 */
const SEMESTRE = '2026.2';
const doSemestre = <T extends { semestre: string }>(itens: readonly T[]): T[] =>
  itens.filter((item) => item.semestre === SEMESTRE);

const DADOS: DadosDoCalendario = {
  provas: PROVAS,
  feriados: FERIADOS,
  eventosAcademicos: EVENTOS_ACADEMICOS,
  periodosOnline: PERIODOS_ONLINE,
  prazos: PRAZOS,
  observacoes: OBSERVACOES_ACADEMICAS
};

const CADEIRA_IDS = new Set(curriculo.flatMap((periodo) => periodo.cadeiras).map((c) => c.id));

const INICIO_DA_JANELA = '2026-07-01';
const FIM_DA_JANELA = '2027-01-31';

/** Chave que identifica um evento, com semestre, datas e título. */
const chaveEvento = (e: EventoDoSemestre): string =>
  `${e.semestre}|${e.inicio}|${e.fim}|${e.titulo}`;

/** Chaves que aparecem mais de uma vez na lista. Lista limpa devolve []. */
function chavesRepetidas<T>(itens: readonly T[], chave: (item: T) => string): string[] {
  const vistas = new Set<string>();
  const repetidas: string[] = [];
  for (const item of itens) {
    const k = chave(item);
    if (vistas.has(k)) repetidas.push(k);
    vistas.add(k);
  }
  return repetidas;
}

describe('dado do calendário inteiro', () => {
  it('passa no validador: datas, cadeiras do currículo, sem duplicata, categorias e semestre', () => {
    expect(validarCalendario(DADOS, { cadeiraIds: CADEIRA_IDS })).toEqual([]);
  });

  it('varre itens de verdade (piso: zero itens seria varredura quebrada, não dado limpo)', () => {
    const analisados = Object.values(DADOS).reduce((total, lista) => total + lista.length, 0);
    expect(analisados).toBeGreaterThan(0);
  });

  it('nenhum feriado, evento, período online, prazo ou prova aparece duplicado (mesma cadeira, tipo e semestre)', () => {
    expect(chavesRepetidas(FERIADOS, chaveEvento)).toEqual([]);
    expect(chavesRepetidas(EVENTOS_ACADEMICOS, chaveEvento)).toEqual([]);
    expect(chavesRepetidas(PERIODOS_ONLINE, chaveEvento)).toEqual([]);
    expect(chavesRepetidas(PRAZOS, (p) => `${p.semestre}|${p.data}|${p.descricao}`)).toEqual([]);
    expect(chavesRepetidas(PROVAS, (p) => `${p.semestre}|${p.cadeiraId}|${p.tipo}`)).toEqual([]);
  });
});

describe('provas do semestre 2026.2, por cadeira', () => {
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
    const achadas = doSemestre(PROVAS).filter((p) => p.cadeiraId === cadeiraId && p.tipo === tipo);
    expect(achadas.map((p) => p.data)).toEqual([data]);
  });

  it('prova parcial é aceita: uma cadeira só com a AV1 passa o validador (sem exigir as cinco)', () => {
    const parcial: DadosDoCalendario = {
      ...DADOS,
      provas: [
        { semestre: SEMESTRE, data: '2026-09-15', cadeiraId: 'interdisciplinar', tipo: 'AV1' }
      ]
    };
    expect(validarCalendario(parcial, { cadeiraIds: CADEIRA_IDS })).toEqual([]);
  });
});

describe('feriados do semestre 2026.2', () => {
  it('os confirmados nas fontes estão presentes (nacionais e Recife; PE não tem feriado estadual na janela), sem exigir que sejam os únicos', () => {
    expect(doSemestre(FERIADOS).map((f) => f.inicio)).toEqual(
      expect.arrayContaining([
        '2026-07-16',
        '2026-09-07',
        '2026-10-12',
        '2026-11-02',
        '2026-11-15',
        '2026-11-20',
        '2026-12-08',
        '2026-12-25',
        '2027-01-01'
      ])
    );
  });

  it('todo feriado (qualquer semestre) é da categoria feriado e tem uma linha de descrição', () => {
    for (const f of FERIADOS) {
      expect(f.categoria).toBe('feriado');
      expect(f.descricao.length).toBeGreaterThan(0);
    }
  });
});

describe('eventos acadêmicos e observações do semestre 2026.2', () => {
  const eventos = doSemestre(EVENTOS_ACADEMICOS);

  it('caem dentro da janela do semestre', () => {
    for (const e of eventos) {
      expect(e.inicio >= INICIO_DA_JANELA && e.fim <= FIM_DA_JANELA, e.titulo).toBe(true);
    }
  });

  it('trazem as datas-chave do calendário discente', () => {
    const porTitulo = (trecho: string) => eventos.find((e) => e.titulo.includes(trecho));
    expect(porTitulo('Início das aulas')?.inicio).toBe('2026-08-10');
    expect(porTitulo('Período de inclusão')?.fim).toBe('2026-09-08');
    expect(porTitulo('dispensa')?.inicio).toBe('2026-09-14');
    expect(porTitulo('colação')?.inicio).toBe('2026-09-10');
    expect(porTitulo('Rematrícula')?.inicio).toBe('2027-01-04');
    expect(porTitulo('Rematrícula')?.fim).toBe('2027-01-22');
    expect(porTitulo('Dia do Professor')?.inicio).toBe('2026-10-15');
  });

  it('guarda a observação de revisão de prova (até 10 dias após a nota)', () => {
    const textos = OBSERVACOES_ACADEMICAS.filter((o) => o.semestre === SEMESTRE).map(
      (o) => o.texto
    );
    expect(textos.join(' ')).toContain('10 dias');
  });
});

describe('provas online de Economia e de Empreendedorismo (sala digital), 2026.2', () => {
  it('o período de 13/10 a 15/11/2026, na categoria própria online, está presente (outros períodos não quebram)', () => {
    expect(doSemestre(PERIODOS_ONLINE)).toContainEqual({
      semestre: SEMESTRE,
      inicio: '2026-10-13',
      fim: '2026-11-15',
      categoria: 'online',
      titulo: 'Provas online: Economia e Empreendedorismo',
      descricao:
        'Provas online de Economia e de Empreendedorismo (sala digital): de 13/10 a 15/11/2026.'
    });
  });

  it('o prazo do contador (fim desse período, com a frase do quadro) está presente', () => {
    expect(doSemestre(PRAZOS)).toContainEqual({
      semestre: SEMESTRE,
      data: '2026-11-15',
      descricao: 'o fim das provas online de Economia e Empreendedorismo'
    });
  });
});
