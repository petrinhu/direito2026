import type { Mnemonico } from '../../../tipos';

/**
 * Mnemônicos de Filosofia Jurídica, 1a unidade: apoios de memória para o que
 * mais se confunde ou se esquece. O conteúdo que cada um guarda vem do
 * resumo (resumo.ts), conferido bloco a bloco; o que é invenção de apoio (a
 * imagem, a frase, a sigla) vem sempre declarado como tal, e nenhum deles
 * acrescenta ou deforma o que o material diz. Ordem: do que mais se
 * confunde para o que organiza a unidade inteira.
 */
export const mnemonicos: readonly Mnemonico[] = [
  {
    id: 'leis-de-tomas',
    titulo: 'As leis em Tomás de Aquino',
    tecnica: 'imagem',
    dica: 'Imagine uma escada de três degraus e, ao lado dela, um livro aberto. No alto, Deus pensa o mundo. No degrau do meio, a razão das pessoas participa desse pensamento. No degrau de baixo, o legislador escreve as normas da cidade. O livro ao lado da escada vem de outra fonte.',
    desafio: 'Diga as leis de cima para baixo e o que cada uma é.',
    guarda: [
      { termo: 'Lei eterna', explicacao: 'a lei de Deus, fundamento de todas as demais (o alto da escada).' },
      {
        termo: 'Lei natural',
        explicacao:
          'participação da criatura racional na lei eterna, alcançável pela razão (o degrau do meio).'
      },
      {
        termo: 'Lei humana',
        explicacao:
          'a lei posta, positiva, estabelecida pelos homens com base na lei natural e voltada à utilidade comum (o degrau de baixo).'
      },
      { termo: 'Lei divina', explicacao: 'a que vem das Escrituras (o livro ao lado).' }
    ],
    comoFunciona:
      'A hierarquia vira posição no espaço (alto, meio, baixo), e a lei que não está na cadeia de derivação vira um objeto separado.',
    ressalva:
      'Os slides destacam três leis (eterna, natural e humana); a divina entra pela exposição de Wolkmer, que completa as quatro. A escada e o livro são só apoio de memória: não constam do material.',
    blocoResumo: 'bloco-8'
  },
  {
    id: 'comutativa-distributiva',
    titulo: 'Justiça comutativa x justiça distributiva',
    tecnica: 'associacao',
    dica: 'Comutativa lembra comutar, trocar: duas pessoas trocam uma coisa por outra, de igual para igual, como num contrato. Distributiva lembra distribuir: o Estado reparte cargos e benefícios, a cada um conforme o mérito ou a necessidade.',
    desafio: 'Para cada tipo, diga quem se relaciona com quem, qual é a igualdade e dê um exemplo.',
    guarda: [
      {
        termo: 'Comutativa (corretiva)',
        explicacao:
          'relações privadas, indivíduo x indivíduo; igualdade aritmética (simples); contratos, Direito Civil e Penal.'
      },
      {
        termo: 'Distributiva',
        explicacao:
          'Estado x indivíduo; igualdade proporcional (geométrica), por mérito ou necessidade; cargos públicos e benefícios sociais.'
      }
    ],
    comoFunciona:
      'O verbo de cada nome (trocar, distribuir) já aponta para quem age e para o tipo de igualdade: a troca é de igual para igual, a repartição é proporcional.',
    ressalva: 'Tomás de Aquino retoma essa divisão de Aristóteles e a integra à caridade cristã.',
    blocoResumo: 'bloco-5'
  },
  {
    id: 'categorias-do-direito-romano',
    titulo: 'Ius civile, ius gentium e ius naturale',
    tecnica: 'associacao',
    dica: 'Ius civile vem de cidade e cidadão: o direito próprio de um povo determinado, o romano. Ius gentium vem de gentes, os povos: o comum a todos os povos. Ius naturale vem de natureza: os princípios ditados pela razão natural.',
    desafio: 'Diga de onde vem cada nome e o que cada direito abrange.',
    guarda: [
      { termo: 'Ius civile', explicacao: 'próprio do povo romano, fundado na vontade do povo.' },
      { termo: 'Ius gentium', explicacao: 'comum a todos os povos.' },
      {
        termo: 'Ius naturale',
        explicacao: 'princípios ditados pela razão natural, fundados na razão universal.'
      }
    ],
    comoFunciona:
      'Cada nome em latim tem uma palavra do português dentro dele (cidade, gente, natureza), que já diz a abrangência.',
    ressalva:
      'A classificação do ius gentium é discutida: Bobbio o aproxima do direito natural, e Del Vecchio o trata como uma espécie de direito internacional, categoria do direito positivo. O mnemônico segue a tripartição das aulas e só ajuda a lembrar que as três categorias não se equivalem.',
    blocoResumo: 'bloco-6'
  },
  {
    id: 'ordem-cronologica',
    titulo: 'Ordem cronológica dos pensadores',
    tecnica: 'loci',
    dica: 'Imagine uma caminhada de dez paradas. 1, um teatro ao ar livre. 2, uma praça onde todos discutem. 3, uma cela. 4, uma cidade dividida em três faixas. 5, uma balança. 6, um rolo de leis romano. 7, uma igreja com duas cidades no horizonte. 8, uma biblioteca com um grande livro aberto. 9, uma pessoa sozinha sob um foco de luz. 10, uma tesoura separando dois fios.',
    desafio: 'Percorra as dez paradas de memória e diga, em cada uma, quem é e a ideia central.',
    guarda: [
      { termo: 'Sófocles', explicacao: 'teatro: Antígona, a lei do Estado x as leis divinas não escritas.' },
      { termo: 'Os sofistas', explicacao: 'praça: physis x nomos, relativismo (século V a.C.).' },
      { termo: 'Sócrates', explicacao: 'cela: recusa a fuga e obedece às leis da pólis (469-399 a.C.).' },
      { termo: 'Platão', explicacao: 'cidade em três faixas: a justiça como harmonia (427-348 a.C.).' },
      {
        termo: 'Aristóteles',
        explicacao: 'balança: justo meio, justiça comutativa e distributiva, equidade (384-322 a.C.).'
      },
      { termo: 'Cícero', explicacao: 'rolo de leis: o direito se funda na natureza (106-43 a.C.).' },
      {
        termo: 'Agostinho',
        explicacao: 'igreja: Cidade de Deus x Cidade dos Homens, prevalece a lei de Deus (354-430).'
      },
      {
        termo: 'Tomás de Aquino',
        explicacao: 'biblioteca: a Suma Teológica, a síntese entre Aristóteles e o cristianismo (1225-1274).'
      },
      {
        termo: 'Duns Escoto',
        explicacao: 'pessoa sob o foco: o primado do individual e da liberdade (1266-1308).'
      },
      {
        termo: 'Guilherme de Ockham',
        explicacao: 'tesoura: separa razão e teologia; direito subjetivo (1285-1327).'
      }
    ],
    comoFunciona:
      'Cada pensador fica preso a um lugar e a uma imagem, o percurso fixa a ordem, e a imagem de cada parada lembra a ideia central, não só o nome.',
    ressalva:
      'Datas das aulas; Sófocles e os sofistas são do mesmo século. As imagens são só apoio de memória: o conteúdo vem do resumo.',
    blocoResumo: 'bloco-11'
  },
  {
    id: 'classes-de-platao',
    titulo: 'As três classes de Platão',
    tecnica: 'imagem',
    dica: 'Pense num corpo. A cabeça pensa e governa. O braço defende. As mãos produzem. Três verbos, na ordem: pensar, defender, produzir.',
    desafio: 'Diga as três classes da cidade ideal e a função de cada uma.',
    guarda: [
      { termo: 'Sábios', explicacao: 'pensam e governam (a cabeça).' },
      { termo: 'Guerreiros', explicacao: 'lutam e defendem (o braço).' },
      { termo: 'Artífices', explicacao: 'trabalham e produzem (as mãos).' }
    ],
    comoFunciona:
      'O corpo dá um lugar para cada função, e os três verbos seguem a ordem das classes, do que pensa ao que produz.',
    ressalva:
      'Cada cidadão cumpre rigidamente o seu papel, e o desvio dessa ordem gera injustiça. A imagem do corpo é só apoio de memória: não consta do material.',
    blocoResumo: 'bloco-4'
  },
  {
    id: 'protagoras-trasimaco',
    titulo: 'Protágoras ou Trasímaco?',
    tecnica: 'associacao',
    dica: 'Protágoras lembra protagonista: cada um é o protagonista que mede o mundo, "o homem é a medida de todas as coisas". Trasímaco lembra trono: quem está no trono, o mais forte, decide o que é justo.',
    desafio: 'Qual dos dois disse que a justiça é a conveniência do mais forte? E qual disse que o homem é a medida de todas as coisas?',
    guarda: [
      {
        termo: 'Protágoras',
        explicacao: 'homo mensura: "o homem é a medida de todas as coisas". Relativismo e individualismo.'
      },
      {
        termo: 'Trasímaco',
        explicacao:
          'a justiça é a conveniência do mais forte; as leis resultam da força de quem controla o poder.'
      }
    ],
    comoFunciona:
      'O começo de cada nome lembra uma palavra do português (protagonista, trono) cuja imagem já carrega a tese.',
    ressalva:
      'É das confusões mais cobradas em verdadeiro ou falso. A palavra "trono" é só apoio de memória: não consta do material.',
    blocoResumo: 'bloco-2'
  },
  {
    id: 'antigona-creonte',
    titulo: 'Antígona x Creonte',
    tecnica: 'frase',
    dica: 'Antígona obedece ao amor; Creonte obedece ao comando.',
    desafio: 'Diga o que cada um defende e a que está ligado.',
    guarda: [
      {
        termo: 'Antígona',
        explicacao:
          'as leis divinas não escritas, ligadas ao amor, à piedade e à tradição: sepulta o irmão.'
      },
      {
        termo: 'Creonte',
        explicacao: 'a lei do Estado, ligada à força, à razão e ao formalismo: decreta que o corpo de Polinice não seja sepultado.'
      }
    ],
    comoFunciona:
      'Uma frase curta com a mesma estrutura nos dois lados pesa os dois polos do conflito de uma vez, sem favorecer nenhum.',
    ressalva:
      'É a leitura das aulas. O livro de apoio lembra que nem Creonte nem Antígona teriam razão absoluta (hybris).',
    blocoResumo: 'bloco-1'
  },
  {
    id: 'socrates-platao-aristoteles',
    titulo: 'Sócrates, Platão e Aristóteles',
    tecnica: 'frase',
    dica: 'Sócrates perguntou, Platão projetou, Aristóteles classificou.',
    desafio: 'Diga o que cada verbo representa no pensamento de cada um sobre a justiça.',
    guarda: [
      {
        termo: 'Sócrates',
        explicacao: 'perguntou: maiêutica e dialética; justiça é cumprir a lei da pólis.'
      },
      {
        termo: 'Platão',
        explicacao: 'projetou: a cidade em que cada classe cumpre sua função, justiça como harmonia.'
      },
      {
        termo: 'Aristóteles',
        explicacao:
          'classificou: justiça universal e particular, comutativa e distributiva, justo natural e legal, regimes de governo.'
      }
    ],
    comoFunciona:
      'Um verbo por pensador, em ordem cronológica, resume o gesto característico de cada um.',
    ressalva:
      'Os verbos são só apoio de memória; o conteúdo de cada um está no quadro comparativo do resumo.',
    blocoResumo: 'bloco-10'
  },
  {
    id: 'regimes-de-aristoteles',
    titulo: 'Os regimes de governo em Aristóteles',
    tecnica: 'acronimo',
    dica: 'Para o bem comum, a sigla MAR: Monarquia, Aristocracia, República. As formas de interesse egoísta vêm na mesma ordem: Tirania, Oligarquia, Democracia.',
    desafio: 'Diga os três regimes de cada lado e o critério que separa um lado do outro.',
    guarda: [
      { termo: 'Bem comum', explicacao: 'monarquia, aristocracia, república.' },
      { termo: 'Interesse egoísta', explicacao: 'tirania, oligarquia, democracia.' },
      {
        termo: 'Critério',
        explicacao: 'a finalidade ética do governo, não o número de governantes.'
      }
    ],
    comoFunciona:
      'A sigla fixa a ordem do lado bom, e a ordem do lado ruim segue a mesma sequência de letras da lista dos slides.',
    ressalva:
      'Siglas de primeira letra têm evidência de eficácia mais fraca que as imagens: use a sigla junto com o desafio de recordar, nunca no lugar dele.',
    blocoResumo: 'bloco-5'
  },
  {
    id: 'idade-media-em-tres-blocos',
    titulo: 'A Idade Média em três blocos',
    tecnica: 'chunking',
    dica: 'Guarde a Idade Média em três blocos, em ordem. Bloco 1, Deus. Bloco 2, razão e fé. Bloco 3, indivíduo.',
    desafio: 'Diga quem pertence a cada bloco e a ideia central dele.',
    guarda: [
      {
        termo: 'Deus',
        explicacao: 'Agostinho: duas leis, Cidade de Deus x Cidade dos Homens; prevalece a lei de Deus.'
      },
      {
        termo: 'Razão e fé',
        explicacao: 'Tomás de Aquino: síntese entre Aristóteles e o cristianismo; as leis eterna, natural, humana e divina.'
      },
      {
        termo: 'Indivíduo',
        explicacao: 'Escoto e Ockham: primado do individual, separação entre razão e teologia, direito subjetivo.'
      }
    ],
    comoFunciona:
      'Três blocos de uma palavra cabem na memória de trabalho de uma vez, e cada bloco abre os detalhes por trás dele.',
    ressalva: 'A síntese das aulas é a passagem do organicismo ao indivíduo.',
    blocoResumo: 'bloco-11'
  }
];
