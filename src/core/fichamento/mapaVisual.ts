import { construirArvoreMapa, idsExpansiveis, percorrer } from './arvoreMapa';
import type { MapaFichamento, NoMapa } from './tipos';

/** Raio de cada anel, do centro para fora: raiz, período, pensador, detalhe, conceito. */
const RAIOS = [0, 180, 340, 520, 700, 880] as const;

export interface NoPosicionado {
  readonly no: NoMapa;
  readonly x: number;
  readonly y: number;
  /** 0 na raiz. */
  readonly profundidade: number;
  /** Índice do ramo (tom): o de cada pensador, herdado por tudo que sai dele. */
  readonly ramo: number;
  readonly paiId?: string;
}

/**
 * Árvore do mapa visual: a mesma da lista, sem o nível de fase (o pensador
 * fica direto sob o período, para o mapa começar mostrando períodos e
 * pensadores).
 */
export function arvoreVisual(dados: MapaFichamento): NoMapa {
  const completa = construirArvoreMapa(dados);
  return {
    ...completa,
    filhos: completa.filhos.map((era) => ({
      ...era,
      filhos: era.filhos
        .flatMap((fase) => fase.filhos)
        // O atalho "Ler a ficha completa" vira link no painel de detalhe.
        .map((pensador) => ({
          ...pensador,
          filhos: pensador.filhos.filter((no) => no.tipo !== 'ficha')
        }))
    }))
  };
}

/** Texto da cápsula: rótulo curto se houver, senão o rótulo, cortado com reticências. */
export function rotuloVisual(no: NoMapa, maximo: number): string {
  const texto = no.rotuloCurto ?? no.rotulo;
  return texto.length <= maximo ? texto : `${texto.slice(0, maximo - 1).trimEnd()}…`;
}

/** Começo do mapa: a raiz e os períodos abertos; os pensadores fechados. */
export function abertosIniciaisVisual(raiz: NoMapa): Set<string> {
  return new Set([raiz.id, ...raiz.filhos.filter((e) => e.filhos.length > 0).map((e) => e.id)]);
}

export function todosAbertos(raiz: NoMapa): string[] {
  return idsExpansiveis(raiz);
}

/**
 * "Abrir todos os ramos": a raiz, os períodos e todos os pensadores abertos
 * (aparece o modo de pensar de cada um), mas os conceitos continuam fechados,
 * senão as cápsulas não cabem.
 */
export function abertosTodosVisual(raiz: NoMapa): Set<string> {
  const abertos = abertosIniciaisVisual(raiz);
  for (const era of raiz.filhos)
    for (const p of era.filhos) if (p.filhos.length > 0) abertos.add(p.id);
  return abertos;
}

/** Um só botão: abre tudo se algo está fechado; recolhe ao começo se tudo está aberto. */
export function alternarTodosRamos(raiz: NoMapa, abertos: ReadonlySet<string>): Set<string> {
  const todos = abertosTodosVisual(raiz);
  const tudoAberto = [...todos].every((id) => abertos.has(id));
  return tudoAberto ? abertosIniciaisVisual(raiz) : todos;
}

/**
 * Abre ou fecha um ramo. Acordeão: abrir um pensador fecha os outros do mesmo
 * período (hemisfério), para o mapa não se amontoar.
 */
export function alternarRamo(raiz: NoMapa, abertos: ReadonlySet<string>, id: string): Set<string> {
  const novo = new Set(abertos);
  if (novo.has(id)) {
    novo.delete(id);
    return novo;
  }
  novo.add(id);
  const era = raiz.filhos.find((e) => e.filhos.some((p) => p.id === id));
  if (era) {
    for (const irmao of era.filhos) {
      if (irmao.id === id) continue;
      novo.delete(irmao.id);
      for (const neto of percorrer(irmao)) novo.delete(neto.id);
    }
  }
  return novo;
}

export interface MedidaDoNo {
  readonly linhas: readonly string[];
  readonly fonte: number;
  readonly alturaLinha: number;
  readonly largura: number;
  readonly altura: number;
}

