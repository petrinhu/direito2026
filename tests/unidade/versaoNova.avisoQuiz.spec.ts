import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { avisoQuizDoCaminho, FRASE_QUIZ_AREA_RESTRITA } from '@/app/versaoNova/avisoQuiz';

/**
 * Decisão 72 do líder (14/11 18:59, ratificada, ratificar-13-11.md): a frase do quiz no aviso de
 * versão aparece nas áreas restritas (Interdisciplinar e Júri), porque a recarga perde as respostas
 * marcadas ali. Cadeira comum, home e busca não recebem a frase. Currículo real, sem fixture.
 */
describe('avisoQuizDoCaminho', () => {
  it('o texto é o ratificado pelo líder, palavra por palavra', () => {
    expect(FRASE_QUIZ_AREA_RESTRITA).toBe(
      'Se você estiver fazendo o quiz desta área, as respostas marcadas aqui se perdem ao recarregar.'
    );
  });

  it('aparece na rota do Interdisciplinar e na da Júri (ambas restritas)', () => {
    expect(avisoQuizDoCaminho(curriculo, '/p/p1/interdisciplinar')).toBe(FRASE_QUIZ_AREA_RESTRITA);
    expect(avisoQuizDoCaminho(curriculo, '/p/p1/juri-simulado')).toBe(FRASE_QUIZ_AREA_RESTRITA);
  });

  it('não aparece em cadeira comum, na home nem na busca', () => {
    for (const caminho of ['/p/p1/intr-direito', '/p/p1/filosofia-juridica', '/', '/busca']) {
      expect(avisoQuizDoCaminho(curriculo, caminho), caminho).toBeNull();
    }
  });
});
