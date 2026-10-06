// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PainelAdmin from '@/ui/area-restrita/PainelAdmin.vue';
import type { ClienteApi, UsuarioAdmin } from '@/app/restrito/clienteApi';
import type { ResultadoAdministracao } from '@/app/restrito/sessaoRestrita';

const usuarios: UsuarioAdmin[] = [
  {
    usuario: 'chefe',
    admin: true,
    ativo: true,
    deveTrocarSenha: false,
    criadoEm: '2026-10-01',
    ultimoLogin: '2026-10-05'
  },
  {
    usuario: 'ana',
    admin: false,
    ativo: true,
    deveTrocarSenha: true,
    criadoEm: '2026-10-02',
    ultimoLogin: null
  },
  {
    usuario: 'beto',
    admin: false,
    ativo: false,
    deveTrocarSenha: false,
    criadoEm: '2026-10-02',
    ultimoLogin: null
  }
];

function montar(sobrescritas: Partial<ClienteApi> = {}, erroAdm?: string) {
  const cliente = {
    listarUsuarios: vi.fn(async () => usuarios),
    acaoUsuario: vi.fn(async () => ({})),
    ...sobrescritas
  } as unknown as ClienteApi;
  const administrar = async <T>(
    f: (c: ClienteApi) => Promise<T>
  ): Promise<ResultadoAdministracao<T>> => {
    if (erroAdm) return { ok: false, mensagem: erroAdm };
    return { ok: true, valor: await f(cliente) };
  };
  const w = mount(PainelAdmin, {
    props: { usuarioAtual: 'chefe', administrar },
    attachTo: document.body
  });
  return { w, cliente };
}

