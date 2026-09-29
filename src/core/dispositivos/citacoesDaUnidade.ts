import type { ConteudoUnidade } from '../unidade/tipos';
import { extrairCitacoes } from './extrairCitacoes';
import type { DispositivoLegal, IndiceDispositivos } from './tipos';

/**
 * Todo o HTML de uma unidade em que uma citação de dispositivo legal pode
 * aparecer. Fonte única: o gerador do subconjunto por unidade e o portão de
 * verificação liam cada um a sua cópia desta lista.
 */
export function coletarHtmlDaUnidade(conteudo: ConteudoUnidade): string {
  const pedacos: string[] = [];
  for (const bloco of conteudo.resumo) {
    pedacos.push(bloco.corpoHtml, bloco.exemploHtml);
  }
  if (conteudo.peticao) {
    for (const secao of conteudo.peticao.secoes) {
      // corpoHtml é opcional (seção-título "guarda-chuva", sem texto de
      // peça próprio): sem `?? ''`, um `undefined` quebraria o tipo.
      pedacos.push(secao.corpoHtml ?? '', secao.comentarioHtml);
    }
  }
  if (conteudo.quiz) {
    // Os três campos legitimamente carregam botão de citação.
    for (const pergunta of conteudo.quiz) {
      pedacos.push(pergunta.enunciadoHtml, pergunta.explicacaoHtml, ...pergunta.alternativasHtml);
    }
  }
  return pedacos.join(' ');
}

export interface CitacoesDaUnidade {
  /** Ids citados (sem repetição), existam ou não no catálogo. */
  readonly encontradas: readonly string[];
  /** Subconjunto do catálogo que a unidade cita. Vazio é resultado válido. */
  readonly subconjunto: Readonly<Record<string, DispositivoLegal>>;
  /** Ids citados que o catálogo não tem: isto sim reprova a construção. */
  readonly orfas: readonly string[];
}

/**
 * Resolve as citações de UMA unidade contra o catálogo. Unidade sem nenhuma
 * citação (caso de uma cadeira que não cita artigo de lei, como Sociologia
 * Jurídica) devolve tudo vazio, sem erro. O piso "zero citação no site
 * inteiro é varredura quebrada" fica nos scripts, que somam as unidades.
 */
export function resolverCitacoesDaUnidade(
  conteudo: ConteudoUnidade,
  catalogoPorId: IndiceDispositivos
): CitacoesDaUnidade {
  const encontradas = extrairCitacoes(coletarHtmlDaUnidade(conteudo));
  const subconjunto: Record<string, DispositivoLegal> = {};
  const orfas: string[] = [];
  for (const id of encontradas) {
    const dispositivo = catalogoPorId[id];
    if (dispositivo) subconjunto[id] = dispositivo;
    else orfas.push(id);
  }
  return { encontradas, subconjunto, orfas };
}

/** Texto do módulo dispositivos.ts gerado para uma unidade. */
export function conteudoArquivoDispositivos(
  subconjunto: Readonly<Record<string, DispositivoLegal>>
): string {
  return `// Arquivo GERADO por scripts/gerar-dispositivos-por-unidade.ts. Não editar à mão.
import type { IndiceDispositivos } from '../../../../core/dispositivos/tipos';

export const dispositivos: IndiceDispositivos = ${JSON.stringify(subconjunto, null, 2)};
`;
}
