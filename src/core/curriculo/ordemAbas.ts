import type { ChaveAba } from './tipos';

/**
 * Ordem fixa das abas de uma unidade. Quem lista abas (descoberta, rotas do
 * e2e, menu) segue esta ordem; ela não depende da ordem do disco.
 */
export const ORDEM_ABAS: readonly ChaveAba[] = [
  'resumo',
  'mapa',
  'fichamento',
  'mnemonicos',
  'peticao',
  'quiz'
];
