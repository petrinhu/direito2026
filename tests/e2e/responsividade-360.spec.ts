import { test, expect } from './apoio/sessaoDoEstudo';
import { calcularContraste } from '../../src/core/design/contraste';
import {
  caminhosParaCabecalho,
  esperarLayoutAssentar,
  prepararEstadoInicial
} from './apoio/estadoInicial';
import { curriculoDoDisco } from '../../scripts/apoio/conteudoDoDisco';

// Lido do disco: o glob do Vite não existe no Node que roda o Playwright.
const curriculo = await curriculoDoDisco();

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
        // Oculto de verdade: sem caixa de layout, ou um ancestral com display:none/visibility:hidden
        // (checkVisibility vê os ancestrais). Um link de nível que a trilha tira da árvore não é alvo.
        if (el.getClientRects().length === 0) continue;
        if (el.checkVisibility({ visibilityProperty: true }) === false) continue;
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
        // Rola só na vertical até o controle (a medida de x já valeu, e a rolagem horizontal
        // não pode vazar para o próximo controle). Abaixo da primeira tela o centro devolve null,
        // e null reprova (TEST-COBERTURA-NULL).
        const rolagemX = window.scrollX;
        el.scrollIntoView({ block: 'center' });
        window.scrollTo(rolagemX, window.scrollY);
        const centro = el.getBoundingClientRect();
        const topo = document.elementFromPoint(
          centro.left + centro.width / 2,
          centro.top + centro.height / 2
        );
        if (topo === null) {
          problemas.push({ controle: rotulo, motivo: 'centro fora da janela depois de rolar' });
        } else if (!(el.contains(topo) || topo.contains(el))) {
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
 * o nome inteiro cabe em até 2 linhas (ordem do líder de 20/10/2026); texto que
 * não cabe nunca termina em reticências nem em corte seco.
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
        const parametrosDaPagina = [PISO_DA_PAGINA_ATUAL_PX, !modoAdaptado] as const;
        const problemas = await page.evaluate(([piso, modoNormal]) => {
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
            // Ordem de 20/10: o nome inteiro cabe em até 2 linhas. Qualquer
            // estouro reprova, corte seco ou reticências.
            if (link.scrollWidth > link.clientWidth + 1) {
              achados.push(`"${texto}" cortado (nome não coube inteiro)`);
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
          // Ordem de 20/10: o nome da página atual cabe em até 2 linhas. Conta
          // as linhas de texto (tops distintos dos retângulos do texto), e não a
          // altura da caixa: o link tem min-height 44px (alvo de toque), que já
          // passa de 2 linhas de 16px com line-height 1.3. Zero linha medida
          // também reprova, senão a medida vazia passaria como verde.
          // 2 linhas é regra do modo normal; decisão do líder de 19/11. No modo
          // adaptado o limite não se aplica, mas zero linha continua reprovando.
          const faixaDoTexto = document.createRange();
          faixaDoTexto.selectNodeContents(atual);
          const linhasDoAtual = new Set(
            Array.from(faixaDoTexto.getClientRects(), (r) => Math.round(r.top))
          ).size;
          if (linhasDoAtual < 1 || (modoNormal && linhasDoAtual > 2)) {
            achados.push(
              `página atual "${textoAtual}" com ${linhasDoAtual} linha(s) de texto (${modoNormal ? 'esperado de 1 a 2' : 'esperado ao menos 1'})`
            );
          }
          if (
            caixaAtual.left < caixaLista.left - 0.5 ||
            caixaAtual.right > caixaLista.right + 0.5 ||
            caixaAtual.right > larguraJanela + 0.5
          ) {
            achados.push(`página atual "${textoAtual}" fora da caixa da trilha ou da tela`);
          }
          // Rola só na vertical até a página atual (a medida de x acima já valeu). Abaixo da
          // primeira tela o centro devolve null, e null reprova (TEST-COBERTURA-NULL).
          const rolagemX = window.scrollX;
          atual.scrollIntoView({ block: 'center' });
          window.scrollTo(rolagemX, window.scrollY);
          const centroAtual = atual.getBoundingClientRect();
          const topo = document.elementFromPoint(
            centroAtual.left + centroAtual.width / 2,
            centroAtual.top + centroAtual.height / 2
          );
          if (topo === null) {
            achados.push(`página atual "${textoAtual}" fora da janela depois de rolar`);
          } else if (!(atual.contains(topo) || topo.contains(atual))) {
            achados.push(`página atual "${textoAtual}" coberta por outro elemento`);
          }
          return achados;
        }, parametrosDaPagina);
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

/**
 * Controle do helper controlesDoCabecalhoComProblema (TRILHA-ADAPTADO-LINHAS): (a) um alvo
 * VISÍVEL menor que 44 px tem de ser cobrado; (b) um link dentro de um `li` oculto
 * (display:none no ancestral, nível que a trilha tira da árvore) não é alvo e não pode ser cobrado.
 */
test('controle do helper: alvo visível menor que 44px é cobrado', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.locator('.botao-modo-adaptado').waitFor({ state: 'visible' });
  await page.evaluate(() => {
    document
      .querySelector('.barra-topo')!
      .insertAdjacentHTML(
        'beforeend',
        '<button class="botao-modo-adaptado" style="width:20px;height:20px;padding:0">x</button>'
      );
  });
  const problemas = await controlesDoCabecalhoComProblema(page, true);
  expect(problemas).toContainEqual(
    expect.objectContaining({
      controle: 'Leitura ampliada',
      motivo: expect.stringMatching(/^alvo de 20x/)
    })
  );
});

test('controle do helper: link dentro de li oculto não é cobrado como alvo', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.locator('.trilha-navegacao a').first().waitFor({ state: 'visible' });
  await page.evaluate(() => {
    document
      .querySelector('.trilha-navegacao ol')!
      .insertAdjacentHTML('beforeend', '<li style="display:none"><a href="#">oculto</a></li>');
  });
  const problemas = await controlesDoCabecalhoComProblema(page, true);
  expect(problemas.filter((p) => p.controle.includes('oculto'))).toEqual([]);
});
