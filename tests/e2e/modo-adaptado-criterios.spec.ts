import { test, expect, type Page } from '@playwright/test';

/**
 * Prova, contra o build real (vite preview), os quatro critérios da seção 8
 * de docs/modo-adaptado.md que a revisão (docs/revisao-modo-adaptado.md)
 * marcou como "sem prova nenhuma": 4 (alvo de toque), 5 (fonte computada),
 * 6 (distinção acerto/erro sem depender de cor) e 9 (persistência entre
 * recarregar e navegar). Liga o modo pela INTERAÇÃO real com o botão do
 * cabeçalho (não pré-carregando localStorage), para o critério 9 provar o
 * caminho de verdade que o leitor usa.
 */

async function ligarModoPeloBotao(page: Page): Promise<void> {
  await page
    .getByRole('button', {
      name: 'Ativar modo de leitura adaptada: texto maior e contraste máximo em preto e branco'
    })
    .click();
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
}

test.describe('critério 4: todo alvo interativo mede >= 44x44 CSS px com o modo ligado', () => {
  test('cabeçalho, menu, quiz e rodapé', async ({ page }) => {
    await page.goto('/p/p1/intr-direito/u1/quiz');
    await ligarModoPeloBotao(page);
    await page.locator('.cartao-pergunta').first().waitFor({ state: 'visible' });

    const seletores = [
      '.botao-modo-adaptado',
      '.alternador-tema',
      '.trilha-navegacao a',
      '.campo-busca__input',
      '.cartao-pergunta__alt',
      '.motor-quiz__navegacao button',
      '.rodape__apagar'
    ];

    const medidas = await page.evaluate((sels: string[]) => {
      const resultado: Array<{ seletor: string; largura: number; altura: number }> = [];
      for (const seletor of sels) {
        for (const el of Array.from(document.querySelectorAll(seletor))) {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue; // escondido, fora de escopo
          resultado.push({ seletor, largura: r.width, altura: r.height });
        }
      }
      return resultado;
    }, seletores);

    expect(medidas.length).toBeGreaterThan(0);
    for (const m of medidas) {
      expect(m.largura, `${m.seletor}: largura ${m.largura}px`).toBeGreaterThanOrEqual(44);
      expect(m.altura, `${m.seletor}: altura ${m.altura}px`).toBeGreaterThanOrEqual(44);
    }
  });

  // Achado do QA final (docs/qa-final-onda.md): os links do sumário do
  // Resumo (VisorResumo.vue) ficavam de fora da lista de seletores acima
  // (página diferente da do quiz) e mediam só 29px de altura com o modo
  // ligado, abaixo do piso de 44x44.
  test('sumário do resumo', async ({ page }) => {
    await page.goto('/p/p1/intr-direito/u1');
    await ligarModoPeloBotao(page);
    await page.locator('.visor-resumo__sumario a').first().waitFor({ state: 'visible' });

    const medidas = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.visor-resumo__sumario a')).map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { largura: r.width, altura: r.height };
      })
    );

    expect(medidas.length).toBeGreaterThan(0);
    for (const m of medidas) {
      expect(m.largura, `largura ${m.largura}px`).toBeGreaterThanOrEqual(44);
      expect(m.altura, `altura ${m.altura}px`).toBeGreaterThanOrEqual(44);
    }
  });

  // Extras interativos da unidade de Redação Jurídica 1 (22/09/2026):
  // checklist do art. 319 (label + input) e os cartões das cinco
  // perguntas, mesmo padrão de prova que o sumário do resumo acima.
  test('extras do resumo (checklist do art. 319 e cartões das cinco perguntas)', async ({
    page
  }) => {
    await page.goto('/p/p1/redacao-juridica-1/u1');
    await ligarModoPeloBotao(page);
    await page.locator('.cartoes-cinco-perguntas__cartao').first().waitFor({ state: 'visible' });

    const seletores = [
      '.checklist-319__rotulo',
      '.checklist-319__rotulo input',
      '.cartoes-cinco-perguntas__cartao'
    ];

    const medidas = await page.evaluate((sels: string[]) => {
      const resultado: Array<{ seletor: string; largura: number; altura: number }> = [];
      for (const seletor of sels) {
        for (const el of Array.from(document.querySelectorAll(seletor))) {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          resultado.push({ seletor, largura: r.width, altura: r.height });
        }
      }
      return resultado;
    }, seletores);

    expect(medidas.length).toBeGreaterThan(0);
    for (const m of medidas) {
      expect(m.largura, `${m.seletor}: largura ${m.largura}px`).toBeGreaterThanOrEqual(44);
      expect(m.altura, `${m.seletor}: altura ${m.altura}px`).toBeGreaterThanOrEqual(44);
    }
  });

  // Gêmeo do mesmo padrão (varredura própria, L-17): a lista de cadeiras da
  // página de Período (Periodo.vue) também é um `<a>` cru dentro de `<li>`,
  // sem min-height/min-width próprios — o token global de base.css não tem
  // efeito porque o elemento fica `inline`.
  test('lista de cadeiras da página de período', async ({ page }) => {
    await page.goto('/p/p1');
    await ligarModoPeloBotao(page);
    await page.locator('.pagina-periodo li a').first().waitFor({ state: 'visible' });

    const medidas = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.pagina-periodo li a')).map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { largura: r.width, altura: r.height };
      })
    );

    expect(medidas.length).toBeGreaterThan(0);
    for (const m of medidas) {
      expect(m.largura, `largura ${m.largura}px`).toBeGreaterThanOrEqual(44);
      expect(m.altura, `altura ${m.altura}px`).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('critério 5: fonte do corpo, computada pela página, >= 24px', () => {
  test('getComputedStyle(document.body).fontSize', async ({ page }) => {
    await page.goto('/');
    await ligarModoPeloBotao(page);
    const fontSizePx = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.body).fontSize)
    );
    expect(fontSizePx).toBeGreaterThanOrEqual(24);
  });
});

