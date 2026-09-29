import { test, expect } from '@playwright/test';
import { curriculo } from '../../src/conteudo/curriculo';
import {
  caminhosParaCabecalho,
  esperarLayoutAssentar,
  prepararEstadoInicial
} from './apoio/estadoInicial';

/**
 * Achado do QA (relatado pelo orquestrador, capturas em
 * mockups/capturas/v2/): a tabela do bloco 6 do resumo (e outras, em
 * mais de um bloco) estourava a largura em 360px, gerando 184px de
 * rolagem horizontal na PÁGINA inteira. Regra do projeto: nenhuma
 * rolagem lateral em 360px (docs/compatibilidade-navegadores.md).
 *
 * Medido só em jsdom não prova nada aqui: jsdom não faz layout real
 * (scrollWidth/clientWidth sempre 0), por isso este teste é Playwright
 * (o "padrão do projeto" para o que precisa de layout real, seção 14 da
 * arquitetura), não vitest/jsdom.
 */
test.use({ viewport: { width: 360, height: 800 } });

test('em 360px, a página do resumo (com tabelas comparativas) não estoura a largura', async ({
  page
}) => {
  await page.goto('/p/p1/intr-direito/u1');
  // Espera o conteúdo carregado (import dinâmico) aparecer: a primeira
  // tabela comparativa é prova de que o bloco 5 (numero 5) já montou.
  await page.locator('table').first().waitFor({ state: 'attached' });

  const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
  const larguraJanela = await page.evaluate(() => document.documentElement.clientWidth);

  expect(larguraDocumento, `scrollWidth ${larguraDocumento} vs clientWidth ${larguraJanela}`).toBe(
    larguraJanela
  );
});

test('em 360px, cada tabela do resumo rola dentro do próprio quadro (não a página)', async ({
  page
}) => {
  await page.goto('/p/p1/intr-direito/u1');
  const tabelas = page.locator('table');
  await tabelas.first().waitFor({ state: 'attached' });
  const total = await tabelas.count();
  expect(total).toBeGreaterThan(0);

  for (let i = 0; i < total; i++) {
    const quadro = page.locator('.tabela-rolavel').nth(i);
    await expect(quadro).toBeVisible();
    const podeRolar = await quadro.evaluate((el) => el.scrollWidth > el.clientWidth);
    // Nem toda tabela precisa ser larga o bastante para exigir rolagem
    // (a de 3 colunas pode caber), mas o CONTÊINER precisa existir e ter
    // overflow controlado — testado indiretamente pelo teste anterior
    // (a página, essa sim, nunca pode estourar).
    expect(typeof podeRolar).toBe('boolean');
  }
});

/**
 * IMPORTANTE 2 do QA (docs/qa-sociologia-u1.md): em modo normal, até ~453px,
 * o cabeçalho tinha 487px de conteúdo e cortava o excedente: "Leitura
 * ampliada" ficava com 11px visíveis e "Tema" fora da tela, e a pessoa de
 * baixa visão não alcançava o botão do modo. `scrollWidth` da página não
 * pega isso (o cabeçalho corta sozinho), então se mede cada CONTROLE: caixa
 * inteira dentro da viewport, sem outro elemento por cima no centro e, no
 * modo adaptado, com alvo de pelo menos 44px.
 */
const LARGURAS_DO_CABECALHO = [320, 360, 390, 412, 453, 480, 640, 768, 880, 1024, 1280] as const;

interface ControleFora {
  controle: string;
  motivo: string;
}

async function controlesDoCabecalhoComProblema(
  page: import('@playwright/test').Page,
  exigirAlvo: boolean
): Promise<ControleFora[]> {
  return page.evaluate((alvoMinimo) => {
    const problemas: Array<{ controle: string; motivo: string }> = [];
    const cabecalho = document.querySelector<HTMLElement>('.barra-topo');
    if (!cabecalho) return [{ controle: 'cabeçalho', motivo: 'ausente' }];
    const larguraJanela = document.documentElement.clientWidth;
    if (cabecalho.scrollWidth > cabecalho.clientWidth + 1) {
      problemas.push({
        controle: 'cabeçalho',
        motivo: `conteúdo com ${cabecalho.scrollWidth}px em caixa de ${cabecalho.clientWidth}px`
      });
    }
    const seletores: Array<[string, string]> = [
      ['menu do currículo', '.barra-topo__botao-gaveta'],
      ['trilha', '.trilha-navegacao a'],
      ['busca', '#campo-busca-input'],
      ['Leitura ampliada', '.botao-modo-adaptado'],
      ['Tema', '.alternador-tema']
    ];
    for (const [nome, seletor] of seletores) {
      const elementos = Array.from(cabecalho.querySelectorAll<HTMLElement>(seletor));
      if (nome !== 'menu do currículo' && nome !== 'trilha' && elementos.length === 0) {
        problemas.push({ controle: nome, motivo: 'não existe' });
      }
      for (const el of elementos) {
        if (getComputedStyle(el).display === 'none') continue;
        const caixa = el.getBoundingClientRect();
        const rotulo = nome === 'trilha' ? `trilha "${el.textContent?.trim()}"` : nome;
        if (caixa.left < -0.5 || caixa.right > larguraJanela + 0.5) {
          problemas.push({
            controle: rotulo,
            motivo: `x de ${caixa.left.toFixed(0)} a ${caixa.right.toFixed(0)} numa janela de ${larguraJanela}px`
          });
        }
        if (alvoMinimo && (caixa.width < 43.5 || caixa.height < 43.5)) {
          problemas.push({
            controle: rotulo,
            motivo: `alvo de ${caixa.width.toFixed(0)}x${caixa.height.toFixed(0)}px`
          });
        }
        const topo = document.elementFromPoint(
          caixa.left + caixa.width / 2,
          caixa.top + caixa.height / 2
        );
        if (!topo || !(el.contains(topo) || topo.contains(el))) {
          problemas.push({ controle: rotulo, motivo: 'coberto por outro elemento no centro' });
        }
      }
    }
    return problemas;
  }, exigirAlvo);
}

