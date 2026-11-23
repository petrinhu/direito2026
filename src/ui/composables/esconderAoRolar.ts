import { computed, onBeforeUnmount, onMounted, shallowRef, type Ref } from 'vue';

/**
 * FLUTUANTES-ROLAGEM (ordem do líder, 21/11/2026): no celular a pilha inferior (cartão do quadro
 * de prova e botão Home) some enquanto a pessoa rola para baixo e volta ao rolar para cima ou
 * ao parar. Foco dentro da pilha a mantém visível. A decisão é uma função pura (reduzirPilha),
 * testada sem DOM; o composable só traduz eventos do navegador em eventos dessa função.
 */

/** Acima desta largura a pilha nunca se esconde (mesmo ponto de quebra da gaveta). */
export const CONSULTA_CELULAR = '(max-width: 880px)';
/** Deslocamento mínimo, em px, para contar como rolagem (ignora o tremor do toque). */
export const LIMIAR_DE_ROLAGEM_PX = 4;
/** Tempo parado, em ms, até a pilha voltar. */
export const ESPERA_PARADO_MS = 600;

export interface EstadoPilha {
  readonly escondida: boolean;
  readonly y: number;
  readonly focoDentro: boolean;
  readonly celular: boolean;
}

export type EventoPilha =
  | { readonly tipo: 'rolou'; readonly y: number }
  | { readonly tipo: 'parou' }
  | { readonly tipo: 'foco'; readonly dentro: boolean }
  | { readonly tipo: 'tela'; readonly celular: boolean };

export function estadoInicialPilha(): EstadoPilha {
  return { escondida: false, y: 0, focoDentro: false, celular: false };
}

export function reduzirPilha(estado: EstadoPilha, evento: EventoPilha): EstadoPilha {
  switch (evento.tipo) {
    case 'parou':
      return { ...estado, escondida: false };
    case 'foco':
      // Foco dentro da pilha a mantém visível; ao sair, a pilha volta a obedecer a rolagem.
      return {
        ...estado,
        focoDentro: evento.dentro,
        escondida: evento.dentro ? false : estado.escondida
      };
    case 'tela':
      return evento.celular
        ? { ...estado, celular: true }
        : { ...estado, celular: false, escondida: false };
    case 'rolou': {
      const delta = evento.y - estado.y;
      const base = { ...estado, y: evento.y };
      if (!estado.celular || estado.focoDentro) return { ...base, escondida: false };
      if (Math.abs(delta) <= LIMIAR_DE_ROLAGEM_PX) return base;
      return { ...base, escondida: delta > 0 };
    }
  }
}

/**
 * Liga a pilha (`alvo`) aos eventos de rolagem, foco e largura. Devolve se ela está escondida agora.
 * Quem usa põe `inert` junto, para que escondida também saia da ordem de Tab.
 */
export function useEsconderAoRolar(alvo: Ref<HTMLElement | undefined>): Readonly<Ref<boolean>> {
  const estado = shallowRef<EstadoPilha>(estadoInicialPilha());
  let temporizador: number | undefined;
  let consultaCelular: ReturnType<typeof window.matchMedia> | undefined;

  function despachar(evento: EventoPilha): void {
    estado.value = reduzirPilha(estado.value, evento);
  }

  function aoRolar(): void {
    despachar({ tipo: 'rolou', y: window.scrollY });
    window.clearTimeout(temporizador);
    temporizador = window.setTimeout(() => despachar({ tipo: 'parou' }), ESPERA_PARADO_MS);
  }

  function aoEntrarFoco(): void {
    despachar({ tipo: 'foco', dentro: true });
  }

  function aoSairFoco(): void {
    despachar({ tipo: 'foco', dentro: false });
  }

  function aoMudarTela(evento: { readonly matches: boolean }): void {
    despachar({ tipo: 'tela', celular: evento.matches });
  }

  onMounted(() => {
    if (typeof window.matchMedia === 'function') {
      consultaCelular = window.matchMedia(CONSULTA_CELULAR);
      despachar({ tipo: 'tela', celular: consultaCelular.matches });
      consultaCelular.addEventListener('change', aoMudarTela);
    }
    despachar({ tipo: 'rolou', y: window.scrollY });
    window.addEventListener('scroll', aoRolar, { passive: true });
    alvo.value?.addEventListener('focusin', aoEntrarFoco);
    alvo.value?.addEventListener('focusout', aoSairFoco);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', aoRolar);
    window.clearTimeout(temporizador);
    consultaCelular?.removeEventListener('change', aoMudarTela);
    alvo.value?.removeEventListener('focusin', aoEntrarFoco);
    alvo.value?.removeEventListener('focusout', aoSairFoco);
  });

  return computed(() => estado.value.escondida);
}
