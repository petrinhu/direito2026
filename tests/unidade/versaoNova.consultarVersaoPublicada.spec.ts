import { describe, expect, it } from 'vitest';
import {
  consultarVersaoPublicada,
  type PedidoVersao,
  type RespostaVersao,
  type Transporte
} from '@/app/versaoNova/consultarVersaoPublicada';

/**
 * AV-F7: consulta de /versao.json com transporte injetado (sem fetch real, sem janela).
 * Regra (plano 3.2): só 200 com JSON válido dá versão; 401 e 403 dão "sessão terminou";
 * qualquer outra coisa (HTML, 404, JSON quebrado, rede) dá "sem informação".
 */
const CORPO_VALIDO = JSON.stringify({
  versao: '1.12.1.0',
  historico: [{ versao: '1.12.1.0', novidades: ['Novo: rádio para estudar'] }]
});

function transporteQue(resposta: RespostaVersao | 'rede'): { transporte: Transporte; pedidos: PedidoVersao[] } {
  const pedidos: PedidoVersao[] = [];
  const transporte: Transporte = async (url, opcoes) => {
    pedidos.push({ url, opcoes });
    if (resposta === 'rede') throw new TypeError('Failed to fetch');
    return resposta;
  };
  return { transporte, pedidos };
}

const json = (status: number, corpo: string): RespostaVersao => ({
  status,
  contentType: 'application/json',
  corpo: async () => corpo
});

describe('consultarVersaoPublicada', () => {
  it('pede /versao.json sem cache e com a mesma origem', async () => {
    const { transporte, pedidos } = transporteQue(json(200, CORPO_VALIDO));
    await consultarVersaoPublicada(transporte);
    expect(pedidos).toEqual([
      { url: '/versao.json', opcoes: { cache: 'no-store', credentials: 'same-origin' } }
    ]);
  });

  it('200 com JSON válido dá a versão publicada e o histórico', async () => {
    const { transporte } = transporteQue(json(200, CORPO_VALIDO));
    expect(await consultarVersaoPublicada(transporte)).toEqual({
      tipo: 'publicada',
      versao: '1.12.1.0',
      historico: [{ versao: '1.12.1.0', novidades: ['Novo: rádio para estudar'] }]
    });
  });

  it('401 e 403 dão sessão terminada, não sem informação', async () => {
    for (const status of [401, 403]) {
      const { transporte } = transporteQue({ status, contentType: null, corpo: async () => '' });
      expect(await consultarVersaoPublicada(transporte)).toEqual({ tipo: 'sessao-terminada' });
    }
  });

  it('404, 500 e HTML do fallback dão sem informação', async () => {
    const dois = [
      { status: 404, contentType: null, corpo: async () => '' },
      { status: 200, contentType: 'text/html; charset=utf-8', corpo: async () => '<!doctype html>' }
    ];
    for (const resposta of dois) {
      const { transporte } = transporteQue(resposta);
      expect(await consultarVersaoPublicada(transporte)).toEqual({ tipo: 'sem-informacao' });
    }
  });

  it('JSON quebrado, versão fora do formato A.B.C.D ou sem histórico dá sem informação', async () => {
    const ruins = [
      '{ "versao": ',
      JSON.stringify({ versao: 'um', historico: [] }),
      JSON.stringify({ versao: '1.12.1.0' })
    ];
    for (const corpo of ruins) {
      const { transporte } = transporteQue(json(200, corpo));
      expect(await consultarVersaoPublicada(transporte)).toEqual({ tipo: 'sem-informacao' });
    }
  });

  it('falha de rede dá sem informação, sem lançar erro', async () => {
    const { transporte } = transporteQue('rede');
    await expect(consultarVersaoPublicada(transporte)).resolves.toEqual({ tipo: 'sem-informacao' });
  });
});