/** Tamanho da cápsula por nível: o centro é maior, os períodos são hubs. */
export function dimensionar(
  no: NoMapa,
  profundidade: number,
  medir: (texto: string, fonte: number, peso: number) => number,
  /** Largura total máxima da cápsula; com ela o texto quebra em quantas linhas precisar. */
  larguraMaxima?: number
): MedidaDoNo {
  const e =
    profundidade === 0
      ? { fonte: 18, peso: 800, maxTexto: 170, minAltura: 60, folga: 40 }
      : profundidade === 1
        ? { fonte: 16, peso: 800, maxTexto: 150, minAltura: 44, folga: 40 }
        : { fonte: 14, peso: 700, maxTexto: 160, minAltura: 32, folga: 30 };
  const texto = no.rotuloCurto ?? no.rotulo;
  const maxTexto =
    larguraMaxima === undefined
      ? e.maxTexto
      : Math.max(60, Math.min(e.maxTexto, larguraMaxima - e.folga));
  const linhas = quebrarRotulo(
    texto,
    maxTexto,
    (s) => medir(s, e.fonte, e.peso),
    larguraMaxima === undefined ? 3 : 20
  );
  const larguraTexto = Math.max(...linhas.map((l) => medir(l, e.fonte, e.peso)));
  const alturaLinha = e.fonte * 1.25;
  return {
    linhas,
    fonte: e.fonte,
    alturaLinha,
    largura: Math.ceil(larguraTexto + e.folga),
    altura: Math.max(e.minAltura, Math.ceil(linhas.length * alturaLinha + 16))
  };
}

export interface OpcoesLayout {
  /** Horizontal: Antiguidade à esquerda e Idade Média à direita. Vertical: em cima e embaixo. */
  readonly orientacao?: 'horizontal' | 'vertical';
  /** Tamanho real da cápsula de cada nó; o anel e a fatia de ângulo reservam esse espaço. */
  readonly medida?: (no: NoMapa, profundidade: number) => { largura: number; altura: number };
}

/** Recuo de cada nível na lista indentada. */
export const RECUO_INDENTADO = 56;

const MEDIDA_PADRAO = { largura: 150, altura: 32 };

/**
 * Disposição radial em dois hemisférios: a raiz no centro, um período por
 * hemisfério, e cada nó com uma fatia de ângulo proporcional ao ESPAÇO real
 * que a subárvore dele ocupa (tamanho das cápsulas), e anéis tão largos
 * quanto preciso para nenhuma cápsula cobrir outra.
 */
