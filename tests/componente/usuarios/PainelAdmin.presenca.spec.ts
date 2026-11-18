// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PainelAdmin from '@/ui/usuarios/PainelAdmin.vue';

/**
 * ADM-F4 (fatia 1): a luz de sessão (LED) na célula do nome. Verde: sessão aberta e válida. Vermelho vazado:
 * sem sessão aberta. Sem o campo (servidor antigo): "sem informação". O texto oculto diz o mesmo para leitor de tela.
 */
function linha(usuario: string, conectado?: boolean) {
  return {
    usuario,
    admin: false,
    ativo: true,
    deveTrocarSenha: false,
    criadoEm: null,
    ultimoLogin: null,
    email: null,
    ...(conectado === undefined ? {} : { conectado })
  };
}

function montar(usuarios: unknown[]) {
  const administrar = vi.fn(async () => ({ ok: true, valor: usuarios }));
  return mount(PainelAdmin, {
    props: { usuarioAtual: 'petrus', administrar: administrar as never },
    attachTo: document.body
  });
}

describe('PainelAdmin: luz de sessão (LED)', () => {
  it('sessão aberta vira LED verde com texto oculto "Sessão aberta"', async () => {
    const w = montar([linha('ana', true)]);
    await flushPromises();
    const led = w.get('tbody tr th .ar-led');
    expect(led.classes()).toContain('ar-led--verde');
    expect(w.get('tbody tr th').text()).toContain('Sessão aberta');
    w.unmount();
  });

  it('sem sessão aberta vira LED vermelho vazado com texto oculto "Sem sessão aberta"', async () => {
    const w = montar([linha('bia', false)]);
    await flushPromises();
    expect(w.get('tbody tr th .ar-led').classes()).toContain('ar-led--vermelho');
    expect(w.get('tbody tr th').text()).toContain('Sem sessão aberta');
    w.unmount();
  });

  it('sem o campo (servidor antigo) mostra "sem informação"', async () => {
    const w = montar([linha('caio')]);
    await flushPromises();
    expect(w.get('tbody tr th .ar-led').classes()).toContain('ar-led--sem');
    expect(w.get('tbody tr th').text()).toContain('sem informação');
    w.unmount();
  });
});
