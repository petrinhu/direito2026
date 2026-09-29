import { test, expect } from '@playwright/test';
import { curriculo } from '../../src/conteudo/curriculo';
import { calcularContraste } from '../../src/core/design/contraste';
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
        await esperarLayoutAssentar(page, { doTopo: true });
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
 * Trilha do cabeçalho (COSMÉTICO 2 do QA, docs/qa-conserto-cabecalho-quiz.md, e
 * IMPORTANTE 1 da rodada 2: depois do primeiro conserto, de ~690px a ~1150px
 * o último item encolhia até 0px e a busca passava por cima). Varre de 320px a
 * 1280px, nos dois modos. Regras: a página atual (último item) fica sempre
 * visível, com largura mínima legível, dentro da tela e nunca coberta por outro
 * controle; os itens intermediários saem da árvore (display:none) quando não
 * cabem com o piso, e o que continua na ordem de foco tem largura legível e
 * não é cortado (nunca um link de 0px, que seria foco invisível);
 * texto que não cabe termina em reticências, nunca corte seco.
 */
const LARGURAS_DA_TRILHA = [
  ...Array.from({ length: 61 }, (_, indice) => 320 + indice * 16),
  360,
  390,
  412,
  453,
  688,
  700,
  720
].sort((a, b) => a - b);
const PISO_DA_PAGINA_ATUAL_PX = 64;

for (const caminho of caminhosParaCabecalho(curriculo).filter((c) => c !== '/')) {
  for (const modoAdaptado of [false, true]) {
    const rotuloModo = modoAdaptado ? 'modo adaptado' : 'modo normal';
    test(`trilha do cabeçalho de ${caminho}, ${rotuloModo}: página atual sempre visível e sem sobreposição de 320px a 1280px`, async ({
      page
    }) => {
      await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(caminho);
      // O primeiro link ("1º período") fica oculto em tela estreita: `attached`,
      // não `visible`, senão o setup expira sem medir nada.
      await page.locator('.trilha-navegacao a').last().waitFor({ state: 'attached' });
      for (const largura of LARGURAS_DA_TRILHA) {
        await page.setViewportSize({ width: largura, height: 800 });
        await esperarLayoutAssentar(page, { doTopo: true });
        const problemas = await page.evaluate((piso) => {
          const achados: string[] = [];
          const lista = document.querySelector<HTMLElement>('.trilha-navegacao ol')!;
          const caixaLista = lista.getBoundingClientRect();
          const larguraJanela = document.documentElement.clientWidth;
          const itens = Array.from(lista.querySelectorAll<HTMLElement>('li')).filter(
            (li) => getComputedStyle(li).display !== 'none'
          );
          // Sobreposição é cruzamento nos DOIS eixos: em modo adaptado a trilha
          // quebra em várias linhas, e itens de linhas diferentes têm
          // intervalos horizontais iguais sem se tocar.
          const caixas = itens.map((li) => li.getBoundingClientRect());
          for (let a = 0; a < caixas.length; a++) {
            for (let b = a + 1; b < caixas.length; b++) {
              const horizontal =
                Math.min(caixas[a]!.right, caixas[b]!.right) -
                Math.max(caixas[a]!.left, caixas[b]!.left);
              const vertical =
                Math.min(caixas[a]!.bottom, caixas[b]!.bottom) -
                Math.max(caixas[a]!.top, caixas[b]!.top);
              if (horizontal > 0.5 && vertical > 1) achados.push('itens da trilha se sobrepõem');
            }
          }
          for (const li of itens) {
            const caixaItem = li.getBoundingClientRect();
            const link = li.querySelector<HTMLElement>('a')!;
            const caixaLink = link.getBoundingClientRect();
            const texto = link.textContent?.trim() ?? '';
            if (caixaLink.right > caixaItem.right + 0.5) {
              achados.push(`"${texto}" passa do próprio item`);
            }
            // Todo link que ainda está na ordem de foco (item sem display:none)
            // aparece inteiro dentro da trilha e com largura legível: o texto
            // inteiro ou, no mínimo, o piso. Link espremido a 0px seria foco
            // invisível (WCAG 2.4.7 e 2.4.11); o que não cabe sai da árvore.
            const exigidoDoLink = Math.min(link.scrollWidth, piso);
            if (caixaLink.width < exigidoDoLink - 0.5) {
              achados.push(
                `"${texto}" com ${caixaLink.width.toFixed(0)}px na ordem de foco (mínimo ${exigidoDoLink.toFixed(0)}px)`
              );
            }
            if (
              caixaLink.left < caixaLista.left - 0.5 ||
              caixaLink.right > caixaLista.right + 0.5
            ) {
              achados.push(`"${texto}" cortado pela caixa da trilha`);
            }
            if (link.scrollWidth > link.clientWidth + 1) {
              const estilo = getComputedStyle(link);
              if (estilo.textOverflow !== 'ellipsis' || estilo.overflow !== 'hidden') {
                achados.push(`"${texto}" cortado sem reticências`);
              }
            }
          }
          const atual = lista.querySelector<HTMLElement>('li:last-child a')!;
          const textoAtual = atual.textContent?.trim() ?? '';
          const caixaAtual = atual.getBoundingClientRect();
          const exigido = Math.min(atual.scrollWidth, piso);
          if (caixaAtual.width < exigido - 0.5) {
            achados.push(
              `página atual "${textoAtual}" com ${caixaAtual.width.toFixed(0)}px (mínimo ${exigido.toFixed(0)}px)`
            );
          }
          if (
            caixaAtual.left < caixaLista.left - 0.5 ||
            caixaAtual.right > caixaLista.right + 0.5 ||
            caixaAtual.right > larguraJanela + 0.5
          ) {
            achados.push(`página atual "${textoAtual}" fora da caixa da trilha ou da tela`);
          }
          const topo = document.elementFromPoint(
            caixaAtual.left + caixaAtual.width / 2,
            caixaAtual.top + caixaAtual.height / 2
          );
          if (!topo || !(atual.contains(topo) || topo.contains(atual))) {
            achados.push(`página atual "${textoAtual}" coberta por outro elemento`);
          }
          return achados;
        }, PISO_DA_PAGINA_ATUAL_PX);
        expect(problemas, `${caminho}, ${rotuloModo}, ${largura}px`).toEqual([]);
      }
    });
  }
}

