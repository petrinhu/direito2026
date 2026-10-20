import type { NivelUrgencia } from './tipos';

/**
 * Faixas da contagem (ordem do líder, 20/10/2026): calmo com mais de 14 dias,
 * dourado de 7 a 14, garnet de 3 a 6, pulsando com 2 ou menos.
 */
export function nivelUrgencia(dias: number): NivelUrgencia {
  if (dias < 0) throw new Error(`dias não pode ser negativo: ${dias}`);
  if (dias > 14) return 'calmo';
  if (dias >= 7) return 'dourado';
  if (dias >= 3) return 'garnet';
  return 'pulsante';
}
