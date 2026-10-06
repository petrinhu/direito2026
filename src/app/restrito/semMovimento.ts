import { ref, watch, type Ref } from 'vue';
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';

function prefereMenosMovimento(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Verdadeiro quando o sistema pede menos movimento ou o modo adaptado está
 * ligado. Acompanha o modo adaptado ao vivo. Compartilhado pelo mapa e pelos
 * slides da área restrita.
 */
export function usarSemMovimento(store: StoreModoAdaptado | undefined): Ref<boolean> {
  const sem = ref(prefereMenosMovimento() || Boolean(store?.ativo.value));
  if (store) watch(store.ativo, (ligado) => (sem.value = prefereMenosMovimento() || ligado));
  return sem;
}
