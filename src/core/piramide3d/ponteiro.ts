// Teste de ponteiro da figura. Funções puras: as formas chegam prontas em px da janela, e o DOM
// fica com quem chama. Formas: silhueta de repouso (casco convexo dos cantos projetados), retângulo
// do rótulo e polígono final da face em voo (calculado pelas fórmulas, não pela animação).
import type { FormaNivel, Ponto, Retangulo } from './tipos';

function cruz(o: Ponto, a: Ponto, b: Ponto): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** Último elemento de uma lista que se sabe não vazia (as cadeias abaixo têm ao menos 2 pontos). */
function ultimo<T>(lista: readonly T[], deslocamento: number): T {
  const item = lista[lista.length - deslocamento];
  if (item === undefined) throw new Error('lista curta demais');
  return item;
}

/** Casco convexo (cadeia monotônica). Devolve os pontos em sentido anti-horário. */
export function cascoConvexo(pontos: readonly Ponto[]): Ponto[] {
  const ps = pontos.map((p) => ({ x: p.x, y: p.y })).sort((a, b) => a.x - b.x || a.y - b.y);
  if (ps.length < 3) return ps;
  const baixo: Ponto[] = [];
  for (const p of ps) {
    while (baixo.length >= 2 && cruz(ultimo(baixo, 2), ultimo(baixo, 1), p) <= 0) baixo.pop();
    baixo.push(p);
  }
  const cima: Ponto[] = [];
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i] as Ponto;
    while (cima.length >= 2 && cruz(ultimo(cima, 2), ultimo(cima, 1), p) <= 0) cima.pop();
    cima.push(p);
  }
  cima.pop();
  baixo.pop();
  return baixo.concat(cima);
}

/** Ponto dentro (ou na borda) de um casco anti-horário. */
export function dentroDoConvexo(p: Ponto, casco: readonly Ponto[]): boolean {
  if (casco.length < 3) return false;
  for (let i = 0; i < casco.length; i++) {
    if (cruz(casco[i] as Ponto, casco[(i + 1) % casco.length] as Ponto, p) < -1e-9) return false;
  }
  return true;
}

export function dentroDoRetangulo(p: Ponto, r: Retangulo): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function cantosDoRetangulo(r: Retangulo): Ponto[] {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h }
  ];
}

// A face da frente visível decide. A silhueta de repouso não decide: ela inclui o topo e as costas,
// que ficam atrás de outras faces; escolher por ela dava o nível errado conforme a ordem da lista.
// Entre faces que se tocam numa aresta, vence a mais próxima do observador.
function frenteSob(p: Ponto, formas: readonly FormaNivel[]): FormaNivel | null {
  let escolhida: FormaNivel | null = null;
  for (const f of formas) {
    if (!f.frente || !dentroDoConvexo(p, f.frente)) continue;
    if (!escolhida || f.profundidade < escolhida.profundidade) escolhida = f;
  }
  return escolhida;
}

// Rótulo: segunda via, só quando nenhuma face da frente está sob o ponteiro.
function rotuloSob(p: Ponto, formas: readonly FormaNivel[]): FormaNivel | null {
  return formas.find((f) => !!f.rotulo && dentroDoRetangulo(p, f.rotulo)) ?? null;
}

function nivelDaForma(p: Ponto, formas: readonly FormaNivel[]): string | null {
  const face = frenteSob(p, formas);
  if (face) return face.nivel;
  const rotulo = rotuloSob(p, formas);
  return rotulo ? rotulo.nivel : null;
}

export interface EntradaNivelSobPonteiro {
  readonly p: Ponto;
  readonly ativo: string | null | undefined;
  readonly formas: readonly FormaNivel[];
  readonly zonas: ReadonlyMap<string, readonly Ponto[]>;
}

/**
 * Nível sob o ponteiro. Sem nível ativo: o da face da frente sob o ponteiro (ou o do rótulo). Com
 * N ativo: continua em N enquanto o ponteiro estiver na zona de permanência; fora dela, troca se
 * estiver sobre outro nível; senão devolve null (fechar).
 */
export function nivelSobPonteiro({
  p,
  ativo,
  formas,
  zonas
}: EntradaNivelSobPonteiro): string | null {
  if (ativo === null || ativo === undefined) {
    return nivelDaForma(p, formas);
  }
  const zona = zonas.get(ativo);
  if (zona && dentroDoConvexo(p, zona)) return ativo;
  return nivelDaForma(
    p,
    formas.filter((x) => x.nivel !== ativo)
  );
}
