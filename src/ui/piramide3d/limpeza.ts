/**
 * Cor de limpeza do renderer da pirâmide. Decisão do líder ("Tirar o véu"): a página não escurece nem
 * clareia por causa da figura, em nenhum estado do voo. Por isso o alfa é sempre zero.
 */
export type EstadoDoPalco = 'repouso' | 'voo' | 'volta' | 'meio-da-volta' | 'norma-fundamental';

export interface CorDeLimpeza {
  readonly cor: number;
  readonly alfa: number;
}

export interface AlvoDeLimpeza {
  setClearColor(cor: number, alfa: number): void;
}

export function corDeLimpeza(estado: EstadoDoPalco): CorDeLimpeza {
  void estado; // a cor não depende do estado: o véu saiu de todos
  return { cor: 0x000000, alfa: 0 };
}

export function aplicarLimpeza(alvo: AlvoDeLimpeza, estado: EstadoDoPalco): void {
  const { cor, alfa } = corDeLimpeza(estado);
  alvo.setClearColor(cor, alfa);
}
