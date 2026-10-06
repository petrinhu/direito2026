import { describe, expect, it, vi } from 'vitest';
import { ErroDeApi, type ClienteApi } from '@/app/restrito/clienteApi';
import { criarSessaoRestrita, type FonteTempo } from '@/app/restrito/sessaoRestrita';
import { conteudoRestritoFalso } from './apoio/conteudoRestritoFalso';

function clienteFalso(sobrescritas: Partial<ClienteApi> = {}): ClienteApi {
  return {
    sessao: vi.fn(async () => ({ autenticado: false })),
    entrar: vi.fn(async () => ({ usuario: 'u', admin: false, deveTrocarSenha: false })),
    sair: vi.fn(async () => {}),
    trocarSenha: vi.fn(async () => {}),
    obterConteudo: vi.fn(async () => conteudoRestritoFalso()),
    listarUsuarios: vi.fn(async () => []),
    acaoUsuario: vi.fn(async () => ({})),
    ...sobrescritas
  };
}

function relogioManual() {
  let ativo: (() => void) | undefined;
  const fonte: FonteTempo = {
    definirIntervalo(cb) {
      ativo = cb;
      return () => {
        ativo = undefined;
      };
    }
  };
  return { fonte, tic: () => ativo?.(), ativo: () => ativo !== undefined };
}

