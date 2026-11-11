// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PainelAdmin from '@/ui/usuarios/PainelAdmin.vue';
import type { ClienteApi, UsuarioAdmin } from '@/app/sessao/administracao';
import type { ResultadoAdministracao } from '@/app/sessao/administracao';

/** Token sintético: 64 hex, a forma do convite, sem valor real. */
const TOKEN = 'ab12'.repeat(16);
const CAMINHO_CONVITE = `/api/convite.php?t=${TOKEN}`;
/** Origem que não é a do jsdom nem a de produção: só `location.origin` explica o endereço composto. */
const ORIGEM_DE_TESTE = 'https://origem-de-teste.invalid';
const TEXTO_VALIDADE =
  'Ele só aparece agora, vale por 48 horas e uma vez só. Envie por um canal privado.';

/** Epoch em segundos (como o servidor manda), montado por componentes locais: o teste não depende do fuso. */
const PRAZO_LOCAL = new Date(2026, 10, 13, 9, 5, 0);
const PRAZO_EPOCH = Math.floor(PRAZO_LOCAL.getTime() / 1000);

const usuarios: UsuarioAdmin[] = [
  {
    usuario: 'chefe',
    admin: true,
    ativo: true,
    deveTrocarSenha: false,
    criadoEm: '2026-10-01',
    ultimoLogin: '2026-10-05',
    email: 'chefe@example.com'
  },
  {
    usuario: 'ana',
    admin: false,
    ativo: true,
    deveTrocarSenha: true,
    criadoEm: '2026-10-02',
    ultimoLogin: null,
    email: 'ana@example.com'
  },
  {
    usuario: 'beto',
    admin: false,
    ativo: false,
    deveTrocarSenha: false,
    criadoEm: '2026-10-02',
    ultimoLogin: null,
    email: null
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

  it('a própria conta só tem a ação Trocar e-mail: nenhuma ação que o servidor recusa sobre si mesmo', async () => {
    const { w } = montar();
    await flushPromises();
    const propria = w.findAll('tbody tr')[0]!;
    expect(propria.findAll('button').map((b) => b.text())).toEqual(['Trocar e-mail']);
    expect(propria.text()).toMatch(/sua conta/i);
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

  it('criar manda o usuário e o e-mail: o formulário não tem campo de senha provisória (R9)', async () => {
    const { w, cliente } = montar();
    await flushPromises();
    expect(w.find('input[name="provisoriaEscolhida"]').exists()).toBe(false);
    expect(w.get('form.ar-admin__criar').text()).not.toMatch(/senha provisória/i);
    await w.get('input[name="novoUsuario"]').setValue('carla');
    await w.get('input[name="novoEmail"]').setValue('carla@example.com');
    await w.get('form.ar-admin__criar').trigger('submit');
    await flushPromises();
    expect(cliente.acaoUsuario).toHaveBeenCalledWith({
      acao: 'criar',
      usuario: 'carla',
      email: 'carla@example.com'
    });
  });
});

describe('PainelAdmin, link de convite (CV-F1)', () => {
  /** O jsdom não implementa `scrollIntoView`: o teste instala um espião e o remove no fim. */
  const rolar = vi.fn();

  beforeEach(() => {
    rolar.mockClear();
    window.Element.prototype.scrollIntoView = rolar;
  });

  afterEach(() => {
    delete (window.Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  function montarComLink(origem = ORIGEM_DE_TESTE) {
    vi.stubGlobal('location', { ...window.location, origin: origem });
    return montar({ acaoUsuario: vi.fn(async () => ({ convite: CAMINHO_CONVITE })) });
  }

  async function criarCarla(w: ReturnType<typeof montar>['w']) {
    await w.get('input[name="novoUsuario"]').setValue('carla');
    await w.get('input[name="novoEmail"]').setValue('carla@example.com');
    await w.get('form.ar-admin__criar').trigger('submit');
    await flushPromises();
  }

  async function redefinirAna(w: ReturnType<typeof montar>['w']) {
    await w.get('button[data-acao="redefinir"][data-usuario="ana"]').trigger('click');
    await flushPromises();
  }

  it('criar mostra o link composto com location.origin e os textos do líder, uma vez', async () => {
    const { w } = montarComLink();
    await flushPromises();
    await criarCarla(w);
    const aviso = w.get('[role="status"].ar-admin__convite');
    expect(aviso.text()).toContain('Link de primeiro acesso de carla:');
    expect(aviso.get('.ar-admin__link').text()).toBe(`${ORIGEM_DE_TESTE}${CAMINHO_CONVITE}`);
    expect(aviso.text()).toContain(TEXTO_VALIDADE);
    expect(aviso.findAll('button').map((b) => b.text())).toEqual(['Copiar link', 'Já enviei']);
  });

  it('redefinir mostra o link com o título da nova senha', async () => {
    const { w, cliente } = montarComLink();
    await flushPromises();
    await redefinirAna(w);
    expect(cliente.acaoUsuario).toHaveBeenCalledWith({ acao: 'redefinir', usuario: 'ana' });
    const aviso = w.get('.ar-admin__convite');
    expect(aviso.text()).toContain('Link para nova senha de ana:');
    expect(aviso.text()).not.toContain('primeiro acesso');
    expect(aviso.get('.ar-admin__link').text()).toBe(`${ORIGEM_DE_TESTE}${CAMINHO_CONVITE}`);
    expect(aviso.text()).toContain(TEXTO_VALIDADE);
  });

  it('a origem vem do navegador: outra origem, outro endereço', async () => {
    const { w } = montarComLink('http://localhost:4741');
    await flushPromises();
    await redefinirAna(w);
    expect(w.get('.ar-admin__link').text()).toBe(`http://localhost:4741${CAMINHO_CONVITE}`);
  });

  it('Copiar link entrega o endereço completo à área de transferência e avisa', async () => {
    const escrever = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: escrever },
      configurable: true
    });
    const { w } = montarComLink();
    await flushPromises();
    await redefinirAna(w);
    await w.get('button[data-acao="copiar"]').trigger('click');
    await flushPromises();
    expect(escrever).toHaveBeenCalledTimes(1);
    expect(escrever).toHaveBeenCalledWith(`${ORIGEM_DE_TESTE}${CAMINHO_CONVITE}`);
    expect(w.get('.ar-admin__convite').text()).toContain('Link copiado.');
  });

  it('se a cópia falha, mostra o texto de cópia à mão e o link segue na tela', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(async () => {
          throw new Error('negado');
        })
      },
      configurable: true
    });
    const { w } = montarComLink();
    await flushPromises();
    await redefinirAna(w);
    await w.get('button[data-acao="copiar"]').trigger('click');
    await flushPromises();
    const aviso = w.get('.ar-admin__convite');
    expect(aviso.text()).toContain('Não foi possível copiar. Selecione o link e copie à mão.');
    expect(aviso.text()).not.toContain('Link copiado.');
    expect(aviso.get('.ar-admin__link').text()).toBe(`${ORIGEM_DE_TESTE}${CAMINHO_CONVITE}`);
  });

  it('Já enviei apaga o link e o aviso de cópia', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => {}) },
      configurable: true
    });
    const { w } = montarComLink();
    await flushPromises();
    await redefinirAna(w);
    await w.get('button[data-acao="copiar"]').trigger('click');
    await flushPromises();
    await w.get('button[data-acao="dispensar"]').trigger('click');
    expect(w.find('.ar-admin__convite').exists()).toBe(false);
    expect(w.html()).not.toContain(TOKEN);
    expect(estadoInterno(w).link).toBeUndefined();
    expect(estadoInterno(w).copiaAvisada).toBe('');
  });

  it('depois de redefinir, o bloco do link recebe o foco e é rolado para dentro da janela', async () => {
    const { w } = montarComLink();
    await flushPromises();
    await redefinirAna(w);
    const bloco = w.get('.ar-admin__convite');
    expect(document.activeElement).toBe(bloco.element);
    expect(rolar).toHaveBeenCalledTimes(1);
    expect(rolar.mock.contexts[0]).toBe(bloco.element);
    expect(rolar).toHaveBeenCalledWith({ block: 'start' });
  });

  it('depois de criar, o bloco do link recebe o foco e é rolado para dentro da janela', async () => {
    const { w } = montarComLink();
    await flushPromises();
    await criarCarla(w);
    const bloco = w.get('.ar-admin__convite');
    expect(document.activeElement).toBe(bloco.element);
    expect(rolar).toHaveBeenCalledTimes(1);
    expect(rolar.mock.contexts[0]).toBe(bloco.element);
    expect(rolar).toHaveBeenCalledWith({ block: 'start' });
  });

  it('o bloco foca por código (tabindex -1, fora da ordem de Tab) e segue anunciado como status', async () => {
    const { w } = montarComLink();
    await flushPromises();
    await redefinirAna(w);
    const bloco = w.get('.ar-admin__convite');
    expect(bloco.attributes('tabindex')).toBe('-1');
    expect(bloco.attributes('role')).toBe('status');
  });

  it('o foco só vai ao bloco quando o link aparece: nem copiar nem outra ação sem link o puxam', async () => {
    const acaoUsuario = vi
      .fn()
      .mockResolvedValueOnce({ convite: CAMINHO_CONVITE })
      .mockResolvedValue({});
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => {}) },
      configurable: true
    });
    vi.stubGlobal('location', { ...window.location, origin: ORIGEM_DE_TESTE });
    const { w } = montar({ acaoUsuario });
    await flushPromises();
    await redefinirAna(w);
    expect(rolar).toHaveBeenCalledTimes(1);

    const campo = w.get<HTMLInputElement>('input[name="novoUsuario"]').element;
    campo.focus();
    await w.get('button[data-acao="copiar"]').trigger('click');
    await flushPromises();
    expect(document.activeElement).toBe(campo);
    expect(rolar).toHaveBeenCalledTimes(1);

    // Ação sem convite na resposta: não há bloco para focar nem rolar.
    campo.focus();
    await w.get('button[data-acao="desativar"][data-usuario="ana"]').trigger('click');
    await flushPromises();
    expect(w.find('.ar-admin__convite').exists()).toBe(false);
    expect(document.activeElement).toBe(campo);
    expect(rolar).toHaveBeenCalledTimes(1);
  });

  it('Já enviei devolve o foco ao Redefinir da conta que gerou o link', async () => {
    const { w } = montarComLink();
    await flushPromises();
    await redefinirAna(w);
    await w.get('button[data-acao="dispensar"]').trigger('click');
    await flushPromises();
    expect(w.find('.ar-admin__convite').exists()).toBe(false);
    expect(document.activeElement).toBe(
      w.get('button[data-acao="redefinir"][data-usuario="ana"]').element
    );
  });

  it('Já enviei, depois de criar, devolve o foco ao campo Usuário do formulário', async () => {
    const { w } = montarComLink();
    await flushPromises();
    await criarCarla(w);
    await w.get('button[data-acao="dispensar"]').trigger('click');
    await flushPromises();
    expect(w.find('.ar-admin__convite').exists()).toBe(false);
    expect(document.activeElement).toBe(w.get('input[name="novoUsuario"]').element);
  });

  it('Já enviei, quando a conta de origem já não está na lista, leva o foco ao título da seção', async () => {
    const semAna = usuarios.filter((u) => u.usuario !== 'ana');
    vi.stubGlobal('location', { ...window.location, origin: ORIGEM_DE_TESTE });
    const { w } = montar({
      listarUsuarios: vi.fn().mockResolvedValueOnce(usuarios).mockResolvedValue(semAna),
      acaoUsuario: vi.fn(async () => ({ convite: CAMINHO_CONVITE }))
    });
    await flushPromises();
    await redefinirAna(w);
    expect(w.find('button[data-acao="redefinir"][data-usuario="ana"]').exists()).toBe(false);
    await w.get('button[data-acao="dispensar"]').trigger('click');
    await flushPromises();
    const titulo = w.get('#ar-admin-titulo');
    expect(titulo.attributes('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(titulo.element);
  });

  it('a ação seguinte apaga o link, mesmo quando a resposta dela não traz convite', async () => {
    const acaoUsuario = vi
      .fn()
      .mockResolvedValueOnce({ convite: CAMINHO_CONVITE })
      .mockResolvedValue({});
    vi.stubGlobal('location', { ...window.location, origin: ORIGEM_DE_TESTE });
    const { w } = montar({ acaoUsuario });
    await flushPromises();
    await redefinirAna(w);
    expect(w.html()).toContain(TOKEN);
    await w.get('button[data-acao="desativar"][data-usuario="ana"]').trigger('click');
    await flushPromises();
    expect(acaoUsuario).toHaveBeenCalledTimes(2);
    expect(w.find('.ar-admin__convite').exists()).toBe(false);
    expect(w.html()).not.toContain(TOKEN);
    expect(estadoInterno(w).link).toBeUndefined();
  });

  it('um link novo substitui o anterior: nunca dois links na tela', async () => {
    const outro = 'cd34'.repeat(16);
    const acaoUsuario = vi
      .fn()
      .mockResolvedValueOnce({ convite: CAMINHO_CONVITE })
      .mockResolvedValueOnce({ convite: `/api/convite.php?t=${outro}` });
    vi.stubGlobal('location', { ...window.location, origin: ORIGEM_DE_TESTE });
    const { w } = montar({ acaoUsuario });
    await flushPromises();
    await redefinirAna(w);
    await w.get('button[data-acao="redefinir"][data-usuario="beto"]').trigger('click');
    await flushPromises();
    expect(w.findAll('.ar-admin__link')).toHaveLength(1);
    expect(w.html()).not.toContain(TOKEN);
    expect(w.get('.ar-admin__link').text()).toContain(outro);
    expect(w.get('.ar-admin__convite').text()).toContain('Link para nova senha de beto:');
  });

  it('a desmontagem apaga o link da memória do componente', async () => {
    const { w } = montarComLink();
    await flushPromises();
    await redefinirAna(w);
    const estado = estadoInterno(w);
    expect(estado.link).toBeDefined();
    w.unmount();
    // Depois de desmontar o DOM some de qualquer jeito; o que prova o apagar é a memória do componente.
    expect(estado.link).toBeUndefined();
  });

  it('o link não vai a localStorage, sessionStorage, console nem barra de endereço', async () => {
    const consoles = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {})
    );
    const empurrar = vi.spyOn(window.history, 'pushState');
    const substituir = vi.spyOn(window.history, 'replaceState');
    const hrefAntes = window.location.href;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => {}) },
      configurable: true
    });
    const { w } = montarComLink();
    await flushPromises();
    await criarCarla(w);
    await w.get('button[data-acao="copiar"]').trigger('click');
    await flushPromises();
    expect(w.html()).toContain(TOKEN);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(JSON.stringify(consoles.flatMap((c) => c.mock.calls))).not.toContain(TOKEN);
    expect(empurrar).not.toHaveBeenCalled();
    expect(substituir).not.toHaveBeenCalled();
    expect(window.location.href).toBe(hrefAntes);
  });
});

