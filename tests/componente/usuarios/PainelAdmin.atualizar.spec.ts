// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PainelAdmin from '@/ui/usuarios/PainelAdmin.vue';

/**
 * ADM-F4 (fatia 2): a coluna "Último acesso" mostra a data no fuso de Recife (dd/mm/aaaa HH:MM:SS); o botão
 * Atualizar relê a lista e mostra a hora da leitura; na volta da aba a lista é relida, no máximo 1 vez a cada 30 s.
 */
function linha(usuario: string, ultimoLogin: string | null) {
  return {
    usuario,
    admin: false,
    ativo: true,
    deveTrocarSenha: false,
    criadoEm: null,
    ultimoLogin,
    email: null,
    conectado: false
  };
}

function montar(usuarios: unknown[]) {
  const administrar = vi.fn(async () => ({ ok: true, valor: usuarios }));
  const w = mount(PainelAdmin, {
    props: { usuarioAtual: 'petrus', administrar: administrar as never },
    attachTo: document.body
  });
  return { w, administrar };
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('PainelAdmin: último acesso e Atualizar', () => {
  it('mostra o último login no fuso de Recife, e "Nunca" sem login', async () => {
    const { w } = montar([linha('ana', '2026-11-14T15:04:29+00:00'), linha('bia', null)]);
    await flushPromises();
    const celulas = w.findAll('tbody tr td[data-rotulo="Último acesso"]').map((c) => c.text());
    expect(celulas).toEqual(['14/11/2026 12:04:29', 'Nunca']);
    w.unmount();
  });

  it('o botão Atualizar relê a lista e mostra "Atualizado às HH:MM:SS"', async () => {
    const { w, administrar } = montar([linha('ana', null)]);
    await flushPromises();
    expect(administrar).toHaveBeenCalledTimes(1);
    const botao = w.findAll('button').find((b) => b.text() === 'Atualizar');
    expect(botao).toBeDefined();
    await botao!.trigger('click');
    await flushPromises();
    expect(administrar).toHaveBeenCalledTimes(2);
    expect(w.text()).toMatch(/Atualizado às \d{2}:\d{2}:\d{2}/);
    w.unmount();
  });

  it('na volta da aba relê, no máximo 1 vez a cada 30 s', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T12:00:00-03:00'));
    const { w, administrar } = montar([linha('ana', null)]);
    await flushPromises();
    expect(administrar).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-11-17T12:00:10-03:00'));
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();
    expect(administrar).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-11-17T12:00:31-03:00'));
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();
    expect(administrar).toHaveBeenCalledTimes(2);
    w.unmount();
  });

  it('uma leitura que falha não mostra "Atualizado às" nem conta como leitura', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T12:00:00-03:00'));
    const administrar = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, mensagem: 'sem conexão' })
      .mockResolvedValue({ ok: true, valor: [linha('ana', null)] });
    const w = mount(PainelAdmin, {
      props: { usuarioAtual: 'petrus', administrar: administrar as never },
      attachTo: document.body
    });
    await flushPromises();
    expect(administrar).toHaveBeenCalledTimes(1);
    expect
      .soft(w.text(), 'leitura falhou: não há hora de atualização')
      .not.toMatch(/Atualizado às/);

    vi.setSystemTime(new Date('2026-11-17T12:00:10-03:00'));
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();
    expect(administrar, 'a falha não marcou leitura: a volta da aba relê').toHaveBeenCalledTimes(2);
    expect(w.text()).toMatch(/Atualizado às \d{2}:\d{2}:\d{2}/);
    w.unmount();
  });
});
