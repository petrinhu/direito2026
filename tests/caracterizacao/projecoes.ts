import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';
import type { DocumentoBusca } from '@/core/busca/tipos';
import type { RegistroDeCarregadores } from '@/app/carregamento/decorarCurriculo';
import {
  montarDocumentosCadeirasRestritas,
  montarDocumentosUnidade
} from '@/core/busca/montarIndice';

/**
 * Projeções usadas pelos testes de caracterização (tests/caracterizacao/).
 *
 * Este arquivo NÃO é um spec (não casa com *.spec.ts, então o vitest não o
 * coleta). Ele também é importado por scripts/atualizar-referencias.ts, que
 * regenera os arquivos *.esperado.json; por isso a forma da projeção mora num
 * lugar só.
 *
 * Regra: cada projeção devolve SOMENTE dados (sem funções) e com chaves
 * sempre presentes (null quando ausente), para a referência não depender
 * de como o objeto foi montado. O que muda a forma de um campo é mudança
 * de comportamento e deve quebrar o teste.
 */

export interface ProjecaoUnidade {
  readonly id: string;
  readonly rotulo: string;
  readonly titulo: string;
  readonly estado: string;
  readonly abas: readonly string[];
}

export interface ProjecaoCadeira {
  readonly id: string;
  readonly nome: string;
  readonly estado: string;
  readonly restrita: boolean;
  readonly atalhoUnidade: {
    readonly rotulo: string;
    readonly apos: string;
    readonly cadeiraId: string;
  } | null;
  readonly unidades: readonly ProjecaoUnidade[];
}

export interface ProjecaoPeriodo {
  readonly id: string;
  readonly numero: number;
  readonly rotulo: string;
  readonly cadeiras: readonly ProjecaoCadeira[];
}

export function projetarCurriculo(curriculo: Curriculo): ProjecaoPeriodo[] {
  return curriculo.map((periodo) => ({
    id: periodo.id,
    numero: periodo.numero,
    rotulo: periodo.rotulo,
    cadeiras: periodo.cadeiras.map((cadeira) => ({
      id: cadeira.id,
      nome: cadeira.nome,
      estado: cadeira.estado,
      restrita: cadeira.restrita === true,
      atalhoUnidade: cadeira.atalhoUnidade
        ? {
            rotulo: cadeira.atalhoUnidade.rotulo,
            apos: cadeira.atalhoUnidade.apos,
            cadeiraId: cadeira.atalhoUnidade.cadeiraId
          }
        : null,
      unidades: cadeira.unidades.map((unidade) => ({
        id: unidade.id,
        rotulo: unidade.rotulo,
        titulo: unidade.titulo,
        estado: unidade.estado,
        abas: [...unidade.abas]
      }))
    }))
  }));
}

/** Chaves "periodo/cadeira/unidade" de toda unidade publicada, na ordem do currículo. */
export function chavesDasUnidadesPublicadas(curriculo: Curriculo): string[] {
  return curriculo.flatMap((periodo) =>
    periodo.cadeiras.flatMap((cadeira) =>
      cadeira.unidades
        .filter((unidade) => unidade.estado === 'publicado')
        .map((unidade) => `${periodo.id}/${cadeira.id}/${unidade.id}`)
    )
  );
}

/**
 * Forma do ConteudoUnidade carregado: quais propriedades existem e
 * quantos itens tem cada uma. Não lê o texto (o texto muda com a aula; a
 * estrutura não pode mudar sem ser notada).
 */
export interface ResumoConteudo {
  readonly propriedades: readonly string[];
  readonly resumoBlocos: number;
  readonly quizPerguntas: number | null;
  readonly quizCategorias: readonly string[] | null;
  /**
   * Contagens e faixas exatas do quiz. Ficam aqui (congeladas) e não nos
   * testes de conteúdo, para que acrescentar pergunta só peça
   * `npm run atualizar-referencias`, sem editar teste. O resumo do comando
   * mostra a mudança.
   */
  readonly quizTipos: {
    readonly multiplaEscolha: number;
    readonly verdadeiroOuFalso: number;
  } | null;
  readonly quizIdsDoProfessor: readonly number[] | null;
  readonly quizIdsComMarca: readonly number[] | null;
  readonly quizIdsPorCategoria: Readonly<Record<string, readonly number[]>> | null;
  readonly peticaoSecoes: number | null;
  readonly mapaFichamento: { readonly eras: number; readonly pensadores: number } | null;
  readonly mnemonicos: number | null;
}

