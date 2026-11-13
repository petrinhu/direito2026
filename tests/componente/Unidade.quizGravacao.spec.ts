// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Unidade from '@/ui/paginas/Unidade.vue';
import { CHAVE_CURRICULO, CHAVE_REPOSITORIO } from '@/app/chaves';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import { embaralharRodada } from '@/core/quiz/motor';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade, IndiceAlternativa } from '@/core/unidade/tipos';
import type { RegistroProgressoUnidade } from '@/core/progresso/tipos';
import { quiz } from '@/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/quiz/index';

/**
 * AV3-K4, fiação da tela do quiz: a resposta é gravada pela posição ORIGINAL da
 * alternativa (não pela posição exibida), e uma rodada finalizada que ganhou pergunta
 * nova volta a ficar em andamento ao abrir a unidade.
 */
const PERIODO = 'p1';
const CADEIRA = 'filosofia-juridica';
const UNIDADE = 'u3-moderna-contemporanea';
const CHAVE = `${PERIODO}/${CADEIRA}/${UNIDADE}`;
const SEMENTE = 777;

const conteudo: ConteudoUnidade = {
  meta: { rotulo: 'Unidade 3', estado: 'publicado', titulo: 't', subtitulo: 's', descricao: 'd' },
  resumo: [],
  quiz
};

const curriculo: Curriculo = [
  {
    id: PERIODO,
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      {
        id: CADEIRA,
        nome: 'Filosofia Jurídica',
        estado: 'publicado',
        unidades: [
          {
            id: UNIDADE,
            rotulo: 'Unidade 3',
            titulo: 'T',
            estado: 'publicado',
            abas: ['quiz'],
            carregar: async () => conteudo
          }
        ]
      }
    ]
  }
];

function registroBase(extra: Partial<RegistroProgressoUnidade>): RegistroProgressoUnidade {
  return {
    versao: 1,
    atualizadoEm: '2026-11-13T12:00:00.000Z',
    blocosLidos: [],
    ultimaAba: 'quiz',
    quizSemente: SEMENTE,
    quizRespostasOriginais: {},
    quizFinalizado: false,
    ...extra
  };
}

async function montar(repositorio: RepositorioMemoria) {
  const wrapper = mount(Unidade, {
    props: { periodo: PERIODO, cadeira: CADEIRA, unidade: UNIDADE, aba: 'quiz' },
    attachTo: document.body,
    global: {
      provide: {
        [CHAVE_CURRICULO as unknown as symbol]: curriculo,
        [CHAVE_REPOSITORIO as unknown as symbol]: repositorio
      }
    }
  });
  await flushPromises();
  return wrapper;
}

describe('Unidade: resposta do quiz é gravada pela posição original (AV3-K4)', () => {
  it('clicar numa alternativa exibida grava a posição dessa alternativa no conteúdo', async () => {
    const primeira = embaralharRodada(quiz, SEMENTE).perguntas[0]!;
    // Só serve para provar a conversão se a posição exibida e a original forem diferentes.
    const k = primeira.ordemOriginal.findIndex((original, exibida) => original !== exibida);
    expect(k).toBeGreaterThanOrEqual(0);

    const repositorio = new RepositorioMemoria();
    repositorio.salvar(CHAVE, registroBase({}));
    const wrapper = await montar(repositorio);
    const alternativas = wrapper.findAll('input[type="radio"]');
    expect(alternativas).toHaveLength(primeira.alternativasHtml.length);

    await alternativas[k]!.trigger('change');
    await flushPromises();

    expect(repositorio.ler(CHAVE)?.quizRespostasOriginais?.[primeira.id]).toBe(
      primeira.ordemOriginal[k]
    );
    wrapper.unmount();
  });
});

describe('Unidade: rodada finalizada reabre ao abrir a unidade quando ganhou pergunta nova (AV3-K4)', () => {
  it('reabre quando há pergunta do conteúdo que a rodada finalizada não tinha', async () => {
    const idsSemUltima = quiz.slice(0, -1).map((p) => p.id);
    const respostas = Object.fromEntries(idsSemUltima.map((id) => [id, 0]));
    const repositorio = new RepositorioMemoria();
    repositorio.salvar(
      CHAVE,
      registroBase({
        quizFinalizado: true,
        quizIdsDaRodada: idsSemUltima,
        quizRespostasOriginais: respostas as Record<number, IndiceAlternativa>
      })
    );
    const wrapper = await montar(repositorio);
    expect(repositorio.ler(CHAVE)?.quizFinalizado).toBe(false);
    wrapper.unmount();
  });

  it('não reabre quando a rodada finalizada já tinha todas as perguntas do conteúdo', async () => {
    const ids = quiz.map((p) => p.id);
    const repositorio = new RepositorioMemoria();
    repositorio.salvar(
      CHAVE,
      registroBase({
        quizFinalizado: true,
        quizIdsDaRodada: ids,
        quizRespostasOriginais: Object.fromEntries(ids.map((id) => [id, 0])) as Record<
          number,
          IndiceAlternativa
        >
      })
    );
    const wrapper = await montar(repositorio);
    expect(repositorio.ler(CHAVE)?.quizFinalizado).toBe(true);
    wrapper.unmount();
  });
});