describe('PainelAdmin, coluna Estado com o convite (CV-F1)', () => {
  const comConvite = (convite: 'pendente' | 'vencido' | null, expiraEm: number | null) =>
    ({ ...usuarios[1]!, convite, conviteExpiraEm: expiraEm }) as UsuarioAdmin;

  async function estadoDaLinha(lista: UsuarioAdmin[]): Promise<string> {
    const { w } = montar({ listarUsuarios: vi.fn(async () => lista) });
    await flushPromises();
    return w.findAll('tbody tr')[0]!.get('td[data-rotulo="Estado"]').text();
  }

  it('convite pendente mostra o prazo em dd/mm hh:mm, lido do epoch em segundos', async () => {
    const estado = await estadoDaLinha([comConvite('pendente', PRAZO_EPOCH)]);
    expect(estado).toContain('Convite pendente até 13/11 09:05');
  });

  it('convite vencido mostra "Convite vencido", sem prazo', async () => {
    const estado = await estadoDaLinha([comConvite('vencido', PRAZO_EPOCH)]);
    expect(estado).toContain('Convite vencido');
    expect(estado).not.toContain('Convite pendente');
    expect(estado).not.toContain('13/11');
  });

  it('quem decide pendente ou vencido é o servidor, nunca o relógio do navegador', async () => {
    const passado = await estadoDaLinha([comConvite('pendente', PRAZO_EPOCH - 10 * 365 * 86400)]);
    expect(passado).toContain('Convite pendente até');
    const futuro = await estadoDaLinha([comConvite('vencido', PRAZO_EPOCH + 10 * 365 * 86400)]);
    expect(futuro).toContain('Convite vencido');
    expect(futuro).not.toContain('Convite pendente');
  });

  it('sem convite (ou servidor antigo sem o campo) não diz nada de convite', async () => {
    expect(await estadoDaLinha([comConvite(null, null)])).not.toMatch(/convite/i);
    const semCampo = { ...usuarios[1]! };
    expect(await estadoDaLinha([semCampo])).not.toMatch(/convite/i);
  });
});

