// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import AreaJuri from '@/ui/paginas/AreaJuri.vue';
import { CHAVE_CLIENTE_JURI } from '@/app/chaves';
import { criarClienteJuri } from '@/app/juri/clienteJuri';
import {
  criarServidorJuriFalso,
  type ServidorJuriFalso
} from '../../unidade/apoio/servidorJuriFalso';

const USUARIO = 'admin';
const PROVISORIA = 'provisoria-sintetica-de-teste';
const NOVA = 'nova-senha-sintetica-de-quinze-mais';

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

function montar(buscar: ServidorJuriFalso['buscar']): VueWrapper {
  const cliente = criarClienteJuri({ buscar });
  w = mount(AreaJuri, {
    attachTo: document.body,
    global: { provide: { [CHAVE_CLIENTE_JURI as unknown as symbol]: cliente } }
  });
  return w;
}

async function assentar(): Promise<void> {
  await flushPromises();
  await vi.waitFor(() =>
    expect(w!.find('[data-fase]').attributes('data-fase')).not.toBe('carregando')
  );
  await flushPromises();
}

const fase = (): string | undefined => w!.find('[data-fase]').attributes('data-fase');

/** Espera o fim da operação (a derivação de chave é assíncrona de verdade, não cabe em flushPromises). */
async function esperarFimDaOperacao(): Promise<void> {
  await vi.waitFor(() => expect(w!.find('.area-juri').attributes('data-ocupado')).toBe('false'));
}

async function entrar(usuario: string, senha: string): Promise<void> {
  await w!.get('input[name="usuario"]').setValue(usuario);
  await w!.get('input[name="senha"]').setValue(senha);
  await w!.get('form').trigger('submit');
  await esperarFimDaOperacao();
  await flushPromises();
}

describe('AreaJuri: entrada', () => {
  it('sem sessão, abre no formulário de entrada com o título da cadeira', async () => {
    const servidor = criarServidorJuriFalso();
    montar(servidor.buscar);
    await assentar();
    expect(w!.get('h1').text()).toBe('Júri Simulado');
    expect(w!.get('h2').text()).toBe('Entrar');
    expect(fase()).toBe('deslogado');
  });

  it('senha errada mostra mensagem genérica e fica deslogado', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, PROVISORIA);
    montar(servidor.buscar);
    await assentar();
    await entrar(USUARIO, 'senha-errada-sintetica');
    expect(fase()).toBe('deslogado');
    expect(w!.get('[role="alert"]').text()).toBe('Usuário ou senha incorretos.');
  });

  it('limite de tentativas mostra os segundos de espera', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, PROVISORIA);
    const limitado: ServidorJuriFalso['buscar'] = async (url, init) =>
      url.endsWith('entrar.php')
        ? new Response(
            JSON.stringify({ ok: false, erro: 'aguarde', segundos: 42, mensagem: 'x' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          )
        : servidor.buscar(url, init);
    montar(limitado);
    await assentar();
    await entrar(USUARIO, PROVISORIA);
    expect(w!.get('[role="alert"]').text()).toBe(
      'Muitas tentativas. Aguarde 42 segundos para tentar de novo.'
    );
  });

  it('provisória leva à troca obrigatória, sem o campo de usuário', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, PROVISORIA, true);
    montar(servidor.buscar);
    await assentar();
    await entrar(USUARIO, PROVISORIA);
    expect(fase()).toBe('troca-pendente');
    expect(w!.get('h2').text()).toBe('Troque a senha para continuar');
    expect(w!.find('input[name="senhaNova"]').exists()).toBe(true);
  });
});

describe('AreaJuri: troca obrigatória', () => {
  it('14 caracteres não chegam ao servidor; 15 trocam e abrem a área', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, PROVISORIA, true);
    montar(servidor.buscar);
    await assentar();
    await entrar(USUARIO, PROVISORIA);

    await w!.get('input[name="senhaAtual"]').setValue(PROVISORIA);
    await w!.get('input[name="senhaNova"]').setValue('a'.repeat(14));
    await w!.get('input[name="confirmacao"]').setValue('a'.repeat(14));
    await w!.get('form').trigger('submit');
    await flushPromises();
    expect(w!.get('[role="alert"]').text()).toContain('15 caracteres');
    expect(servidor.chamadasPara('trocar-senha.php')).toHaveLength(0);

    await w!.get('input[name="senhaNova"]').setValue('a'.repeat(15));
    await w!.get('input[name="confirmacao"]').setValue('a'.repeat(15));
    await w!.get('form').trigger('submit');
    await vi.waitFor(() => expect(fase()).toBe('aberta'));
    expect(servidor.chamadasPara('trocar-senha.php')).toHaveLength(1);
  });
});

describe('AreaJuri: aberta, recarregar e sair', () => {
  it('depois de entrar mostra quem entrou, o marcador de conteúdo e o botão Sair', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, PROVISORIA);
    montar(servidor.buscar);
    await assentar();
    await entrar(USUARIO, PROVISORIA);
    expect(fase()).toBe('aberta');
    expect(w!.text()).toContain('Conteúdo em preparação');
    expect(w!.find('button[data-acao="sair"]').exists()).toBe(true);
  });

  it('recarregar a página pede só a senha (travada) e a senha certa devolve a área', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, NOVA);
    montar(servidor.buscar);
    await assentar();
    await entrar(USUARIO, NOVA);
    expect(fase()).toBe('aberta');

    w!.unmount();
    montar(servidor.buscar);
    await assentar();
    expect(fase()).toBe('travada');
    expect(w!.get('h2').text()).toBe('Destravar');
    expect(w!.findAll('input[name="usuario"]')).toHaveLength(0);

    await w!.get('input[name="senha"]').setValue(NOVA);
    await w!.get('form').trigger('submit');
    await vi.waitFor(() => expect(fase()).toBe('aberta'));
  });

  it('Sair devolve ao formulário de entrada', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, PROVISORIA);
    montar(servidor.buscar);
    await assentar();
    await entrar(USUARIO, PROVISORIA);
    await w!.get('button[data-acao="sair"]').trigger('click');
    await vi.waitFor(() => expect(fase()).toBe('deslogado'));
    expect(w!.get('h2').text()).toBe('Entrar');
  });

  it('travada também tem Sair, e ele devolve à entrada sem pedir a senha', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, NOVA);
    montar(servidor.buscar);
    await assentar();
    await entrar(USUARIO, NOVA);
    w!.unmount();
    montar(servidor.buscar);
    await assentar();
    expect(fase()).toBe('travada');
    await w!.get('button[data-acao="sair"]').trigger('click');
    await vi.waitFor(() => expect(fase()).toBe('deslogado'));
  });
});
