// Leiaute do texto na face da fatia. Mede com um medidor injetado (a tela mede com um canvas 2D, o
// teste com uma medida fixa) e devolve as linhas e as caixas, tudo em px da face. Nada aqui escreve
// frase: o texto chega do conteúdo (campos nome, explicacao, exemplo).
import type { NivelFigura3d } from './tipos';

export const FONTE_NOME = 'Cormorant Garamond';
export const FONTE_CORPO = 'Inter';

/** Mede texto na fonte corrente; a ui entrega um canvas 2D por trás desta interface. */
export interface Medidor {
  definirFonte(fonte: string): void;
  largura(texto: string): number;
}

const MARGEM = 26; // margem de cima e de baixo
const MARGEM_LATERAL = 28; // recuo de cada lado dentro do topo do trapézio
const FILETE_W = 56;
const FILETE_H = 2;
const GAP_FILETE = 10; // do nome ao filete
const GAP_CORPO = 14; // do filete ao corpo
const GAP_EXEMPLO = 16; // da explicação ao bloco do exemplo, em uma coluna
const PAD_EXEMPLO = 14;
export const BARRA = 4;
const GAP_ROTULO = 6;
const VAO_COLUNAS = 2.5; // em unidades de f
const COLUNAS_A_PARTIR_DE = 52; // em unidades de f
const MEDIDA_MAX = 36; // em unidades de f: teto de linha confortável
const NOME_MAX = 45; // em unidades de f
const F_MIN = 14;
const F_MAX = 24;
const F_MIN_LEGIVEL = 17;
const PISO_ALTURA = 0.2; // fração da largura da face

/** Corpo do nome em múltiplos de f: 1,5 f nas faces comuns; 1,7 f na norma fundamental. */
export const FATOR_NOME = 1.5;
export const FATOR_NOME_NORMA = 1.7;

export const fonteNome = (f: number, fator: number = FATOR_NOME): string =>
  `700 ${fator * f}px "${FONTE_NOME}"`;
export const fonteRotulo = (f: number): string => `700 ${1.1 * f}px "${FONTE_NOME}"`;
export const fonteCorpo = (f: number): string => `400 ${f}px "${FONTE_CORPO}"`;

/** Escala da textura em pixels por px de tela: 1,5 a 2 vezes o dpr, sem passar de 4096. */
export function escalaDaTextura(Lpx: number, dpr: number): number {
  let e = Math.min(2, Math.max(1.5, 1.5 * dpr));
  if (Lpx * e > 4096) e = Math.max(1, 4096 / Lpx);
  return e;
}

interface Token {
  t: string;
  sep: string;
}

// Tokens do texto: uma palavra vira um ou mais pedaços quebrando depois de hífen. `sep` é o
// separador que vem antes do pedaço ('' dentro de palavra com hífen).
function tokens(texto: string): Token[] {
  const out: Token[] = [];
  texto
    .trim()
    .split(/\s+/)
    .forEach((palavra) => {
      palavra
        .split(/(?<=-)/)
        .forEach((pedaco, j) => out.push({ t: pedaco, sep: j === 0 ? ' ' : '' }));
    });
  const primeiro = out[0];
  if (primeiro) primeiro.sep = '';
  return out;
}

/** Uma linha do texto quebrado. juntaCom é true quando a quebra caiu dentro de palavra com hífen. */
export interface LinhaQuebrada {
  t: string;
  juntaCom: boolean;
}

/**
 * Quebra gulosa por medida. A próxima linha continua sem espaço quando a quebra caiu dentro de
 * uma palavra com hífen. Devolve null se um pedaço sozinho não cabe na medida.
 */
export function quebrar(medidor: Medidor, texto: string, max: number): LinhaQuebrada[] | null {
  const linhas: LinhaQuebrada[] = [];
  let atual: LinhaQuebrada | null = null;
  for (const tk of tokens(texto)) {
    if (medidor.largura(tk.t) > max) return null;
    if (atual === null) {
      atual = { t: tk.t, juntaCom: false };
      continue;
    }
    const cand = atual.t + tk.sep + tk.t;
    if (medidor.largura(cand) <= max) {
      atual.t = cand;
      continue;
    }
    atual.juntaCom = tk.sep === '';
    linhas.push(atual);
    atual = { t: tk.t, juntaCom: false };
  }
  if (atual !== null) linhas.push(atual);
  return linhas;
}

/** Texto de volta a partir das linhas: é o que o teste compara com o original. */
export function juntarLinhas(linhas: readonly LinhaQuebrada[]): string {
  return linhas.reduce(
    (acc, l, i) => acc + (i ? (linhas[i - 1]?.juntaCom ? '' : ' ') : '') + l.t,
    ''
  );
}

