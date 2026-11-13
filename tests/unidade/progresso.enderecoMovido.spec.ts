import { describe, expect, it } from 'vitest';
import { criarStoreProgresso } from '@/app/stores/progresso';
import type { RegistroProgressoUnidade, RepositorioProgresso } from '@/core/progresso/tipos';

/**
 * Progresso de unidade movida (ordem do líder, 25/10/2026: "Levar para o endereço
 * novo"): o registro guardado sob a chave antiga é lido pela chave nova quando a nova
 * está vazia. Se a nova já tem registro, ele vence. Só ler e salvar são usados pelo store.
 */
const CHAVE_ANTIGA = 'p1/sociologia-juridica/u3';
const CHAVE_NOVA = 'p1/sociologia-juridica/u3-artigos-infancia-digital';

function registro(blocosLidos: string[]): RegistroProgressoUnidade {
  return { versao: 1, atualizadoEm: '2026-10-01T00:00:00.000Z', blocosLidos, ultimaAba: 'resumo' };
}

function repositorioCom(dados: Record<string, RegistroProgressoUnidade>): RepositorioProgresso {
  const mapa = new Map(Object.entries(dados));
  return {
    ler: (chave: string) => mapa.get(chave),
    salvar: (chave: string, valor: RegistroProgressoUnidade) => {
      mapa.set(chave, valor);
      return true;
    }
  } as unknown as RepositorioProgresso;
}

describe('progresso de unidade movida', () => {
  it('sem registro na chave nova, lê o registro da chave antiga', () => {
    const repositorio = repositorioCom({ [CHAVE_ANTIGA]: registro(['bloco-0']) });
    const store = criarStoreProgresso(repositorio, CHAVE_NOVA);
    expect(store.registro.value.blocosLidos).toEqual(['bloco-0']);
  });

  it('com registro na chave nova, o da chave nova vence o da antiga', () => {
    const repositorio = repositorioCom({
      [CHAVE_ANTIGA]: registro(['bloco-0']),
      [CHAVE_NOVA]: registro(['bloco-9'])
    });
    const store = criarStoreProgresso(repositorio, CHAVE_NOVA);
    expect(store.registro.value.blocosLidos).toEqual(['bloco-9']);
  });

  it('uma chave que não é movida não busca nenhum registro antigo', () => {
    const repositorio = repositorioCom({ [CHAVE_ANTIGA]: registro(['bloco-0']) });
    const store = criarStoreProgresso(repositorio, 'p1/intr-direito/u1');
    expect(store.registro.value.blocosLidos).toEqual([]);
  });
});

/**
 * Filosofia AV3 (decisão R1 = A, 13/11/2026): o registro inteiro vai com a unidade,
 * inclusive a semente e as respostas do quiz. A leitura por id de pergunta e por
 * posição na semente só continua válida porque o quiz não muda nesta fatia.
 */
const CHAVE_ANTIGA_FILOSOFIA = 'p1/filosofia-juridica/u3';
const CHAVE_NOVA_FILOSOFIA = 'p1/filosofia-juridica/u3-moderna-contemporanea';

describe('progresso de unidade movida: Filosofia AV3', () => {
  it('o registro inteiro (lidos, aba, semente e respostas do quiz) chega intacto à chave nova', () => {
    const antigo: RegistroProgressoUnidade = {
      versao: 1,
      atualizadoEm: '2026-11-01T00:00:00.000Z',
      blocosLidos: ['bloco-0', 'bloco-3'],
      ultimaAba: 'quiz',
      quizSemente: 2026,
      quizRespostas: { 1: 2, 17: 0 },
      quizFinalizado: false
    };
    const repositorio = repositorioCom({ [CHAVE_ANTIGA_FILOSOFIA]: antigo });
    const store = criarStoreProgresso(repositorio, CHAVE_NOVA_FILOSOFIA);
    expect(store.registro.value).toEqual(antigo);
  });
});
