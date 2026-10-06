import { ref, type Ref } from 'vue';

function prefereMenosMovimento(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Verdadeiro quando o sistema pede menos movimento (prefers-reduced-motion).
 * Compartilhado pelo mapa e pelos slides da área restrita. O modo adaptado
 * não se aplica à área (ordem do líder), então só esta preferência vale.
 */
export function usarSemMovimento(): Ref<boolean> {
  return ref(prefereMenosMovimento());
}
