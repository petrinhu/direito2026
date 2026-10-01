import { construirArvoreMapa, idsExpansiveis } from './arvoreMapa';
import type { MapaFichamento, NoMapa } from './tipos';

/** Raio de cada anel, do centro para fora: raiz, período, pensador, detalhe, conceito. */
const RAIOS = [0, 190, 390, 560, 720, 880] as const;

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

/** Um só botão: abre tudo se algo está fechado; recolhe ao começo se tudo está aberto. */
export function alternarTodosRamos(raiz: NoMapa, abertos: ReadonlySet<string>): Set<string> {
  const tudoAberto = todosAbertos(raiz).every((id) => abertos.has(id));
  return tudoAberto ? abertosIniciaisVisual(raiz) : new Set(todosAbertos(raiz));
}

/**
 * Disposição radial: a raiz no centro, cada nível num anel, e cada nó com a
 * fatia de ângulo proporcional ao número de folhas visíveis dele.
 */
export interface OpcoesLayout {
  /** Horizontal: Antiguidade à esquerda e Idade Média à direita. Vertical: em cima e embaixo. */
  readonly orientacao?: 'horizontal' | 'vertical';
}

export function layoutRadial(
  raiz: NoMapa,
  abertos: ReadonlySet<string>,
  opcoes: OpcoesLayout = {}
): NoPosicionado[] {
  const saida: NoPosicionado[] = [];
  let proximoRamo = 0;

  const filhosVisiveis = (no: NoMapa): readonly NoMapa[] => (abertos.has(no.id) ? no.filhos : []);
  const peso = (no: NoMapa): number => {
    const filhos = filhosVisiveis(no);
    return filhos.length === 0 ? 1 : filhos.reduce((soma, f) => soma + peso(f), 0);
  };

  // O tom de cada pensador vem da ordem na árvore COMPLETA, para não mudar ao abrir e fechar.
  const ramoDoPensador = new Map<string, number>();
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
    const raio = RAIOS[Math.min(profundidade, RAIOS.length - 1)]!;
    saida.push({
      no,
      x: Math.round(raio * Math.cos(angulo) * 10) / 10 + 0,
      y: Math.round(raio * Math.sin(angulo) * 10) / 10 + 0,
      profundidade,
      ramo,
      paiId
    });
    const filhos = filhosVisiveis(no);
    const total = peso(no);
    let cursor = inicio;
    filhos.forEach((filho, indice) => {
      // Cada período recebe um hemisfério inteiro, qualquer que seja o número de pensadores.
      const fatia =
        profundidade === 0
          ? (fim - inicio) / filhos.length
          : ((fim - inicio) * peso(filho)) / total;
      const ramoFilho = profundidade === 0 ? indice : (ramoDoPensador.get(filho.id) ?? ramo);
      posicionar(filho, cursor, cursor + fatia, profundidade + 1, ramoFilho, no.id);
      cursor += fatia;
    });
  };

  const inicioDoGiro = opcoes.orientacao === 'vertical' ? Math.PI : Math.PI / 2;
  posicionar(raiz, inicioDoGiro, inicioDoGiro + 2 * Math.PI, 0, 0);
  return saida;
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
