import type { Navegador } from './sessaoGlobal';
import { limparCachesESW } from './limparNavegador';

/** Navegador real: a única peça que toca window. Fica fora dos testes unitários. */
export function criarNavegadorReal(janela: typeof globalThis = globalThis): Navegador {
  return {
    caminhoAtual: () => janela.location.pathname + janela.location.search,
    substituir: (url) => janela.location.replace(url),
    recarregar: () => janela.location.reload(),
    limparCachesESW: () =>
      limparCachesESW({
        caches: janela.caches,
        serviceWorker:
          'serviceWorker' in janela.navigator ? janela.navigator.serviceWorker : undefined
      })
  };
}