describe('sessão restrita', () => {
  it('sem sessão no servidor, fica anônima', async () => {
    const s = criarSessaoRestrita({ cliente: clienteFalso() });
    expect(s.fase.value).toBe('carregando');
    await s.iniciar();
    expect(s.fase.value).toBe('anonima');
    expect(s.conteudo.value).toBeUndefined();
  });

  it('com sessão válida, carrega e valida o conteúdo e fica ativa', async () => {
    const s = criarSessaoRestrita({
      cliente: clienteFalso({
        sessao: async () => ({ autenticado: true, usuario: 'u', admin: true })
      })
    });
    await s.iniciar();
    expect(s.fase.value).toBe('ativa');
    expect(s.admin.value).toBe(true);
    expect(s.conteudo.value?.quiz).toHaveLength(40);
  });

  it('login normal: ativa e carrega o conteúdo', async () => {
    const cliente = clienteFalso();
    const s = criarSessaoRestrita({ cliente });
    await s.iniciar();
    await s.entrar('u', 'segredo');
    expect(cliente.entrar).toHaveBeenCalledWith('u', 'segredo');
    expect(s.fase.value).toBe('ativa');
    expect(s.conteudo.value).toBeDefined();
    expect(s.mensagem.value).toBe('');
  });

  it('senha provisória: vai à troca obrigatória e NÃO pede conteúdo', async () => {
    const cliente = clienteFalso({
      entrar: async () => ({ usuario: 'u', admin: true, deveTrocarSenha: true })
    });
    const s = criarSessaoRestrita({ cliente });
    await s.iniciar();
    await s.entrar('u', 'x');
    expect(s.fase.value).toBe('trocar-senha');
    expect(cliente.obterConteudo).not.toHaveBeenCalled();
    expect(s.conteudo.value).toBeUndefined();
  });

  it('trocar a senha leva à área e carrega o conteúdo', async () => {
    const cliente = clienteFalso({
      entrar: async () => ({ usuario: 'u', admin: false, deveTrocarSenha: true })
    });
    const s = criarSessaoRestrita({ cliente });
    await s.iniciar();
    await s.entrar('u', 'x');
    await s.trocarSenha('x', 'senha nova bem longa');
    expect(cliente.trocarSenha).toHaveBeenCalledWith('x', 'senha nova bem longa');
    expect(s.fase.value).toBe('ativa');
    expect(s.conteudo.value).toBeDefined();
  });

  it('credenciais erradas: mensagem genérica e continua anônima', async () => {
    const s = criarSessaoRestrita({
      cliente: clienteFalso({
        entrar: async () => {
          throw new ErroDeApi(401, 'credenciais');
        }
      })
    });
    await s.iniciar();
    await s.entrar('u', 'errada');
    expect(s.fase.value).toBe('anonima');
    expect(s.mensagem.value).toMatch(/usuário ou senha/i);
  });

  it('429: mostra contagem regressiva, bloqueia o envio e libera no zero', async () => {
    const relogio = relogioManual();
    const entrar = vi.fn(async () => {
      throw new ErroDeApi(429, 'aguarde', 2);
    });
    const s = criarSessaoRestrita({ cliente: clienteFalso({ entrar }), tempo: relogio.fonte });
    await s.iniciar();
    await s.entrar('u', 'x');
    expect(s.segundosEspera.value).toBe(2);
    expect(s.mensagem.value).toMatch(/2 segundos/);
    await s.entrar('u', 'x');
    expect(entrar).toHaveBeenCalledTimes(1);
    relogio.tic();
    expect(s.segundosEspera.value).toBe(1);
    expect(s.mensagem.value).toMatch(/1 segundo\b/);
    relogio.tic();
    expect(s.segundosEspera.value).toBe(0);
    expect(relogio.ativo()).toBe(false);
  });

  it('falha de rede: mensagem própria, sem perder o estado', async () => {
    const s = criarSessaoRestrita({
      cliente: clienteFalso({
        entrar: async () => {
          throw new ErroDeApi(0, 'rede');
        }
      })
    });
    await s.iniciar();
    await s.entrar('u', 'x');
    expect(s.mensagem.value).toMatch(/conexão/i);
    expect(s.fase.value).toBe('anonima');
  });

  it('conteúdo inválido (HTML fora do allowlist) não é guardado nem renderizado', async () => {
    const ruim = conteudoRestritoFalso() as { resumo: Record<string, unknown>[] };
    ruim.resumo[0]!.corpoHtml = '<img src=x onerror=alert(1)>';
    const s = criarSessaoRestrita({
      cliente: clienteFalso({
        sessao: async () => ({ autenticado: true, usuario: 'u' }),
        obterConteudo: async () => ruim
      })
    });
    await s.iniciar();
    expect(s.conteudo.value).toBeUndefined();
    expect(s.mensagem.value).toMatch(/não foi possível/i);
    expect(s.mensagem.value).not.toContain('onerror');
  });

  it('401 ao carregar o conteúdo derruba a sessão local', async () => {
    const s = criarSessaoRestrita({
      cliente: clienteFalso({
        sessao: async () => ({ autenticado: true, usuario: 'u' }),
        obterConteudo: async () => {
          throw new ErroDeApi(401, 'sem-sessao');
        }
      })
    });
    await s.iniciar();
    expect(s.fase.value).toBe('anonima');
    expect(s.usuario.value).toBe('');
    expect(s.mensagem.value).toMatch(/sessão/i);
  });

  it('403 troca-obrigatoria manda para a tela de troca', async () => {
    const s = criarSessaoRestrita({
      cliente: clienteFalso({
        sessao: async () => ({ autenticado: true, usuario: 'u' }),
        obterConteudo: async () => {
          throw new ErroDeApi(403, 'troca-obrigatoria');
        }
      })
    });
    await s.iniciar();
    expect(s.fase.value).toBe('trocar-senha');
  });

  it('sair limpa TUDO, mesmo se o servidor falhar', async () => {
    const s = criarSessaoRestrita({
      cliente: clienteFalso({
        sessao: async () => ({ autenticado: true, usuario: 'u', admin: true }),
        sair: async () => {
          throw new ErroDeApi(0, 'rede');
        }
      })
    });
    await s.iniciar();
    expect(s.conteudo.value).toBeDefined();
    await s.sair();
    expect(s.fase.value).toBe('anonima');
    expect(s.conteudo.value).toBeUndefined();
    expect(s.usuario.value).toBe('');
    expect(s.admin.value).toBe(false);
  });

  it('descartar apaga o conteúdo da memória sem encerrar a sessão do servidor', async () => {
    const cliente = clienteFalso({ sessao: async () => ({ autenticado: true, usuario: 'u' }) });
    const s = criarSessaoRestrita({ cliente });
    await s.iniciar();
    s.descartar();
    expect(s.conteudo.value).toBeUndefined();
    expect(cliente.sair).not.toHaveBeenCalled();
  });

  it('chamada de admin: 401 derruba a sessão; erro comum devolve mensagem', async () => {
    const s = criarSessaoRestrita({
      cliente: clienteFalso({
        sessao: async () => ({ autenticado: true, usuario: 'u', admin: true }),
        listarUsuarios: vi
          .fn()
          .mockRejectedValueOnce(new ErroDeApi(409, 'conflito'))
          .mockRejectedValueOnce(new ErroDeApi(401, 'sem-sessao'))
      })
    });
    await s.iniciar();
    const r1 = await s.administrar((c) => c.listarUsuarios());
    expect(r1.ok).toBe(false);
    const r2 = await s.administrar((c) => c.listarUsuarios());
    expect(r2.ok).toBe(false);
    expect(s.fase.value).toBe('anonima');
  });
});
