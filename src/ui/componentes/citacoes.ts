import type { IndiceDispositivos } from '@/core/dispositivos/tipos';

export interface EstadoBalao {
  readonly aberto: boolean;
  readonly dispositivoId: string | undefined;
  readonly botaoAncora: HTMLElement | undefined;
}

/** Ponto do ponteiro no instante em que o hover abriu o balão (seção 12.4). */
export interface PontoPonteiro {
  readonly x: number;
  readonly y: number;
}

export interface ControladorCitacoes {
  readonly estado: EstadoBalao;
  ligar(regiao: HTMLElement): void;
  /** Liga os escutadores de hoverable no próprio elemento do balão (seção 12.3). */
  ligarBalao(balao: HTMLElement): void;
  desligar(): void;
}

const ATRASO_INTENCAO_HOVER_MS = 120;
const TOLERANCIA_SAIDA_HOVER_MS = 200;

/**
 * Controlador único por delegação de evento (seção 12.2): não existe um
 * balão por citação, existe um elemento popover compartilhado na página e
 * um controlador que escuta a região de conteúdo inteira. Este módulo é
 * puro TypeScript sobre DOM (por isso mora em ui/, não em core), sem Vue:
 * o próprio plano (seção 12.8) o descreve como um controlador, não um
 * componente.
 */