export function layoutRadial(
  raiz: NoMapa,
  abertos: ReadonlySet<string>,
  opcoes: OpcoesLayout = {}
): NoPosicionado[] {
  const saida: NoPosicionado[] = [];
  const medidaDe = opcoes.medida ?? (() => MEDIDA_PADRAO);
  const filhosVisiveis = (no: NoMapa): readonly NoMapa[] => (abertos.has(no.id) ? no.filhos : []);

  const arco = (no: NoMapa, profundidade: number): number => {
    const m = medidaDe(no, profundidade);
    return Math.hypot(m.largura, m.altura) * 1.1 + 8;
  };
  const pesos = new Map<string, number>();
  const somaDosFilhos = new Map<string, number>();
  const maiorLargura: number[] = [];
  const calcular = (no: NoMapa, profundidade: number): number => {
    const filhos = filhosVisiveis(no);
    const soma = filhos.reduce((s, f) => s + calcular(f, profundidade + 1), 0);
    somaDosFilhos.set(no.id, soma);
    const peso = Math.max(arco(no, profundidade), soma);
    pesos.set(no.id, peso);
    maiorLargura[profundidade] = Math.max(
      maiorLargura[profundidade] ?? 0,
      medidaDe(no, profundidade).largura
    );
    return peso;
  };
  calcular(raiz, 0);

  // Raio mínimo para a fatia de cada período comportar os pensadores dele.
  const eras = filhosVisiveis(raiz);
  const anguloDaEra = eras.length > 0 ? (2 * Math.PI) / eras.length : 2 * Math.PI;
  const raioMinimoDoAnel = Math.max(
    0,
    ...eras.map((e) => (somaDosFilhos.get(e.id) ?? 0) / anguloDaEra)
  );

  const raios: number[] = [0];
  for (let d = 1; d < maiorLargura.length; d++) {
    const base = RAIOS[Math.min(d, RAIOS.length - 1)]!;
    const folga = ((maiorLargura[d - 1] ?? 0) + (maiorLargura[d] ?? 0)) / 2 + 16;
    raios[d] = Math.max(base, raios[d - 1]! + folga, d >= 2 ? raioMinimoDoAnel : 0);
  }

  // O tom de cada pensador vem da ordem na árvore COMPLETA, para não mudar ao abrir e fechar.
  const ramoDoPensador = new Map<string, number>();
  let proximoRamo = 0;
  for (const era of raiz.filhos)
    for (const p of era.filhos) ramoDoPensador.set(p.id, proximoRamo++);

  const posicionar = (
    no: NoMapa,
    inicio: number,
    fim: number,
    profundidade: number,
    ramo: number,
    paiId?: string
  ): void => {
    const angulo = (inicio + fim) / 2;
    const raio = raios[profundidade] ?? 0;
    saida.push({
      no,
      x: Math.round(raio * Math.cos(angulo) * 10) / 10 + 0,
      y: Math.round(raio * Math.sin(angulo) * 10) / 10 + 0,
      profundidade,
      ramo,
      paiId
    });
    const filhos = filhosVisiveis(no);
    const total = somaDosFilhos.get(no.id) ?? 0;
    let cursor = inicio;
    filhos.forEach((filho, indice) => {
      // Cada período recebe um hemisfério inteiro, qualquer que seja o número de pensadores.
      const fatia =
        profundidade === 0
          ? (fim - inicio) / filhos.length
          : ((fim - inicio) * (pesos.get(filho.id) ?? 0)) / total;
      const ramoFilho = profundidade === 0 ? indice : (ramoDoPensador.get(filho.id) ?? ramo);
      posicionar(filho, cursor, cursor + fatia, profundidade + 1, ramoFilho, no.id);
      cursor += fatia;
    });
  };

  const inicioDoGiro = opcoes.orientacao === 'vertical' ? Math.PI : Math.PI / 2;
  posicionar(raiz, inicioDoGiro, inicioDoGiro + 2 * Math.PI, 0, 0);
  return saida;
}

/**
 * Layout de tela estreita: lista indentada de cápsulas, de cima para baixo (a
 * raiz, os períodos, os pensadores...), cada nível recuado. Cabe na largura de
 * um celular e a altura cresce com o conteúdo.
 */
export function layoutIndentado(
  raiz: NoMapa,
  abertos: ReadonlySet<string>,
  opcoes: { medida?: OpcoesLayout['medida']; recuo?: number; espaco?: number } = {}
): NoPosicionado[] {
  const medidaDe = opcoes.medida ?? (() => MEDIDA_PADRAO);
  const recuo = opcoes.recuo ?? RECUO_INDENTADO;
  const espaco = opcoes.espaco ?? 14;
  const ramoDoPensador = new Map<string, number>();
  let proximo = 0;
  for (const era of raiz.filhos) for (const p of era.filhos) ramoDoPensador.set(p.id, proximo++);

  const saida: NoPosicionado[] = [];
  let y = 0;
  const visitar = (
    no: NoMapa,
    profundidade: number,
    ramo: number,
    paiId?: string,
    indiceEra = 0
  ): void => {
    const m = medidaDe(no, profundidade);
    y += m.altura / 2;
    saida.push({
      no,
      x: profundidade * recuo + m.largura / 2,
      y,
      profundidade,
      ramo: profundidade === 1 ? indiceEra : ramo,
      paiId
    });
    y += m.altura / 2 + espaco;
    if (!abertos.has(no.id)) return;
    no.filhos.forEach((filho, indice) => {
      const ramoFilho = ramoDoPensador.get(filho.id) ?? ramo;
      visitar(filho, profundidade + 1, ramoFilho, no.id, profundidade === 0 ? indice : indiceEra);
    });
  };
  visitar(raiz, 0, 0);
  return saida;
}

/**
 * Vista para tela estreita: enquadra pela LARGURA (nunca abaixo da escala
 * mínima legível); a altura do contêiner cresce até o conteúdo caber. Se nem a
 * largura couber na escala mínima, alinha à esquerda e deixa o pan para o resto.
 */
