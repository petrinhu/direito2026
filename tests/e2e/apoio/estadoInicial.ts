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

/** Espera o layout assentar depois de trocar o viewport (dois quadros). */
export async function esperarLayoutAssentar(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolver) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolver()))
      )
  );
}

/** Páginas que exercitam o cabeçalho: a home e o resumo de cada unidade do currículo. */
export function caminhosParaCabecalho(curriculo: Curriculo): string[] {
  const resumos = rotasDeUnidades(curriculo)
    .filter((rota) => !rota.caminho.endsWith('/quiz') && !rota.caminho.endsWith('/peticao'))
    .map((rota) => rota.caminho);
  return ['/', ...resumos];
}
