import { describe, expect, it } from 'vitest';
import { migrarRegistroLegado } from '@/app/quiz/migrarRegistroLegado';
import { FORMAS_CONGELADAS } from '@/app/quiz/formasCongeladas';
import { ordemDaRodada } from '@/core/quiz/motor';
import type { RegistroProgressoUnidade } from '@/core/progresso/tipos';
import { quiz } from '@/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/quiz/index';

/**
 * FIL-B12, decisão do CPO (D3 e D5): as alternativas corretas dos quiz ids 1 e 5 mudam de TEXTO, no mesmo
 * índice. Quem já respondeu continua certo: a resposta salva é o índice original, e a forma congelada guarda
 * só id, tipo e número de alternativas. Este spec trava os índices (2 e 0) e a tradução da resposta salva.
 */
const CHAVE = 'p1/filosofia-juridica/u3-moderna-contemporanea';

function perguntaDe(id: number): { id: number; correta: number } {
  const p = (quiz as unknown as { id: number; correta?: number }[]).find((x) => x.id === id);
  if (p === undefined || p.correta === undefined)
    throw new Error(`pergunta ${id} sem índice correto`);
  return { id: p.id, correta: p.correta };
}

describe('índice correto dos ids 1 e 5 da Filosofia u3', () => {
  it('não muda com a troca de texto: id 1 é 2 e id 5 é 0 (decisão do CPO, D3 e D5)', () => {
    expect(perguntaDe(1).correta).toBe(2);
    expect(perguntaDe(5).correta).toBe(0);
  });
});

describe('resposta salva antiga continua certa', () => {
  for (const id of [1, 5]) {
    for (const semente of [11, 222, 3333]) {
      it(`id ${id}, semente ${semente}: a posição mostrada que aponta a correta, traduzida, dá a correta`, () => {
        const forma = FORMAS_CONGELADAS[CHAVE];
        expect(forma).toBeDefined();
        const ordem = ordemDaRodada(forma!, semente);
        const correta = perguntaDe(id).correta;
        const mostrada = ordem.alternativas.get(id)!.indexOf(correta as never);
        expect(mostrada).toBeGreaterThanOrEqual(0);
        const legado: RegistroProgressoUnidade = {
          quizSemente: semente,
          quizRespostas: { [id]: mostrada }
        } as unknown as RegistroProgressoUnidade;
        const migrado = migrarRegistroLegado(legado, CHAVE) as unknown as {
          quizRespostasOriginais: Record<number, number>;
        };
        expect(migrado.quizRespostasOriginais[id]).toBe(correta);
      });
    }
  }
});
