/**
 * Diferença entre a referência gravada e o estado atual, por chave de
 * identidade (caminho de unidade, caminho de rota, id de documento). "Alterado"
 * é a mesma chave com conteúdo diferente: a forma do item mudou, não só a
 * posição dele na lista.
 */
export interface Mudancas {
  readonly adicionados: string[];
  readonly removidos: string[];
  readonly alterados: string[];
}

export function diferencaPorChave<T>(
  anteriores: readonly T[],
  atuais: readonly T[],
  chave: (item: T) => string
): Mudancas {
  const antigos = new Map(anteriores.map((item) => [chave(item), item]));
  const novos = new Map(atuais.map((item) => [chave(item), item]));
  const adicionados = [...novos.keys()].filter((k) => !antigos.has(k)).sort();
  const removidos = [...antigos.keys()].filter((k) => !novos.has(k)).sort();
  const alterados = [...novos.keys()]
    .filter(
      (k) => antigos.has(k) && JSON.stringify(antigos.get(k)) !== JSON.stringify(novos.get(k))
    )
    .sort();
  return { adicionados, removidos, alterados };
}

export function temMudanca(mudancas: Mudancas): boolean {
  return (
    mudancas.adicionados.length > 0 ||
    mudancas.removidos.length > 0 ||
    mudancas.alterados.length > 0
  );
}

/**
 * Uma seção do resumo: título, linhas com + (adicionado), - (removido) e ~
 * (alterado). Lista inteira quando curta; acima do teto, mostra os primeiros
 * e diz quantos ficaram de fora, para o terminal não virar parede de texto.
 */
export function secaoDoResumo(titulo: string, mudancas: Mudancas, teto = 25): string[] {
  const linhas = [
    `${titulo}: +${mudancas.adicionados.length} -${mudancas.removidos.length} ~${mudancas.alterados.length}`
  ];
  const marcas: Array<[string, string[]]> = [
    ['+', mudancas.adicionados],
    ['-', mudancas.removidos],
    ['~', mudancas.alterados]
  ];
  for (const [marca, itens] of marcas) {
    for (const item of itens.slice(0, teto)) linhas.push(`  ${marca} ${item}`);
    if (itens.length > teto) linhas.push(`  ${marca} ... e mais ${itens.length - teto}`);
  }
  return linhas;
}
