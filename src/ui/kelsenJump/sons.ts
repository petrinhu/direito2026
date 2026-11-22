/* global AudioNode, GainNode, OscillatorNode */
/**
 * Sons de Atari com osciladores do WebAudio: onda quadrada, sem arquivo. O AudioContext nasce no
 * primeiro gesto do usuário (política de autoplay); antes disso, o jogo é mudo sem erro.
 */
export type EventoSom = 'pulo' | 'ponto' | 'colisao';

export interface Sons {
  /** Chamado num gesto do usuário: cria o contexto de áudio. */
  ativar(): void;
  tocar(evento: EventoSom): void;
  definirMudo(mudo: boolean): void;
  fechar(): void;
}

interface ContextoAudio {
  readonly currentTime: number;
  readonly destination: AudioNode;
  createOscillator(): OscillatorNode;
  createGain(): GainNode;
  close(): Promise<void>;
}

type FabricaContexto = () => ContextoAudio | undefined;

const fabricaPadrao: FabricaContexto = () => {
  const Ctor = (globalThis as { AudioContext?: new () => ContextoAudio }).AudioContext;
  return Ctor ? new Ctor() : undefined;
};

export function criarSons(mudoInicial: boolean, fabrica: FabricaContexto = fabricaPadrao): Sons {
  let ctx: ContextoAudio | undefined;
  let mudo = mudoInicial;

  function nota(inicio: number, de: number, para: number, duracao: number, volume: number): void {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(de, inicio);
    osc.frequency.exponentialRampToValueAtTime(para, inicio + duracao);
    ganho.gain.setValueAtTime(volume, inicio);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
    osc.connect(ganho);
    ganho.connect(ctx.destination);
    osc.start(inicio);
    osc.stop(inicio + duracao);
  }

  return {
    ativar() {
      if (ctx) return;
      ctx = fabrica();
    },
    tocar(evento) {
      if (!ctx || mudo) return;
      const t = ctx.currentTime;
      if (evento === 'pulo') nota(t, 220, 880, 0.12, 0.12);
      else if (evento === 'ponto') {
        nota(t, 880, 880, 0.05, 0.1);
        nota(t + 0.06, 1320, 1320, 0.07, 0.1);
      } else nota(t, 440, 55, 0.45, 0.2);
    },
    definirMudo(valor) {
      mudo = valor;
    },
    fechar() {
      void ctx?.close();
      ctx = undefined;
    }
  };
}
