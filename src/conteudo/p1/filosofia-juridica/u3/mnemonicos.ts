import type { Mnemonico } from '../../../tipos';

/**
 * Mnemônicos de Filosofia Jurídica, 3a unidade: apoios de memória para o que
 * mais se confunde ou se esquece. O conteúdo que cada um guarda vem do
 * resumo (resumo.ts). O que é invenção de apoio (a palavra, a frase, a
 * imagem) vem declarado como tal, e nenhum deles acrescenta ou deforma o que
 * os autores dizem. Ordem: do que mais se confunde para o que organiza a
 * unidade inteira.
 */
export const mnemonicos: readonly Mnemonico[] = [
  {
    id: 'pontos-de-partida-hobbes-locke-rousseau',
    titulo: 'Hobbes, Locke e Rousseau: o ponto de partida',
    tecnica: 'associacao',
    dica: 'Três pontos de partida, três palavras: Hobbes parte da GUERRA. Locke parte da LIBERDADE e da IGUALDADE. Rousseau parte do homem livre que está sob FERROS. Guerra, liberdade e ferros.',
    desafio: 'Diga o ponto de partida de cada um e o que cada um faz com ele.',
    guarda: [
      {
        termo: 'Hobbes (guerra)',
        explicacao: 'guerra de todos contra todos; contrato em que cada um renuncia a parte da liberdade, e o monarca absoluto administra o Leviatã.'
      },
      {
        termo: 'Locke (liberdade)',
        explicacao: 'liberdade e igualdade, com direitos à vida, à liberdade e à propriedade; o governo civil entra como árbitro imparcial.'
      },
      {
        termo: 'Rousseau (ferros)',
        explicacao: 'o homem nasce livre e encontra-se sob ferros; a soberania pertence ao corpo social e não pode ser representada.'
      }
    ],
    comoFunciona:
      'Cada autor fica preso a uma palavra do ponto de partida, e a palavra já aponta o que vem depois: a guerra pede um monarca, a liberdade pede limite ao governo, e os ferros pedem soberania popular.',
    ressalva:
      'A palavra "ferros" vem da abertura do Contrato Social, e a associação é só apoio de memória, não descrição do estado de natureza de Rousseau.',
    blocoResumo: 'bloco-3'
  },
  {
    id: 'soberania-x-direito-divino',
    titulo: 'Bodin (soberania) x Bossuet (direito divino)',
    tecnica: 'frase',
    dica: 'Pergunte a cada um quem manda. Bodin responde com o poder: soberania, supremo, uno e indivisível. Bossuet responde com Deus: direito divino dos reis.',
    desafio: 'Diga o fundamento que cada um dá ao poder do rei e qual dos dois sobreviveu na história.',
    guarda: [
      {
        termo: 'Bodin',
        explicacao: 'soberania: poder supremo, uno e indivisível, ligado à legitimidade; o soberano não se sujeita às leis que faz.'
      },
      {
        termo: 'Bossuet',
        explicacao: 'direito divino: o monarca reina por um direito que vem de Deus; rebeldia contra o príncipe cristão é sacrilégio.'
      }
    ],
    comoFunciona:
      'Um verbo por autor fixa o fundamento: Bodin responde com o poder e Bossuet com Deus. Quem sobreviveu foi a resposta de Bodin.',
    ressalva:
      'O que sobreviveu foi a soberania de Bodin, e não o direito divino de Bossuet. A frase de apoio é invenção didática, e não uma citação de Bodin ou de Bossuet.',
    blocoResumo: 'bloco-2'
  },
  {
    id: 'tres-imperativos-de-kant',
    titulo: 'Os três imperativos de Kant',
    tecnica: 'associacao',
    dica: 'O hipotético tem um SE escondido: se você quer X, então faça Y. O categórico não tem SE: faça porque é certo, sem condição. O de destreza é receita: diz como fazer, sem dizer se é bom ou mau.',
    desafio: 'Diga, sem consultar, o que cada imperativo exige e dê um exemplo de cada um.',
    guarda: [
      {
        termo: 'Destreza',
        explicacao: 'regra técnica, sem vontade boa ou má; é o médico que orienta o procedimento para curar a doença.'
      },
      {
        termo: 'Hipotético',
        explicacao: 'a ação é boa para atingir um fim; paga-se o tributo por medo da multa. O Direito é, em regra, assim.'
      },
      {
        termo: 'Categórico',
        explicacao: 'a ação é boa em si mesma, cumprida incondicionalmente; é o campo da Moral.'
      }
    ],
    comoFunciona:
      'A condição escondida no hipotético é o que o separa do categórico: sem SE não há fim a alcançar, só dever.',
    ressalva:
      'O SE é apoio de memória, invenção didática, e não uma citação de Kant. A distinção entre o dever hipotético e o categórico é de Kant.',
    blocoResumo: 'bloco-9'
  },
  {
    id: 'poderes-de-locke-x-montesquieu',
    titulo: 'Os três poderes: Locke x Montesquieu',
    tecnica: 'associacao',
    dica: 'Locke tem o federativo: quem cuida da guerra, da paz e das alianças. Montesquieu tem o judiciário: quem julga. Executivo e legislativo aparecem nos dois.',
    desafio: 'Liste os poderes de Locke e os de Montesquieu e diga o que muda entre eles.',
    guarda: [
      {
        termo: 'Locke',
        explicacao: 'executivo, legislativo e federativo (guerra, paz e alianças).'
      },
      {
        termo: 'Montesquieu',
        explicacao: 'executivo, legislativo e judiciário; reunidos na mesma pessoa, não existe liberdade.'
      }
    ],
    comoFunciona:
      'A diferença está em um só poder: o federativo de Locke ocupa o lugar que o judiciário ocupa em Montesquieu.',
    ressalva:
      'Locke ainda é um esboço, com centralização nas mãos do rei. A separação em três poderes que o julgador não acumula é a de Montesquieu.',
    blocoResumo: 'bloco-6'
  },
  {
    id: 'fundamento-do-direito-natural',
    titulo: 'Poder, natureza e razão: o fundamento do direito',
    tecnica: 'associacao',
    dica: 'Três fundamentos, três palavras: Hobbes funda o Direito no PODER. Grotius, na NATUREZA das coisas. Pufendorf, na RAZÃO humana. Poder, natureza e razão, na ordem em que os autores aparecem na unidade.',
    desafio: 'Diga em que cada autor funda o Direito e qual é a finalidade do direito natural em Pufendorf.',
    guarda: [
      {
        termo: 'Hobbes (poder)',
        explicacao: 'funda o Direito no poder; é a referência de contraste da primeira fase.'
      },
      {
        termo: 'Grotius (natureza)',
        explicacao: 'funda o Direito na natureza das coisas; a natureza do homem é ser sociável.'
      },
      {
        termo: 'Pufendorf (razão)',
        explicacao: 'funda o Direito na razão humana; a finalidade do direito natural é a sociabilidade.'
      }
    ],
    comoFunciona:
      'Uma palavra por autor fixa o fundamento de cada um, e a finalidade de Pufendorf completa o quadro.',
    ressalva:
      'Grotius e Pufendorf são da segunda fase; Hobbes é da primeira e serve de contraste. A palavra de cada um é apoio de memória.',
    blocoResumo: 'bloco-4'
  },
  {
    id: 'governante-ou-estado',
    titulo: 'Maquiavel ou Hobbes: quem é o centro do problema?',
    tecnica: 'frase',
    dica: 'Maquiavel pensa o governante: como conquistar e manter o poder. Hobbes pensa o Estado: o Leviatã e a paz.',
    desafio: 'Diga, em cada autor, qual é o centro do problema e como o poder se mantém.',
    guarda: [
      {
        termo: 'Maquiavel',
        explicacao: 'o governante; o poder se mantém pela força ou pela fraude, não pelo Direito nem pela justiça.'
      },
      {
        termo: 'Hobbes',
        explicacao: 'o Estado em si; o poder se justifica por um contrato que cria o Leviatã e impõe a paz.'
      }
    ],
    comoFunciona:
      'A frase põe o foco de cada um numa palavra só: o governante, no caso de Maquiavel, e o Estado, no caso de Hobbes.',
    ressalva:
      'A frase é apoio de memória, invenção didática, e não uma citação de Maquiavel nem de Hobbes. O deslocamento do governante para o Estado é o avanço de Hobbes.',
    blocoResumo: 'bloco-1'
  },
  {
    id: 'tres-caixas-da-filosofia-moderna-e-social',
    titulo: 'As três caixas: formar, limitar e a Filosofia Social',
    tecnica: 'chunking',
    dica: 'Três caixas em ordem. Caixa 1, formar o Estado: quatro nomes. Caixa 2, limitar o Estado: sete nomes. Caixa 3, Filosofia Social: dois nomes.',
    desafio: 'Diga em que caixa está cada pensador, sem olhar, e qual é a ideia central de cada caixa.',
    guarda: [
      {
        termo: 'Formar o Estado',
        explicacao: 'Maquiavel, Bodin, Bossuet e Hobbes: centralização máxima do poder para unificar e criar o Estado.'
      },
      {
        termo: 'Limitar o Estado',
        explicacao: 'Grotius, Pufendorf, Locke, Montesquieu, Rousseau, Kant e Hegel: separação de poderes e direitos naturais, origem do Estado de Direito.'
      },
      {
        termo: 'Filosofia Social',
        explicacao: 'Proudhon e Marx: crítica ao capitalismo e à desigualdade.'
      }
    ],
    comoFunciona:
      'Três caixas com quatro, sete e dois nomes cabem na memória de trabalho, e cada caixa abre o detalhe por trás dela.',
    ressalva:
      'Hobbes está na primeira caixa, e não na segunda, mesmo tendo vivido ao mesmo tempo que Grotius. Os números são só apoio de memória.',
    blocoResumo: 'bloco-0'
  }
];
