import { expect, test, type Page } from '@playwright/test';
import { calcularContraste } from '../../src/core/design/contraste';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';
import { prepararJuriFalsa, SENHA_PROVISORIA_FALSA, USUARIO_JURI_FALSO } from './apoio/juriFalso';
import { conteudoJuriFalso } from '../unidade/apoio/conteudoJuriFalso';

/**
 * Júri Simulado em telas pequenas e em leitura ampliada (QA visual, relatório
 * /var/tmp/juri-simulado/qa-visual.md, desvios D1 a D4). Cada tela da Júri
 * (entrada, troca de senha, cinco abas, destravar) tem de caber na largura da
 * janela, em 360, 390 e 1280 px, nos dois modos e nos dois temas. Medido em
 * Playwright, não em jsdom: sem layout real, scrollWidth e clientWidth valem 0.
 *
 * O botão "Sair" (e os demais botões da Júri) precisa de 4,5:1 entre o texto e o
 * fundo REAL do elemento, no tema escuro também. Medido na página renderizada.
 */

// O service worker do site intercepta as chamadas depois do primeiro carregamento (ver juri-simulado).
test.use({ serviceWorkers: 'block' });

const QUINZE = 'abcdefghijklmno';
const LARGURAS = [360, 390, 1280] as const;
const MODOS = [
  { rotulo: 'modo normal', modoAdaptado: false },
  { rotulo: 'Leitura ampliada', modoAdaptado: true }
] as const;
const TEMAS = ['claro', 'escuro'] as const;
const PISO_TEXTO = 4.5;
const ABAS = [
  { rotulo: 'Resumo', id: 'resumo' },
  { rotulo: 'Mapa mental', id: 'mapa' },
  { rotulo: 'Fichamento', id: 'fichamento' },
  { rotulo: 'Mnemônicos', id: 'mnemonicos' },
  { rotulo: 'Quiz', id: 'quiz' }
] as const;

type Tela = 'entrada' | 'troca' | (typeof ABAS)[number]['id'] | 'destravar';

/**
 * Fixture sintética com o que estoura a Júri: tabela sem quadro de rolagem (o
 * conteúdo real tem tabelas, e a área não as envolve como as páginas de estudo)
 * e palavra sem espaço, que não quebra sozinha. Nada do caso real: só texto fictício.
 */
function conteudoComTabelaELongaPalavra(): Record<string, unknown> {
  const base = conteudoJuriFalso();
  const resumo = base.resumo as Array<Record<string, unknown>>;
  resumo[0] = {
    ...resumo[0],
    corpoHtml: [
      '<h3>TituloFicticioSemEspacoQueNaoQuebraSozinhoNoResumo</h3>',
      '<blockquote>CitacaoFicticiaSemEspacoQueNaoQuebraSozinhaNaCitacao</blockquote>',
      '<p>Texto fictício do bloco um com tabela comparativa.</p>',
      '<table><thead><tr><th>Critério fictício</th><th>Descrição fictícia</th><th>Referência</th>',
      '<th>Observação fictícia do critério</th></tr></thead><tbody>',
      '<tr><td>Primeiro critério fictício</td><td>Descrição fictícia do primeiro critério, com texto corrido.</td>',
      '<td>ReferenciaFicticiaSemEspacoQueNaoQuebraSozinhaNaColuna</td><td>Observação fictícia.</td></tr>',
      '</tbody></table>'
    ].join('')
  };
  const mnemonicos = base.mnemonicos as Array<Record<string, unknown>>;
  mnemonicos[0] = {
    ...mnemonicos[0],
    dicaHtml: '<h3>DicaFicticiaSemEspacoQueNaoQuebraSozinhaNoMnemonico</h3>'
  };
  const termos = base.quadroTermos as Array<Record<string, unknown>>;
  termos[0] = {
    ...termos[0],
    definicaoHtml:
      '<h3>DefinicaoFicticiaSemEspacoQueNaoQuebraSozinhaNoQuadroDeTermos</h3><blockquote>CitacaoFicticiaSemEspacoNoQuadroDeTermos</blockquote>'
  };
  return base;
}

