import type { RespostaVersao, Transporte } from './consultarVersaoPublicada';

/**
 * Transporte real sobre fetch (AV-F11). Mantém os pedidos da consulta (cache no-store, mesma
 * origem) e devolve só o que a consulta usa: status, content-type e corpo.
 */
export function criarTransporteFetch(buscar: typeof fetch = fetch): Transporte {
  return async (url, opcoes) => {
    const resposta = await buscar(url, opcoes);
    const devolvida: RespostaVersao = {
      status: resposta.status,
      contentType: resposta.headers.get('content-type'),
      corpo: () => resposta.text()
    };
    return devolvida;
  };
}
