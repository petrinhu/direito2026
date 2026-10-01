import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Devolve todos os elementos que casam com o seletor, depois de esperar o
 * primeiro existir e de provar que há pelo menos um (L-36). `.all()` logo
 * após `goto` devolve lista vazia enquanto o chunk da rota carrega, e um
 * laço sobre lista vazia passa sem medir nada.
 */
export async function todosOsPresentes(page: Page, seletor: string): Promise<Locator[]> {
  await page.locator(seletor).first().waitFor({ state: 'visible' });
  const lista = await page.locator(seletor).all();
  expect(lista.length, `nenhum elemento para ${seletor}`).toBeGreaterThan(0);
  return lista;
}

/** Abre um botão de disclosure só se ele estiver fechado (nunca fecha sem querer). */
export async function abrirSeFechado(botao: Locator): Promise<void> {
  await botao.waitFor({ state: 'visible' });
  if ((await botao.getAttribute('aria-expanded')) !== 'true') await botao.click();
}
