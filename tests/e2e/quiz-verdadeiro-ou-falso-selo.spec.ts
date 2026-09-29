import { test, expect, type Page } from '@playwright/test';
import { curriculo } from '../../src/conteudo/curriculo';
import { calcularContraste } from '../../src/core/design/contraste';
import { rotasDeUnidades } from './apoio/rotasDoCurriculo';
import { prepararEstadoInicial, type EstadoInicial } from './apoio/estadoInicial';

/**
 * Pergunta de verdadeiro ou falso e selo "Revisão do professor" (ordem do
 * líder, 29/09/2026), medidos no navegador de verdade: contraste do selo,
 * selo como texto sem fundo colorido no modo adaptado, duas opções fixas sem
 * letra, resposta por teclado e largura útil a 320px e 360px.
 *
 * Nenhum quiz publicado até esta data tem verdadeiro ou falso nem selo, então
 * cada teste varre a rodada inteira lendo o que a TELA mostra e, se a unidade
 * não tiver nenhum dos dois, se declara ignorado (skip) com o motivo. Um
 * teste que não encontra nada e passa seria portão falso; por isso o skip é
 * explícito. Passam a rodar sozinhos quando a unidade de Filosofia Jurídica
 * for publicada.
 *
 * Este arquivo não foi executado por quem o escreveu (L-50, só o QA roda
 * navegador, em caixa isolada); só `playwright test --list` foi conferido.
 */
const PISO_TEXTO = 4.5;
const PISO_SELO_SOBRE_CARTAO = 3;
const LARGURAS = [320, 360] as const;

const ESTADOS: ReadonlyArray<{ rotulo: string; estado: EstadoInicial }> = [
  { rotulo: 'tema claro', estado: { tema: 'claro', modoAdaptado: false } },
  { rotulo: 'tema escuro', estado: { tema: 'escuro', modoAdaptado: false } },
  { rotulo: 'modo adaptado', estado: { tema: 'claro', modoAdaptado: true } }
];

async function abrirQuiz(page: Page, caminho: string, estado: EstadoInicial): Promise<number> {
  // Mesma rodada em toda carga (o quiz sorteia com Math.random).
  await page.addInitScript(() => {
    Math.random = () => 0.123456789;
  });
  await prepararEstadoInicial(page, estado);
  await page.goto(caminho);
  if (estado.modoAdaptado) {
    await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
  }
  await page.locator('.cartao-pergunta').first().waitFor({ state: 'visible' });
  const texto = await page.locator('.motor-quiz__posicao').innerText();
  const total = Number(/de (\d+)/.exec(texto)?.[1]);
  expect(total, `total lido de "${texto}"`).toBeGreaterThan(0);
  return total;
}

interface LeituraDoCartao {
  enunciado: string;
  radios: number;
  opcoes: string[];
  letras: string[];
  selo: null | {
    texto: string;
    corTexto: string;
    corFundo: string;
    corCartao: string;
    bordaEstilo: string;
    bordaLargura: number;
    negrito: boolean;
    antesDoEnunciado: boolean;
    largura: number;
    larguraCartao: number;
  };
  larguraPagina: { scroll: number; client: number };
}

async function lerCartao(page: Page): Promise<LeituraDoCartao> {
  return page.evaluate(() => {
    const cartao = document.querySelector<HTMLElement>('.cartao-pergunta')!;
    const enunciado = cartao.querySelector<HTMLElement>('.cartao-pergunta__enunciado')!;
    const seloEl = cartao.querySelector<HTMLElement>('.cartao-pergunta__selo-professor');
    let selo: LeituraDoCartao['selo'] = null;
    if (seloEl) {
      const estilo = getComputedStyle(seloEl);
      selo = {
        texto: (seloEl.textContent ?? '').trim(),
        corTexto: estilo.color,
        corFundo: estilo.backgroundColor,
        corCartao: getComputedStyle(cartao).backgroundColor,
        bordaEstilo: estilo.borderTopStyle,
        bordaLargura: parseFloat(estilo.borderTopWidth),
        negrito: Number(estilo.fontWeight) >= 700,
        antesDoEnunciado: Boolean(
          seloEl.compareDocumentPosition(enunciado) & window.Node.DOCUMENT_POSITION_FOLLOWING
        ),
        largura: seloEl.getBoundingClientRect().width,
        larguraCartao: cartao.getBoundingClientRect().width
      };
    }
    return {
      enunciado: (enunciado.textContent ?? '').slice(0, 60),
      radios: cartao.querySelectorAll('input[type="radio"]').length,
      opcoes: Array.from(cartao.querySelectorAll('.cartao-pergunta__alt-texto')).map((e) =>
        (e.textContent ?? '').trim()
      ),
      letras: Array.from(cartao.querySelectorAll('.cartao-pergunta__letra')).map((e) =>
        (e.textContent ?? '').trim()
      ),
      selo,
      larguraPagina: {
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth
      }
    };
  });
}

