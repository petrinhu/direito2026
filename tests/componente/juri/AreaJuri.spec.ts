// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import AreaJuri from '@/ui/paginas/AreaJuri.vue';
import { CHAVE_CLIENTE_RESTRITO } from '@/app/chaves';
import { ErroDeApi, type ClienteApi } from '@/app/restrito/clienteApi';
import { conteudoJuriFalso } from '../../unidade/apoio/conteudoJuriFalso';

/** Cliente de fake: só o método da Júri. A página não chama mais login, senha nem sessão própria. */
function montar(obter: () => Promise<unknown>): {
  readonly w: VueWrapper;
  readonly cliente: { obterConteudoJuri: ReturnType<typeof vi.fn> };
} {
  const cliente = { obterConteudoJuri: vi.fn(obter) };
  const w = mount(AreaJuri, {
    attachTo: document.body,
    global: {
      provide: { [CHAVE_CLIENTE_RESTRITO as unknown as symbol]: cliente as unknown as ClienteApi }
    }
  });
  return { w, cliente };
}

let w: VueWrapper | undefined;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  w?.unmount();
  w = undefined;
});

describe('AreaJuri: carga direta, sem login', () => {
  it('monta e pede o conteúdo sem tela de senha nem de login', async () => {
    const montado = montar(async () => conteudoJuriFalso());
    w = montado.w;
    await vi.waitFor(() => expect(w!.find('[data-estado="pronto"]').exists()).toBe(true));
    expect(montado.cliente.obterConteudoJuri).toHaveBeenCalledTimes(1);
    expect(w.get('h1').text()).toBe('Júri Simulado');
    expect(w.find('input[type="password"]').exists()).toBe(false);
    expect(w.find('form').exists()).toBe(false);
    expect(w.text()).not.toContain('Entrou como');
  });

  it('não grava nada no navegador: Storage continua vazio', async () => {
    const montado = montar(async () => conteudoJuriFalso());
    w = montado.w;
    await vi.waitFor(() => expect(w!.find('[data-estado="pronto"]').exists()).toBe(true));
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('conteúdo que não valida mostra o defeito, sem tela de senha', async () => {
    const montado = montar(async () => ({ versao: 1 }));
    w = montado.w;
    await vi.waitFor(() => expect(w!.find('[role="alert"]').exists()).toBe(true));
    expect(w.get('[role="alert"]').text()).toContain('Ele tem um defeito');
    expect(w.find('input[type="password"]').exists()).toBe(false);
  });

  it('falha de rede mostra Tentar de novo, e o botão carrega de novo', async () => {
    let chamadas = 0;
    const montado = montar(async () => {
      chamadas += 1;
      if (chamadas === 1) throw new ErroDeApi(0, 'rede');
      return conteudoJuriFalso();
    });
    w = montado.w;
    await vi.waitFor(() => expect(w!.find('button').exists()).toBe(true));
    expect(w.get('[role="alert"]').text()).toContain('Verifique a conexão');
    await w.get('button').trigger('click');
    await flushPromises();
    await vi.waitFor(() => expect(w!.find('[data-estado="pronto"]').exists()).toBe(true));
    expect(montado.cliente.obterConteudoJuri).toHaveBeenCalledTimes(2);
  });
});
