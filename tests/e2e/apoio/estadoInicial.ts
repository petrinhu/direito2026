import type { Page } from '@playwright/test';
import type { Curriculo } from '../../../src/core/curriculo/tipos';
import { rotasDeUnidades } from './rotasDoCurriculo';

const CHAVE_TEMA = 'caderno-direito:v1:tema';
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';
const CHAVE_AVISO_ARMAZENAMENTO_VISTO = 'caderno-direito:v1:aviso-armazenamento-visto';

export interface EstadoInicial {
  tema: 'claro' | 'escuro';
  modoAdaptado: boolean;
}

/**
 * Grava, antes de a página abrir, as três chaves de localStorage que os
 * testes de layout precisam (tema, modo adaptado e aviso de armazenamento
 * já visto, para a faixa fixa do rodapé não cobrir nada). Mesmo padrão de
 * quiz-sem-rolagem-lateral.spec.ts: nenhum teste depende de clicar botão
 * para chegar ao estado.
 */
export async function prepararEstadoInicial(page: Page, estado: EstadoInicial): Promise<void> {
  await page.addInitScript(
    ({ chaveTema, chaveModo, chaveAviso, tema, modoAdaptado }) => {
      window.localStorage.setItem(chaveTema, tema);
      if (modoAdaptado) window.localStorage.setItem(chaveModo, 'true');
      window.localStorage.setItem(chaveAviso, '1');
    },
    {
      chaveTema: CHAVE_TEMA,
      chaveModo: CHAVE_MODO_ADAPTADO,
      chaveAviso: CHAVE_AVISO_ARMAZENAMENTO_VISTO,
      tema: estado.tema,
      modoAdaptado: estado.modoAdaptado
    }
  );
}

/**
 * Espera o layout assentar depois de trocar o viewport: dois quadros e o fim
 * de toda animação ou transição FINITA em andamento (a gaveta lateral anima o
 * `transform` ao cruzar 880px, e nesse intervalo o botão dela cobre o
 * cabeçalho). Sem espera fixa em milissegundos. Animação infinita (fundo da
 * home) fica de fora, senão nunca terminaria.
 *
 * Com `doTopo`, depois disso rola ao topo, espera de novo (o reflow da
 * troca de largura reposiciona a rolagem por âncora, e rolar ANTES de o
 * layout assentar era desfeito) e só devolve quando `scrollY` continua 0 em
 * dois quadros seguidos; se não estabilizar, falha com mensagem clara em vez
 * de deixar a medida partir de uma página rolada.
 */
export async function esperarLayoutAssentar(
  page: Page,
  opcoes: { doTopo: boolean } = { doTopo: false }
): Promise<void> {
  await page.evaluate(async ({ doTopo }) => {
    const quadro = (): Promise<void> =>
      new Promise((resolver) => requestAnimationFrame(() => resolver()));
    const assentar = async (): Promise<void> => {
      await quadro();
      await quadro();
      for (let volta = 0; volta < 10; volta++) {
        const finitas = document
          .getAnimations()
          .filter((animacao) => animacao.effect?.getComputedTiming().iterations !== Infinity);
        if (finitas.length === 0) return;
        await Promise.allSettled(finitas.map((animacao) => animacao.finished));
        await quadro();
        await quadro();
      }
    };

    await assentar();
    if (!doTopo) return;
    window.scrollTo(0, 0);
    await assentar();
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const antes = window.scrollY;
      await quadro();
      await quadro();
      if (antes === 0 && window.scrollY === 0) return;
      window.scrollTo(0, 0);
      await assentar();
    }
    throw new Error(`scrollY não estabilizou em 0 (ficou em ${window.scrollY})`);
  }, opcoes);
}

/** Páginas que exercitam o cabeçalho: a home e o resumo de cada unidade do currículo. */
export function caminhosParaCabecalho(curriculo: Curriculo): string[] {
  const resumos = rotasDeUnidades(curriculo)
    .filter((rota) => !rota.caminho.endsWith('/quiz') && !rota.caminho.endsWith('/peticao'))
    .map((rota) => rota.caminho);
  return ['/', ...resumos];
}
