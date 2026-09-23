/**
 * Caso levantado pelo líder (23/09/2026): uma aba aberta com o bundle da
 * versão A pede, sob demanda (navegação para uma seção ainda não
 * visitada), um pedaço de código com impressão digital no nome que a
 * publicação da versão B já apagou do servidor. A regra do `.htaccess`
 * devolve `index.html` no lugar (fallback de SPA), o `import()` dinâmico
 * falha ao tentar interpretar HTML como módulo, e a seção fica em branco.
 *
 * O Vite emite `vite:preloadError` no `window` exatamente para este caso
 * (documentação oficial, seção "Load Error Handling"; `event.payload`
 * carrega o erro original). O recarregamento é o remédio: busca o
 * `index.html` (e os módulos) já na versão B. `criarTratadorFalhaModulo`
 * só orquestra a decisão de recarregar; a assinatura do evento real e o
 * armazenamento real (sessionStorage) moram em main.ts, que depende de
 * `window`/`document` e por isso não é testável sem navegador (L-50).
 */
export interface ArmazenamentoRecarga {
  /** true quando já houve um recarregamento por esta causa há pouco tempo. */
  lerMarcaRecente(): boolean;
  /** Grava que um recarregamento acabou de acontecer agora. */
  gravarMarca(): void;
}

export interface EventoFalhaModulo {
  preventDefault?(): void;
}

/**
 * Protege contra laço: se `armazenamento` já indica um recarregamento
 * recente, uma segunda falha de módulo (bem possível, porque várias
 * seções da página podem tentar carregar módulos velhos em sequência) não
 * dispara outro recarregamento.
 */
export function criarTratadorFalhaModulo(
  armazenamento: ArmazenamentoRecarga,
  recarregar: () => void
): (evento: EventoFalhaModulo) => void {
  return (evento) => {
    evento.preventDefault?.();
    if (armazenamento.lerMarcaRecente()) return;
    armazenamento.gravarMarca();
    recarregar();
  };
}