interface Caixa {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LeiauteExemplo {
  linhas: LinhaQuebrada[];
  bloco: Caixa;
  rotulo: Caixa;
  texto: Caixa;
  hLinha: number;
  hRotuloLinha: number;
}

export interface LeiauteFace {
  f: number;
  fatorNome: number;
  dupla: boolean;
  Lpx: number;
  Apx: number;
  colunas: 1 | 2;
  nome: { linhas: LinhaQuebrada[]; caixa: Caixa; hLinha: number };
  filete: Caixa;
  explicacao: { linhas: LinhaQuebrada[]; caixa: Caixa; hLinha: number };
  exemplo: LeiauteExemplo | null;
}

/** Leiaute com corpo f. Tudo em px da face (Lpx de largura). Devolve null se não cabe em AmaxPx. */
export function leiauteComCorpo(
  medidor: Medidor,
  info: NivelFigura3d,
  Lpx: number,
  razao: number,
  AmaxPx: number,
  f: number,
  fatorNome: number = FATOR_NOME
): LeiauteFace | null {
  const linSc = razao * Lpx - 2 * MARGEM_LATERAL;
  const dupla = linSc >= COLUNAS_A_PARTIR_DE * f;
  const colW = dupla
    ? Math.min(MEDIDA_MAX * f, (linSc - VAO_COLUNAS * f) / 2)
    : Math.min(linSc, MEDIDA_MAX * f);
  const nomeW = Math.min(linSc, NOME_MAX * f);
  const hNomeLinha = 1.2 * fatorNome * f;
  const hExplLinha = 1.5 * f;
  const hRotuloLinha = 1.32 * f;

  medidor.definirFonte(fonteNome(f, fatorNome));
  const nomeLin = quebrar(medidor, info.nome, nomeW);
  medidor.definirFonte(fonteCorpo(f));
  const explLin = quebrar(medidor, info.explicacao, colW);
  const exLin = info.exemplo ? quebrar(medidor, info.exemplo, colW - BARRA - 2 * PAD_EXEMPLO) : [];
  if (!nomeLin || !explLin || !exLin) return null;

  const hNome = nomeLin.length * hNomeLinha;
  const hExpl = explLin.length * hExplLinha;
  const hEx = info.exemplo
    ? 2 * PAD_EXEMPLO + hRotuloLinha + GAP_ROTULO + exLin.length * hExplLinha
    : 0;
  const yNome = MARGEM;
  const yFilete = yNome + hNome + GAP_FILETE;
  const yCorpo = yFilete + FILETE_H + GAP_CORPO;
  const total = dupla
    ? yCorpo + Math.max(hExpl, hEx) + MARGEM
    : yCorpo + hExpl + (hEx ? GAP_EXEMPLO + hEx : 0) + MARGEM;
  const Apx = Math.max(total, PISO_ALTURA * Lpx);
  if (Apx > AmaxPx) return null;

  const xExpl = dupla ? (Lpx - (2 * colW + VAO_COLUNAS * f)) / 2 : (Lpx - colW) / 2;
  const xEx = dupla ? xExpl + colW + VAO_COLUNAS * f : xExpl;
  const yEx = dupla ? yCorpo : yCorpo + hExpl + GAP_EXEMPLO;
  return {
    f,
    fatorNome,
    dupla,
    Lpx,
    Apx,
    colunas: dupla ? 2 : 1,
    nome: {
      linhas: nomeLin,
      caixa: { x: (Lpx - nomeW) / 2, y: yNome, w: nomeW, h: hNome },
      hLinha: hNomeLinha
    },
    filete: { x: (Lpx - FILETE_W) / 2, y: yFilete, w: FILETE_W, h: FILETE_H },
    explicacao: {
      linhas: explLin,
      caixa: { x: xExpl, y: yCorpo, w: colW, h: hExpl },
      hLinha: hExplLinha
    },
    exemplo: info.exemplo
      ? {
          linhas: exLin,
          bloco: { x: xEx, y: yEx, w: colW, h: hEx },
          rotulo: {
            x: xEx + BARRA + PAD_EXEMPLO,
            y: yEx + PAD_EXEMPLO,
            w: colW - BARRA - 2 * PAD_EXEMPLO,
            h: hRotuloLinha
          },
          texto: {
            x: xEx + BARRA + PAD_EXEMPLO,
            y: yEx + PAD_EXEMPLO + hRotuloLinha + GAP_ROTULO,
            w: colW - BARRA - 2 * PAD_EXEMPLO,
            h: exLin.length * hExplLinha
          },
          hLinha: hExplLinha,
          hRotuloLinha
        }
      : null
  };
}

/** Maior corpo f que cabe; desce de 1 em 1 até F_MIN. Lança erro com o nível se nenhum cabe. */
export function leiaute(
  medidor: Medidor,
  info: NivelFigura3d,
  Lpx: number,
  razao: number,
  AmaxPx: number,
  fatorNome: number = FATOR_NOME
): LeiauteFace {
  const f0 = Math.min(F_MAX, Math.max(F_MIN_LEGIVEL, Math.round(Lpx / 66)));
  for (let f = f0; f >= F_MIN; f--) {
    const lay = leiauteComCorpo(medidor, info, Lpx, razao, AmaxPx, f, fatorNome);
    if (lay) return lay;
  }
  throw new Error(`texto do nível "${info.nivel}" não cabe na face nem com ${F_MIN} px`);
}
