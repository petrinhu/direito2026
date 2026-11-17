/**
 * Perda do contexto WebGL do canvas da pirâmide. Na perda, cancela-se o evento (preventDefault) para o
 * navegador poder restaurar o contexto; na restauração, a cena é avisada para desenhar de novo.
 */
export interface AlvoDoContexto {
  addEventListener(tipo: string, ouvinte: (evento: Event) => void): void;
  removeEventListener(tipo: string, ouvinte: (evento: Event) => void): void;
}

export interface OuvintesDoContexto {
  onPerdido(): void;
  onRestaurado(): void;
}

/** Liga o tratamento e devolve a função que o desliga. */
export function ouvirContextoDoWebgl(
  alvo: AlvoDoContexto,
  ouvintes: OuvintesDoContexto
): () => void {
  const aoPerder = (evento: Event): void => {
    evento.preventDefault();
    ouvintes.onPerdido();
  };
  const aoRestaurar = (): void => ouvintes.onRestaurado();
  alvo.addEventListener('webglcontextlost', aoPerder);
  alvo.addEventListener('webglcontextrestored', aoRestaurar);
  return () => {
    alvo.removeEventListener('webglcontextlost', aoPerder);
    alvo.removeEventListener('webglcontextrestored', aoRestaurar);
  };
}
