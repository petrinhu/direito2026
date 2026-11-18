import { expect, test, type Locator, type Page } from '@playwright/test';
import { join } from 'node:path';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp, esperarApp, esperarEntrada } from './apoio/acoes';
import { CONTA_ADMIN, CONTA_ANA_PAULA, PASTA_CAPTURAS } from './apoio/constantes';

/**
 * ADM-F5 (plano P4 v2, seção 2): a luz de sessão e a coluna "Último acesso" do painel do admin, de ponta a ponta.
 *
 * Dois contextos. O admin lê o painel; a pessoa (participante sintética) entra, sai, e o admin relê pelo botão
 * Atualizar. A luz fica verde com a sessão aberta, vermelha depois do Sair, e a data do último acesso sai no fuso
 * de Recife mesmo com o navegador da pessoa em outro fuso. Os casos são vermelhos antes da ADM-F4 (c7a3d1b).
 */

const ALVO = CONTA_ANA_PAULA.usuario;
const SESSAO_ABERTA = 'Sessão aberta';
const SEM_SESSAO = 'Sem sessão aberta';
const FORMATO_ULTIMO_ACESSO = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';
/** Folga, em ms, entre o relógio do teste e a hora gravada pelo servidor (o servidor trunca o segundo). */
const FOLGA_MS = 2_000;

/** Fuso de Recife sem horário de verão (GMT-3): a conversão é fixa, sem depender do fuso do navegador. */
const DESLOCAMENTO_RECIFE_MS = 3 * 60 * 60 * 1000;

test.beforeEach(() => resetarPrivado());

function linhaDaConta(page: Page): Locator {
  return page.getByRole('row').filter({ hasText: ALVO });
}

/**
 * Captura a tabela inteira (cabeçalho, luz e coluna Último acesso). Com a janela alta, a tabela cai no meio da tela:
 * a barra fixa do topo e o cartão de prazo do canto não cobrem a linha da conta (medido: cobriam a coluna).
 */
async function capturarTabela(page: Page, nome: string): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 2000 });
  await page.getByRole('region', { name: 'Tabela de usuários' }).screenshot({ path: join(PASTA_CAPTURAS, `${nome}.png`) });
}

/** Relê a lista pelo botão Atualizar (ADM-F4). Sem o botão, o caso falha em segundos, não no limite do teste. */
async function atualizarPainel(page: Page): Promise<void> {
  const botao = page.getByRole('button', { name: 'Atualizar' });
  await expect(botao, 'botão Atualizar do painel (ADM-F4)').toBeVisible();
  await botao.click();
}

/** Converte "dd/mm/aaaa HH:MM:SS" (hora de Recife) em instante UTC, em ms. */
function instanteDeRecife(texto: string): number {
  const [, dia, mes, ano, hora, minuto, segundo] = texto.match(
    /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/
  ) as RegExpMatchArray;
  return (
    Date.UTC(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto), Number(segundo)) +
    DESLOCAMENTO_RECIFE_MS
  );
}

/** Modo de exibição do painel: claro, escuro e adaptado (Leitura ampliada), como nas capturas dos outros casos. */
async function mudarModo(page: Page, modo: 'claro' | 'escuro' | 'adaptado'): Promise<void> {
  await page.emulateMedia({ colorScheme: modo === 'escuro' ? 'dark' : 'light' });
  await page.evaluate(
    ([chave, ligado]) => {
      if (ligado) localStorage.setItem(chave, 'true');
      else localStorage.removeItem(chave);
    },
    [CHAVE_MODO_ADAPTADO, modo === 'adaptado'] as const
  );
  await page.reload();
  await esperarApp(page);
  if (modo === 'adaptado') {
    await expect(page.locator('html')).toHaveAttribute('data-modo-adaptado', 'on');
  }
}

async function sairDaConta(pessoa: Page): Promise<void> {
  const sair = pessoa.getByRole('button', { name: 'Sair' });
  if (!(await sair.isVisible())) {
    await pessoa.getByRole('button', { name: 'Abrir menu do currículo' }).click();
  }
  await sair.click();
  await esperarEntrada(pessoa);
}

test('presenca: a luz de ana.paula fica verde com a sessão aberta, vermelha depois do Sair e de Atualizar, e o último acesso sai na hora de Recife', async ({
  page,
  browser
}, testInfo) => {
  test.setTimeout(300_000);
  await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
  const linha = linhaDaConta(page);
  await page.reload();
  await esperarApp(page);
  await expect(linha.locator('th')).toContainText(SEM_SESSAO);
  await expect(linha.locator('.ar-led--vermelho')).toHaveCount(1);

  // Navegador da pessoa em outro fuso: a hora do painel não pode depender dele.
  const pessoaContexto = await browser.newContext({ timezoneId: 'Pacific/Auckland' });
  try {
    const pessoa = await pessoaContexto.newPage();
    const antesDoLogin = Date.now();
    await entrarNoApp(pessoa, CONTA_ANA_PAULA);
    const depoisDoLogin = Date.now();

    await atualizarPainel(page);
    await expect(linha.locator('.ar-led--verde')).toHaveCount(1);
    await expect(linha.locator('th')).toContainText(SESSAO_ABERTA);
    const ultimoAcesso = linha.locator('td[data-rotulo="Último acesso"]');
    await expect(ultimoAcesso).toHaveText(FORMATO_ULTIMO_ACESSO);
    const instante = instanteDeRecife((await ultimoAcesso.textContent()) ?? '');
    expect(instante, 'último acesso dentro da janela do login, na hora de Recife').toBeGreaterThanOrEqual(
      antesDoLogin - FOLGA_MS
    );
    expect(instante, 'último acesso dentro da janela do login, na hora de Recife').toBeLessThanOrEqual(
      depoisDoLogin + FOLGA_MS
    );

    for (const modo of ['claro', 'escuro', 'adaptado'] as const) {
      await mudarModo(page, modo);
      await expect(linha.locator('.ar-led--verde')).toHaveCount(1);
      await capturarTabela(page, `admin-presenca-${testInfo.project.name}-verde-${modo}`);
    }

    await sairDaConta(pessoa);
    await atualizarPainel(page);
    await expect(linha.locator('.ar-led--vermelho')).toHaveCount(1);
    await expect(linha.locator('th')).toContainText(SEM_SESSAO);
    await expect(ultimoAcesso).toHaveText(FORMATO_ULTIMO_ACESSO);

    for (const modo of ['claro', 'escuro', 'adaptado'] as const) {
      await mudarModo(page, modo);
      await expect(linha.locator('.ar-led--vermelho')).toHaveCount(1);
      await capturarTabela(page, `admin-presenca-${testInfo.project.name}-vermelho-${modo}`);
    }
  } finally {
    await pessoaContexto.close();
  }
});