describe('PainelAdmin, e-mail da conta (EM-F1)', () => {
  const FRASE_FALHA = 'O e-mail não saiu. Copie o link e envie por outro canal.';

  /** Painel em que só a ação falha: a lista carrega, e a ação devolve o erro do servidor já traduzido. */
  function montarComFalhaNaAcao(mensagem: string) {
    const cliente = {
      listarUsuarios: vi.fn(async () => usuarios),
      acaoUsuario: vi.fn(async () => {
        throw new Error('falha do servidor');
      })
    } as unknown as ClienteApi;
    const administrar = async <T>(
      f: (c: ClienteApi) => Promise<T>
    ): Promise<ResultadoAdministracao<T>> => {
      try {
        return { ok: true, valor: await f(cliente) };
      } catch {
        return { ok: false, mensagem };
      }
    };
    const w = mount(PainelAdmin, {
      props: { usuarioAtual: 'chefe', administrar },
      attachTo: document.body
    });
    return { w, cliente };
  }

  function montarComResposta(resposta: { convite?: string; email?: string }) {
    vi.stubGlobal('location', { ...window.location, origin: ORIGEM_DE_TESTE });
    return montar({
      acaoUsuario: vi.fn(async () => resposta) as unknown as ClienteApi['acaoUsuario']
    });
  }

  async function criar(
    w: ReturnType<typeof montar>['w'],
    usuario = 'carla',
    email = 'carla@example.com'
  ) {
    await w.get('input[name="novoUsuario"]').setValue(usuario);
    await w.get('input[name="novoEmail"]').setValue(email);
    await w.get('form.ar-admin__criar').trigger('submit');
    await flushPromises();
  }

  async function abrirTrocaDeEmail(w: ReturnType<typeof montar>['w'], login: string) {
    await w.get(`button[data-acao="trocar-email"][data-usuario="${login}"]`).trigger('click');
    await flushPromises();
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    delete (window.Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  beforeEach(() => {
    window.Element.prototype.scrollIntoView = vi.fn();
  });

  describe('criar', () => {
    it('o formulário tem o campo E-mail, obrigatório, com rótulo visível', async () => {
      const { w } = montar();
      await flushPromises();
      const campo = w.get<HTMLInputElement>('form.ar-admin__criar input[name="novoEmail"]');
      expect(campo.attributes('type')).toBe('email');
      expect(campo.attributes('required')).toBeDefined();
      expect(campo.attributes('autocomplete')).toBe('off');
      const rotulo = w.get(`label[for="${campo.attributes('id')}"]`);
      expect(rotulo.text()).toBe('E-mail');
    });

    it.each([
      ['vazio', ''],
      ['só espaços', '   ']
    ])('e-mail %s: o botão não envia, e o erro aparece num alerta', async (_nome, email) => {
      const { w, cliente } = montar();
      await flushPromises();
      await w.get('input[name="novoUsuario"]').setValue('carla');
      await w.get('input[name="novoEmail"]').setValue(email);
      await w.get('form.ar-admin__criar').trigger('submit');
      await flushPromises();
      expect(cliente.acaoUsuario).not.toHaveBeenCalled();
      expect(w.get('[role="alert"]').text()).toBe('E-mail inválido.');
    });

    it('manda o e-mail sem espaços nas pontas', async () => {
      const { w, cliente } = montar();
      await flushPromises();
      await criar(w, 'carla', '  carla@example.com ');
      expect(cliente.acaoUsuario).toHaveBeenCalledWith({
        acao: 'criar',
        usuario: 'carla',
        email: 'carla@example.com'
      });
    });

    it.each([['E-mail inválido.'], ['Este e-mail já está em outra conta.']])(
      'o erro do servidor (%s) aparece e os campos seguem preenchidos',
      async (mensagem) => {
        const { w } = montarComFalhaNaAcao(mensagem);
        await flushPromises();
        await criar(w);
        expect(w.get('[role="alert"]').text()).toBe(mensagem);
        expect(w.get<HTMLInputElement>('input[name="novoEmail"]').element.value).toBe(
          'carla@example.com'
        );
        expect(w.get<HTMLInputElement>('input[name="novoUsuario"]').element.value).toBe('carla');
      }
    );

    it('conta criada: os dois campos esvaziam', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'enviado' });
      await flushPromises();
      await criar(w);
      expect(w.get<HTMLInputElement>('input[name="novoEmail"]').element.value).toBe('');
      expect(w.get<HTMLInputElement>('input[name="novoUsuario"]').element.value).toBe('');
    });
  });

  describe('frase de enviado ou de falha, com o link sempre visível', () => {
    it('criar com envio feito: "O link também foi para <e-mail>." e o link na tela', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'enviado' });
      await flushPromises();
      await criar(w);
      const bloco = w.get('.ar-admin__convite');
      expect(bloco.text()).toContain('O link também foi para carla@example.com.');
      expect(bloco.text()).not.toContain('não saiu');
      expect(bloco.get('.ar-admin__link').text()).toBe(`${ORIGEM_DE_TESTE}${CAMINHO_CONVITE}`);
    });

    it('o título continua sendo o primeiro parágrafo do bloco, e a frase vem depois do link', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'enviado' });
      await flushPromises();
      await criar(w);
      const paragrafos = w.findAll('.ar-admin__convite p').map((p) => p.text());
      expect(paragrafos[0]).toBe('Link de primeiro acesso de carla:');
      expect(paragrafos.findIndex((t) => t.startsWith('O link também foi para'))).toBeGreaterThan(
        paragrafos.findIndex((t) => t.startsWith('https://') || t.startsWith(ORIGEM_DE_TESTE))
      );
    });

    it('o endereço da frase é o que o servidor grava: em minúsculas', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'enviado' });
      await flushPromises();
      await criar(w, 'carla', ' Carla@Example.COM ');
      expect(w.get('.ar-admin__convite').text()).toContain(
        'O link também foi para carla@example.com.'
      );
    });

    it('criar com envio que falhou: a frase de falha e o link, sem a frase de enviado', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'falhou' });
      await flushPromises();
      await criar(w);
      const bloco = w.get('.ar-admin__convite');
      expect(bloco.text()).toContain(FRASE_FALHA);
      expect(bloco.text()).not.toContain('O link também foi para');
      expect(bloco.get('.ar-admin__link').text()).toBe(`${ORIGEM_DE_TESTE}${CAMINHO_CONVITE}`);
    });

    it('redefinir uma conta com e-mail: a frase leva o e-mail que a lista mostra', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'enviado' });
      await flushPromises();
      await w.get('button[data-acao="redefinir"][data-usuario="ana"]').trigger('click');
      await flushPromises();
      expect(w.get('.ar-admin__convite').text()).toContain(
        'O link também foi para ana@example.com.'
      );
    });

    it('redefinir com envio que falhou: a frase de falha e o link', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'falhou' });
      await flushPromises();
      await w.get('button[data-acao="redefinir"][data-usuario="ana"]').trigger('click');
      await flushPromises();
      expect(w.get('.ar-admin__convite').text()).toContain(FRASE_FALHA);
      expect(w.find('.ar-admin__link').exists()).toBe(true);
    });

    it('redefinir uma conta sem e-mail: só o link, nenhuma das duas frases', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'sem-email' });
      await flushPromises();
      await w.get('button[data-acao="redefinir"][data-usuario="beto"]').trigger('click');
      await flushPromises();
      const bloco = w.get('.ar-admin__convite');
      expect(bloco.text()).not.toContain('O link também foi para');
      expect(bloco.text()).not.toContain('não saiu');
      expect(bloco.get('.ar-admin__link').text()).toBe(`${ORIGEM_DE_TESTE}${CAMINHO_CONVITE}`);
    });

    it('servidor sem o campo email na resposta: só o link', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE });
      await flushPromises();
      await criar(w);
      expect(w.get('.ar-admin__convite').text()).not.toContain('O link também foi para');
      expect(w.get('.ar-admin__convite').text()).not.toContain('não saiu');
    });

    it('Já enviei apaga a frase junto com o link', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'enviado' });
      await flushPromises();
      await criar(w);
      await w.get('button[data-acao="dispensar"]').trigger('click');
      await flushPromises();
      expect(w.text()).not.toContain('O link também foi para');
      expect(w.text()).not.toContain('carla@example.com');
    });

    it('Já enviei, na origem criar, devolve o foco ao campo Usuário (a frase não muda isso)', async () => {
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'falhou' });
      await flushPromises();
      await criar(w);
      await w.get('button[data-acao="dispensar"]').trigger('click');
      await flushPromises();
      expect(document.activeElement).toBe(w.get('input[name="novoUsuario"]').element);
    });
  });

  describe('coluna Estado e coluna E-mail', () => {
    const conta = (extra: Partial<UsuarioAdmin>) => ({ ...usuarios[1]!, ...extra }) as UsuarioAdmin;

    async function linha(lista: UsuarioAdmin[]) {
      const { w } = montar({ listarUsuarios: vi.fn(async () => lista) });
      await flushPromises();
      const tr = w.findAll('tbody tr')[0]!;
      return {
        estado: tr.get('td[data-rotulo="Estado"]').text(),
        email: tr.get('td[data-rotulo="E-mail"]').text()
      };
    }

    it('sem e-mail na conta: Estado diz "Sem e-mail"', async () => {
      expect((await linha([conta({ email: null })])).estado).toContain('Sem e-mail');
    });

    it('com e-mail: nada de "Sem e-mail", e a coluna E-mail mostra o endereço', async () => {
      const r = await linha([conta({ email: 'ana@example.com' })]);
      expect(r.estado).not.toContain('Sem e-mail');
      expect(r.email).toBe('ana@example.com');
    });

    it('servidor antigo, sem o campo email: não afirma "Sem e-mail"', async () => {
      const antigo = { ...usuarios[1]! } as Record<string, unknown>;
      delete antigo.email;
      expect((await linha([antigo as unknown as UsuarioAdmin])).estado).not.toContain('Sem e-mail');
    });

    it('falha de envio gravada: "E-mail não saiu em dd/mm hh:mm", no fuso de quem olha', async () => {
      const instante = new Date(2026, 10, 13, 9, 5, 0);
      const r = await linha([conta({ envioFalhouEm: instante.toISOString() })]);
      expect(r.estado).toContain('E-mail não saiu em 13/11 09:05');
    });

    it('sem falha gravada, ou com valor que não é data: nenhum aviso de falha', async () => {
      expect((await linha([conta({ envioFalhouEm: null })])).estado).not.toContain('não saiu');
      expect((await linha([conta({})])).estado).not.toContain('não saiu');
      expect((await linha([conta({ envioFalhouEm: 'não é data' })])).estado).not.toContain(
        'não saiu em'
      );
    });
  });

  describe('Trocar e-mail', () => {
    it('há um botão por conta, inclusive a própria, com nome acessível que diz de quem é', async () => {
      const { w } = montar();
      await flushPromises();
      for (const login of ['chefe', 'ana', 'beto']) {
        const botao = w.get(`button[data-acao="trocar-email"][data-usuario="${login}"]`);
        expect(botao.text()).toBe('Trocar e-mail');
        const ids = botao.attributes('aria-labelledby')!.split(' ');
        const nome = ids.map((id) => document.getElementById(id)!.textContent!.trim()).join(' ');
        expect(nome).toBe(`Trocar e-mail ${login}`);
      }
    });

    it('abre o campo E-mail com o valor atual e o foco nele', async () => {
      const { w } = montar();
      await flushPromises();
      await abrirTrocaDeEmail(w, 'ana');
      const campo = w.get<HTMLInputElement>('input[name="emailEditado"]');
      expect(campo.element.value).toBe('ana@example.com');
      expect(document.activeElement).toBe(campo.element);
      expect(w.get(`label[for="${campo.attributes('id')}"]`).text()).toBe('E-mail');
      expect(campo.attributes('type')).toBe('email');
    });

    it('conta sem e-mail: o campo abre vazio', async () => {
      const { w } = montar();
      await flushPromises();
      await abrirTrocaDeEmail(w, 'beto');
      expect(w.get<HTMLInputElement>('input[name="emailEditado"]').element.value).toBe('');
    });

    it('outra conta: manda só o e-mail novo, sem campo nem valor de senha atual', async () => {
      const { w, cliente } = montar();
      await flushPromises();
      await abrirTrocaDeEmail(w, 'ana');
      expect(w.find('input[name="senhaAtual"]').exists()).toBe(false);
      await w.get('input[name="emailEditado"]').setValue(' Ana.Nova@Example.com ');
      await w.get('form.ar-admin__trocar-email').trigger('submit');
      await flushPromises();
      expect(cliente.acaoUsuario).toHaveBeenCalledWith({
        acao: 'email',
        usuario: 'ana',
        email: 'Ana.Nova@Example.com'
      });
      expect(cliente.listarUsuarios).toHaveBeenCalledTimes(2);
    });

    it('depois de trocar, o campo fecha e o foco volta ao Trocar e-mail da conta', async () => {
      const { w } = montar();
      await flushPromises();
      await abrirTrocaDeEmail(w, 'ana');
      await w.get('input[name="emailEditado"]').setValue('outro@example.com');
      await w.get('form.ar-admin__trocar-email').trigger('submit');
      await flushPromises();
      expect(w.find('form.ar-admin__trocar-email').exists()).toBe(false);
      expect(document.activeElement).toBe(
        w.get('button[data-acao="trocar-email"][data-usuario="ana"]').element
      );
    });

    it('e-mail vazio: não envia e diz "E-mail inválido."', async () => {
      const { w, cliente } = montar();
      await flushPromises();
      await abrirTrocaDeEmail(w, 'ana');
      await w.get('input[name="emailEditado"]').setValue('  ');
      await w.get('form.ar-admin__trocar-email').trigger('submit');
      await flushPromises();
      expect(cliente.acaoUsuario).not.toHaveBeenCalled();
      expect(w.get('[role="alert"]').text()).toBe('E-mail inválido.');
      expect(w.find('form.ar-admin__trocar-email').exists()).toBe(true);
    });

    it('o erro do servidor aparece e o campo segue aberto com o que foi digitado', async () => {
      const { w } = montarComFalhaNaAcao('Este e-mail já está em outra conta.');
      await flushPromises();
      await abrirTrocaDeEmail(w, 'ana');
      await w.get('input[name="emailEditado"]').setValue('beto@example.com');
      await w.get('form.ar-admin__trocar-email').trigger('submit');
      await flushPromises();
      expect(w.get('[role="alert"]').text()).toBe('Este e-mail já está em outra conta.');
      expect(w.get<HTMLInputElement>('input[name="emailEditado"]').element.value).toBe(
        'beto@example.com'
      );
    });

    it('Cancelar fecha sem chamar o servidor e devolve o foco ao botão', async () => {
      const { w, cliente } = montar();
      await flushPromises();
      await abrirTrocaDeEmail(w, 'ana');
      await w
        .get('form.ar-admin__trocar-email button[data-acao="cancelar-email"]')
        .trigger('click');
      await flushPromises();
      expect(w.find('form.ar-admin__trocar-email').exists()).toBe(false);
      expect(cliente.acaoUsuario).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(
        w.get('button[data-acao="trocar-email"][data-usuario="ana"]').element
      );
    });

    it('só um campo de e-mail aberto por vez: abrir outro fecha o anterior', async () => {
      const { w } = montar();
      await flushPromises();
      await abrirTrocaDeEmail(w, 'ana');
      await abrirTrocaDeEmail(w, 'beto');
      expect(w.findAll('form.ar-admin__trocar-email')).toHaveLength(1);
      expect(w.get<HTMLInputElement>('input[name="emailEditado"]').element.value).toBe('');
    });
  });

  describe('Trocar e-mail na própria conta pede a Senha atual', () => {
    async function abrirPropria() {
      const montado = montar();
      await flushPromises();
      await abrirTrocaDeEmail(montado.w, 'chefe');
      return montado;
    }

    it('mostra o campo Senha atual, do tipo senha e com autocomplete current-password', async () => {
      const { w } = await abrirPropria();
      const campo = w.get<HTMLInputElement>('input[name="senhaAtual"]');
      expect(campo.attributes('type')).toBe('password');
      expect(campo.attributes('autocomplete')).toBe('current-password');
      expect(w.get(`label[for="${campo.attributes('id')}"]`).text()).toBe('Senha atual');
    });

    it('manda a senha atual junto com o e-mail novo', async () => {
      const { w, cliente } = await abrirPropria();
      await w.get('input[name="emailEditado"]').setValue('chefe.novo@example.com');
      await w.get('input[name="senhaAtual"]').setValue('senha-sintetica-do-teste');
      await w.get('form.ar-admin__trocar-email').trigger('submit');
      await flushPromises();
      expect(cliente.acaoUsuario).toHaveBeenCalledWith({
        acao: 'email',
        usuario: 'chefe',
        email: 'chefe.novo@example.com',
        senhaAtual: 'senha-sintetica-do-teste'
      });
    });

    it('depois de trocar, a senha atual sai da memória do componente e do documento', async () => {
      const { w } = await abrirPropria();
      await w.get('input[name="senhaAtual"]').setValue('senha-sintetica-do-teste');
      await w.get('form.ar-admin__trocar-email').trigger('submit');
      await flushPromises();
      expect(estadoDoEmail(w).senhaAtualEditada).toBe('');
      expect(w.html()).not.toContain('senha-sintetica-do-teste');
    });

    it('senha errada: o erro aparece, o campo segue aberto e a senha digitada é apagada', async () => {
      const cliente = {
        listarUsuarios: vi.fn(async () => usuarios),
        acaoUsuario: vi.fn(async () => {
          throw new Error('403');
        })
      } as unknown as ClienteApi;
      const administrar = async <T>(
        f: (c: ClienteApi) => Promise<T>
      ): Promise<ResultadoAdministracao<T>> => {
        try {
          return { ok: true, valor: await f(cliente) };
        } catch {
          return { ok: false, mensagem: 'A senha atual não confere.' };
        }
      };
      const w = mount(PainelAdmin, {
        props: { usuarioAtual: 'chefe', administrar },
        attachTo: document.body
      });
      await flushPromises();
      await abrirTrocaDeEmail(w, 'chefe');
      await w.get('input[name="senhaAtual"]').setValue('senha-errada-do-teste');
      await w.get('form.ar-admin__trocar-email').trigger('submit');
      await flushPromises();
      expect(w.get('[role="alert"]').text()).toBe('A senha atual não confere.');
      expect(w.find('form.ar-admin__trocar-email').exists()).toBe(true);
      expect(estadoDoEmail(w).senhaAtualEditada).toBe('');
      expect(w.get<HTMLInputElement>('input[name="senhaAtual"]').element.value).toBe('');
      expect(document.activeElement).toBe(w.get('input[name="senhaAtual"]').element);
    });

    it('Cancelar apaga a senha digitada', async () => {
      const { w } = await abrirPropria();
      await w.get('input[name="senhaAtual"]').setValue('senha-sintetica-do-teste');
      await w.get('button[data-acao="cancelar-email"]').trigger('click');
      expect(estadoDoEmail(w).senhaAtualEditada).toBe('');
    });

    it('a desmontagem apaga a senha digitada da memória', async () => {
      const { w } = await abrirPropria();
      await w.get('input[name="senhaAtual"]').setValue('senha-sintetica-do-teste');
      const estado = estadoDoEmail(w);
      expect(estado.senhaAtualEditada).toBe('senha-sintetica-do-teste');
      w.unmount();
      expect(estado.senhaAtualEditada).toBe('');
    });
  });

  describe('o e-mail e a senha atual não saem da memória do componente', () => {
    it('nunca vão a localStorage, sessionStorage, console nem barra de endereço', async () => {
      const consoles = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
        vi.spyOn(console, m).mockImplementation(() => {})
      );
      const empurrar = vi.spyOn(window.history, 'pushState');
      const substituir = vi.spyOn(window.history, 'replaceState');
      const hrefAntes = window.location.href;
      const { w } = montarComResposta({ convite: CAMINHO_CONVITE, email: 'enviado' });
      await flushPromises();
      await criar(w, 'carla', 'carla.segredo@example.com');
      await w.get('button[data-acao="dispensar"]').trigger('click');
      await flushPromises();
      await abrirTrocaDeEmail(w, 'chefe');
      await w.get('input[name="emailEditado"]').setValue('chefe.segredo@example.com');
      await w.get('input[name="senhaAtual"]').setValue('senha-secreta-do-teste');
      await w.get('form.ar-admin__trocar-email').trigger('submit');
      await flushPromises();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
      const impresso = JSON.stringify(consoles.flatMap((c) => c.mock.calls));
      for (const segredo of ['carla.segredo', 'chefe.segredo', 'senha-secreta-do-teste']) {
        expect(impresso).not.toContain(segredo);
      }
      expect(empurrar).not.toHaveBeenCalled();
      expect(substituir).not.toHaveBeenCalled();
      expect(window.location.href).toBe(hrefAntes);
    });
  });
});

/** Estado do formulário de Trocar e-mail (script setup): o DOM sozinho não prova que a senha saiu da memória. */
function estadoDoEmail(w: { vm: unknown }): { senhaAtualEditada: string } {
  return (w.vm as { $: { setupState: { senhaAtualEditada: string } } }).$.setupState;
}

/** Estado interno do componente (script setup). Só os testes de apagar o link o leem: o DOM sozinho não prova a memória. */
function estadoInterno(w: { vm: unknown }): { link: unknown; copiaAvisada: string } {
  return (w.vm as { $: { setupState: { link: unknown; copiaAvisada: string } } }).$.setupState;
}