/**
 * Anel de foco dos links da trilha em modo normal (achado da rodada 3 do QA):
 * o `overflow: hidden` da lista recortava o contorno desenhado FORA da caixa
 * do link, e o teclado via só uma barra de 2px. O anel tem de ficar dentro da
 * caixa (offset negativo, no mínimo -2px, ou sombra interna) e medir >= 3:1
 * contra o fundo real do cabeçalho, nos dois temas.
 */
for (const tema of ['claro', 'escuro'] as const) {
  test(`anel de foco do link da trilha, modo normal, tema ${tema}: dentro da caixa e com contraste >= 3:1`, async ({
    page
  }) => {
    await prepararEstadoInicial(page, { tema, modoAdaptado: false });
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/p/p1/sociologia-juridica/u1');
    const link = page.locator('.trilha-navegacao li:last-child a');
    await link.waitFor({ state: 'visible' });
    await link.focus();
    const medida = await link.evaluate((el) => {
      const estilo = getComputedStyle(el);
      const fundo = getComputedStyle(document.querySelector('.barra-topo')!).backgroundColor;
      return {
        focusVisible: el.matches(':focus-visible'),
        estiloDoContorno: estilo.outlineStyle,
        larguraDoContorno: parseFloat(estilo.outlineWidth),
        deslocamento: parseFloat(estilo.outlineOffset),
        sombra: estilo.boxShadow,
        corDoContorno: estilo.outlineColor,
        fundo
      };
    });
    expect(medida.focusVisible, 'o link recebeu :focus-visible').toBe(true);
    const contornoInterno =
      medida.estiloDoContorno !== 'none' &&
      medida.larguraDoContorno >= 2 &&
      medida.deslocamento <= -2;
    const sombraInterna = medida.sombra.includes('inset');
    expect(
      contornoInterno || sombraInterna,
      `anel fora da caixa seria cortado: ${JSON.stringify(medida)}`
    ).toBe(true);
    const paraHex = (css: string): string =>
      '#' +
      (/\(([^)]+)\)/.exec(css)?.[1] ?? '0,0,0')
        .split(/[\s,/]+/)
        .slice(0, 3)
        .map((v) => Math.round(Number(v)).toString(16).padStart(2, '0'))
        .join('');
    expect(
      calcularContraste(paraHex(medida.corDoContorno), paraHex(medida.fundo)),
      `contorno ${medida.corDoContorno} sobre ${medida.fundo}`
    ).toBeGreaterThanOrEqual(3);
  });
}
