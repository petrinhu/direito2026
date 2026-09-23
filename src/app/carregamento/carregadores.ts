import type { ConteudoUnidade } from '@/core/unidade/tipos';
import type { RegistroDeCarregadores } from './decorarCurriculo';

/**
 * Um carregador por unidade publicada, escrito à mão: cada entrada é o
 * `import()` dinâmico dos quatro arquivos da unidade (seção 3 da
 * arquitetura), combinados em um só ConteudoUnidade. Onda 3 traz a
 * ferramenta que gera isto a partir do HTML antigo; até lá, uma entrada por
 * unidade publicada é natural e não é abstração prematura (regra de 3,
 * L-33: a segunda unidade duplica, a terceira decide o que extrair).
 */
export const CARREGADORES: RegistroDeCarregadores = {
  'p1/intr-direito/u1': async (): Promise<ConteudoUnidade> => {
    const [{ meta }, { resumo }, { peticao }, { quiz }] = await Promise.all([
      import('@/conteudo/p1/intr-direito/u1/meta'),
      import('@/conteudo/p1/intr-direito/u1/resumo'),
      import('@/conteudo/p1/intr-direito/u1/peticao'),
      import('@/conteudo/p1/intr-direito/u1/quiz')
    ]);
    return { meta, resumo, peticao, quiz };
  },
  'p1/redacao-juridica-1/u1': async (): Promise<ConteudoUnidade> => {
    const [{ meta }, { resumo }, { peticao }, { quiz }] = await Promise.all([
      import('@/conteudo/p1/redacao-juridica-1/u1/meta'),
      import('@/conteudo/p1/redacao-juridica-1/u1/resumo'),
      import('@/conteudo/p1/redacao-juridica-1/u1/peticao'),
      import('@/conteudo/p1/redacao-juridica-1/u1/quiz')
    ]);
    return { meta, resumo, peticao, quiz };
  }
};
