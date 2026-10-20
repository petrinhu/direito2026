import { ehDataIso } from './datas';
import {
  CATEGORIAS_EVENTO,
  TIPOS_PROVA,
  type EventoDoSemestre,
  type ObservacaoDoSemestre,
  type PrazoDoSemestre,
  type ProvaDoSemestre
} from './tipos';

/** Dado bruto do calendário: as listas que os arquivos de src/conteudo/calendario exportam. */
export interface DadosDoCalendario {
  provas: readonly ProvaDoSemestre[];
  feriados: readonly EventoDoSemestre[];
  eventosAcademicos: readonly EventoDoSemestre[];
  periodosOnline: readonly EventoDoSemestre[];
  prazos: readonly PrazoDoSemestre[];
  observacoes: readonly ObservacaoDoSemestre[];
}

export interface ReferenciasDoCalendario {
  /** Ids de cadeira do currículo montado. Prova cujo id não estiver aqui é erro. */
  cadeiraIds: ReadonlySet<string>;
}

const PADRAO_SEMESTRE = /^\d{4}\.[12]$/;

/**
 * Valida o dado do calendário e devolve uma mensagem por problema, na ordem
 * das listas. Lista vazia = dado válido. Função pura: não lança.
 */
export function validarCalendario(
  dados: DadosDoCalendario,
  referencias: ReferenciasDoCalendario
): string[] {
  return [
    ...validarProvas(dados.provas, referencias),
    ...validarEventos('feriados', dados.feriados),
    ...validarEventos('eventosAcademicos', dados.eventosAcademicos),
    ...validarEventos('periodosOnline', dados.periodosOnline),
    ...validarPrazos(dados.prazos),
    ...validarObservacoes(dados.observacoes)
  ];
}

function validarSemestre(lista: string, indice: number, semestre: string): string[] {
  return PADRAO_SEMESTRE.test(semestre)
    ? []
    : [`${lista}[${indice}]: semestre inválido "${semestre}"`];
}

function validarProvas(
  provas: readonly ProvaDoSemestre[],
  { cadeiraIds }: ReferenciasDoCalendario
): string[] {
  const erros: string[] = [];
  const vistas = new Set<string>();
  provas.forEach((prova, i) => {
    const rotulo = `provas[${i}]`;
    erros.push(...validarSemestre('provas', i, prova.semestre));
    if (!ehDataIso(prova.data)) erros.push(`${rotulo}: data inválida "${prova.data}"`);
    if (!cadeiraIds.has(prova.cadeiraId)) {
      erros.push(`${rotulo}: cadeiraId desconhecido "${prova.cadeiraId}"`);
    }
    if (!TIPOS_PROVA.includes(prova.tipo))
      erros.push(`${rotulo}: tipo desconhecido "${prova.tipo}"`);
    const chave = `${prova.semestre}|${prova.cadeiraId}|${prova.tipo}`;
    if (vistas.has(chave)) {
      erros.push(
        `${rotulo}: prova duplicada (${prova.semestre}, ${prova.cadeiraId}, ${prova.tipo})`
      );
    }
    vistas.add(chave);
  });
  return erros;
}

function validarEventos(lista: string, eventos: readonly EventoDoSemestre[]): string[] {
  return eventos.flatMap((evento, i) => {
    const rotulo = `${lista}[${i}]`;
    const erros = validarSemestre(lista, i, evento.semestre);
    if (!ehDataIso(evento.inicio)) erros.push(`${rotulo}: início inválido "${evento.inicio}"`);
    if (!ehDataIso(evento.fim)) erros.push(`${rotulo}: fim inválido "${evento.fim}"`);
    if (ehDataIso(evento.inicio) && ehDataIso(evento.fim) && evento.fim < evento.inicio) {
      erros.push(`${rotulo}: fim (${evento.fim}) antes do início (${evento.inicio})`);
    }
    if (!CATEGORIAS_EVENTO.includes(evento.categoria)) {
      erros.push(`${rotulo}: categoria desconhecida "${evento.categoria}"`);
    }
    return erros;
  });
}

function validarPrazos(prazos: readonly PrazoDoSemestre[]): string[] {
  return prazos.flatMap((prazo, i) => {
    const erros = validarSemestre('prazos', i, prazo.semestre);
    if (!ehDataIso(prazo.data)) erros.push(`prazos[${i}]: data inválida "${prazo.data}"`);
    return erros;
  });
}

function validarObservacoes(observacoes: readonly ObservacaoDoSemestre[]): string[] {
  return observacoes.flatMap((observacao, i) => {
    const erros = validarSemestre('observacoes', i, observacao.semestre);
    if (observacao.texto.trim() === '') erros.push(`observacoes[${i}]: texto vazio`);
    return erros;
  });
}
