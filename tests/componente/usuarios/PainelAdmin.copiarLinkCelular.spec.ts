// @vitest-environment jsdom
// COPIAR-LINK-CELULAR: o Copiar link do convite precisa copiar também sem navigator.clipboard (contexto
// sem HTTPS seguro, navegador antigo) e, se nada copiar, deixar o endereço pronto e selecionado para a
// pessoa copiar à mão. O aviso de cada caso é anunciado pela região role="status" do bloco do convite.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PainelAdmin from '@/ui/usuarios/PainelAdmin.vue';
import type { ClienteApi, UsuarioAdmin, ResultadoAdministracao } from '@/app/sessao/administracao';

const TOKEN = 'cd34'.repeat(16);
const CAMINHO_CONVITE = `/api/convite.php#t=${TOKEN}`;
const ORIGEM_DE_TESTE = 'https://origem-de-teste.invalid';
const ENDERECO = `${ORIGEM_DE_TESTE}${CAMINHO_CONVITE}`;

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
  }
];

function montarComLink() {
  const cliente = {
    listarUsuarios: vi.fn(async () => usuarios),
    acaoUsuario: vi.fn(async () => ({ convite: CAMINHO_CONVITE }))
  } as unknown as ClienteApi;
  const administrar = async <T>(
    f: (c: ClienteApi) => Promise<T>
  ): Promise<ResultadoAdministracao<T>> => ({ ok: true, valor: await f(cliente) });
  return mount(PainelAdmin, {
    props: { usuarioAtual: 'chefe', administrar },
    attachTo: document.body
  });
}

async function mostrarLinkDeAna(w: ReturnType<typeof montarComLink>) {
  await flushPromises();
  await w.get('button[data-acao="redefinir"][data-usuario="ana"]').trigger('click');
  await flushPromises();
}

async function clicarCopiar(w: ReturnType<typeof montarComLink>) {
  await w.get('button[data-acao="copiar"]').trigger('click');
  await flushPromises();
}

function semClipboard(): void {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
}

function clipboardQueRejeita(): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(async () => {
        throw new Error('negado');
      })
    },
    configurable: true
  });
}

function definirExecCommand(resultado: boolean): ReturnType<typeof vi.fn> {
  const execCommand = vi.fn(() => resultado);
  Object.defineProperty(document, 'execCommand', {
    value: execCommand,
    configurable: true,
    writable: true
  });
  return execCommand;
}

describe('PainelAdmin, Copiar link sem navigator.clipboard (COPIAR-LINK-CELULAR)', () => {
  beforeEach(() => {
    window.Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('location', { ...window.location, origin: ORIGEM_DE_TESTE });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'execCommand');
    Reflect.deleteProperty(navigator, 'clipboard');
    document.body.replaceChildren();
  });

  it('sem clipboard API, copia pelo execCommand e avisa "Link copiado."', async () => {
    semClipboard();
    const execCommand = definirExecCommand(true);
    const w = montarComLink();
    await mostrarLinkDeAna(w);

    await clicarCopiar(w);

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(w.get('.ar-admin__convite').text()).toContain('Link copiado.');
    expect(w.find('input[data-acao="campo-link"]').exists()).toBe(false);
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
    w.unmount();
  });

  it('writeText rejeitado e execCommand sem sucesso: campo readonly com o endereço, selecionado e com aviso de cópia à mão', async () => {
    clipboardQueRejeita();
    definirExecCommand(false);
    const w = montarComLink();
    await mostrarLinkDeAna(w);

    await clicarCopiar(w);

    const campo = w.get<HTMLInputElement>('input[data-acao="campo-link"]').element;
    expect(campo.readOnly).toBe(true);
    expect(campo.value).toBe(ENDERECO);
    expect(document.activeElement).toBe(campo);
    expect(campo.selectionStart).toBe(0);
    expect(campo.selectionEnd).toBe(ENDERECO.length);
    expect(w.get('.ar-admin__convite').text()).toContain(
      'Não foi possível copiar. Selecione o link e copie à mão.'
    );
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
    w.unmount();
  });

  it('a cópia que dá certo não tira o foco de quem clicou', async () => {
    clipboardQueRejeita();
    definirExecCommand(true);
    const w = montarComLink();
    await mostrarLinkDeAna(w);
    const botao = w.get<HTMLButtonElement>('button[data-acao="copiar"]').element;
    botao.focus();

    await clicarCopiar(w);

    expect(w.get('.ar-admin__convite').text()).toContain('Link copiado.');
    expect(document.activeElement).toBe(botao);
    w.unmount();
  });
});
