import { test, expect, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';
import { embaralharRodada } from '../../src/core/quiz/motor';
import type { ChaveUnidade } from '../../src/core/progresso/tipos';
import type { IndiceAlternativa, PerguntaQuiz } from '../../src/core/unidade/tipos';
import { quiz as quizFilosofiaU3 } from '../../src/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/quiz/index';
import { quiz as quizIntrNorma } from '../../src/conteudo/p1/intr-direito/u3-material-norma-interpretacao/quiz';
import { quiz as quizEca } from '../../src/conteudo/p1/sociologia-juridica/u3-eca-digital/quiz';
import { quiz as quizRedacao } from '../../src/conteudo/p1/redacao-juridica-1/u1/quiz';

/**
 * Rádio da resposta salva marcado em TODA pergunta (defeito do QA visual de 14/11, b16b3c94:
 * perguntas 12 e 16 da Filosofia u3 ficavam sem o rádio marcado, com o destaque certo).
 *
 * Causa: o cartão é reaproveitado entre perguntas (sem key), e os rádios trocam de grupo
 * (name). Um rádio que estava marcado num grupo, ao entrar no grupo da pergunta seguinte, pode
 * ficar marcado e desmarcar o correto. Só aparece no navegador real (jsdom não junta grupos).
 *
 * Aqui: respostas salvas em todas as perguntas, escolha original 0 (a primeira alternativa do
 * conteúdo). Para cada pergunta, o rádio marcado na tela tem de ser a posição que a rodada
 * sorteada dá a essa alternativa.
 */
const UNIDADES: ReadonlyArray<{ chave: ChaveUnidade; quiz: readonly PerguntaQuiz[] }> = [
  { chave: 'p1/filosofia-juridica/u3-moderna-contemporanea', quiz: quizFilosofiaU3 },
  { chave: 'p1/intr-direito/u3-material-norma-interpretacao', quiz: quizIntrNorma },
  { chave: 'p1/sociologia-juridica/u3-eca-digital', quiz: quizEca },
  { chave: 'p1/redacao-juridica-1/u1', quiz: quizRedacao }
];
const SEMENTE = 4242;

async function lerMarcado(page: Page): Promise<number> {
  return page.evaluate(() => {
    const card = document.querySelector('.cartao-pergunta');
    const radios = Array.from(card?.querySelectorAll<HTMLInputElement>('input[type=radio]') ?? []);
    return radios.findIndex((r) => r.checked);
  });
}

for (const { chave, quiz } of UNIDADES) {
  test(`quiz ${chave}: o rádio da resposta salva fica marcado em todas as perguntas`, async ({
    page
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
    const rodada = embaralharRodada(quiz, SEMENTE);
    const registro = {
      versao: 1,
      atualizadoEm: '2026-11-14T10:00:00.000Z',
      blocosLidos: [],
      ultimaAba: 'quiz',
      quizSemente: SEMENTE,
      quizIdsDaRodada: rodada.perguntas.map((p) => p.id),
      quizRespostasOriginais: Object.fromEntries(quiz.map((p) => [p.id, 0 as IndiceAlternativa]))
    };
    await page.addInitScript(
      (p: { chave: string; registro: string }) => {
        window.localStorage.setItem(`caderno-direito:v1:progresso:${p.chave}`, p.registro);
      },
      { chave, registro: JSON.stringify(registro) }
    );
    await page.goto(`/p/${chave}/quiz`);
    await esperarLayoutAssentar(page);
    await page.locator('.motor-quiz__posicao').waitFor({ state: 'attached' });

    const falhas: string[] = [];
    for (let i = 0; i < rodada.perguntas.length; i++) {
      const pergunta = rodada.perguntas[i]!;
      const esperado = pergunta.ordemOriginal.indexOf(0 as IndiceAlternativa);
      const marcado = await lerMarcado(page);
      if (marcado !== esperado)
        falhas.push(
          `pergunta ${pergunta.id} (posição ${i + 1}): marcado ${marcado}, esperado ${esperado}`
        );
      if (i < rodada.perguntas.length - 1)
        await page.getByRole('button', { name: 'Próxima', exact: true }).click();
    }
    expect(falhas, 'rádios marcados fora do esperado').toEqual([]);
  });
}
