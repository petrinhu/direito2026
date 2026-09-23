import type { ConteudoUnidade } from '../unidade/tipos';
import { removerTags } from './removerTags';
import type { DocumentoBusca } from './tipos';

export interface ParametrosUnidade {
  readonly periodo: string;
  readonly cadeira: string;
  readonly unidade: string;
  readonly conteudo: ConteudoUnidade;
}

function trechoDe(texto: string, limite = 200): string {
  if (texto.length <= limite) return texto;
  return texto.slice(0, limite).trimEnd();
}

/**
 * Granularidade da seção 7: um documento por bloco teórico, um por seção
 * da peça, e um por unidade para o quiz — nunca pergunta por pergunta, que
 * entregaria a resposta na busca.
 */
export function montarDocumentosUnidade(params: ParametrosUnidade): DocumentoBusca[] {
  const { periodo, cadeira, unidade, conteudo } = params;
  const base = `${periodo}/${cadeira}/${unidade}`;
  const documentos: DocumentoBusca[] = [];

  for (const bloco of conteudo.resumo) {
    const corpo = removerTags(`${bloco.corpoHtml} ${bloco.exemploHtml} ${bloco.resumo.join(' ')}`);
    documentos.push({
      id: `${base}#${bloco.id}`,
      url: `/p/${base}#${bloco.id}`,
      periodo,
      cadeira,
      unidade,
      aba: 'resumo',
      titulo: bloco.titulo,
      corpo,
      trecho: trechoDe(corpo)
    });
  }

  if (conteudo.peticao) {
    for (const secao of conteudo.peticao.secoes) {
      // corpoHtml é opcional (seção-título "guarda-chuva", sem texto de
      // peça próprio): sem o `?? ''`, a interpolação de template vira a
      // STRING "undefined" e essa palavra entraria no índice de busca.
      const corpo = removerTags(`${secao.corpoHtml ?? ''} ${secao.comentarioHtml}`);
      documentos.push({
        id: `${base}/peticao#${secao.id}`,
        url: `/p/${base}/peticao#${secao.id}`,
        periodo,
        cadeira,
        unidade,
        aba: 'peticao',
        titulo: secao.titulo,
        corpo,
        trecho: trechoDe(corpo)
      });
    }
  }

  if (conteudo.quiz && conteudo.quiz.length > 0) {
    // Só os enunciados, nunca a resposta correta: a busca não pode virar gabarito.
    const corpo = removerTags(conteudo.quiz.map((p) => p.enunciadoHtml).join(' '));
    documentos.push({
      id: `${base}/quiz`,
      url: `/p/${base}/quiz`,
      periodo,
      cadeira,
      unidade,
      aba: 'quiz',
      titulo: `Quiz: ${conteudo.meta.titulo}`,
      corpo,
      trecho: trechoDe(corpo)
    });
  }

  return documentos;
}