function rgbParaHex(rgb: string): string {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.round(v ?? 0)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

/** Percorre a rodada inteira lendo cada cartão; devolve o que a tela mostrou. */
async function varrer(page: Page, total: number): Promise<LeituraDoCartao[]> {
  const leituras: LeituraDoCartao[] = [];
  for (let i = 0; i < total; i++) {
    leituras.push(await lerCartao(page));
    if (i < total - 1) await page.getByRole('button', { name: 'Próxima' }).click();
  }
  return leituras;
}

const rotasDeQuiz = rotasDeUnidades(curriculo).filter((r) => r.caminho.endsWith('/quiz'));

for (const rota of rotasDeQuiz) {
  for (const { rotulo, estado } of ESTADOS) {
    for (const largura of LARGURAS) {
      test(`${rota.nome}: selo e verdadeiro ou falso, ${rotulo}, ${largura}px`, async ({
        page
      }) => {
        test.setTimeout(180_000);
        await page.setViewportSize({ width: largura, height: 800 });
        const total = await abrirQuiz(page, rota.caminho, estado);
        const leituras = await varrer(page, total);

        const comSelo = leituras.filter((l) => l.selo !== null);
        const verdadeiroOuFalso = leituras.filter((l) => l.radios === 2);
        test.skip(
          comSelo.length === 0 && verdadeiroOuFalso.length === 0,
          `${rota.nome}: nenhuma pergunta de verdadeiro ou falso nem selo do professor nesta unidade`
        );

        for (const l of verdadeiroOuFalso) {
          const id = `"${l.enunciado}"`;
          expect(l.opcoes, `${id}: opções`).toEqual(['Verdadeiro', 'Falso']);
          expect(l.letras, `${id}: não deve ter letras`).toEqual([]);
        }
        for (const l of leituras) {
          expect(l.larguraPagina.scroll, `"${l.enunciado}": rolagem lateral`).toBe(
            l.larguraPagina.client
          );
        }

        for (const l of comSelo) {
          const s = l.selo!;
          const id = `"${l.enunciado}"`;
          expect(s.texto, `${id}: texto do selo`).toBe('Revisão do professor');
          expect(s.antesDoEnunciado, `${id}: selo antes do enunciado`).toBe(true);
          expect(s.negrito, `${id}: selo em negrito`).toBe(true);
          expect(s.largura, `${id}: selo cabe no cartão`).toBeLessThanOrEqual(s.larguraCartao);
          const texto = rgbParaHex(s.corTexto);
          const fundo = rgbParaHex(s.corFundo);
          const cartao = rgbParaHex(s.corCartao);
          if (estado.modoAdaptado) {
            expect(texto, `${id}: texto do selo no modo adaptado`).toBe('#000000');
            expect(fundo, `${id}: sem fundo colorido no modo adaptado`).toBe('#ffffff');
            expect(s.bordaEstilo, `${id}: borda do selo`).toBe('solid');
            expect(s.bordaLargura, `${id}: borda do selo`).toBeGreaterThanOrEqual(2);
          } else {
            expect(
              calcularContraste(texto, fundo),
              `${id}: texto/fundo do selo`
            ).toBeGreaterThanOrEqual(PISO_TEXTO);
            expect(
              calcularContraste(fundo, cartao),
              `${id}: fundo do selo contra o cartão`
            ).toBeGreaterThanOrEqual(PISO_SELO_SOBRE_CARTAO);
          }
        }
      });
    }
  }

  test(`${rota.nome}: pergunta de verdadeiro ou falso se responde só pelo teclado`, async ({
    page
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 360, height: 800 });
    const total = await abrirQuiz(page, rota.caminho, { tema: 'claro', modoAdaptado: false });
    let achou = false;
    for (let i = 0; i < total && !achou; i++) {
      if ((await page.locator('.cartao-pergunta input[type="radio"]').count()) === 2) {
        achou = true;
        break;
      }
      if (i < total - 1) await page.getByRole('button', { name: 'Próxima' }).click();
    }
    test.skip(!achou, `${rota.nome}: nenhuma pergunta de verdadeiro ou falso nesta unidade`);

    // Parte do enunciado (a árvore de navegação lateral tem dezenas de links
    // antes do quiz): dali, o próximo Tab tem de cair no grupo de opções.
    await page.locator('.cartao-pergunta__enunciado').evaluate((el) => {
      el.setAttribute('tabindex', '-1');
      el.focus();
    });
    let noRadio = false;
    for (let tab = 0; tab < 5 && !noRadio; tab++) {
      await page.keyboard.press('Tab');
      noRadio = await page.evaluate(() => {
        const ativo = document.activeElement as HTMLInputElement | null;
        return ativo?.type === 'radio' && ativo.closest('.cartao-pergunta') !== null;
      });
    }
    expect(noRadio, 'Tab alcança o grupo de opções do cartão').toBe(true);
    expect(
      await page.evaluate(() =>
        (document.activeElement?.closest('label')?.textContent ?? '').trim()
      )
    ).toContain('Verdadeiro');

    await page.keyboard.press('Space');
    await expect(page.locator('.cartao-pergunta__marca')).not.toHaveCount(0);
    await expect(page.locator('.cartao-pergunta input[type="radio"]').first()).toBeDisabled();
    await expect(page.locator('.cartao-pergunta__explicacao')).toBeVisible();

    // O foco não se perde em <body>: vai para o bloco do resultado, e o
    // próximo Tab segue para os botões de navegação do quiz.
    await expect(page.locator('.cartao-pergunta__resultado')).toBeFocused();
    await page.keyboard.press('Tab');
    const foco = await page.evaluate(() => {
      const ativo = document.activeElement;
      return {
        emBody: ativo === document.body,
        naNavegacao: ativo?.closest('.motor-quiz__navegacao') !== null
      };
    });
    expect(foco.emBody, 'foco caiu em body depois do Tab').toBe(false);
    expect(foco.naNavegacao, 'Tab depois do resultado segue para os botões do quiz').toBe(true);
  });
}
