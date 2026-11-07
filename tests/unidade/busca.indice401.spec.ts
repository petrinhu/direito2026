import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarStoreBusca } from '@/app/stores/busca';

describe('índice da busca sob o portão', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('401 ao baixar o índice chama o aviso de sessão vencida e não monta motor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 401 }))
    );
    const aoNaoAutorizado = vi.fn();
    const store = criarStoreBusca(aoNaoAutorizado);

    await expect(store.garantirMotorCarregado()).rejects.toThrow(/401/);
    expect(aoNaoAutorizado).toHaveBeenCalledOnce();
  });

  it('resposta não ok que não é 401 não chama o aviso de sessão', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('x', { status: 500 }))
    );
    const aoNaoAutorizado = vi.fn();
    const store = criarStoreBusca(aoNaoAutorizado);

    await expect(store.garantirMotorCarregado()).rejects.toThrow(/500/);
    expect(aoNaoAutorizado).not.toHaveBeenCalled();
  });
});
