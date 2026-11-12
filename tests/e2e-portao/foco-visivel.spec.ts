import { expect, test, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp } from './apoio/acoes';
import { CONTA_ADMIN } from './apoio/constantes';

/**
 * Indicador de foco do teclado visível (A11Y-FOCO). Critério WCAG 2.2: 2.4.7 (foco visível) e
 * 1.4.11 (contraste de componente de interface, 3:1 contra as cores adjacentes). O anel é
 * medido contra o FUNDO REAL atrás dele: com deslocamento zero ou positivo, o anel é desenhado
 * fora da caixa do elemento, sobre o fundo do PAI; com deslocamento negativo, sobre o próprio
 * elemento. Medida por cor computada no navegador (sem espera fixa) e, no rodapé, conferida
 * também por captura de tela pelo QA.
 *
 * Parte A: o link de oferecimento do rodapé, alcançado por Tab, nos três modos e nas duas
 * larguras. Parte B (L-17): varredura de todo elemento que recebe foco por Tab nas páginas
 * inicial, de unidade, de troca de senha e do painel; reprovação fora das regras de anel sobre
 * a superfície escura da lateral só é listada, não afirmada.
 */
const PISO_CONTRASTE = 3;
const PISO_ESPESSURA_PX = 2;
const LIMITE_DE_TABS = 600;
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';

/** As regras de contorno afirmadas na Parte B: as de superfície escura (N1, N3) e as da A11Y-FOCO-2. */
const REGRAS_DA_SUPERFICIE_ESCURA: Record<string, string> = {
  'rodape-oferecimento': '.rodape__link-oferecimento',
  'menu-lateral':
    '.menu-curriculo__botao, .menu-curriculo a, .menu-curriculo__sair, .menu-curriculo__toggle',
  'selo-home': '.selo-home',
  trilha: '.trilha-navegacao a',
  // A11Y-FOCO-2: a faixa da barra do topo é escura nos dois temas e a lista de cadeiras tinha
  // o contorno sem valor de reserva (inexistente fora da Leitura ampliada).
  'barra-alternador-tema': 'button.alternador-tema',
  'barra-modo-adaptado': 'button.botao-modo-adaptado',
  'barra-busca': 'input#campo-busca-input',
  'barra-gaveta': 'button.barra-topo__botao-gaveta',
  'lista-de-cadeiras': 'a.linha',
  // A11Y-FOCO-3: a região rolável da tabela do painel de administração.
  'painel-tabela-rolavel': 'div.ar-tabela-rolavel'
};

/**
 * Item (e): o ponto do meio do traço do anel, nos lados esquerdo e direito e dentro da janela, tem
 * de cair sobre o PRÓPRIO elemento (ou um descendente), e não sobre outra coisa. A cor computada
 * compara o anel com o fundo do pai e não vê o traço desenhado em cima da lateral (A11Y-FOCO-3).
 * Só se afirma onde o anel é desenhado por dentro, que é o conserto da região do painel.
 */
const REGRA_COM_ITEM_E = 'painel-tabela-rolavel';

/**
 * O menu lateral ocupa a largura inteira da lateral (e, a 360, da gaveta): o anel de fora fica
 * sempre rente à borda e é cortado dos lados, nos três modos. A cor do anel passa (item c). O corte
 * é geometria do menu, fora do escopo desta correção: fica listado, não afirmado.
 */
const REGRA_COM_GEOMETRIA_PROPRIA = 'menu-lateral';

type Modo = 'claro' | 'escuro' | 'ampliada';
const MODOS: readonly Modo[] = ['claro', 'escuro', 'ampliada'];
const LARGURAS = [360, 1280] as const;

interface Pagina {
  readonly nome: string;
  readonly caminho: string;
  readonly pronta: string;
}

const PAGINAS: readonly Pagina[] = [
  { nome: 'inicial', caminho: '/', pronta: '.rodape__link-oferecimento' },
  {
    nome: 'unidade',
    caminho: '/p/p1/intr-direito/u1',
    pronta: 'h1'
  },
  { nome: 'troca-de-senha', caminho: '/conta', pronta: '.conta' },
  { nome: 'painel', caminho: '/usuarios', pronta: 'form.ar-admin__criar' }
];

