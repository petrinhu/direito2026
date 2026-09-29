import { test, expect, type Page } from '@playwright/test';
import { curriculo } from '../../src/conteudo/curriculo';
import { rotasDeUnidades } from './apoio/rotasDoCurriculo';

/**
 * Achado do QA (docs/qa-redacao-u1.md, seção "Rodada final"): em tema
 * escuro, 360px e modo adaptado ligado, o quiz estourava a largura da
 * página em 2 de 10 carregamentos aleatórios (80px numa pergunta sobre a
 * estrutura de oito passos, cujas alternativas são listas separadas por
 * vírgula; 13px numa pergunta sobre o art. 1.658). O quiz sorteia a
 * ordem a cada carga, então testar só ALGUMAS perguntas passa por sorte
 * (como passou antes). Este teste substitui a sorte por varredura
 * completa: percorre todas as perguntas de cada unidade (hoje 30, 60 e 80, lidas da tela)
 * unidade-piloto, uma a uma, na mesma combinação que reproduziu o
 * defeito.
 *
 * Medido só em jsdom não prova nada aqui (jsdom não faz layout real,
 * scrollWidth/clientWidth sempre 0 — mesma nota de
 * responsividade-360.spec.ts), por isso este é um teste de PONTA A
 * PONTA (Playwright), não vitest/jsdom. Este arquivo não foi executado
 * por mim (regra da noite/manhã: sem teste em navegador desta sessão);
 * o QA roda sob o protocolo de isolamento já em uso.
 */
test.use({ viewport: { width: 360, height: 800 } });

/**
 * Achado do QA na primeira versão deste arquivo: a faixa de aviso de
 * armazenamento (AvisoArmazenamento.vue, fixa no rodapé, primeira
 * visita) nunca era dispensada, e em 360px ela cobre a área dos botões
 * "Anterior"/"Próxima" — o clique em "Próxima" expirava depois da
 * primeira pergunta, reprovando o teste sempre (contra o pacote
 * corrigido OU não), sem provar nada. As três chaves abaixo são
 * pré-carregadas em localStorage (mesmo padrão de
 * tests/e2e/modo-adaptado-320.spec.ts para o modo adaptado) ANTES de
 * `page.goto`, em vez de clicar em "Entendi"/"Ativar modo...": o teste
 * não depende de nenhum desses botões existirem nem do texto exato do
 * rótulo deles.
 */
const CHAVE_TEMA = 'caderno-direito:v1:tema';
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';
const CHAVE_AVISO_ARMAZENAMENTO_VISTO = 'caderno-direito:v1:aviso-armazenamento-visto';

interface EstadoInicial {
  tema: 'claro' | 'escuro';
  modoAdaptado: boolean;
}

async function irParaQuiz(page: Page, caminho: string, estado: EstadoInicial): Promise<void> {
  // O quiz sorteia a ordem das perguntas e das alternativas a partir de
  // Math.random (MotorQuiz.vue, semente nova a cada carga). Valor fixo: a
  // rodada é sempre a mesma, então o percurso é determinístico de verdade e
  // um empate de subpixel não aparece e some conforme o sorteio.
  await page.addInitScript(() => {
    Math.random = () => 0.123456789;
  });
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
  await page.goto(caminho);
  if (estado.modoAdaptado) {
    await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
  }
  await page.locator('.cartao-pergunta').first().waitFor({ state: 'visible' });
  // Prova de que a faixa de fato não apareceu (e não só que o teste
  // parou de precisar dela): se ela existisse no DOM, os cliques em
  // "Próxima" mais abaixo arriscariam o mesmo timeout de antes.
  await expect(page.locator('.aviso-armazenamento')).toHaveCount(0);
}

async function irParaQuizEscuroModoAdaptado(page: Page, caminho: string): Promise<void> {
  await irParaQuiz(page, caminho, { tema: 'escuro', modoAdaptado: true });
}

async function medirEstouro(page: Page): Promise<{ scrollWidth: number; clientWidth: number }> {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
}

/**
 * Lê "Pergunta 1 de N" na tela: o total vem da própria rodada renderizada,
 * então uma unidade nova ou uma pergunta a mais entra na varredura sem
 * editar este arquivo (antes: 30 e 60 escritos à mão).
 */
