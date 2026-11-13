import {
  curriculoDoDisco,
  carregadoresDoDisco,
  carregadoresDispositivosDoDisco,
  RAIZ_DO_CONTEUDO
} from '../conteudoDoDisco';
import type { Curriculo } from '../../../src/core/curriculo/tipos';
import {
  projetarAlternativas,
  type AlternativasPorUnidade,
  type ImpressoesDaPergunta
} from '../../../tests/caracterizacao/alternativas';
import {
  chavesDasUnidadesPublicadas,
  montarDocumentosComoBuild,
  ordenarIdsUrls,
  projetarCurriculo,
  resumirConteudo,
  type ProjecaoPeriodo,
  type ResumoConteudo
} from '../../../tests/caracterizacao/projecoes';
import {
  rotasDeAbaAusente,
  rotasDeUnidades,
  rotasDoCurriculo,
  type RotaDoCurriculo
} from '../../../tests/e2e/apoio/rotasDoCurriculo';

/**
 * Estado atual do conteúdo, na forma exata que cada *.esperado.json guarda.
 * Lê do disco (não do glob do Vite), pelas mesmas projeções que os testes de
 * caracterização usam, então o que este módulo grava é o que o teste compara.
 */
export interface Referencias {
  readonly carregadores: {
    readonly chavesCarregadores: string[];
    readonly chavesCarregadoresDispositivos: string[];
    readonly unidades: Record<string, ResumoConteudo>;
  };
  readonly curriculo: ProjecaoPeriodo[];
  readonly rotas: {
    readonly rotasDoCurriculo: RotaDoCurriculo[];
    readonly rotasDeUnidades: RotaDoCurriculo[];
    readonly rotasDeAbaAusente: string[];
  };
  readonly indiceBusca: {
    readonly documentosEncontrados: number;
    readonly documentos: { id: string; url: string }[];
  };
  /** AV3-K4: impressão de cada alternativa de cada pergunta com quiz (sem texto). */
  readonly alternativas: AlternativasPorUnidade;
}

/** `raiz` troca o conteúdo lido (sabotagem em cópia fora da árvore, AV3-K4); o padrão é src/conteudo. */
export async function capturarReferencias(raiz: string = RAIZ_DO_CONTEUDO): Promise<Referencias> {
  const curriculo: Curriculo = await curriculoDoDisco(raiz);
  const carregadores = carregadoresDoDisco(raiz);
  const dispositivos = carregadoresDispositivosDoDisco(raiz);

  const unidades: Record<string, ResumoConteudo> = {};
  const alternativas: Record<string, Readonly<Record<string, ImpressoesDaPergunta>>> = {};
  for (const chave of chavesDasUnidadesPublicadas(curriculo)) {
    const carregar = carregadores[chave];
    if (!carregar) throw new Error(`unidade publicada sem carregador: ${chave}`);
    const conteudo = await carregar();
    unidades[chave] = resumirConteudo(conteudo);
    if (conteudo.quiz !== undefined) alternativas[chave] = projetarAlternativas(conteudo.quiz);
  }

  const documentos = await montarDocumentosComoBuild(curriculo, carregadores);
  return {
    alternativas,
    carregadores: {
      chavesCarregadores: Object.keys(carregadores).sort(),
      chavesCarregadoresDispositivos: Object.keys(dispositivos).sort(),
      unidades
    },
    curriculo: projetarCurriculo(curriculo),
    rotas: {
      rotasDoCurriculo: rotasDoCurriculo(curriculo),
      rotasDeUnidades: rotasDeUnidades(curriculo),
      rotasDeAbaAusente: rotasDeAbaAusente(curriculo)
    },
    indiceBusca: {
      documentosEncontrados: documentos.length,
      documentos: ordenarIdsUrls(documentos)
    }
  };
}
