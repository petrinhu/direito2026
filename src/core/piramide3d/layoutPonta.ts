// Texto da face de ponta (topo da pirâmide): a face é um triângulo, com o ápice em cima. O texto fica
// na parte de baixo, centralizado, e cada linha tem a largura que cabe no triângulo naquela altura, com
// margem. A escala de fonte é uma só (a da fatia comum, reduzida só se não couber): sem esticar.
import type { Medidor } from './layoutFace';

export interface TrianguloPonta {
  /** Largura da base, em px. */
  readonly W: number;
  /** Altura, em px (do ápice, em y = 0, até a base, em y = H). */
  readonly H: number;
}

export interface FontesDaPonta {
  readonly nome: (f: number) => string;
  readonly corpo: (f: number) => string;
  readonly rotulo: (f: number) => string;
}

export interface TextosDaPonta {
  readonly nome: string;
  readonly explicacao: string;
  readonly rotulo: string;
  readonly exemplo: string;
}

export interface LinhaDaPonta {
  readonly t: string;
  readonly x: number;
  /** Centro vertical da caixa da linha. */
  readonly y: number;
  /** Topo e altura da caixa da linha (a largura é garantida no topo). */
  readonly topo: number;
  readonly altura: number;
  readonly fonte: string;
  readonly cor: 'nome' | 'explicacao' | 'rotulo' | 'exemplo';
}

export interface LayoutDaPonta {
  readonly f: number;
  readonly linhas: readonly LinhaDaPonta[];
  /** Topo e base da caixa do texto, em px (y do canvas). */
  readonly yTopo: number;
  readonly yBase: number;
}

/** Meia largura do triângulo na altura y (medida a partir do ápice). */
export function meiaLarguraNaAltura(t: TrianguloPonta, y: number): number {
  return (t.W / 2) * Math.max(0, Math.min(1, y / t.H));
}

interface Passo {
  readonly texto: string;
  readonly fonte: string;
  readonly altura: number;
  readonly cor: LinhaDaPonta['cor'];
}

/** Quebra gulosa de um parágrafo; cada linha recebe a largura máxima da sua altura (top-down). */
function quebrarNaAltura(
  medidor: Medidor,
  texto: string,
  fonte: string,
  yInicio: number,
  altura: number,
  t: TrianguloPonta,
  margem: number
): { t: string; y: number }[] | null {
  medidor.definirFonte(fonte);
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  const saida: { t: string; y: number }[] = [];
  let atual = '';
  let y = yInicio;
  const limite = (yTopoLinha: number): number => 2 * (meiaLarguraNaAltura(t, yTopoLinha) - margem);
  for (const p of palavras) {
    const cand = atual ? `${atual} ${p}` : p;
    if (medidor.largura(cand) <= limite(y)) {
      atual = cand;
      continue;
    }
    if (!atual) return null;
    saida.push({ t: atual, y });
    y += altura;
    atual = p;
    if (medidor.largura(p) > limite(y)) return null;
  }
  if (atual) saida.push({ t: atual, y });
  return saida;
}

/**
 * Layout da ponta: escolhe a maior altura de topo (a caixa mais baixa possível) em que todas as linhas
 * cabem no triângulo, com a fonte de maior f que caiba. Devolve null só se nem o menor f couber.
 */
export function layoutDaPonta(
  medidor: Medidor,
  textos: TextosDaPonta,
  t: TrianguloPonta,
  fontes: FontesDaPonta,
  opcoes: { fInicial: number; fMinimo: number; margem: number; passoAltura?: number }
): LayoutDaPonta | null {
  const margem = opcoes.margem;
  const passo = opcoes.passoAltura ?? 2;
  for (let f = opcoes.fInicial; f >= opcoes.fMinimo; f -= 1) {
    const passos: Passo[] = [
      { texto: textos.nome, fonte: fontes.nome(f), altura: f * 1.9, cor: 'nome' },
      { texto: textos.explicacao, fonte: fontes.corpo(f), altura: f * 1.45, cor: 'explicacao' },
      { texto: textos.rotulo, fonte: fontes.rotulo(f), altura: f * 1.6, cor: 'rotulo' },
      { texto: textos.exemplo, fonte: fontes.corpo(f), altura: f * 1.45, cor: 'exemplo' }
    ];
    // Blocos de cima para baixo; a caixa começa na altura y0 e desce. Procura o y0 mais baixo que cabe.
    for (let y0 = t.H - margem - f; y0 > margem; y0 -= passo) {
      let y = y0;
      const linhas: LinhaDaPonta[] = [];
      let ok = true;
      for (const p of passos) {
        const quebras = quebrarNaAltura(medidor, p.texto, p.fonte, y, p.altura, t, margem);
        if (!quebras) {
          ok = false;
          break;
        }
        for (const q of quebras) {
          linhas.push({
            t: q.t,
            x: t.W / 2,
            y: q.y + p.altura / 2,
            topo: q.y,
            altura: p.altura,
            fonte: p.fonte,
            cor: p.cor
          });
        }
        y = (quebras[quebras.length - 1]?.y ?? y) + p.altura;
      }
      if (!ok) continue;
      if (y > t.H - margem) continue;
      return { f, linhas, yTopo: y0, yBase: y };
    }
  }
  return null;
}