async function lerTotalDePerguntas(page: Page): Promise<number> {
  const texto = await page.locator('.motor-quiz__posicao').innerText();
  const total = Number(/de (\d+)/.exec(texto)?.[1]);
  expect(total, `total lido de "${texto}"`).toBeGreaterThan(0);
  return total;
}

/**
 * Percorre TODAS as perguntas da rodada atual, clicando em "Próxima" a
 * cada passo, e mede o estouro de largura da PÁGINA em cada uma. A ordem
 * é embaralhada (semente aleatória a cada carga), mas percorrer as N-1
 * transições cobre as N perguntas de qualquer jeito, seja qual for a
 * ordem sorteada. Com cinco alternativas (Sociologia Jurídica), confere
 * também as cinco letras A a E, que são o item mais largo do cartão.
 */
async function varrerTodasAsPerguntas(page: Page, nomeUnidade: string): Promise<number> {
  const total = await lerTotalDePerguntas(page);
  for (let indice = 0; indice < total; indice++) {
    await expect(page.locator('.cartao-pergunta')).toBeVisible();
    const { scrollWidth, clientWidth } = await medirEstouro(page);
    const textoEnunciado = await page.locator('.cartao-pergunta__enunciado').innerText();
    expect(
      scrollWidth,
      `${nomeUnidade}, pergunta ${indice + 1}/${total} ("${textoEnunciado.slice(0, 80)}"): ` +
        `scrollWidth ${scrollWidth} vs clientWidth ${clientWidth}`
    ).toBe(clientWidth);

    const alternativas = await page.locator('.cartao-pergunta input[type="radio"]').count();
    if (alternativas === 5) {
      const letras = await page.locator('.cartao-pergunta__letra').allInnerTexts();
      expect(letras, `${nomeUnidade}, pergunta ${indice + 1}`).toEqual(['A', 'B', 'C', 'D', 'E']);
    }

    if (indice < total - 1) {
      await page.getByRole('button', { name: 'Próxima' }).click();
    }
  }
  return total;
}

/**
 * Uma varredura por unidade que tem aba de quiz, tirada do currículo
 * (tests/e2e/apoio/rotasDoCurriculo.ts). A de Sociologia Jurídica cobre as
 * 80 perguntas de cinco alternativas.
 */
for (const rota of rotasDeUnidades(curriculo).filter((r) => r.caminho.endsWith('/quiz'))) {
  test(`${rota.nome}: nenhuma pergunta estoura 360px, escuro, modo adaptado`, async ({ page }) => {
    await irParaQuizEscuroModoAdaptado(page, rota.caminho);
    await varrerTodasAsPerguntas(page, rota.nome);
  });
}

/**
 * Defeito CRÍTICO do QA (docs/qa-sociologia-u1.md, "CRÍTICO 1"): a varredura
 * acima só mede `scrollWidth`, e o texto da alternativa colapsava para 16px
 * (3px no Firefox) sem estourar a página, quebrando letra por letra. Aqui
 * se mede a LARGURA ÚTIL do texto de cada alternativa, antes e depois de
 * responder (a marca "Correta"/"Sua resposta, incorreta" só existe depois),
 * em 320px e 360px, com e sem modo adaptado, em toda pergunta de todo quiz
 * (percorridas com a semente do sorteio fixada, ver irParaQuiz).
 *
 * Piso: o texto ocupa no mínimo metade da largura do cartão. Palavra que
 * cabe numa linha do texto não pode aparecer quebrada em duas: mede-se,
 * por palavra, se a soma dos fragmentos (um por linha) cabia na largura do
 * texto; se cabia, a quebra no meio foi desnecessária.
 */
const PISO_LARGURA_TEXTO_SOBRE_CARTAO = 0.5;
const TOLERANCIA_DE_SUBPIXEL = 2;
const LARGURAS_DO_CELULAR = [320, 360] as const;

