import type { RepositorioProgresso } from '@/core/progresso/tipos';
import { RepositorioLocalStorage } from './RepositorioLocalStorage';
import { RepositorioMemoria } from './RepositorioMemoria';

const CHAVE_SONDA = 'caderno-direito:v1:sonda';

/** Tenta escrever e ler uma chave descartável. Falhou, localStorage não presta. */
function localStorageFunciona(): boolean {
  try {
    localStorage.setItem(CHAVE_SONDA, '1');
    const leu = localStorage.getItem(CHAVE_SONDA) === '1';
    localStorage.removeItem(CHAVE_SONDA);
    return leu;
  } catch {
    return false;
  }
}

/**
 * Fábrica que decide, na subida, qual implementação usar (seção 8 da
 * arquitetura). Depois da sonda inicial, RepositorioLocalStorage também
 * trata falha própria em toda operação: a cota pode estourar no meio.
 */
export function criarRepositorioProgresso(): RepositorioProgresso {
  return localStorageFunciona() ? new RepositorioLocalStorage() : new RepositorioMemoria();
}