export function criarControladorCitacoes(params: {
  dispositivos: () => IndiceDispositivos | undefined;
  aoAbrir: (dispositivoId: string, ancora: HTMLElement, ponto?: PontoPonteiro) => void;
  aoFechar: () => void;
}): ControladorCitacoes {
  let regiaoAtual: HTMLElement | undefined;
  let balaoAtual: HTMLElement | undefined;
  let temporizadorAbertura: ReturnType<typeof setTimeout> | undefined;
  let temporizadorFechamento: ReturnType<typeof setTimeout> | undefined;

  const estado: EstadoBalao = { aberto: false, dispositivoId: undefined, botaoAncora: undefined };

  function ehBotaoCitacao(alvo: EventTarget | null): alvo is HTMLElement {
    return alvo instanceof HTMLElement && alvo.matches('button[data-dispositivo]');
  }

  function abrir(botao: HTMLElement, ponto?: PontoPonteiro): void {
    const id = botao.dataset.dispositivo;
    if (!id) return;
    (estado as { aberto: boolean }).aberto = true;
    (estado as { dispositivoId: string | undefined }).dispositivoId = id;
    (estado as { botaoAncora: HTMLElement | undefined }).botaoAncora = botao;
    botao.setAttribute('aria-expanded', 'true');
    params.aoAbrir(id, botao, ponto);
  }

  function fechar(): void {
    if (!estado.aberto) return;
    estado.botaoAncora?.setAttribute('aria-expanded', 'false');
    (estado as { aberto: boolean }).aberto = false;
    (estado as { dispositivoId: string | undefined }).dispositivoId = undefined;
    (estado as { botaoAncora: HTMLElement | undefined }).botaoAncora = undefined;
    params.aoFechar();
  }

  // Mouse: só dentro de hover fino, com intenção antes de abrir.
  const consultaHover =
    typeof matchMedia === 'function' ? matchMedia('(hover: hover) and (pointer: fine)') : undefined;

  function aoPonteiroEntrar(evento: PointerEvent): void {
    if (evento.pointerType !== 'mouse' || !consultaHover?.matches) return;
    const botao =
      evento.target instanceof HTMLElement
        ? evento.target.closest('button[data-dispositivo]')
        : null;
    if (!(botao instanceof HTMLElement)) return;
    const ponto: PontoPonteiro = { x: evento.clientX, y: evento.clientY };
    clearTimeout(temporizadorFechamento);
    clearTimeout(temporizadorAbertura);
    temporizadorAbertura = setTimeout(() => abrir(botao, ponto), ATRASO_INTENCAO_HOVER_MS);
  }

  /**
   * Achado ao investigar o teste e2e desta correção: 'pointerleave' não é
   * um único evento que borbulha - o navegador sintetiza um evento por
   * NÍVEL de ancestral atravessado ao sair de uma estrutura aninhada
   * (aqui, botão -> p -> div -> section -> div -> div -> div, sete
   * disparos para um único movimento real do mouse). Sem cancelar o
   * temporizador anterior antes de reagendar, cada nível deixava um
   * setTimeout(fechar, ...) órfão para trás; cancelar só o último
   * (aoBalaoPonteiroEntrar) não bastava, porque os órfãos disparavam do
   * mesmo jeito. `clearTimeout` antes de reatribuir resolve na raiz,
   * sem precisar de nenhuma lógica de geometria (polígono seguro).
   */
  function aoPonteiroSair(evento: PointerEvent): void {
    if (evento.pointerType !== 'mouse') return;
    clearTimeout(temporizadorAbertura);
    clearTimeout(temporizadorFechamento);
    temporizadorFechamento = setTimeout(fechar, TOLERANCIA_SAIDA_HOVER_MS);
  }

  // Hoverable (WCAG 1.4.13): o mesmo par entrar/sair, agora no próprio
  // balão, para o ponteiro poder atravessar de um para o outro sem que o
  // fechamento agendado em aoPonteiroSair se cumpra no meio do caminho.
  function aoBalaoPonteiroEntrar(evento: PointerEvent): void {
    if (evento.pointerType !== 'mouse') return;
    clearTimeout(temporizadorFechamento);
  }

  function aoBalaoPonteiroSair(evento: PointerEvent): void {
    if (evento.pointerType !== 'mouse') return;
    clearTimeout(temporizadorAbertura);
    clearTimeout(temporizadorFechamento);
    temporizadorFechamento = setTimeout(fechar, TOLERANCIA_SAIDA_HOVER_MS);
  }

  // Toque: um toque abre, outro fecha. A media query acima já impede que o
  // caminho de hover interfira, então não há o problema clássico de
  // primeiro-toque-vira-hover.
  function aoClicar(evento: MouseEvent): void {
    const botao = ehBotaoCitacao(evento.target) ? evento.target : null;
    if (!botao) return;
    if (estado.aberto && estado.botaoAncora === botao) {
      fechar();
    } else {
      abrir(botao);
    }
  }

  // Teclado: só abre em :focus-visible, nunca em foco por clique de mouse.
  function aoFocar(evento: FocusEvent): void {
    const botao = evento.target;
    if (!(botao instanceof HTMLElement) || !botao.matches('button[data-dispositivo]')) return;
    if (botao.matches(':focus-visible')) abrir(botao);
  }

  function aoDesfocar(evento: FocusEvent): void {
    const botao = evento.target;
    if (botao instanceof HTMLElement && botao === estado.botaoAncora) fechar();
  }

  function ligar(regiao: HTMLElement): void {
    regiaoAtual = regiao;
    regiao.addEventListener('pointerenter', aoPonteiroEntrar, true);
    regiao.addEventListener('pointerleave', aoPonteiroSair, true);
    regiao.addEventListener('click', aoClicar);
    regiao.addEventListener('focus', aoFocar, true);
    regiao.addEventListener('focusout', aoDesfocar, true);
  }

  function ligarBalao(balao: HTMLElement): void {
    balaoAtual = balao;
    balao.addEventListener('pointerenter', aoBalaoPonteiroEntrar);
    balao.addEventListener('pointerleave', aoBalaoPonteiroSair);
  }

  function desligar(): void {
    if (regiaoAtual) {
      regiaoAtual.removeEventListener('pointerenter', aoPonteiroEntrar, true);
      regiaoAtual.removeEventListener('pointerleave', aoPonteiroSair, true);
      regiaoAtual.removeEventListener('click', aoClicar);
      regiaoAtual.removeEventListener('focus', aoFocar, true);
      regiaoAtual.removeEventListener('focusout', aoDesfocar, true);
      regiaoAtual = undefined;
    }
    if (balaoAtual) {
      balaoAtual.removeEventListener('pointerenter', aoBalaoPonteiroEntrar);
      balaoAtual.removeEventListener('pointerleave', aoBalaoPonteiroSair);
      balaoAtual = undefined;
    }
    clearTimeout(temporizadorAbertura);
    clearTimeout(temporizadorFechamento);
  }

  return { estado, ligar, ligarBalao, desligar };
}
