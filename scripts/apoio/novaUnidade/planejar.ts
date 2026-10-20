import { join, relative } from 'node:path';
import { ErroDeArgumento, type ArgumentosNovaUnidade } from './argumentos';
import { existe, lerCadeira, proximaOrdemLivre, type ArquivoAGravar } from './disco';
import { modeloDaCadeira, modeloDaUnidade } from './modelos';

export interface PlanoNovaUnidade {
  /** Tudo que será criado, com caminho absoluto. Nada é escrito antes da checagem. */
  readonly arquivos: readonly ArquivoAGravar[];
  readonly nomeDaCadeira: string;
  readonly cadeiraNova: boolean;
  readonly ordemDaCadeira?: number;
  readonly pastaDaUnidade: string;
  readonly caminhoDaCadeira: string;
}

/**
 * Decide o que será criado e recusa tudo que colidiria: unidade já existente
 * (qualquer coisa dentro dela), raiz de conteúdo errada, cadeira sem
 * descrição sem --cadeira, e --cadeira apontando para cadeira que já existe.
 * Não escreve nada: quem chama grava depois.
 */
export async function planejarNovaUnidade(
  argumentos: ArgumentosNovaUnidade,
  raizDoConteudo: string
): Promise<PlanoNovaUnidade> {
  if (!existe(raizDoConteudo)) {
    throw new ErroDeArgumento(`pasta de conteúdo não encontrada: ${raizDoConteudo}`);
  }
  const pastaDoPeriodo = join(raizDoConteudo, argumentos.periodo);
  const pastaDaCadeira = join(pastaDoPeriodo, argumentos.cadeira);
  const pastaDaUnidade = join(pastaDaCadeira, argumentos.unidade);
  const caminhoDaCadeira = join(pastaDaCadeira, 'cadeira.ts');
  const nomeDaPasta = relative(raizDoConteudo, pastaDaUnidade);

  if (existe(pastaDaUnidade)) {
    throw new ErroDeArgumento(
      `a unidade já existe em ${nomeDaPasta}: o gerador não sobrescreve nem completa unidade existente.`
    );
  }

  const cadeiraExiste = existe(caminhoDaCadeira);
  if (cadeiraExiste && argumentos.nomeCadeira !== undefined) {
    throw new ErroDeArgumento(
      `a cadeira ${argumentos.cadeira} já tem descrição (cadeira.ts): --cadeira só cria cadeira nova.`
    );
  }
  if (!cadeiraExiste && argumentos.nomeCadeira === undefined) {
    throw new ErroDeArgumento(
      `a cadeira ${argumentos.cadeira} não tem cadeira.ts: passe --cadeira "Nome da cadeira" para criá-la.`
    );
  }

  let nomeDaCadeira: string;
  let ordemDaCadeira: number | undefined;
  const arquivos: ArquivoAGravar[] = [];
  if (cadeiraExiste) {
    const lida = await lerCadeira(caminhoDaCadeira);
    if (lida.nome === undefined) {
      throw new ErroDeArgumento(`cadeira.ts de ${argumentos.cadeira} não tem campo nome.`);
    }
    nomeDaCadeira = lida.nome;
  } else {
    nomeDaCadeira = argumentos.nomeCadeira ?? argumentos.cadeira;
    ordemDaCadeira = await proximaOrdemLivre(pastaDoPeriodo);
    arquivos.push({
      caminho: caminhoDaCadeira,
      conteudo: modeloDaCadeira({
        periodo: argumentos.periodo,
        nome: nomeDaCadeira,
        ordem: ordemDaCadeira
      })
    });
  }

  const modelos = modeloDaUnidade({
    periodo: argumentos.periodo,
    nomeDaCadeira,
    unidade: argumentos.unidade,
    titulo: argumentos.titulo,
    peticao: argumentos.peticao
  });
  for (const [relativoNaUnidade, conteudo] of Object.entries(modelos)) {
    arquivos.push({ caminho: join(pastaDaUnidade, relativoNaUnidade), conteudo });
  }

  return {
    arquivos,
    nomeDaCadeira,
    cadeiraNova: !cadeiraExiste,
    ...(ordemDaCadeira !== undefined ? { ordemDaCadeira } : {}),
    pastaDaUnidade,
    caminhoDaCadeira
  };
}
