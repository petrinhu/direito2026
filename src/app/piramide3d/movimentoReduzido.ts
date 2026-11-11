import { onBeforeUnmount, ref, type Ref } from 'vue';

const CONSULTA = '(prefers-reduced-motion: reduce)';

/** Preferência do sistema por menos movimento, reativa: muda sozinha se o leitor trocar no sistema. */
export function usarMovimentoReduzido(): Ref<boolean> {
  const reduzido = ref(false);
  if (typeof matchMedia !== 'function') return reduzido;
  const consulta = matchMedia(CONSULTA);
  reduzido.value = consulta.matches;
  const aoMudar = (evento: { matches: boolean }): void => {
    reduzido.value = evento.matches;
  };
  consulta.addEventListener('change', aoMudar);
  onBeforeUnmount(() => consulta.removeEventListener('change', aoMudar));
  return reduzido;
}
