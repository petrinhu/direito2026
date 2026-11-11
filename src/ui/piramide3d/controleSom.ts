/* global Element */
import type { ControleSom, EstadoSom } from '@/app/piramide3d/tiposMotor';
import { criarSom, type Som } from './sons';

// Gestos ouvidos em qualquer ponto da página, em captura. Os controles de som tratam o próprio
// gesto, porque precisam ler o estado anterior ao clique para decidir ligar ou desligar.
const EVENTOS_GESTO = [
  'pointerdown',
  'mousedown',
  'pointerup',
  'mouseup',
  'click',
  'keydown',
  'keyup',
  'touchstart',
  'touchend'
] as const;

const SELETOR_CONTROLES = '[data-controles-som]';

interface Compartilhado {
  som: Som;
  controle: ControleSom;
}

// Um só som para a página: as figuras dividem o contexto de áudio e o estado ligado/desligado.
let compartilhado: Compartilhado | null = null;

function criarCompartilhado(reduzido: boolean): Compartilhado {
  const som = criarSom({ reduzido });
  const ouvintes = new Set<() => void>();
  const notificar = (): void => {
    for (const fn of ouvintes) fn();
  };

  function ouvirGesto(ev: Event): void {
    if (ev.target instanceof Element && ev.target.closest(SELETOR_CONTROLES)) return;
    void som.gesto(ev.type).then(() => {
      notificar();
      if (som.estado.desbloqueado) {
        for (const tipo of EVENTOS_GESTO) document.removeEventListener(tipo, ouvirGesto, true);
      }
    });
  }
  for (const tipo of EVENTOS_GESTO) document.addEventListener(tipo, ouvirGesto, { capture: true });

  // Os controles aparecem quando os buffers estão prontos.
  void som.pronto.then(notificar);

  const controle: ControleSom = {
    estado(): EstadoSom {
      return {
        disponivel: som.estado.disponivel,
        desbloqueado: som.estado.desbloqueado,
        ativo: som.estado.ativo
      };
    },
    ouvir(aoMudar) {
      ouvintes.add(aoMudar);
      return () => ouvintes.delete(aoMudar);
    },
    alternar() {
      void som.controle('controle-som').then(notificar);
      notificar();
    },
    testar() {
      void som.testar('testar-som').then(notificar);
    },
    definirReduzido(valor) {
      som.definirReduzido(valor);
    }
  };
  return { som, controle };
}

/** O som da página: criado na primeira figura, com os buffers prontos antes de qualquer hover. */
export function obterControleSom(reduzido: boolean): ControleSom {
  if (!compartilhado) compartilhado = criarCompartilhado(reduzido);
  return compartilhado.controle;
}

/** A figura pede o som para tocar um nível (entrar, sair ou fundamental). */
export function somDaPagina(reduzido: boolean): Som {
  if (!compartilhado) compartilhado = criarCompartilhado(reduzido);
  return compartilhado.som;
}