/**
 * Percorre o fluxo inteiro da Júri (entrada, troca obrigatória, abas, recarregar
 * e destravar) e chama `visitar` em cada tela, com a página já montada.
 * Mesmo caminho de tests/e2e/juri-simulado.spec.ts, sem conta real.
 */
async function percorrerJuri(page: Page, visitar: (tela: Tela) => Promise<void>): Promise<void> {
  const servidor = await prepararJuriFalsa(page);
  servidor.definirConteudo(conteudoComTabelaELongaPalavra());
  await page.goto('/p/p1/juri-simulado');
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  await visitar('entrada');

  await page.getByLabel('Usuário').fill(USUARIO_JURI_FALSO);
  await page.getByLabel('Senha', { exact: true }).fill(SENHA_PROVISORIA_FALSA);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Troque a senha para continuar' })).toBeVisible();
  await visitar('troca');

  await page.getByLabel('Senha atual').fill(SENHA_PROVISORIA_FALSA);
  await page.getByLabel('Nova senha', { exact: true }).fill(QUINZE);
  await page.getByLabel('Confirmar nova senha').fill(QUINZE);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('tab', { name: 'Resumo' })).toBeVisible();

  for (const aba of ABAS) {
    await page.getByRole('tab', { name: aba.rotulo }).click();
    await expect(page.getByRole('tab', { name: aba.rotulo })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await visitar(aba.id);
  }

  // Recarregar: a chave sai da memória e a tela pede só a senha (destravar).
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Destravar' })).toBeVisible();
  await visitar('destravar');
}

async function estouroDaPagina(page: Page): Promise<string | null> {
  await esperarLayoutAssentar(page);
  const medida = await page.evaluate(() => ({
    rolagem: document.documentElement.scrollWidth,
    janela: document.documentElement.clientWidth
  }));
  return medida.rolagem > medida.janela
    ? `scrollWidth ${medida.rolagem} para clientWidth ${medida.janela}`
    : null;
}

for (const largura of LARGURAS) {
  for (const modo of MODOS) {
    for (const tema of TEMAS) {
      test(`Júri, ${largura}px, tema ${tema}, ${modo.rotulo}: nenhuma tela tem rolagem lateral da página`, async ({
        page
      }) => {
        test.setTimeout(180_000);
        await page.setViewportSize({ width: largura, height: 800 });
        await prepararEstadoInicial(page, { tema, modoAdaptado: modo.modoAdaptado });
        const estouros: string[] = [];
        await percorrerJuri(page, async (tela) => {
          const achado = await estouroDaPagina(page);
          if (achado) estouros.push(`${tela}: ${achado}`);
        });
        expect(estouros, `telas da Júri com rolagem lateral em ${largura}px`).toEqual([]);
      });
    }
  }
}

interface ParTextoFundo {
  rotulo: string;
  texto: string;
  fundo: string;
}

/**
 * Para cada elemento HTML da Júri com texto próprio, devolve a cor do texto e a
 * cor do fundo real (sobe pelos ancestrais até achar um fundo não transparente).
 * Só o que o leitor vê: sem SVG, sem texto só para leitor de tela, sem elemento oculto.
 */