export function vistaPorLargura(
  caixas: readonly CaixaDoNo[],
  largura: number,
  margem: number,
  escalaMinima: number
): { x: number; y: number; k: number; altura: number } {
  const esq = Math.min(...caixas.map((c) => c.x - c.largura / 2));
  const dir = Math.max(...caixas.map((c) => c.x + c.largura / 2));
  const topo = Math.min(...caixas.map((c) => c.y - c.altura / 2));
  const base = Math.max(...caixas.map((c) => c.y + c.altura / 2));
  const cabe = (largura - 2 * margem) / (dir - esq);
  const k = Math.min(1.2, Math.max(cabe, escalaMinima));
  const altura = Math.ceil((base - topo) * k + 2 * margem);
  const x = cabe >= escalaMinima ? -((esq + dir) / 2) * k : margem - largura / 2 - esq * k;
  const y = margem - altura / 2 - topo * k;
  return { k, x, y, altura };
}

function numero(n: number): string {
  return String(Math.round(n * 10) / 10 + 0);
}

/** Curva cúbica radial do pai ao filho (o mesmo desenho de uma ligação radial do d3). */
export function caminhoLigacao(
  pai: { x: number; y: number },
  filho: { x: number; y: number }
): string {
  const r1 = Math.hypot(pai.x, pai.y);
  const r2 = Math.hypot(filho.x, filho.y);
  const t2 = Math.atan2(filho.y, filho.x);
  const t1 = r1 < 1e-6 ? t2 : Math.atan2(pai.y, pai.x);
  const rm = (r1 + r2) / 2;
  const c1 = `${numero(rm * Math.cos(t1))} ${numero(rm * Math.sin(t1))}`;
  const c2 = `${numero(rm * Math.cos(t2))} ${numero(rm * Math.sin(t2))}`;
  return `M ${numero(pai.x)} ${numero(pai.y)} C ${c1}, ${c2}, ${numero(filho.x)} ${numero(filho.y)}`;
}

export interface CaixaDoNo {
  readonly x: number;
  readonly y: number;
  readonly largura: number;
  readonly altura: number;
}

/**
 * Vista (escala e deslocamento) que faz TODAS as cápsulas caberem na janela,
 * centralizando a caixa do conjunto. Sem piso de escala: cabe sempre; se
 * ficar pequeno demais, quem decide é o layout vertical e o zoom.
 */
export function ajustarVista(
  caixas: readonly CaixaDoNo[],
  largura: number,
  altura: number,
  margem = 12
): { x: number; y: number; k: number } {
  const esq = Math.min(...caixas.map((c) => c.x - c.largura / 2));
  const dir = Math.max(...caixas.map((c) => c.x + c.largura / 2));
  const topo = Math.min(...caixas.map((c) => c.y - c.altura / 2));
  const base = Math.max(...caixas.map((c) => c.y + c.altura / 2));
  const k = Math.min(
    (largura - 2 * margem) / (dir - esq),
    (altura - 2 * margem) / (base - topo),
    1.2
  );
  return { k, x: -((esq + dir) / 2) * k, y: -((topo + base) / 2) * k };
}

/**
 * Vista legível: tenta o mapa inteiro; se a escala ficar abaixo do mínimo que
 * mantém o texto legível (tela estreita), enquadra só o ramo em foco e, se
 * ainda assim não couber, usa a escala mínima centrada no nó escolhido, com
 * pan para o resto. `foco[0]` é o nó escolhido.
 */
export function vistaLegivel(
  todas: readonly CaixaDoNo[],
  foco: readonly CaixaDoNo[],
  largura: number,
  altura: number,
  margem: number,
  escalaMinima: number
): { x: number; y: number; k: number } {
  const inteira = ajustarVista(todas, largura, altura, margem);
  if (inteira.k >= escalaMinima) return inteira;
  if (foco.length > 0) {
    const emFoco = ajustarVista(foco, largura, altura, margem);
    if (emFoco.k >= escalaMinima) return emFoco;
    const alvo = foco[0]!;
    return { k: escalaMinima, x: -alvo.x * escalaMinima, y: -alvo.y * escalaMinima };
  }
  return { k: escalaMinima, x: 0, y: 0 };
}

