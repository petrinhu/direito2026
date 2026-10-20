import {
  curriculoDoDisco,
  carregadoresDoDisco,
  carregadoresDispositivosDoDisco
} from '../conteudoDoDisco';
import type { Curriculo } from '../../../src/core/curriculo/tipos';
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
}

export async function capturarReferencias(): Promise<Referencias> {
  const curriculo: Curriculo = await curriculoDoDisco();
  const carregadores = carregadoresDoDisco();
  const dispositivos = carregadoresDispositivosDoDisco();

  const unidades: Record<string, ResumoConteudo> = {};
  for (const chave of chavesDasUnidadesPublicadas(curriculo)) {
    const carregar = carregadores[chave];
    if (!carregar) throw new Error(`unidade publicada sem carregador: ${chave}`);
    unidades[chave] = resumirConteudo(await carregar());
  }

  const documentos = await montarDocumentosComoBuild(curriculo, carregadores);
  return {
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
