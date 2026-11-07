import { describe, expect, it, vi } from 'vitest';
import { ErroDeApi, type ClienteApi } from '@/app/restrito/clienteApi';
import { criarSessaoRestrita } from '@/app/restrito/sessaoRestrita';
import { conteudoRestritoFalso } from './apoio/conteudoRestritoFalso';

function clienteFalso(sobrescritas: Partial<ClienteApi> = {}): ClienteApi {
  return {
    sessao: vi.fn(async () => ({ autenticado: true, usuario: 'u', admin: false })),
    entrar: vi.fn(async () => ({ usuario: 'u', admin: false, deveTrocarSenha: false })),
    sair: vi.fn(async () => {}),
    trocarSenha: vi.fn(async () => {}),
    obterConteudo: vi.fn(async () => conteudoRestritoFalso()),
    listarUsuarios: vi.fn(async () => []),
    acaoUsuario: vi.fn(async () => ({})),
    ...sobrescritas
  };
}

describe('carga do conteúdo restrito', () => {
  it('carrega e valida o conteúdo sem perguntar sessão nem pedir senha', async () => {
    const cliente = clienteFalso();
    const s = criarSessaoRestrita({ cliente });
    expect(s.carregando.value).toBe(true);
    await s.carregar();
    expect(cliente.obterConteudo).toHaveBeenCalledTimes(1);
    expect(cliente.sessao).not.toHaveBeenCalled();
    expect(cliente.entrar).not.toHaveBeenCalled();
    expect(s.conteudo.value?.quiz).toHaveLength(40);
    expect(s.carregando.value).toBe(false);
    expect(s.mensagem.value).toBe('');
  });

  it('conteúdo inválido (HTML fora do allowlist) não é guardado nem renderizado', async () => {
    const ruim = conteudoRestritoFalso() as { resumo: Record<string, unknown>[] };
    ruim.resumo[0]!.corpoHtml = '<img src=x onerror=alert(1)>';
    const s = criarSessaoRestrita({ cliente: clienteFalso({ obterConteudo: async () => ruim }) });
    await s.carregar();
    expect(s.conteudo.value).toBeUndefined();
    expect(s.mensagem.value).toMatch(/não foi possível/i);
    expect(s.mensagem.value).not.toContain('onerror');
  });

  it('401 na carga apaga o conteúdo; a volta à tela de entrada é do transporte', async () => {
    const cliente = clienteFalso({
      obterConteudo: async () => {
        throw new ErroDeApi(401, 'sem-sessao');
      }
    });
    const s = criarSessaoRestrita({ cliente });
    await s.carregar();
    expect(s.conteudo.value).toBeUndefined();
    expect(s.mensagem.value).toMatch(/sessão terminou/i);
    expect(cliente.sair).not.toHaveBeenCalled();
  });

  it('403 troca-obrigatoria: não há conteúdo, e a mensagem manda recarregar para trocar a senha', async () => {
    const s = criarSessaoRestrita({
      cliente: clienteFalso({
        obterConteudo: async () => {
          throw new ErroDeApi(403, 'troca-obrigatoria');
        }
      })
    });
    await s.carregar();
    expect(s.conteudo.value).toBeUndefined();
    expect(s.mensagem.value).toMatch(/recarregue/i);
  });

  it('falha de rede: mensagem própria e tentar de novo refaz a carga', async () => {
    const obterConteudo = vi
      .fn()
      .mockRejectedValueOnce(new ErroDeApi(0, 'rede'))
      .mockResolvedValueOnce(conteudoRestritoFalso());
    const s = criarSessaoRestrita({ cliente: clienteFalso({ obterConteudo }) });
    await s.carregar();
    expect(s.mensagem.value).toMatch(/conexão/i);
    expect(s.conteudo.value).toBeUndefined();
    await s.carregar();
    expect(obterConteudo).toHaveBeenCalledTimes(2);
    expect(s.conteudo.value).toBeDefined();
    expect(s.mensagem.value).toBe('');
  });

  it('descartar apaga o conteúdo da memória sem encerrar a sessão do servidor', async () => {
    const cliente = clienteFalso();
    const s = criarSessaoRestrita({ cliente });
    await s.carregar();
    expect(s.conteudo.value).toBeDefined();
    s.descartar();
    expect(s.conteudo.value).toBeUndefined();
    expect(cliente.sair).not.toHaveBeenCalled();
  });
});
