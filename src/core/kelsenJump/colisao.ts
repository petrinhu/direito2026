/** Retângulo alinhado aos eixos, com `x0 < x1` e `y0 < y1` (AABB). */
export interface Caixa {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

/** Encostar não conta como colisão: a borda só dispara com sobreposição de área positiva. */
export function colidem(a: Caixa, b: Caixa): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}
