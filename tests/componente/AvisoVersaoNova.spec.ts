// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import AvisoVersaoNova from '@/ui/componentes/AvisoVersaoNova.vue';
import type { ResultadoConsulta } from '@/app/versaoNova/consultarVersaoPublicada';

/**
 * AV-F9 (plano 3.5, 3.6 e pedido do líder): banner de versão nova. Região role="status"
 * sempre no DOM, vazia sem versão. Link para "/" que faz uma consulta antes de navegar;
 * 401/403 troca para "Sua sessão terminou" sem navegar. Botão "Fechar aviso" dispensa e
 * leva o foco a #conteudo-principal. Nome do login entra só como texto.
 */
const RESUMO = {
  rollback: false,
  foraDoHistorico: false,
  itens: ['Filosofia Jurídica (1º período) atualizada', 'Novo: rádio para estudar'],
  mais: 0
};

function props(sobrescrever: Record<string, unknown> = {}) {
  return {
    versaoPublicada: '1.12.1.0' as string | null,
    nome: 'Ana Paula',
    resumo: RESUMO,
    continuaConectado: true,
    avisoQuiz: null,
    consultar: vi.fn(async (): Promise<ResultadoConsulta> => ({
      tipo: 'publicada',
      versao: '1.12.1.0',
      historico: []
    })),
    marcarRecarregouPara: vi.fn(),
    navegarParaInicio: vi.fn(),
    aoFechar: vi.fn(),
    ...sobrescrever
  };
}

let montado: VueWrapper | null = null;
afterEach(() => {
  montado?.unmount();
  montado = null;
  document.body.innerHTML = '';
});

describe('AvisoVersaoNova', () => {
  it('a região role="status" existe e fica vazia sem versão nova', () => {
    montado = mount(AvisoVersaoNova, { props: props({ versaoPublicada: null }) });
    const regiao = montado.find('[role="status"]');
    expect(regiao.exists()).toBe(true);
    expect(regiao.text()).toBe('');
    expect(montado.find('a').exists()).toBe(false);
  });

  it('com versão nova mostra o nome, as novidades e o link para a Home', () => {
    montado = mount(AvisoVersaoNova, { props: props() });
    expect(montado.text()).toContain(
      'Ana Paula, o site foi atualizado: Filosofia Jurídica (1º período) atualizada; Novo: rádio para estudar.'
    );
    const link = montado.find('a');
    expect(link.attributes('href')).toBe('/');
    expect(link.text()).toBe('Recarregar a página');
  });

  it('nome vazio usa a variante sem nome', () => {
    montado = mount(AvisoVersaoNova, { props: props({ nome: '' }) });
    expect(montado.text()).toContain('O site foi atualizado: Filosofia Jurídica');
    expect(montado.text()).not.toContain(', o site foi atualizado');
  });

  it('clique com 200: uma consulta, marca a versão, depois navega para a Home', async () => {
    const p = props();
    montado = mount(AvisoVersaoNova, { props: p });
    await montado.find('a').trigger('click');
    await flushPromises();
    expect(p.consultar).toHaveBeenCalledTimes(1);
    expect(p.marcarRecarregouPara).toHaveBeenCalledWith('1.12.1.0');
    expect(p.navegarParaInicio).toHaveBeenCalledTimes(1);
  });

  it('clique com 401: não navega e troca para "Sua sessão terminou"', async () => {
    const p = props({
      consultar: vi.fn(async (): Promise<ResultadoConsulta> => ({ tipo: 'sessao-terminada' }))
    });
    montado = mount(AvisoVersaoNova, { props: p });
    await montado.find('a').trigger('click');
    await flushPromises();
    expect(p.navegarParaInicio).not.toHaveBeenCalled();
    expect(montado.text()).toContain('Sua sessão terminou.');
    expect(montado.find('a').text()).toBe('Entrar de novo');
  });

  it('D-F12-2: depois do 401 no clique, a variante "Sua sessão terminou" continua mesmo sem versão publicada', async () => {
    const p = props({
      consultar: vi.fn(async (): Promise<ResultadoConsulta> => ({ tipo: 'sessao-terminada' }))
    });
    montado = mount(AvisoVersaoNova, { props: p });
    await montado.find('a').trigger('click');
    await flushPromises();
    // O controlador esconde a versão quando a consulta é de sessão terminada (estadoAvisoVersao).
    await montado.setProps({ versaoPublicada: null });
    expect(montado.text()).toContain('Sua sessão terminou.');
    expect(montado.find('a').text()).toBe('Entrar de novo');
  });

  it('durante a consulta do clique o link não é desmontado (o pai esconde a versão no meio)', async () => {
    let liberar: (r: ResultadoConsulta) => void = () => undefined;
    const p = props({
      consultar: vi.fn(
        () =>
          new Promise<ResultadoConsulta>((resolver) => {
            liberar = resolver;
          })
      )
    });
    montado = mount(AvisoVersaoNova, { props: p });
    const link = montado.find('a').element;
    const clique = montado.find('a').trigger('click');
    await montado.setProps({ versaoPublicada: null });
    expect(montado.find('a').element).toBe(link);
    liberar({ tipo: 'sessao-terminada' });
    await clique;
    await flushPromises();
    expect(montado.text()).toContain('Sua sessão terminou.');
  });

  it('clique com tecla modificadora deixa o navegador agir, sem consulta', async () => {
    const p = props();
    montado = mount(AvisoVersaoNova, { props: p });
    await montado.find('a').trigger('click', { ctrlKey: true });
    await flushPromises();
    expect(p.consultar).not.toHaveBeenCalled();
    expect(p.navegarParaInicio).not.toHaveBeenCalled();
  });

  it('o botão "Fechar aviso" dispensa e leva o foco a #conteudo-principal', async () => {
    const principal = document.createElement('main');
    principal.id = 'conteudo-principal';
    principal.tabIndex = -1;
    document.body.appendChild(principal);
    const p = props();
    montado = mount(AvisoVersaoNova, { props: p, attachTo: document.body });
    const fechar = montado.find('button');
    expect(fechar.text()).toBe('Fechar aviso');
    await fechar.trigger('click');
    expect(p.aoFechar).toHaveBeenCalledTimes(1);
    expect(document.activeElement?.id).toBe('conteudo-principal');
  });

  it('o nome do login entra como texto, nunca como HTML', () => {
    montado = mount(AvisoVersaoNova, { props: props({ nome: '<img src=x onerror=alert(1)>' }) });
    expect(montado.find('img').exists()).toBe(false);
    expect(montado.text()).toContain('<img src=x onerror=alert(1)>');
  });

  it('a frase de continuidade só aparece quando continua conectado', () => {
    montado = mount(AvisoVersaoNova, { props: props({ continuaConectado: false }) });
    expect(montado.text()).not.toContain('continua conectado');
    montado.unmount();
    montado = mount(AvisoVersaoNova, { props: props({ continuaConectado: true }) });
    expect(montado.text()).toContain('continua conectado');
  });
});
