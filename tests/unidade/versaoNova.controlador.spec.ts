import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { criarControladorAviso } from '@/app/versaoNova/controladorAviso';
import { CHAVE_DISPENSADA, CHAVE_RECARREGOU_PARA } from '@/app/versaoNova/estadoAvisoVersao';
import type { RespostaVersao, Transporte } from '@/app/versaoNova/consultarVersaoPublicada';

/**
 * AV-F11: controlador do banner. Consulta só com login; estado a partir da última resposta;
 * fechar guarda a versão dispensada na aba; "continua conectado" some depois de 110 min sem
 * confirmação; laço de recarga respeitado. Relógio, transporte e armazenamento falsos.
 */
const MINUTO = 60_000;

function transporteDe(versao: string | 'sessao' | 'rede') {
  const transporte = vi.fn<Transporte>(async () => {
    if (versao === 'rede') throw new TypeError('Failed to fetch');
    if (versao === 'sessao') return { status: 401, contentType: null, corpo: async () => '' } as RespostaVersao;
    return {
      status: 200,
      contentType: 'application/json',
      corpo: async () => JSON.stringify({ versao, historico: [{ versao, novidades: ['Novo: rádio para estudar'] }] })
    } as RespostaVersao;
  });
  return transporte;
}

function criar(opcoes: { versao?: string | 'sessao' | 'rede'; usuario?: string; armazenado?: Record<string, string> } = {}) {
  let agora = 10_000_000_000;
  const dados: Record<string, string> = { ...(opcoes.armazenado ?? {}) };
  const transporte = transporteDe(opcoes.versao ?? '1.12.1.0');
  const usuario = ref(opcoes.usuario ?? 'ana.paula');
  const controlador = criarControladorAviso({
    daAba: '1.12.0.0',
    transporte,
    relogio: { agora: () => agora },
    documento: { visibilityState: 'visible', addEventListener: () => undefined, removeEventListener: () => undefined },
    armazenamento: {
      lerChave: (c) => dados[c] ?? null,
      gravarChave: (c, v) => {
        dados[c] = v;
      }
    },
    usuario,
    navegarParaInicio: vi.fn()
  });
  return {
    controlador,
    transporte,
    dados,
    usuario,
    avancar: (ms: number) => (agora += ms)
  };
}

describe('criarControladorAviso', () => {
  it('sem login não consulta e o banner fica oculto', async () => {
    const { controlador, transporte } = criar({ usuario: '' });
    await controlador.consultar();
    expect(transporte).not.toHaveBeenCalled();
    expect(controlador.estado.value).toEqual({ tipo: 'oculto' });
  });

  it('com login e versão nova publicada mostra o banner com o nome composto', async () => {
    const { controlador } = criar();
    await controlador.consultar();
    expect(controlador.estado.value).toEqual({ tipo: 'versao-nova', publicada: '1.12.1.0' });
    expect(controlador.visaoAgora().nome).toBe('Ana Paula');
    expect(controlador.visaoAgora().resumo.itens).toEqual(['Novo: rádio para estudar']);
  });

  it('fechar guarda a versão dispensada na aba e o banner some', async () => {
    const { controlador, dados } = criar();
    await controlador.consultar();
    controlador.fechar();
    expect(controlador.estado.value).toEqual({ tipo: 'oculto' });
    expect(dados[CHAVE_DISPENSADA]).toBe('1.12.1.0');
  });

  it('versão já dispensada continua escondida nesta aba', async () => {
    const { controlador, dados } = criar({ armazenado: { [CHAVE_DISPENSADA]: '1.12.1.0' } });
    await controlador.consultar();
    expect(controlador.estado.value).toEqual({ tipo: 'oculto' });
    expect(dados[CHAVE_RECARREGOU_PARA]).toBeUndefined();
  });

  it('sessão terminada esconde o banner da consulta comum', async () => {
    const { controlador } = criar({ versao: 'sessao' });
    await controlador.consultar();
    expect(controlador.estado.value).toEqual({ tipo: 'oculto' });
  });

  it('anti-laço: a marca de recarga para a mesma versão não mostra o banner de novo', async () => {
    const { controlador } = criar({ armazenado: { [CHAVE_RECARREGOU_PARA]: '1.12.1.0' } });
    await controlador.consultar();
    expect(controlador.estado.value).toEqual({ tipo: 'oculto' });
  });

  it('"continua conectado" some depois de 110 min sem confirmação', async () => {
    const { controlador, avancar } = criar();
    await controlador.consultar();
    expect(controlador.visaoAgora().continuaConectado).toBe(true);
    avancar(111 * MINUTO);
    expect(controlador.visaoAgora().continuaConectado).toBe(false);
  });

  it('a primeira troca de rota é a carga; a segunda consulta', async () => {
    const { controlador, transporte } = criar();
    controlador.iniciar();
    controlador.aoTrocarRota();
    expect(transporte).not.toHaveBeenCalled();
    controlador.aoTrocarRota();
    await Promise.resolve();
    expect(transporte).toHaveBeenCalledTimes(1);
  });
});
