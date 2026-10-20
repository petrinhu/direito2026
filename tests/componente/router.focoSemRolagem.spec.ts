// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarRouter } from '@/app/router';

/**
 * Defeito medido (QA, 20/10/2026): ao abrir o site sem interagir, a página
 * nascia rolada (scrollY 1146 a 1280x900, 457 a 390x844) e a faixa do templo
 * sumia. Causa: o afterEach do router dava `focus()` cru no <main> (foco de
 * acessibilidade na troca de rota), e o navegador rola até um elemento que
 * está abaixo da dobra. O foco de leitor de tela continua valendo; a rolagem
 * fica por conta do scrollBehavior, que já manda ao topo ou à âncora.
 */
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

function montarAreaDeConteudo(): HTMLElement {
  document.body.innerHTML = '<main id="conteudo-principal" tabindex="-1"></main>';
  return document.getElementById('conteudo-principal') as HTMLElement;
}

describe('router, foco na troca de rota sem rolar a página', () => {
  it('o foco vai ao conteúdo com preventScroll: true (sem rolagem)', async () => {
    const main = montarAreaDeConteudo();
    const focar = vi.spyOn(main, 'focus');
    const router = criarRouter();

    await router.push('/busca');

    await vi.waitFor(() => expect(focar).toHaveBeenCalled());
    expect(focar).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('rolagem ao topo na troca de rota continua sendo do scrollBehavior', () => {
    const router = criarRouter();
    const scrollBehavior = router.options.scrollBehavior!;
    const destino = { path: '/busca', hash: '' } as Parameters<typeof scrollBehavior>[0];

    expect(scrollBehavior(destino, {} as never, null)).toEqual({ top: 0 });
  });

  it('âncora (hash) continua rolando até o alvo pelo scrollBehavior', () => {
    const router = criarRouter();
    const scrollBehavior = router.options.scrollBehavior!;
    const destino = { path: '/p/x', hash: '#bloco-1' } as Parameters<typeof scrollBehavior>[0];

    expect(scrollBehavior(destino, {} as never, null)).toEqual({
      el: '#bloco-1',
      behavior: 'smooth'
    });
  });
});