/** Ids em ordem crescente: a referência compara a lista, não a ordem do arquivo. */
function idsOrdenados(perguntas: readonly { readonly id: number }[]): number[] {
  return perguntas.map((p) => p.id).sort((a, b) => a - b);
}

/** Categoria → ids, com as chaves em ordem alfabética (a referência não depende da ordem de montagem). */
function idsPorCategoria(
  quiz: readonly { readonly id: number; readonly categoria: string }[]
): Record<string, number[]> {
  const grupos: Record<string, number[]> = {};
  for (const pergunta of quiz) (grupos[pergunta.categoria] ??= []).push(pergunta.id);
  return Object.fromEntries(
    Object.keys(grupos)
      .sort()
      .map((categoria) => [categoria, idsOrdenados(quiz.filter((p) => p.categoria === categoria))])
  );
}

export function resumirConteudo(conteudo: ConteudoUnidade): ResumoConteudo {
  const quiz = conteudo.quiz ?? null;
  return {
    propriedades: Object.keys(conteudo).sort(),
    resumoBlocos: conteudo.resumo.length,
    quizPerguntas: quiz ? quiz.length : null,
    quizCategorias: quiz ? [...new Set(quiz.map((p) => p.categoria))].sort() : null,
    quizTipos: quiz
      ? {
          multiplaEscolha: quiz.filter((p) => p.tipo !== 'verdadeiro-ou-falso').length,
          verdadeiroOuFalso: quiz.filter((p) => p.tipo === 'verdadeiro-ou-falso').length
        }
      : null,
    quizIdsDoProfessor: quiz ? idsOrdenados(quiz.filter((p) => p.origem === 'professor')) : null,
    quizIdsComMarca: quiz ? idsOrdenados(quiz.filter((p) => p.gabaritoDoCaderno === true)) : null,
    quizIdsPorCategoria: quiz ? idsPorCategoria(quiz) : null,
    peticaoSecoes: conteudo.peticao ? conteudo.peticao.secoes.length : null,
    mapaFichamento: conteudo.mapaFichamento
      ? {
          eras: conteudo.mapaFichamento.eras.length,
          pensadores: conteudo.mapaFichamento.pensadores.length
        }
      : null,
    mnemonicos: conteudo.mnemonicos ? conteudo.mnemonicos.length : null
  };
}

/**
 * Espelho da montagem de scripts/gerar-indice-busca.ts (laço de unidades
 * publicadas + cadeiras restritas), SEM escrever public/assets. O script não
 * exporta esta função; quando ele mudar, este espelho muda junto e a
 * referência tem de ser revista (ver a nota no spec indiceBusca).
 *
 * Diferença deliberada: onde o script faz `continue` com exitCode 1 para
 * unidade sem carregador, aqui lança erro (teste tem de ficar vermelho).
 */
export async function montarDocumentosComoBuild(
  curriculo: Curriculo,
  carregadores: RegistroDeCarregadores
): Promise<DocumentoBusca[]> {
  const documentos: DocumentoBusca[] = [];
  for (const periodo of curriculo) {
    for (const cadeira of periodo.cadeiras) {
      for (const unidade of cadeira.unidades) {
        if (unidade.estado !== 'publicado') continue;
        const caminho = `${periodo.id}/${cadeira.id}/${unidade.id}`;
        const carregar = carregadores[caminho];
        if (!carregar) throw new Error(`unidade publicada sem carregador: ${caminho}`);
        const conteudo = await carregar();
        documentos.push(
          ...montarDocumentosUnidade({
            periodo: periodo.id,
            cadeira: cadeira.id,
            unidade: unidade.id,
            conteudo
          })
        );
      }
    }
  }
  documentos.push(...montarDocumentosCadeirasRestritas(curriculo));
  return documentos;
}

/** Ordena por id e depois por url, para a comparação não depender da ordem de montagem. */
export function ordenarIdsUrls(
  documentos: readonly DocumentoBusca[]
): { id: string; url: string }[] {
  return documentos
    .map(({ id, url }) => ({ id, url }))
    .sort((a, b) =>
      a.id === b.id ? (a.url < b.url ? -1 : a.url > b.url ? 1 : 0) : a.id < b.id ? -1 : 1
    );
}
