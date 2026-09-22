import type { TemaEscolhido } from './tipos';

const ORDEM: readonly TemaEscolhido[] = ['sistema', 'claro', 'escuro'];

/** Ordem do ciclo do AlternadorTema (seção 6 da arquitetura). Função pura. */
export function proximoTema(atual: TemaEscolhido): TemaEscolhido {
  const indice = ORDEM.indexOf(atual);
  return ORDEM[(indice + 1) % ORDEM.length]!;
}