interface MedidaFoco {
  /** O foco está num elemento do documento (não no corpo nem fora dele). */
  readonly temFoco: boolean;
  /** Este elemento já tinha sido visitado nesta varredura: o ciclo de Tab fechou. */
  readonly repetido: boolean;
  readonly seletor: string;
  readonly regra: string | null;
  readonly foraDaTela: boolean;
  readonly focusVisible: boolean;
  readonly tipo: 'outline' | 'box-shadow' | 'nenhum';
  readonly estilo: string;
  readonly espessura: number;
  readonly deslocamento: number;
  readonly corAnel: string;
  readonly corFundo: string;
  readonly fundoComImagem: boolean;
  readonly razao: number;
  readonly cabe: boolean;
  readonly cortadoPor: string;
  /** Caixa do anel e janela, para ler o item (d): esq,topo,dir,base / largura x altura. */
  readonly geometria: string;
  /** Item (e): o que `elementFromPoint` devolve no meio do traço, lados esquerdo e direito. */
  readonly pontos: readonly { lado: string; dentro: boolean; hit: string }[];
}

/**
 * Mede o indicador de foco do elemento focado agora. Roda dentro do navegador: não pode usar
 * nada de fora. Falha alto (lança) em formato de cor que não conhece e em fundo que nunca fica
 * opaco, em vez de assumir branco ou transparente.
 */
