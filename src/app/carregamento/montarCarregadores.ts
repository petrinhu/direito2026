import type { UnidadeDescoberta } from '@/core/curriculo/agruparPorUnidade';
import { ErroDeConteudo } from '@/core/curriculo/erroDeConteudo';
import type { IndiceDispositivos } from '@/core/dispositivos/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';
import type { RegistroDeCarregadores } from './decorarCurriculo';

/**
 * Importa um arquivo de conteúdo pelo caminho que a descoberta devolveu
 * (relativo a src/conteudo, ex.: 'p1/intr-direito/u1/resumo.ts'). No site é o
 * glob do Vite; nos scripts Node é import() do arquivo no disco.
 */
export type Importador = (caminho: string) => Promise<unknown>;

/** Partes do ConteudoUnidade que vêm de arquivo, com o nome do export de cada uma. */
const PARTES_DO_CONTEUDO = [
  'meta',
  'resumo',
  'peticao',
  'quiz',
  'mapaFichamento',
  'mnemonicos',
  'textoIntegral'
] as const;

/**
 * Um carregador por unidade descoberta. Preguiçoso: nenhum arquivo é importado
 * até o carregador ser chamado (carregamento sob demanda, um pedaço por arquivo).
 * Só entram no conteúdo as partes que existem; chave ausente nunca vem como undefined.
 */
export function montarCarregadores(
  unidades: readonly UnidadeDescoberta[],
  importar: Importador
): RegistroDeCarregadores {
  return Object.fromEntries(
    unidades.map((unidade) => [unidade.chave, () => carregarUnidade(unidade, importar)])
  );
}

/** Um carregador de dispositivos por unidade que tem dispositivos.ts gerado. */
export function montarCarregadoresDispositivos(
  unidades: readonly UnidadeDescoberta[],
  importar: Importador
): Record<string, () => Promise<IndiceDispositivos>> {
  const registro: Record<string, () => Promise<IndiceDispositivos>> = {};
  for (const unidade of unidades) {
    const caminho = unidade.arquivos.dispositivos;
    if (caminho === undefined) continue;
    registro[unidade.chave] = () =>
      lerExport<IndiceDispositivos>(caminho, 'dispositivos', importar);
  }
  return registro;
}

async function carregarUnidade(
  unidade: UnidadeDescoberta,
  importar: Importador
): Promise<ConteudoUnidade> {
  const conteudo: Record<string, unknown> = {};
  for (const parte of PARTES_DO_CONTEUDO) {
    const caminho = unidade.arquivos[parte];
    if (caminho === undefined) continue;
    conteudo[parte] = await lerExport(caminho, parte, importar);
  }
  if (conteudo.resumo === undefined) {
    throw new ErroDeConteudo(`sem resumo.ts em ${unidade.chave}`);
  }
  // A forma é garantida pelo cheque de resumo acima e pelo de meta na descoberta.
  return conteudo as unknown as ConteudoUnidade;
}

async function lerExport<T>(caminho: string, nome: string, importar: Importador): Promise<T> {
  const modulo = (await importar(caminho)) as Record<string, unknown>;
  const valor = modulo[nome];
  if (valor === undefined) {
    throw new ErroDeConteudo(`${caminho} não exporta '${nome}'`);
  }
  return valor as T;
}
