import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const TEXTO = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf-8');

/** Roda o matador num service worker falso e devolve as promessas que ele registra. */
function executarMatador() {
  const ouvintes: Record<string, (evento: unknown) => void> = {};
  const promessas: Promise<unknown>[] = [];
  const registro = { unregister: vi.fn(async () => true) };
  const self = {
    registration: registro,
    skipWaiting: vi.fn(async () => undefined),
    addEventListener: (tipo: string, fn: (evento: unknown) => void) => {
      ouvintes[tipo] = fn;
    }
  };
  const caches = {
    keys: vi.fn(async () => ['navegacao', 'conteudo-unidades']),
    delete: vi.fn(async () => true)
  };
  new Function('self', 'caches', TEXTO)(self, caches);
  return {
    ouvintes,
    registro,
    self,
    caches,
    disparar: async (tipo: string) => {
      ouvintes[tipo]?.({ waitUntil: (p: Promise<unknown>) => promessas.push(p) });
      await Promise.all(promessas);
    }
  };
}

describe('public/sw.js, o matador do service worker antigo', () => {
  it('é o texto fixo do plano: sem importScripts, sem workbox, sem laço de navegação', () => {
    expect(TEXTO).not.toMatch(/importScripts/);
    expect(TEXTO).not.toMatch(/workbox/i);
    expect(TEXTO).not.toMatch(/navigate\(/);
    expect(TEXTO).not.toMatch(/precache/i);
  });

  it('install assume já (skipWaiting)', async () => {
    const m = executarMatador();
    await m.disparar('install');
    expect(m.self.skipWaiting).toHaveBeenCalledOnce();
  });

  it('activate apaga todo cache e desregistra o próprio service worker', async () => {
    const m = executarMatador();
    await m.disparar('activate');
    expect(m.caches.delete).toHaveBeenCalledWith('navegacao');
    expect(m.caches.delete).toHaveBeenCalledWith('conteudo-unidades');
    expect(m.registro.unregister).toHaveBeenCalledOnce();
  });
});
