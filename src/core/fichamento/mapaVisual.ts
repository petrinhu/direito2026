import { construirArvoreMapa, idsExpansiveis } from './arvoreMapa';
import type { MapaFichamento, NoMapa } from './tipos';

/** Raio de cada anel, do centro para fora: raiz, período, pensador, detalhe, conceito. */
const RAIOS = [0, 170, 350, 540, 700, 860] as const;

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
      filhos: era.filhos.flatMap((fase) => fase.filhos)
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
export function layoutRadial(raiz: NoMapa, abertos: ReadonlySet<string>): NoPosicionado[] {
  const saida: NoPosicionado[] = [];
  let proximoRamo = 0;

  const filhosVisiveis = (no: NoMapa): readonly NoMapa[] => (abertos.has(no.id) ? no.filhos : []);
  const peso = (no: NoMapa): number => {
    const filhos = filhosVisiveis(no);
    return filhos.length === 0 ? 1 : filhos.reduce((soma, f) => soma + peso(f), 0);
  };

  // O tom de cada pensador vem da ordem na árvore COMPLETA, para não mudar ao abrir e fechar.
  const ramoDoPensador = new Map<string, number>();
  for (const era of raiz.filhos) for (const p of era.filhos) ramoDoPensador.set(p.id, proximoRamo++);

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
      const fatia = ((fim - inicio) * peso(filho)) / total;
      const ramoFilho =
        profundidade === 0
          ? indice
          : (ramoDoPensador.get(filho.id) ?? ramo);
      posicionar(filho, cursor, cursor + fatia, profundidade + 1, ramoFilho, no.id);
      cursor += fatia;
    });
  };

  posicionar(raiz, -Math.PI / 2, (3 * Math.PI) / 2, 0, 0);
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

/** Escala que faz o mapa inteiro caber na janela (no máximo 1,2). */
export function enquadrar(posicionados: readonly NoPosicionado[], largura: number, altura: number): number {
  const meiaLargura = Math.max(...posicionados.map((p) => Math.abs(p.x))) + 120;
  const meiaAltura = Math.max(...posicionados.map((p) => Math.abs(p.y))) + 30;
  return Math.min(largura / 2 / meiaLargura, altura / 2 / meiaAltura, 1.2);
}
