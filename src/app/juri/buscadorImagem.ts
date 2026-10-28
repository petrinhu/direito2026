/**
 * Busca binária de uma imagem cifrada da Júri (GET imagem.php?id=). É o único lugar
 * do navegador que recebe bytes de imagem: o transporte JSON não serve para isto. Só
 * a mesma origem, sem cache (nada vai para o cache do navegador) e sem credenciais
 * fora do site. Não guarda nada: quem chama decide o que fazer com os bytes.
 */
import { ehIdImagem } from '@/core/juri/idImagem';
import { ErroDeApi, type Buscador } from '../restrito/transporte';

const BASE_PADRAO = '/api/juri/';
const TEMPO_LIMITE_PADRAO_MS = 20_000;

export interface OpcoesBuscadorImagem {
  readonly buscar?: Buscador;
  readonly base?: string;
  readonly tempoLimiteMs?: number;
}

/** Status do servidor para o código que a sessão entende. 401 é o que derruba a CEK. */
function codigoDoStatus(status: number): string {
  if (status === 401) return 'sem-sessao';
  if (status === 403) return 'troca-pendente';
  if (status === 404) return 'nao-encontrada';
  return 'servidor';
}

export function criarBuscadorImagemJuri(opcoes: OpcoesBuscadorImagem = {}) {
  const buscar: Buscador = opcoes.buscar ?? ((url, init) => fetch(url, init));
  const base = opcoes.base ?? BASE_PADRAO;
  const tempoLimite = opcoes.tempoLimiteMs ?? TEMPO_LIMITE_PADRAO_MS;

  return async function buscarImagem(id: string): Promise<Uint8Array<ArrayBuffer>> {
    // Id fora do formato nem sai da máquina: nenhum caminho de arquivo vem do pedido.
    if (!ehIdImagem(id)) throw new ErroDeApi(0, 'id-invalido');

    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), tempoLimite);
    let resposta: Response;
    try {
      resposta = await buscar(`${base}imagem.php?id=${id}`, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/octet-stream' },
        signal: controle.signal
      });
    } catch {
      throw new ErroDeApi(0, 'rede');
    } finally {
      clearTimeout(relogio);
    }

    if (!resposta.ok) throw new ErroDeApi(resposta.status, codigoDoStatus(resposta.status));

    let bytes: Uint8Array<ArrayBuffer>;
    try {
      bytes = new Uint8Array(await resposta.arrayBuffer());
    } catch {
      throw new ErroDeApi(resposta.status, 'resposta-invalida');
    }
    // Arquivo vazio nunca é imagem: a decifração recusaria de qualquer jeito, e o erro fica no lugar certo.
    if (bytes.byteLength === 0) throw new ErroDeApi(resposta.status, 'resposta-invalida');
    return bytes;
  };
}
