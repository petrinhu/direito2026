import { describe, expect, it, vi } from 'vitest';
import { limparCachesESW } from '@/app/sessao/limparNavegador';

describe('limparCachesESW (Safari anterior a 17 não recebe Clear-Site-Data)', () => {
  it('apaga todo cache nomeado e desregistra todo service worker', async () => {
    const apagados: string[] = [];
    const desregistrados = vi.fn(async () => true);
    await limparCachesESW({
      caches: {
        keys: async () => ['navegacao', 'conteudo-unidades'],
        delete: async (nome: string) => {
          apagados.push(nome);
          return true;
        }
      },
      serviceWorker: {
        getRegistrations: async () => [
          { unregister: desregistrados },
          { unregister: desregistrados }
        ]
      }
    });

    expect(apagados).toEqual(['navegacao', 'conteudo-unidades']);
    expect(desregistrados).toHaveBeenCalledTimes(2);
  });

  it('navegador sem Cache API nem service worker (contexto inseguro) não quebra', async () => {
    await expect(limparCachesESW({})).resolves.toBeUndefined();
  });
});
