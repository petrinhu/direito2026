import type { EntradaHistorico } from '@/core/versaoNova/novidadesDesde';

/** Caminho do arquivo de versão no pacote (plano 3.1, decisão D1). */
export const CAMINHO_VERSAO_PUBLICADA = '/versao.json';

/** Formato A.B.C.D, o mesmo que compararVersao aceita. */
const FORMATO_VERSAO = /^\d+\.\d+\.\d+\.\d+$/;

export type ResultadoConsulta =
  | { tipo: 'publicada'; versao: string; historico: EntradaHistorico[] }
  | { tipo: 'sessao-terminada' }
  | { tipo: 'sem-informacao' };

export interface PedidoVersao {
  url: string;
  opcoes: { cache: 'no-store'; credentials: 'same-origin' };
}

export interface RespostaVersao {
  status: number;
  contentType: string | null;
  corpo(): Promise<string>;
}

/** Transporte injetado: o real é fetch; o teste passa uma função falsa. */
export type Transporte = (url: string, opcoes: PedidoVersao['opcoes']) => Promise<RespostaVersao>;

/**
 * Consulta a versão publicada. Transporte próprio, fora do clienteApi, para que um 401 não
 * leve à tela de entrada (plano 3.2). 401 e 403 viram "sessão terminou"; o resto que não
 * seja JSON válido vale "sem informação", que esconde o banner.
 */
export async function consultarVersaoPublicada(transporte: Transporte): Promise<ResultadoConsulta> {
  let resposta: RespostaVersao;
  try {
    resposta = await transporte(CAMINHO_VERSAO_PUBLICADA, {
      cache: 'no-store',
      credentials: 'same-origin'
    });
  } catch {
    return { tipo: 'sem-informacao' };
  }
  if (resposta.status === 401 || resposta.status === 403) return { tipo: 'sessao-terminada' };
  if (resposta.status !== 200) return { tipo: 'sem-informacao' };
  if (!resposta.contentType?.includes('application/json')) return { tipo: 'sem-informacao' };
  return lerCorpo(await resposta.corpo());
}

function lerCorpo(texto: string): ResultadoConsulta {
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    return { tipo: 'sem-informacao' };
  }
  if (!ehObjeto(dados)) return { tipo: 'sem-informacao' };
  const { versao, historico } = dados;
  if (typeof versao !== 'string' || !FORMATO_VERSAO.test(versao)) return { tipo: 'sem-informacao' };
  if (!Array.isArray(historico) || !historico.every(ehEntrada)) return { tipo: 'sem-informacao' };
  return { tipo: 'publicada', versao, historico };
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function ehEntrada(valor: unknown): valor is EntradaHistorico {
  return (
    ehObjeto(valor) &&
    typeof valor.versao === 'string' &&
    Array.isArray(valor.novidades) &&
    valor.novidades.every((item) => typeof item === 'string')
  );
}
