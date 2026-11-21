import { computed, ref, type ComputedRef, type Ref } from 'vue';
import { RADIOS, ehIdRadio, radioPorId, type IdRadio, type Radio } from '@/core/radio/catalogo';
import {
  CHAVE_PREFERENCIAS_RADIO,
  gravarPreferencias,
  lerPreferencias,
  sanearVolume,
  type ArmazenamentoLike
} from '@/core/radio/preferencias';
import {
  descreverEstado,
  transicionar,
  type ComandoRadio,
  type EstadoRadio,
  type EventoRadio
} from '@/core/radio/maquina';

/**
 * Store do tocador (item 42 da ratificação). Liga a máquina pura ao único <audio> do app: quem toca
 * é o elemento que o App.vue entrega por `vincularAudio`, fora do <router-view>, então a rádio segue
 * tocando ao trocar de página. O `src` só é atribuído no comando `conectar`, que a máquina só emite
 * depois do consentimento da emissora (LGPD). Parar limpa o `src`: pausar manteria a conexão.
 */
export interface StoreRadio {
  readonly estado: Ref<EstadoRadio>;
  /** As 5 rádios fixas, na ordem do catálogo (a UI só lê; quem valida a escolha é trocarRadio). */
  readonly radios: readonly Radio[];
  readonly radio: ComputedRef<Radio>;
  readonly volume: Ref<number>;
  readonly mudo: Ref<boolean>;
  /** Texto para a região aria-live. */
  readonly anuncio: ComputedRef<string>;
  /** Verdadeiro quando a emissora atual já teve o aviso de IP confirmado. */
  readonly consentidaAtual: ComputedRef<boolean>;
  alternar(): void;
  parar(): void;
  consentir(): void;
  cancelar(): void;
  trocarRadio(id: IdRadio): void;
  definirVolume(valor: number): void;
  alternarMudo(): void;
  vincularAudio(elemento: HTMLAudioElement | null): void;
}

export function criarStoreRadio(armazenamento: ArmazenamentoLike | null): StoreRadio {
  const inicial = lerPreferencias(armazenamento, CHAVE_PREFERENCIAS_RADIO);
  const estado = ref<EstadoRadio>('parado');
  const radioId = ref<IdRadio>(inicial.radio);
  const volume = ref<number>(inicial.volume);
  const mudo = ref(false);
  const consentimentos = ref<IdRadio[]>([...inicial.consentimentos]);
  let elemento: HTMLAudioElement | null = null;
  let aoAudio: Array<[string, () => void]> = [];

  const radio = computed(() => radioPorId(radioId.value));
  const consentidaAtual = computed(() => consentimentos.value.includes(radioId.value));
  const anuncio = computed(() => descreverEstado(estado.value, radio.value.nome));

  function gravar(): void {
    gravarPreferencias(armazenamento, CHAVE_PREFERENCIAS_RADIO, {
      radio: radioId.value,
      volume: volume.value,
      consentimentos: [...consentimentos.value]
    });
  }

  function aplicarAoAudio(): void {
    if (!elemento) return;
    elemento.volume = volume.value / 100;
    elemento.muted = mudo.value;
  }

  function conectar(): void {
    const el = elemento;
    if (!el) {
      disparar('falhar');
      return;
    }
    el.src = radio.value.url;
    el.play().catch((erro: unknown) => {
      // AbortError vem do próprio parar ou da troca de rádio; não é falha de rede.
      if (erro instanceof DOMException && erro.name === 'AbortError') return;
      disparar('falhar');
    });
  }

  function desconectar(): void {
    const el = elemento;
    if (!el) return;
    el.pause();
    el.removeAttribute('src');
    el.load();
  }

  function executar(comando: ComandoRadio | undefined): void {
    if (comando === 'conectar') conectar();
    else if (comando === 'desconectar') desconectar();
  }

  function disparar(evento: EventoRadio): void {
    const resultado = transicionar(estado.value, evento, consentidaAtual.value);
    estado.value = resultado.estado;
    executar(resultado.comando);
  }

  function tocarAtiva(): boolean {
    return estado.value === 'conectando' || estado.value === 'tocando';
  }

  return {
    estado,
    radios: RADIOS,
    radio,
    volume,
    mudo,
    anuncio,
    consentidaAtual,

    alternar() {
      disparar(tocarAtiva() ? 'parar' : 'tocar');
    },

    parar() {
      disparar('parar');
    },

    consentir() {
      if (!consentimentos.value.includes(radioId.value)) {
        consentimentos.value = [...consentimentos.value, radioId.value];
      }
      gravar();
      disparar('consentir');
    },

    cancelar() {
      disparar('cancelar');
    },

    trocarRadio(id) {
      if (!ehIdRadio(id)) return;
      const estavaAtiva = tocarAtiva();
      if (estavaAtiva) disparar('parar');
      radioId.value = id;
      gravar();
      if (estavaAtiva) disparar('tocar');
    },

    definirVolume(valor) {
      volume.value = sanearVolume(valor);
      aplicarAoAudio();
      gravar();
    },

    alternarMudo() {
      mudo.value = !mudo.value;
      aplicarAoAudio();
    },

    vincularAudio(novo) {
      for (const [evento, funcao] of aoAudio) elemento?.removeEventListener(evento, funcao);
      aoAudio = [];
      elemento = novo;
      if (!novo) return;
      const ouvintes: Array<[string, () => void]> = [
        ['playing', () => disparar('tocando')],
        ['waiting', () => disparar('aguardar')],
        ['stalled', () => disparar('aguardar')],
        ['error', () => disparar('falhar')],
        ['ended', () => disparar('falhar')]
      ];
      for (const [evento, funcao] of ouvintes) novo.addEventListener(evento, funcao);
      aoAudio = ouvintes;
      aplicarAoAudio();
    }
  };
}

/** localStorage pode lançar (Safari em modo privado, acesso negado): devolve null e o tocador segue sem memória. */
export function obterArmazenamentoLocal(): ArmazenamentoLike | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}