async function medirAlternativas(page: Page, depoisDeResponder: boolean): Promise<string[]> {
  return page.evaluate(
    ({ piso, respondida, TOLERANCIA_DE_SUBPIXEL }) => {
      const problemas: string[] = [];
      const cartao = document.querySelector<HTMLElement>('.cartao-pergunta');
      if (!cartao) return ['cartão da pergunta ausente'];
      const caixaCartao = cartao.getBoundingClientRect();
      const alternativas = Array.from(
        cartao.querySelectorAll<HTMLElement>('.cartao-pergunta__alt')
      );
      let marcas = 0;
      alternativas.forEach((alt, indice) => {
        const texto = alt.querySelector<HTMLElement>('.cartao-pergunta__alt-texto');
        if (!texto) {
          problemas.push(`alternativa ${indice}: sem texto`);
          return;
        }
        const larguraTexto = texto.getBoundingClientRect().width;
        if (larguraTexto < piso * caixaCartao.width) {
          problemas.push(
            `alternativa ${indice}: texto com ${larguraTexto.toFixed(0)}px de ` +
              `${caixaCartao.width.toFixed(0)}px do cartão (piso ${piso * 100}%)`
          );
        }
        const percurso = document.createTreeWalker(texto, window.NodeFilter.SHOW_TEXT);
        for (let no = percurso.nextNode(); no; no = percurso.nextNode()) {
          const conteudo = no.textContent ?? '';
          for (const palavra of conteudo.matchAll(/[^\s-]+/g)) {
            const trecho = document.createRange();
            trecho.setStart(no, palavra.index ?? 0);
            trecho.setEnd(no, (palavra.index ?? 0) + palavra[0].length);
            // Retângulo de largura zero na fronteira de linha não é fragmento.
            const fragmentos = Array.from(trecho.getClientRects()).filter((f) => f.width > 0);
            if (fragmentos.length < 2) continue;
            const larguraInteira = fragmentos.reduce((soma, f) => soma + f.width, 0);
            if (larguraInteira + TOLERANCIA_DE_SUBPIXEL <= larguraTexto) {
              problemas.push(
                `alternativa ${indice}: palavra "${palavra[0]}" quebrada no meio ` +
                  `(inteira ocupa ${larguraInteira.toFixed(0)}px, linha tem ${larguraTexto.toFixed(0)}px)`
              );
            }
          }
        }
        const marca = alt.querySelector<HTMLElement>('.cartao-pergunta__marca');
        if (marca) {
          marcas += 1;
          const caixaMarca = marca.getBoundingClientRect();
          const dentro =
            caixaMarca.width > 0 &&
            caixaMarca.left >= caixaCartao.left - 1 &&
            caixaMarca.right <= caixaCartao.right + 1;
          if (!dentro) problemas.push(`alternativa ${indice}: marca fora do cartão`);
          if (marca.closest('label') !== alt) problemas.push(`alternativa ${indice}: marca solta`);
        }
      });
      if (respondida && marcas === 0) problemas.push('depois de responder, nenhuma marca visível');
      if (!respondida && marcas > 0) problemas.push('antes de responder, já há marca');
      return problemas;
    },
    {
      piso: PISO_LARGURA_TEXTO_SOBRE_CARTAO,
      respondida: depoisDeResponder,
      TOLERANCIA_DE_SUBPIXEL
    }
  );
}

for (const rota of rotasDeUnidades(curriculo).filter((r) => r.caminho.endsWith('/quiz'))) {
  for (const largura of LARGURAS_DO_CELULAR) {
    for (const modoAdaptado of [false, true]) {
      const rotuloModo = modoAdaptado ? 'modo adaptado' : 'modo normal';
      test(`${rota.nome}: texto das alternativas com largura útil e sem palavra partida, ${largura}px, ${rotuloModo}`, async ({
        page
      }) => {
        test.setTimeout(180_000);
        await page.setViewportSize({ width: largura, height: 800 });
        await irParaQuiz(page, rota.caminho, { tema: 'claro', modoAdaptado });
        const total = await lerTotalDePerguntas(page);
        for (let indice = 0; indice < total; indice++) {
          const enunciado = (await page.locator('.cartao-pergunta__enunciado').innerText()).slice(
            0,
            60
          );
          const rotulo = `${rota.nome}, ${largura}px, ${rotuloModo}, pergunta ${indice + 1}/${total} ("${enunciado}")`;
          expect(await medirAlternativas(page, false), `${rotulo}, antes de responder`).toEqual([]);
          await page.locator('.cartao-pergunta input[type="radio"]').first().check({ force: true });
          expect(await medirAlternativas(page, true), `${rotulo}, depois de responder`).toEqual([]);
          if (indice < total - 1) await page.getByRole('button', { name: 'Próxima' }).click();
        }
      });
    }
  }
}
