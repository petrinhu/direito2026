// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarControladorCitacoes } from '@/ui/componentes/citacoes';

/**
 * WCAG 2.1 SC 1.4.13 (Content on Hover or Focus) exige que conteúdo
 * revelado por hover seja "hoverable": o ponteiro precisa poder se mover
 * do gatilho até o próprio conteúdo sem que ele desapareça no caminho.
 * https://w3c.github.io/wcag21/understanding/content-on-hover-or-focus.html
 *
 * Ordem do líder, 22/09/2026, verbatim: "o balao NÃO pode sumir quando o
 * ponteiro sai da citação em direção a ele. Enquanto o ponteiro estiver
 * sobre a citação OU sobre o balão, ele fica aberto."
 *
 * Sem @floating-ui/react (só @floating-ui/dom está instalado, L-51 proíbe
 * instalar pacote novo), a técnica de safePolygon não está disponível.
 * A solução adotada é a mais simples documentada para este requisito:
 * cancelar o fechamento agendado sempre que o ponteiro estiver confirmado
 * sobre o gatilho OU sobre o balão, com o pequeno atraso de saída que já
 * existia (200 ms) servindo de ponte para a distância de 8 px entre os
 * dois.
 */

function dispararPonteiro(
  alvo: EventTarget,
  tipo: string,
  detalhes: { pointerType?: string; clientX?: number; clientY?: number } = {}
): void {
  const evento = new Event(tipo, { bubbles: false, cancelable: true });
  Object.assign(evento, {
    pointerType: detalhes.pointerType ?? 'mouse',
    clientX: detalhes.clientX ?? 0,
    clientY: detalhes.clientY ?? 0
  });
  alvo.dispatchEvent(evento);
}

describe('criarControladorCitacoes: balão hoverable', () => {
  let regiao: HTMLElement;
  let botao: HTMLElement;
  let balao: HTMLElement;
  let aoAbrir: ReturnType<typeof vi.fn>;
  let aoFechar: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '',
        addEventListener: () => {},
        removeEventListener: () => {}
      })
    );

    regiao = document.createElement('div');
    botao = document.createElement('button');
    botao.dataset.dispositivo = 'cc-186';
    regiao.appendChild(botao);
    document.body.appendChild(regiao);

    balao = document.createElement('div');
    document.body.appendChild(balao);

    aoAbrir = vi.fn();
    aoFechar = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('mover o ponteiro da citação para dentro do balão mantém aberto', () => {
    const controlador = criarControladorCitacoes({
      dispositivos: () => undefined,
      aoAbrir,
      aoFechar
    });
    controlador.ligar(regiao);
    controlador.ligarBalao(balao);

    dispararPonteiro(botao, 'pointerenter');
    vi.advanceTimersByTime(120);
    expect(aoAbrir).toHaveBeenCalledTimes(1);
    expect(controlador.estado.aberto).toBe(true);

    // ponteiro sai do botão a caminho do balão, mas chega antes da tolerância
    dispararPonteiro(botao, 'pointerleave');
    vi.advanceTimersByTime(50);
    dispararPonteiro(balao, 'pointerenter');
    // mesmo passando do prazo original de 200ms, não fecha
    vi.advanceTimersByTime(300);
    expect(aoFechar).not.toHaveBeenCalled();
    expect(controlador.estado.aberto).toBe(true);

    // agora sai de verdade do balão
    dispararPonteiro(balao, 'pointerleave');
    vi.advanceTimersByTime(200);
    expect(aoFechar).toHaveBeenCalledTimes(1);
    expect(controlador.estado.aberto).toBe(false);
  });

  it('vários pointerleave em cascata (um por nível de ancestral, como o navegador realmente dispara ao sair de uma estrutura aninhada) não deixam temporizador órfão que feche o balão depois de cancelado', () => {
    // Achado real ao rodar o e2e desta correção: pointerleave não é um
    // único evento que borbulha, o navegador sintetiza um por NÍVEL de
    // ancestral atravessado (botão -> p -> div -> section -> div -> div
    // -> div, no caso medido). Sem cancelar o temporizador anterior antes
    // de reagendar, cada nível deixava um fechamento órfão para trás, e
    // cancelar só o último (ao entrar no balão) não bastava.
    const nivelBotao = document.createElement('button');
    nivelBotao.dataset.dispositivo = 'cc-186';
    const ancestral1 = document.createElement('p');
    const ancestral2 = document.createElement('div');
    ancestral1.appendChild(nivelBotao);
    ancestral2.appendChild(ancestral1);
    regiao.appendChild(ancestral2);

    const controlador = criarControladorCitacoes({
      dispositivos: () => undefined,
      aoAbrir,
      aoFechar
    });
    controlador.ligar(regiao);
    controlador.ligarBalao(balao);

    dispararPonteiro(nivelBotao, 'pointerenter');
    vi.advanceTimersByTime(120);
    expect(controlador.estado.aberto).toBe(true);

    // a cascata real: um pointerleave por elemento sendo deixado para trás.
    for (const nivel of [nivelBotao, ancestral1, ancestral2, regiao]) {
      dispararPonteiro(nivel, 'pointerleave');
    }
    // e só então o ponteiro chega de fato ao balão.
    dispararPonteiro(balao, 'pointerenter');

    vi.advanceTimersByTime(300);
    expect(
      aoFechar,
      'um temporizador órfão de um nível anterior fechou mesmo com o ponteiro dentro do balão'
    ).not.toHaveBeenCalled();
    expect(controlador.estado.aberto).toBe(true);
  });

  it('sair da citação sem alcançar o balão fecha após a tolerância', () => {
    const controlador = criarControladorCitacoes({
      dispositivos: () => undefined,
      aoAbrir,
      aoFechar
    });
    controlador.ligar(regiao);
    controlador.ligarBalao(balao);

    dispararPonteiro(botao, 'pointerenter');
    vi.advanceTimersByTime(120);
    expect(controlador.estado.aberto).toBe(true);

    dispararPonteiro(botao, 'pointerleave');
    vi.advanceTimersByTime(200);
    expect(aoFechar).toHaveBeenCalledTimes(1);
    expect(controlador.estado.aberto).toBe(false);
  });

  it('desligar() remove também os escutadores do balão (não reabre nem quebra ao reusar)', () => {
    const controlador = criarControladorCitacoes({
      dispositivos: () => undefined,
      aoAbrir,
      aoFechar
    });
    controlador.ligar(regiao);
    controlador.ligarBalao(balao);
    controlador.desligar();

    dispararPonteiro(botao, 'pointerenter');
    vi.advanceTimersByTime(120);
    expect(aoAbrir).not.toHaveBeenCalled();

    // entrar/sair do balão depois de desligado não deve lançar erro
    expect(() => {
      dispararPonteiro(balao, 'pointerenter');
      dispararPonteiro(balao, 'pointerleave');
    }).not.toThrow();
  });
});