async function paresDeTextoDaJuri(page: Page): Promise<ParTextoFundo[]> {
  return page.evaluate(() => {
    // Dentro do navegador: constantes do Node não existem aqui, e o lint do repo não conhece o DOM.
    const XHTML = 'http://www.w3.org/1999/xhtml';
    const TEXTO = 3;
    const hex = (valor: string): string | null => {
      const m = /^rgba?\(([^)]+)\)$/.exec(valor.trim());
      if (!m) return null;
      const partes = m[1]!
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map(Number);
      if (partes.length > 3 && partes[3]! < 1) return null;
      return `#${partes
        .slice(0, 3)
        .map((n) => Math.round(n).toString(16).padStart(2, '0'))
        .join('')}`;
    };
    const transparente = (cor: string): boolean => /rgba\(\d+, \d+, \d+, 0\)|transparent/.test(cor);
    const pares: ParTextoFundo[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('.area-juri *'))) {
      if (el.closest('svg, .juri-so-leitor') || el.namespaceURI !== XHTML) continue;
      const texto = Array.from(el.childNodes)
        .filter((n) => n.nodeType === TEXTO)
        .map((n) => n.textContent ?? '')
        .join('')
        .trim();
      if (!texto) continue;
      const estilo = getComputedStyle(el);
      if (estilo.display === 'none' || estilo.visibility === 'hidden') continue;
      if (el.getBoundingClientRect().width === 0) continue;
      const corTexto = hex(estilo.color);
      if (!corTexto) continue;
      let corFundo: string | null = null;
      for (let atual: HTMLElement | null = el; atual && !corFundo; atual = atual.parentElement) {
        const fundo = getComputedStyle(atual).backgroundColor;
        if (!transparente(fundo)) corFundo = hex(fundo);
      }
      if (!corFundo) {
        corFundo = hex(getComputedStyle(document.body).backgroundColor) ?? '#ffffff';
      }
      const classe = typeof el.className === 'string' ? el.className.trim() : '';
      pares.push({
        rotulo: `${el.tagName.toLowerCase()}${classe ? `.${classe.split(/\s+/)[0]}` : ''} "${texto.slice(0, 40)}"`,
        texto: corTexto,
        fundo: corFundo
      });
    }
    return pares;
  });
}

function abaixoDoPiso(pares: readonly ParTextoFundo[]): string[] {
  return pares
    .map((par) => ({
      par,
      razao: calcularContraste(par.texto, par.fundo)
    }))
    .filter(({ razao }) => razao < PISO_TEXTO)
    .map(
      ({ par, razao }) => `${par.rotulo}: ${razao.toFixed(2)}:1 (${par.texto} sobre ${par.fundo})`
    );
}

for (const modo of MODOS) {
  test(`Júri, tema escuro, ${modo.rotulo}: todo texto tem pelo menos 4,5:1 contra o fundo real`, async ({
    page
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await prepararEstadoInicial(page, { tema: 'escuro', modoAdaptado: modo.modoAdaptado });
    const reprovados: string[] = [];
    await percorrerJuri(page, async (tela) => {
      const achados = abaixoDoPiso(await paresDeTextoDaJuri(page));
      for (const achado of achados) reprovados.push(`${tela}: ${achado}`);
    });
    expect(reprovados, 'textos da Júri abaixo de 4,5:1 no tema escuro').toEqual([]);
  });
}

test('Júri, tema escuro: botão Sair tem pelo menos 4,5:1 entre o texto e o fundo do botão', async ({
  page
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await prepararEstadoInicial(page, { tema: 'escuro', modoAdaptado: false });
  const medidas: string[] = [];
  await percorrerJuri(page, async (tela) => {
    if (tela !== 'resumo') return;
    const sair = page.locator('[data-acao="sair"]');
    await expect(sair).toBeVisible();
    const par = await sair.evaluate((el) => {
      const fundo = (() => {
        for (
          let atual: HTMLElement | null = el as HTMLElement;
          atual;
          atual = atual.parentElement
        ) {
          const cor = getComputedStyle(atual).backgroundColor;
          if (!/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(cor)) return cor;
        }
        return getComputedStyle(document.body).backgroundColor;
      })();
      return { texto: getComputedStyle(el).color, fundo };
    });
    medidas.push(`${par.texto} sobre ${par.fundo}`);
    const hex = (valor: string): string => {
      const partes = valor
        .match(/\d+(\.\d+)?/g)!
        .slice(0, 3)
        .map(Number);
      return `#${partes.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
    };
    expect(
      calcularContraste(hex(par.texto), hex(par.fundo)),
      `Sair: ${par.texto} sobre ${par.fundo}`
    ).toBeGreaterThanOrEqual(PISO_TEXTO);
  });
  expect(medidas.length, 'a tela de abas foi medida').toBeGreaterThan(0);
});
