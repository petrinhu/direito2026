import { describe, expect, it, vi } from 'vitest';
import { criarTransporteFetch } from '@/app/versaoNova/transporteFetch';

/**
 * AV-F11: transporte real sobre fetch. Repassa URL e opções (cache no-store, mesma origem)
 * e devolve a resposta no formato que a consulta espera: status, content-type e corpo.
 */
describe('criarTransporteFetch', () => {
  it('chama fetch com a URL e as opções de consulta', async () => {
    const fetchFalso = vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    const transporte = criarTransporteFetch(fetchFalso as unknown as typeof fetch);
    await transporte('/versao.json', { cache: 'no-store', credentials: 'same-origin' });
    expect(fetchFalso).toHaveBeenCalledWith('/versao.json', { cache: 'no-store', credentials: 'same-origin' });
  });

  it('devolve status, content-type e corpo da resposta', async () => {
    const fetchFalso = async () =>
      new Response('{"versao":"1.12.1.0"}', { status: 200, headers: { 'content-type': 'application/json' } });
    const transporte = criarTransporteFetch(fetchFalso as unknown as typeof fetch);
    const resposta = await transporte('/versao.json', { cache: 'no-store', credentials: 'same-origin' });
    expect(resposta.status).toBe(200);
    expect(resposta.contentType).toContain('application/json');
    expect(await resposta.corpo()).toBe('{"versao":"1.12.1.0"}');
  });

  it('401 chega como status, sem lançar erro', async () => {
    const fetchFalso = async () => new Response('', { status: 401 });
    const transporte = criarTransporteFetch(fetchFalso as unknown as typeof fetch);
    const resposta = await transporte('/versao.json', { cache: 'no-store', credentials: 'same-origin' });
    expect(resposta.status).toBe(401);
  });
});