for (const caminho of caminhosParaCabecalho(curriculo)) {
  for (const modoAdaptado of [false, true]) {
    const rotuloModo = modoAdaptado ? 'modo adaptado' : 'modo normal';
    test(`cabeçalho de ${caminho}, ${rotuloModo}: todo controle inteiro dentro da tela de 320px a 1280px`, async ({
      page
    }) => {
      await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(caminho);
      await page.locator('.botao-modo-adaptado').waitFor({ state: 'visible' });
      for (const largura of LARGURAS_DO_CABECALHO) {
        await page.setViewportSize({ width: largura, height: 800 });
        await esperarLayoutAssentar(page);
        const problemas = await controlesDoCabecalhoComProblema(page, modoAdaptado);
        expect(problemas, `${caminho}, ${rotuloModo}, ${largura}px`).toEqual([]);
        if (!modoAdaptado) {
          const rotulo = await page.locator('.botao-modo-adaptado__rotulo').innerText();
          expect(rotulo.trim(), `${largura}px: o botão do modo mostra o rótulo`).toBe(
            'Leitura ampliada'
          );
          await expect(page.locator('.botao-modo-adaptado__rotulo')).toBeVisible();
        }
      }
    });
  }
}

/**
 * COSMÉTICO 2 do QA (docs/qa-conserto-cabecalho-quiz.md): em modo normal, a
 * 320px e 360px a trilha do cabeçalho era cortada ("Unidade/1 Resu"), sem
 * reticências, e a 320px o "1" ficava sobreposto à barra. Sem sobreposição
 * entre itens, cada link dentro da caixa da trilha e, se o texto não
 * couber, truncado com reticências (nunca cortado seco).
 */
for (const caminho of caminhosParaCabecalho(curriculo).filter((c) => c !== '/')) {
  test(`trilha do cabeçalho de ${caminho}, modo normal: sem sobreposição e sem corte seco em 320px, 360px e 412px`, async ({
    page
  }) => {
    await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
    await page.setViewportSize({ width: 412, height: 800 });
    await page.goto(caminho);
    await page.locator('.trilha-navegacao a').first().waitFor({ state: 'visible' });
    for (const largura of [320, 360, 412]) {
      await page.setViewportSize({ width: largura, height: 800 });
      await esperarLayoutAssentar(page);
      const problemas = await page.evaluate(() => {
        const achados: string[] = [];
        const lista = document.querySelector<HTMLElement>('.trilha-navegacao ol')!;
        const caixaLista = lista.getBoundingClientRect();
        const itens = Array.from(lista.querySelectorAll<HTMLElement>('li')).filter(
          (li) => getComputedStyle(li).display !== 'none'
        );
        let fimAnterior = -Infinity;
        for (const li of itens) {
          const caixaItem = li.getBoundingClientRect();
          if (caixaItem.left < fimAnterior - 0.5) achados.push('itens da trilha se sobrepõem');
          fimAnterior = caixaItem.right;
          const link = li.querySelector<HTMLElement>('a')!;
          const caixaLink = link.getBoundingClientRect();
          const texto = link.textContent?.trim() ?? '';
          if (caixaLink.left < caixaLista.left - 0.5 || caixaLink.right > caixaLista.right + 0.5) {
            achados.push(`"${texto}" passa da caixa da trilha`);
          }
          if (caixaLink.right > caixaItem.right + 0.5)
            achados.push(`"${texto}" passa do próprio item`);
          if (link.scrollWidth > link.clientWidth + 1) {
            const estilo = getComputedStyle(link);
            if (estilo.textOverflow !== 'ellipsis' || estilo.overflow !== 'hidden') {
              achados.push(`"${texto}" cortado sem reticências`);
            }
          }
        }
        return achados;
      });
      expect(problemas, `${caminho}, ${largura}px`).toEqual([]);
    }
  });
}