test.describe('critério 6: acerto/erro do quiz não depende de cor', () => {
  test('correta e incorreta têm o mesmo fundo computado e bordas de estilo diferente', async ({
    page
  }) => {
    // A semente do quiz é aleatória a cada carga (MotorQuiz.vue: sem
    // semente salva, gera Math.random()), então a alternativa de índice 1
    // tem 25% de chance de já ser a correta (aí só a marca "correta"
    // aparece, nenhuma "incorreta" a comparar). Recarrega e tenta de novo
    // em vez de pular o teste: garante que a asserção real seja exercitada
    // quase sempre, sem depender de sorte numa única tentativa.
    // Cada goto() do laço abaixo precisa recarregar com o modo DESLIGADO
    // (senão o botão "Ativar..." não existe mais na segunda volta, porque
    // a escolha anterior já persistiu em localStorage) e com o quiz sem
    // resposta salva (senão a pergunta já nasce respondida).
    await page.context().addInitScript(() => window.localStorage.clear());

    let incorretaCount = 0;
    let correta = page.locator('.cartao-pergunta__alt--correta').first();
    let incorreta = page.locator('.cartao-pergunta__alt--incorreta').first();

    for (let tentativa = 0; tentativa < 8 && incorretaCount === 0; tentativa += 1) {
      await page.goto('/p/p1/intr-direito/u1/quiz');
      await ligarModoPeloBotao(page);
      const cartao = page.locator('.cartao-pergunta').first();
      await cartao.waitFor({ state: 'visible' });
      await cartao.locator('.cartao-pergunta__alt').nth(1).locator('input').click();
      correta = cartao.locator('.cartao-pergunta__alt--correta').first();
      incorreta = cartao.locator('.cartao-pergunta__alt--incorreta').first();
      incorretaCount = await incorreta.count();
    }
    expect(incorretaCount, 'nenhuma das 8 tentativas caiu numa alternativa errada').toBeGreaterThan(
      0
    );

    const estiloCorreta = await correta.evaluate((el) => {
      const c = getComputedStyle(el);
      return { fundo: c.backgroundColor, borda: c.borderStyle };
    });
    const estiloIncorreta = await incorreta.evaluate((el) => {
      const c = getComputedStyle(el);
      return { fundo: c.backgroundColor, borda: c.borderStyle };
    });

    // Mesmo fundo (no modo adaptado, --cor-sucesso-bg e --cor-erro-bg são
    // ambos #ffffff): prova que a cor não é o sinal.
    expect(estiloIncorreta.fundo).toBe(estiloCorreta.fundo);
    // Estilo de borda diferente (double vs dashed, tokens.css): o sinal
    // real sobrevive à escala de cinza.
    expect(estiloIncorreta.borda).not.toBe(estiloCorreta.borda);
  });
});

test.describe('critério 9: o modo continua ligado ao recarregar e ao navegar para uma segunda página', () => {
  test('recarregar a mesma página mantém o modo ligado', async ({ page }) => {
    await page.goto('/');
    await ligarModoPeloBotao(page);

    await page.reload();
    await expect(page.locator('[data-modo-adaptado="on"]')).toHaveCount(1);
  });

  test('navegar para uma segunda página mantém o modo ligado', async ({ page }) => {
    await page.goto('/');
    await ligarModoPeloBotao(page);

    await page.goto('/p/p1/intr-direito/u1');
    await expect(page.locator('[data-modo-adaptado="on"]')).toHaveCount(1);
  });
});
