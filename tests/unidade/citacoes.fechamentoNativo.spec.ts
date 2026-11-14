// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarControladorCitacoes } from '@/ui/componentes/citacoes';

/**
 * QA-BAL-D1 (QA visual de 14/11, cc-12, cpc-322 e cpc-497): depois que o Esc (ou um clique
 * fora) fecha o balão pelo próprio navegador (popover auto), o controlador precisa saber que
 * não está mais aberto. Senão o próximo clique no MESMO gatilho cai no ramo "já aberto, então
 * fecha" e o balão não reabre.
 */
describe('controlador de citações depois de um fechamento nativo', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function montar() {
    const regiao = document.createElement('div');
    regiao.innerHTML =
      '<button class="citacao" data-dispositivo="cc-12">art. 12</button>' +
      '<button class="citacao" data-dispositivo="cpc-322">art. 322</button>';
    document.body.appendChild(regiao);
    const aoAbrir = vi.fn();
    const aoFechar = vi.fn();
    const controlador = criarControladorCitacoes({
      dispositivos: () => undefined,
      aoAbrir,
      aoFechar
    });
    controlador.ligar(regiao);
    return { controlador, aoAbrir, aoFechar, botao: regiao.querySelector('button') as HTMLElement };
  }

  it('o clique seguinte no mesmo gatilho reabre depois do fechamento nativo', () => {
    const { controlador, aoAbrir, botao } = montar();
    botao.click();
    expect(aoAbrir).toHaveBeenCalledTimes(1);
    controlador.registrarFechamento();
    botao.click();
    expect(aoAbrir).toHaveBeenCalledTimes(2);
  });

  it('o fechamento nativo limpa o estado e o aria-expanded, sem chamar aoFechar de novo', () => {
    const { controlador, aoFechar, botao } = montar();
    botao.click();
    controlador.registrarFechamento();
    expect(controlador.estado.aberto).toBe(false);
    expect(botao.getAttribute('aria-expanded')).toBe('false');
    expect(aoFechar).not.toHaveBeenCalled();
  });

  it('corrida: o clique chega antes do evento toggle, e o balão já está fechado pelo navegador', () => {
    // O navegador fecha de forma síncrona; o evento toggle chega depois. Se o clique (Espaço no
    // keyup) cai nesse intervalo, o controlador tem de olhar o estado REAL do popover.
    const regiao = document.createElement('div');
    regiao.innerHTML = '<button class="citacao" data-dispositivo="cc-12">art. 12</button>';
    document.body.appendChild(regiao);
    let fechadoPeloNavegador = false;
    const aoAbrir = vi.fn();
    const controlador = criarControladorCitacoes({
      dispositivos: () => undefined,
      aoAbrir,
      aoFechar: vi.fn(),
      estaAberto: () => !fechadoPeloNavegador
    });
    controlador.ligar(regiao);
    const botao = regiao.querySelector('button') as HTMLElement;
    botao.click();
    fechadoPeloNavegador = true;
    botao.click();
    expect(aoAbrir).toHaveBeenCalledTimes(2);
  });

  it('um clique cancela a abertura por hover que ainda não disparou (senão reabre depois do Esc)', () => {
    vi.useFakeTimers();
    const matchMediaAntigo = window.matchMedia;
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
    try {
      const regiao = document.createElement('div');
      regiao.innerHTML = '<button class="citacao" data-dispositivo="cc-12">art. 12</button>';
      document.body.appendChild(regiao);
      const aoAbrir = vi.fn();
      const controlador = criarControladorCitacoes({
        dispositivos: () => undefined,
        aoAbrir,
        aoFechar: vi.fn()
      });
      controlador.ligar(regiao);
      const botao = regiao.querySelector('button') as HTMLElement;
      botao.dispatchEvent(
        Object.assign(new Event('pointerenter'), { pointerType: 'mouse', clientX: 1, clientY: 1 })
      );
      botao.click();
      vi.advanceTimersByTime(300);
      expect(aoAbrir).toHaveBeenCalledTimes(1);
    } finally {
      window.matchMedia = matchMediaAntigo;
      vi.useRealTimers();
    }
  });

  it('registrar um fechamento quando nada está aberto não faz nada', () => {
    const { controlador, aoAbrir, aoFechar } = montar();
    controlador.registrarFechamento();
    expect(aoAbrir).not.toHaveBeenCalled();
    expect(aoFechar).not.toHaveBeenCalled();
  });
});
