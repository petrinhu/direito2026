import type { Mnemonico } from '../../../tipos';

/**
 * Mnemônicos da unidade: apoios de memória para o que mais se confunde. O
 * conteúdo que cada um guarda vem do resumo. A frase, a imagem ou a escada são
 * invenção de apoio e vêm declaradas como tal na ressalva.
 */
export const mnemonicos: readonly Mnemonico[] = [
  {
    id: 'fontes-quatro',
    titulo: 'As quatro fontes do direito',
    tecnica: 'frase',
    dica: 'Lei manda, tribunal repete, jurista explica, povo pratica. Cada verbo aponta para quem produz a fonte: quem faz a lei, quem decide de forma reiterada, quem explica e quem pratica a conduta.',
    desafio: 'Diga, sem olhar, o que é cada uma das quatro fontes e o que o costume exige.',
    guarda: [
      {
        termo: 'Lei manda (legislação)',
        explicacao: 'fonte primária por excelência no civil law, com a Constituição e as leis.'
      },
      {
        termo: 'Tribunal repete (jurisprudência)',
        explicacao: 'as decisões reiteradas dos tribunais.'
      },
      {
        termo: 'Jurista explica (doutrina)',
        explicacao: 'o estudo dogmático dos juristas e teóricos, que ajuda a dar sentido às leis.'
      },
      {
        termo: 'Povo pratica (costume)',
        explicacao: 'a conduta reiterada com a convicção de que é obrigatória, com uso constante e consciência de obrigatoriedade.'
      }
    ],
    comoFunciona:
      'Cada verbo indica quem produz a fonte.',
    ressalva:
      'Os verbos são apoio de memória. As definições são as da disciplina.',
    blocoResumo: 'bloco-0'
  },
  {
    id: 'precedente-jurisprudencia-sumula',
    titulo: 'Precedente, jurisprudência e súmula',
    tecnica: 'chunking',
    dica: 'Pense em três tamanhos: uma decisão (precedente), muitas decisões repetidas (jurisprudência) e o resumo delas, escrito para consulta (súmula).',
    desafio: 'Diga, sem olhar, o que é cada um dos três e por que a súmula nasce da jurisprudência.',
    guarda: [
      {
        termo: 'Uma decisão (precedente)',
        explicacao: 'decisão judicial tomada em um caso concreto, que pode servir de exemplo para outros julgamentos.'
      },
      {
        termo: 'Muitas decisões repetidas (jurisprudência)',
        explicacao: 'o conjunto de decisões sobre um tema, quando o tribunal decide de forma repetida e constante.'
      },
      {
        termo: 'O resumo (súmula)',
        explicacao: 'enunciado que resume a jurisprudência, redigido quando o tribunal percebe que já decidiu a mesma coisa diversas vezes.'
      }
    ],
    comoFunciona:
      'A escada vai do caso ao conjunto e do conjunto ao resumo, na ordem em que cada um costuma surgir.',
    ressalva:
      'A escada é apoio de memória. As definições são as da disciplina.',
    blocoResumo: 'bloco-10'
  },
  {
    id: 'kelsen-moldura',
    titulo: 'Moldura da interpretação: dentro e fora',
    tecnica: 'imagem',
    dica: 'Imagine um quadro com moldura. Dentro dele cabem várias interpretações diferentes, todas válidas. Fora da moldura ficam as decisões ilegais ou inconstitucionais.',
    desafio: 'Diga, sem olhar, o que cabe dentro da moldura e o que fica fora dela, segundo Kelsen.',
    guarda: [
      {
        termo: 'Dentro da moldura',
        explicacao: 'as diversas interpretações possíveis e válidas, entre as quais o juiz tem liberdade para escolher.'
      },
      {
        termo: 'Fora da moldura',
        explicacao: 'as decisões ilegais ou inconstitucionais.'
      }
    ],
    comoFunciona:
      'A moldura separa a escolha possível, dentro dela, da decisão que não tem validade, fora dela.',
    ressalva:
      'O quadro é apoio de memória. A moldura é a ideia de Kelsen, conforme a disciplina.',
    blocoResumo: 'bloco-11'
  },
  {
    id: 'sintaxe-semantica-pragmatica',
    titulo: 'Sintaxe, semântica e pragmática',
    tecnica: 'associacao',
    dica: 'Forma, sentido e uso. A sintaxe olha a forma da norma e a conexão entre as leis. A semântica olha o sentido da palavra na lei. A pragmática olha o uso da lei no caso concreto e na realidade social.',
    desafio: 'Diga, sem olhar, qual dimensão analisa a hierarquia das leis e qual aplica a norma ao caso concreto.',
    guarda: [
      {
        termo: 'Forma (sintaxe)',
        explicacao: 'a relação entre os signos, a estrutura lógica das normas, a gramática legislativa e a hierarquia.'
      },
      {
        termo: 'Sentido (semântica)',
        explicacao: 'a relação entre o signo e o seu significado, o sentido das palavras na lei.'
      },
      {
        termo: 'Uso (pragmática)',
        explicacao: 'a relação entre o signo e os usuários, no contexto, com a aplicação ao caso concreto.'
      }
    ],
    comoFunciona:
      'A ordem forma, sentido, uso segue o caminho da norma: primeiro a escrita, depois a palavra, por fim o caso.',
    ressalva:
      'Forma, sentido e uso são apoio de memória. As três dimensões são as da disciplina.',
    blocoResumo: 'bloco-6'
  },
  {
    id: 'fato-significado',
    titulo: 'Fato x significado jurídico',
    tecnica: 'frase',
    dica: 'O fato acontece no mundo. O significado jurídico é o que o Direito diz sobre ele. Matar alguém é o fato; homicídio ou execução legal é o que o Direito diz.',
    desafio: 'Diga, sem olhar, qual é o fato e qual é o significado jurídico no exemplo de matar alguém.',
    guarda: [
      {
        termo: 'O fato',
        explicacao: 'o evento no mundo real, como matar alguém.'
      },
      {
        termo: 'O significado jurídico',
        explicacao: 'a interpretação feita pelo Direito, que pode ser homicídio ou execução legal, conforme a norma que interpreta o fato.'
      }
    ],
    comoFunciona:
      'A frase separa o que acontece do que a norma faz com o que aconteceu.',
    ressalva:
      'A frase é apoio de memória. A distinção é a que a disciplina apresenta ao tratar da Teoria Pura.',
    blocoResumo: 'bloco-1'
  }
];