/**
 * Quebra o rótulo em até `maxLinhas` linhas, só entre palavras, medindo cada
 * linha com `medir` (largura real do texto). O que não couber vira reticências
 * na última linha; nada é cortado em silêncio.
 */
export function quebrarRotulo(
  texto: string,
  larguraMaxima: number,
  medir: (s: string) => number,
  maxLinhas = 3
): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = '';
  let i = 0;
  for (; i < palavras.length; i++) {
    const candidata = atual ? `${atual} ${palavras[i]}` : palavras[i]!;
    if (!atual || medir(candidata) <= larguraMaxima) {
      atual = candidata;
      continue;
    }
    if (linhas.length === maxLinhas - 1) break;
    linhas.push(atual);
    atual = palavras[i]!;
  }
  const sobra = i < palavras.length ? [atual, ...palavras.slice(i)].join(' ') : atual;
  if (i < palavras.length) {
    let ultima = sobra;
    while (ultima.length > 1 && medir(`${ultima}…`) > larguraMaxima) ultima = ultima.slice(0, -1);
    linhas.push(`${ultima.trimEnd()}…`);
  } else if (atual) {
    linhas.push(atual);
  }
  return linhas;
}

export type NoDesenhado = NoPosicionado & MedidaDoNo;

export interface PlanoDoMapa {
  readonly tipo: 'radial' | 'indentado';
  readonly itens: readonly NoDesenhado[];
  /** Vista que deixa todos os nós dentro do quadro. */
  readonly vista: { x: number; y: number; k: number };
  /** Altura do quadro: fixa no radial, crescendo com o conteúdo na lista indentada. */
  readonly altura: number;
}

export interface EntradaDoPlano {
  readonly largura: number;
  /** Altura natural do quadro (usada pelo layout radial). */
  readonly altura: number;
  readonly medir: (texto: string, fonte: number, peso: number) => number;
  readonly escalaMinima: number;
  readonly larguraEstreita?: number;
  readonly margem?: number;
}

/**
 * Escolhe e monta o layout. Radial (dois hemisférios) quando cabe na janela
 * com o texto legível; senão, lista indentada enquadrada pela LARGURA, com a
 * altura do quadro crescendo até caber tudo. Todo nó fica sempre dentro do
 * quadro, e nenhuma cápsula passa da borda: a largura de cada cápsula é a
 * disponível menos o recuo do nível.
 */
export function montarPlano(
  raiz: NoMapa,
  abertos: ReadonlySet<string>,
  entrada: EntradaDoPlano
): PlanoDoMapa {
  const margem = entrada.margem ?? 8;
  const estreita = entrada.largura < (entrada.larguraEstreita ?? 640);

  const planoIndentado = (): PlanoDoMapa => {
    const medidas = new Map<string, MedidaDoNo>();
    const medida = (no: NoMapa, profundidade: number): MedidaDoNo => {
      const disponivel = entrada.largura - 2 * margem - profundidade * RECUO_INDENTADO;
      const m = dimensionar(no, profundidade, entrada.medir, Math.max(90, disponivel));
      medidas.set(no.id, m);
      return m;
    };
    const pos = layoutIndentado(raiz, abertos, { medida });
    const itens = pos.map((p) => ({ ...p, ...medidas.get(p.no.id)! }));
    const v = vistaPorLargura(itens, entrada.largura, margem, entrada.escalaMinima);
    return { tipo: 'indentado', itens, vista: { x: v.x, y: v.y, k: v.k }, altura: v.altura };
  };

  if (estreita) return planoIndentado();

  const medidas = new Map<string, MedidaDoNo>();
  const medida = (no: NoMapa, profundidade: number): MedidaDoNo => {
    const m = dimensionar(no, profundidade, entrada.medir);
    medidas.set(no.id, m);
    return m;
  };
  const pos = layoutRadial(raiz, abertos, { orientacao: 'horizontal', medida });
  const itens = pos.map((p) => ({ ...p, ...medidas.get(p.no.id)! }));
  const v = ajustarVista(itens, entrada.largura, entrada.altura, margem);
  if (v.k >= entrada.escalaMinima) {
    return { tipo: 'radial', itens, vista: v, altura: entrada.altura };
  }
  return planoIndentado();
}