async function medirFocoAtual(regras: Record<string, string>): Promise<MedidaFoco> {
  const sem = (campos: Partial<MedidaFoco>): MedidaFoco => ({
    temFoco: false,
    repetido: false,
    seletor: '',
    regra: null,
    foraDaTela: false,
    focusVisible: false,
    tipo: 'nenhum',
    estilo: '',
    espessura: 0,
    deslocamento: 0,
    corAnel: '',
    corFundo: '',
    fundoComImagem: false,
    razao: Number.NaN,
    cabe: false,
    cortadoPor: '',
    geometria: '',
    pontos: [],
    ...campos
  });

  const TOLERANCIA = 0.5;
  const ativo = document.activeElement as HTMLElement | null;
  if (!ativo || ativo === document.body || ativo === document.documentElement) return sem({});

  const janela = window as unknown as { __focoVistos?: WeakSet<HTMLElement> };
  const vistos = (janela.__focoVistos ??= new WeakSet<HTMLElement>());
  if (vistos.has(ativo)) return sem({ temFoco: true, repetido: true });
  vistos.add(ativo);

  const el = ativo as HTMLElement;
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  const transicoes = document
    .getAnimations()
    .filter((a) => a.constructor.name === 'CSSTransition')
    .map((a) => a.finished.catch(() => undefined));
  await Promise.all(transicoes);
  await new Promise<void>((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok())));

  const ler = (texto: string): [number, number, number, number] => {
    const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(
      texto.trim()
    );
    if (!m) throw new Error(`formato de cor não previsto: ${texto}`);
    const alfa =
      m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [parseFloat(m[1]!), parseFloat(m[2]!), parseFloat(m[3]!), alfa];
  };
  const sobre = (
    topo: [number, number, number, number],
    base: [number, number, number, number]
  ): [number, number, number, number] => [
    topo[0] * topo[3] + base[0] * (1 - topo[3]),
    topo[1] * topo[3] + base[1] * (1 - topo[3]),
    topo[2] * topo[3] + base[2] * (1 - topo[3]),
    1
  ];
  const luminancia = (c: [number, number, number, number]): number => {
    const canal = (v: number): number => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]);
  };
  const texto = (c: [number, number, number, number]): string =>
    `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

  const cs = getComputedStyle(el);
  const px = (v: string): number => parseFloat(v);
  let tipo: MedidaFoco['tipo'] = 'nenhum';
  let estilo = cs.outlineStyle;
  let espessura = px(cs.outlineWidth);
  let deslocamento = px(cs.outlineOffset);
  let anel: [number, number, number, number] = ler(cs.outlineColor);
  if (estilo !== 'none' && estilo !== 'hidden' && espessura > 0) {
    tipo = 'outline';
  } else {
    const camada =
      /(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?!\s+inset)/.exec(
        cs.boxShadow
      );
    if (camada && !cs.boxShadow.includes('inset')) {
      tipo = 'box-shadow';
      anel = ler(camada[1]!);
      estilo = 'solid';
      espessura = parseFloat(camada[5]!);
      deslocamento = 0;
    }
  }

  const camadas: [number, number, number, number][] = [];
  let fundoComImagem = false;
  let no: HTMLElement | null = deslocamento < 0 ? el : el.parentElement;
  let opaco = false;
  while (no) {
    const estiloNo = getComputedStyle(no);
    const cor = ler(estiloNo.backgroundColor);
    if (cor[3] > 0) {
      camadas.push(cor);
      if (estiloNo.backgroundImage !== 'none') fundoComImagem = true;
      if (cor[3] >= 1) {
        opaco = true;
        break;
      }
    }
    if (estiloNo.backgroundImage !== 'none') fundoComImagem = true;
    no = no.parentElement;
  }
  if (!opaco) throw new Error('nenhum fundo opaco acima do elemento focado');
  let fundo: [number, number, number, number] = camadas[camadas.length - 1]!;
  for (let i = camadas.length - 2; i >= 0; i -= 1) fundo = sobre(camadas[i]!, fundo);
  const anelSobreFundo = sobre(anel, fundo);
  const clara = Math.max(luminancia(anelSobreFundo), luminancia(fundo));
  const escura = Math.min(luminancia(anelSobreFundo), luminancia(fundo));
  const razao = (clara + 0.05) / (escura + 0.05);

  const r = el.getBoundingClientRect();
  const larguraJanela = document.documentElement.clientWidth;
  const alturaJanela = window.innerHeight;
  const foraDaTela =
    r.right <= 0 || r.left >= larguraJanela || r.bottom <= 0 || r.top >= alturaJanela;
  const extensao = deslocamento + espessura;
  const caixa = {
    esq: r.left - extensao,
    topo: r.top - extensao,
    dir: r.right + extensao,
    base: r.bottom + extensao
  };
  // Elemento mais alto que a janela não cabe na vertical por definição: só o eixo horizontal vale.
  const maisAltoQueAJanela = r.height > alturaJanela + TOLERANCIA;
  let cortadoPor = '';
  if (
    caixa.esq < -TOLERANCIA ||
    caixa.dir > larguraJanela + TOLERANCIA ||
    (!maisAltoQueAJanela && (caixa.topo < -TOLERANCIA || caixa.base > alturaJanela + TOLERANCIA))
  ) {
    cortadoPor = 'janela';
  }
  for (let pai = el.parentElement; pai && !cortadoPor; pai = pai.parentElement) {
    if (pai === document.body || pai === document.documentElement) break;
    const ps = getComputedStyle(pai);
    const rp = pai.getBoundingClientRect();
    if (rp.width === 0 && rp.height === 0) continue;
    const esq = rp.left + pai.clientLeft;
    const topo = rp.top + pai.clientTop;
    const clipaX = ps.overflowX !== 'visible';
    const clipaY = ps.overflowY !== 'visible';
    if (
      (clipaX &&
        (caixa.esq < esq - TOLERANCIA || caixa.dir > esq + pai.clientWidth + TOLERANCIA)) ||
      (clipaY &&
        (caixa.topo < topo - TOLERANCIA || caixa.base > topo + pai.clientHeight + TOLERANCIA))
    ) {
      cortadoPor = `${pai.tagName.toLowerCase()}${pai.className ? '.' + String(pai.className).split(/\s+/)[0] : ''}`;
    }
  }

  const meioDoTraco = deslocamento + espessura / 2;
  const yDoMeio = (r.top + r.bottom) / 2;
  const descrever = (no: { tagName: string; className: unknown } | null): string =>
    no === null
      ? 'nada'
      : `${no.tagName.toLowerCase()}${typeof no.className === 'string' && no.className ? '.' + no.className.split(/\s+/)[0] : ''}`;
  const pontos: { lado: string; dentro: boolean; hit: string }[] = [];
  for (const [lado, x] of [
    ['esq', r.left - meioDoTraco],
    ['dir', r.right + meioDoTraco]
  ] as const) {
    if (x < 0 || x >= larguraJanela || yDoMeio < 0 || yDoMeio >= alturaJanela) continue;
    const topo = document.elementFromPoint(x, yDoMeio);
    pontos.push({
      lado,
      dentro: topo !== null && (topo === el || el.contains(topo)),
      hit: descrever(topo)
    });
  }

  let regra: string | null = null;
  for (const [nome, seletorRegra] of Object.entries(regras)) {
    if (el.matches(seletorRegra)) regra = nome;
  }
  const classe =
    typeof el.className === 'string' && el.className ? '.' + el.className.split(/\s+/)[0] : '';
  const nomeCurto = (el.getAttribute('aria-label') ?? el.textContent ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 24);

  return {
    temFoco: true,
    repetido: false,
    seletor: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${classe}[${nomeCurto}]`,
    regra,
    foraDaTela,
    focusVisible: el.matches(':focus-visible'),
    tipo,
    estilo,
    espessura,
    deslocamento,
    corAnel: texto(anel),
    corFundo: texto(fundo),
    fundoComImagem,
    razao,
    cabe: cortadoPor === '',
    cortadoPor,
    pontos,
    geometria: `${Math.round(caixa.esq)},${Math.round(caixa.topo)},${Math.round(caixa.dir)},${Math.round(caixa.base)} / ${larguraJanela}x${alturaJanela}`
  };
}