describe('PainelAdmin', () => {
  it('lista os usuários numa tabela com legenda e estado dito em texto', async () => {
    const { w } = montar();
    await flushPromises();
    expect(w.get('table caption').text()).toMatch(/usuários/i);
    const linhas = w.findAll('tbody tr');
    expect(linhas).toHaveLength(3);
    expect(linhas[1]!.text()).toContain('ana');
    expect(linhas[1]!.text()).toContain('Participante');
    expect(linhas[1]!.text()).toContain('Troca de senha pendente');
    expect(linhas[2]!.text()).toContain('Desativado');
    expect(linhas[0]!.text()).toContain('Administrador');
  });

  it('a própria conta não tem botões de ação', async () => {
    const { w } = montar();
    await flushPromises();
    const propria = w.findAll('tbody tr')[0]!;
    expect(propria.findAll('button')).toHaveLength(0);
    expect(propria.text()).toMatch(/sua conta/i);
  });

  it('cria usuário com senha provisória gerada e a mostra uma vez, com botão copiar', async () => {
    const { w, cliente } = montar({
      acaoUsuario: vi.fn(async () => ({ senhaProvisoria: 'ABCD2345wxyz' }))
    });
    await flushPromises();
    await w.get('input[name="novoUsuario"]').setValue('carla');
    await w.get('form.ar-admin__criar').trigger('submit');
    await flushPromises();
    expect(cliente.acaoUsuario).toHaveBeenCalledWith({ acao: 'criar', usuario: 'carla' });
    const aviso = w.get('[role="status"].ar-admin__provisoria');
    expect(aviso.text()).toContain('carla');
    expect(aviso.text()).toContain('ABCD2345wxyz');
    expect(aviso.text()).toMatch(/só aparece agora/i);
    expect(aviso.findAll('button').map((b) => b.text())).toEqual(['Copiar senha', 'Já anotei']);
    await aviso.findAll('button')[1]!.trigger('click');
    expect(w.find('.ar-admin__provisoria').exists()).toBe(false);
    expect(w.html()).not.toContain('ABCD2345wxyz');
  });

  it('login inválido não chama o servidor e explica a regra', async () => {
    const { w, cliente } = montar();
    await flushPromises();
    await w.get('input[name="novoUsuario"]').setValue('a b');
    await w.get('form.ar-admin__criar').trigger('submit');
    await flushPromises();
    expect(cliente.acaoUsuario).not.toHaveBeenCalled();
    expect(w.get('[role="alert"]').text()).toMatch(/3 a 32 caracteres/);
  });

  it('senha provisória digitada vai junto', async () => {
    const { w, cliente } = montar();
    await flushPromises();
    await w.get('input[name="novoUsuario"]').setValue('carla');
    await w.get('input[name="provisoriaEscolhida"]').setValue('minha provisoria 1');
    await w.get('form.ar-admin__criar').trigger('submit');
    await flushPromises();
    expect(cliente.acaoUsuario).toHaveBeenCalledWith({
      acao: 'criar',
      usuario: 'carla',
      senhaProvisoria: 'minha provisoria 1'
    });
  });

  it('redefinir mostra a nova provisória', async () => {
    const { w, cliente } = montar({
      acaoUsuario: vi.fn(async () => ({ senhaProvisoria: 'NOVA9999aaaa' }))
    });
    await flushPromises();
    await w.get('button[data-acao="redefinir"][data-usuario="ana"]').trigger('click');
    await flushPromises();
    expect(cliente.acaoUsuario).toHaveBeenCalledWith({ acao: 'redefinir', usuario: 'ana' });
    expect(w.get('.ar-admin__provisoria').text()).toContain('NOVA9999aaaa');
  });

  it('ativa quem está desativado e desativa quem está ativo, e atualiza a lista', async () => {
    const { w, cliente } = montar();
    await flushPromises();
    await w.get('button[data-acao="ativar"][data-usuario="beto"]').trigger('click');
    await flushPromises();
    expect(cliente.acaoUsuario).toHaveBeenCalledWith({ acao: 'ativar', usuario: 'beto' });
    expect(cliente.listarUsuarios).toHaveBeenCalledTimes(2);
    expect(w.find('button[data-acao="desativar"][data-usuario="ana"]').exists()).toBe(true);
    expect(w.find('button[data-acao="desativar"][data-usuario="beto"]').exists()).toBe(false);
  });

  it('excluir exige confirmação e a confirmação pode ser cancelada', async () => {
    const { w, cliente } = montar();
    await flushPromises();
    await w.get('button[data-acao="excluir"][data-usuario="ana"]').trigger('click');
    expect(cliente.acaoUsuario).not.toHaveBeenCalled();
    const grupo = w.get('[role="group"].ar-admin__confirmar');
    expect(grupo.text()).toMatch(/excluir ana/i);
    await grupo.get('button[data-acao="cancelar"]').trigger('click');
    expect(w.find('.ar-admin__confirmar').exists()).toBe(false);
    expect(cliente.acaoUsuario).not.toHaveBeenCalled();

    await w.get('button[data-acao="excluir"][data-usuario="ana"]').trigger('click');
    await w.get('button[data-acao="confirmar-exclusao"]').trigger('click');
    await flushPromises();
    expect(cliente.acaoUsuario).toHaveBeenCalledWith({ acao: 'excluir', usuario: 'ana' });
  });

  it('erro do servidor aparece num alerta', async () => {
    const { w } = montar({}, 'Sua sessão terminou. Entre de novo.');
    await flushPromises();
    expect(w.get('[role="alert"]').text()).toBe('Sua sessão terminou. Entre de novo.');
  });

  it('copiar usa a área de transferência e avisa o resultado', async () => {
    const escrever = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: escrever },
      configurable: true
    });
    const { w } = montar({ acaoUsuario: vi.fn(async () => ({ senhaProvisoria: 'COPIAR123abc' })) });
    await flushPromises();
    await w.get('button[data-acao="redefinir"][data-usuario="ana"]').trigger('click');
    await flushPromises();
    await w.get('button[data-acao="copiar"]').trigger('click');
    await flushPromises();
    expect(escrever).toHaveBeenCalledWith('COPIAR123abc');
    expect(w.get('.ar-admin__provisoria').text()).toMatch(/copiada/i);
  });
});