test.beforeEach(() => resetarPrivado());

async function prepararModo(page: Page, modo: Modo): Promise<void> {
  await page.emulateMedia({ colorScheme: modo === 'escuro' ? 'dark' : 'light' });
  if (modo === 'ampliada') {
    await page.addInitScript((chave) => localStorage.setItem(chave, 'true'), CHAVE_MODO_ADAPTADO);
  }
}

async function abrirPagina(page: Page, pagina: Pagina, largura: number): Promise<void> {
  await page.setViewportSize({ width: largura, height: largura === 360 ? 740 : 800 });
  await page.goto(pagina.caminho);
  await expect(page.locator(pagina.pronta).first()).toBeVisible();
  await page.waitForLoadState('networkidle');
}

/** Uma tecla Tab liga a modalidade de teclado; sem ela o foco por script não casa com :focus-visible. */
async function ligarModalidadeDeTeclado(page: Page): Promise<void> {
  await page.keyboard.press('Tab');
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

function reprovacoes(m: MedidaFoco, ignorarForaDaTela: boolean): string[] {
  const itens: string[] = [];
  if (!m.focusVisible) itens.push('a');
  if (m.estilo !== 'solid' || !(m.espessura >= PISO_ESPESSURA_PX)) itens.push('b');
  if (!(m.razao >= PISO_CONTRASTE)) itens.push('c');
  if (!m.cabe && !(ignorarForaDaTela && m.foraDaTela)) itens.push('d');
  if (m.regra === REGRA_COM_ITEM_E && m.pontos.some((p) => !p.dentro)) itens.push('e');
  return itens;
}

function linha(
  pagina: string,
  modo: Modo,
  largura: number,
  m: MedidaFoco,
  itens: string[]
): string {
  return [
    'FOCO',
    pagina,
    modo,
    largura,
    m.seletor,
    m.regra ?? '-',
    `${m.tipo}:${m.estilo}:${m.espessura}px+${m.deslocamento}px`,
    `anel=${m.corAnel}`,
    `fundo=${m.corFundo}${m.fundoComImagem ? '+img' : ''}`,
    `razao=${Number.isFinite(m.razao) ? m.razao.toFixed(2) : 'NaN'}`,
    `itens=${itens.join('') || '-'}`,
    m.cortadoPor ? `cortado-por=${m.cortadoPor} caixa=${m.geometria}` : '',
    m.regra === REGRA_COM_ITEM_E
      ? `pontos=${m.pontos.map((p) => `${p.lado}:${p.dentro ? 'dentro' : 'FORA'}(${p.hit})`).join(',')}`
      : '',
    m.foraDaTela ? 'fora-da-tela' : ''
  ]
    .filter((c) => c !== '')
    .join(' | ');
}

/** Alvos da Parte A: o primeiro elemento que casa com o seletor, alcançado por Tab. */
interface AlvoA {
  readonly nome: string;
  readonly seletor: string;
  readonly larguras: readonly number[];
  /** Página em que o alvo é procurado; por padrão, a inicial. */
  readonly pagina?: Pagina;
}

const ALVOS_A: readonly AlvoA[] = [
  {
    nome: 'link de oferecimento do rodapé',
    seletor: '.rodape__link-oferecimento',
    larguras: LARGURAS
  },
  {
    nome: 'alternador de tema da barra do topo',
    seletor: 'button.alternador-tema',
    larguras: LARGURAS
  },
  {
    nome: 'botão do modo de leitura da barra do topo',
    seletor: 'button.botao-modo-adaptado',
    larguras: LARGURAS
  },
  {
    nome: 'campo de busca da barra do topo',
    seletor: 'input#campo-busca-input',
    larguras: LARGURAS
  },
  // A gaveta do menu só existe na barra a 360 px.
  {
    nome: 'botão da gaveta da barra do topo',
    seletor: 'button.barra-topo__botao-gaveta',
    larguras: [360]
  },
  { nome: 'primeira linha da lista de cadeiras', seletor: 'a.linha', larguras: LARGURAS },
  // A11Y-FOCO-3: a região rolável da tabela do painel, mais alta que a janela.
  {
    nome: 'região rolável da tabela do painel',
    seletor: 'div.ar-tabela-rolavel',
    larguras: LARGURAS,
    pagina: PAGINAS[3]!
  }
];

for (const alvo of ALVOS_A) {
  for (const modo of MODOS) {
    for (const largura of alvo.larguras) {
      test(`A: ${alvo.nome} mostra o contorno de foco (${modo}, ${largura} px)`, async ({
        page
      }) => {
        await prepararModo(page, modo);
        await entrarNoApp(page, CONTA_ADMIN, '/');
        await abrirPagina(page, alvo.pagina ?? PAGINAS[0]!, largura);
        await ligarModalidadeDeTeclado(page);

        let chegou = false;
        for (let i = 0; i < LIMITE_DE_TABS && !chegou; i += 1) {
          await page.keyboard.press('Tab');
          chegou = await page.evaluate(
            (seletor) => document.activeElement?.matches(seletor) ?? false,
            alvo.seletor
          );
        }
        expect(chegou, `Tab chegou a ${alvo.nome}`).toBe(true);

        const m = await page.evaluate(medirFocoAtual, REGRAS_DA_SUPERFICIE_ESCURA);
        const itens = reprovacoes(m, false);
        console.log(linha(alvo.pagina?.nome ?? 'inicial', modo, largura, m, itens));
        expect(m.focusVisible, '(a) casa com :focus-visible').toBe(true);
        expect(m.estilo, '(b) contorno sólido').toBe('solid');
        expect(m.espessura, '(b) espessura do contorno em px').toBeGreaterThanOrEqual(
          PISO_ESPESSURA_PX
        );
        expect(
          m.razao,
          `(c) contraste do contorno ${m.corAnel} contra o fundo real ${m.corFundo}`
        ).toBeGreaterThanOrEqual(PISO_CONTRASTE);
        expect(m.cabe, `(d) a caixa do anel cabe (cortada por: ${m.cortadoPor})`).toBe(true);
        if (m.regra === REGRA_COM_ITEM_E) {
          const fora = m.pontos.filter((ponto) => !ponto.dentro);
          expect(
            fora.map((ponto) => `${ponto.lado}: ${ponto.hit}`),
            '(e) o anel está desenhado sobre a própria região, não sobre outro elemento'
          ).toEqual([]);
          expect(
            m.pontos.length,
            '(e) ao menos um lado do anel está dentro da janela'
          ).toBeGreaterThan(0);
        }
      });
    }
  }
}

interface Passagem {
  readonly encontrados: number;
  readonly analisados: number;
  readonly medidas: readonly MedidaFoco[];
}

/** Percorre a página por Tab até o ciclo fechar; mede cada parada. */
async function percorrerPorTab(page: Page): Promise<Passagem> {
  await ligarModalidadeDeTeclado(page);
  await page.evaluate(() => {
    (window as unknown as { __focoVistos?: WeakSet<HTMLElement> }).__focoVistos = new WeakSet();
  });
  const medidas: MedidaFoco[] = [];
  let encontrados = 0;
  let semFocoSeguidos = 0;
  for (let i = 0; i < LIMITE_DE_TABS; i += 1) {
    await page.keyboard.press('Tab');
    const m = await page.evaluate(medirFocoAtual, REGRAS_DA_SUPERFICIE_ESCURA);
    if (m.repetido) return { encontrados, analisados: medidas.length, medidas };
    if (!m.temFoco) {
      semFocoSeguidos += 1;
      if (semFocoSeguidos > 2) return { encontrados, analisados: medidas.length, medidas };
      continue;
    }
    semFocoSeguidos = 0;
    encontrados += 1;
    if (Number.isFinite(m.razao) && m.corAnel !== '' && m.corFundo !== '') medidas.push(m);
  }
  throw new Error(`a varredura por Tab não fechou o ciclo em ${LIMITE_DE_TABS} paradas`);
}

for (const modo of MODOS) {
  test(`B: varredura de todo elemento que recebe foco por Tab (${modo})`, async ({ page }) => {
    test.setTimeout(300_000);
    await prepararModo(page, modo);
    await entrarNoApp(page, CONTA_ADMIN, '/');

    let encontrados = 0;
    let analisados = 0;
    let falharam = 0;
    const reprovadosDasRegras: string[] = [];
    const medidosPorRegra = new Map<string, number>();

    const passagens: { nome: string; largura: number; gaveta: boolean }[] = [];
    for (const largura of LARGURAS) {
      for (const pagina of PAGINAS) passagens.push({ nome: pagina.nome, largura, gaveta: false });
    }
    passagens.push({ nome: 'inicial', largura: 360, gaveta: true });

    const feitas: string[] = [];
    for (const { nome, largura, gaveta } of passagens) {
      const pagina = PAGINAS.find((p) => p.nome === nome)!;
      await abrirPagina(page, pagina, largura);
      if (gaveta) {
        await page.locator('.barra-topo__botao-gaveta').click();
        await expect(page.locator('.menu-curriculo').first()).toBeVisible();
      }
      const rotulo = gaveta ? `${nome}+gaveta` : nome;
      const passagem = await percorrerPorTab(page);
      expect(
        passagem.encontrados,
        `paradas de Tab em ${rotulo} (${modo}, ${largura})`
      ).toBeGreaterThan(0);
      expect(passagem.analisados, `medidos em ${rotulo} (${modo}, ${largura})`).toBe(
        passagem.encontrados
      );
      feitas.push(`${rotulo} ${largura}`);
      console.log(
        `FOCO-PASSAGEM | modo=${modo} | ${rotulo} | ${largura} | encontrados=${passagem.encontrados}`
      );
      encontrados += passagem.encontrados;
      analisados += passagem.analisados;
      for (const m of passagem.medidas) {
        if (m.regra) medidosPorRegra.set(m.regra, (medidosPorRegra.get(m.regra) ?? 0) + 1);
        const itens = reprovacoes(m, true);
        if (itens.length === 0) continue;
        falharam += 1;
        const afirmados =
          m.regra === REGRA_COM_GEOMETRIA_PROPRIA ? itens.filter((i) => i !== 'd') : itens;
        const texto = linha(rotulo, modo, largura, m, itens);
        console.log(
          `${m.regra === null ? 'FORA-DO-ESCOPO' : afirmados.length > 0 ? 'AFIRMADO' : 'LISTADO'} ${texto}`
        );
        if (m.regra && afirmados.length > 0) reprovadosDasRegras.push(texto);
      }
    }

    console.log(
      `FOCO-TOTAL | modo=${modo} | ENCONTRADOS=${encontrados} ANALISADOS=${analisados} FALHARAM=${falharam}`
    );
    // Lista escrita por extenso, de propósito: não é a que o laço percorre. Uma página que saia
    // do laço não muda a igualdade entre ANALISADOS e ENCONTRADOS (cada passagem se compara só
    // consigo mesma), mas muda esta lista.
    expect(feitas, 'as nove passagens da varredura, na ordem').toEqual([
      'inicial 360',
      'unidade 360',
      'troca-de-senha 360',
      'painel 360',
      'inicial 1280',
      'unidade 1280',
      'troca-de-senha 1280',
      'painel 1280',
      'inicial+gaveta 360'
    ]);
    for (const regra of Object.keys(REGRAS_DA_SUPERFICIE_ESCURA)) {
      console.log(
        `FOCO-REGRA | modo=${modo} | ${regra} medidos=${medidosPorRegra.get(regra) ?? 0}`
      );
      expect(
        medidosPorRegra.get(regra) ?? 0,
        `a varredura mediu ao menos um elemento da regra ${regra} (${modo})`
      ).toBeGreaterThan(0);
    }
    expect(encontrados, 'varredura vazia').toBeGreaterThan(0);
    expect(analisados, 'analisados igual a encontrados').toBe(encontrados);
    expect(reprovadosDasRegras, 'elementos das regras de anel da superfície escura').toEqual([]);
  });
}
