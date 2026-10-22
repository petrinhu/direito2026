import type { Mnemonico } from '../../../tipos';

/**
 * Mnemônicos da Unidade 3 de Introdução ao Direito: apoios de memória para o
 * que mais se confunde no trecho de Hart. O conteúdo que cada um guarda vem do
 * resumo (resumo.ts). O que é invenção de apoio (a palavra, a frase, a imagem)
 * vem declarado como tal, e nenhum deles acrescenta ou deforma o que Hart diz.
 */
export const mnemonicos: readonly Mnemonico[] = [
  {
    id: 'caso-claro-penumbra',
    titulo: 'Caso claro x penumbra',
    tecnica: 'imagem',
    dica: 'Imagine um alvo. No centro, o caso claro, em que a flecha acerta sem discussão. Na borda, a penumbra, em que ninguém tem certeza se a flecha entrou na área do alvo.',
    desafio: 'Diga, sem olhar, o que separa um caso simples de um caso de penumbra, e dê um exemplo de cada um.',
    guarda: [
      {
        termo: 'Centro do alvo',
        explicacao: 'caso simples: o termo geral é claramente aplicável, como o automóvel é certamente um veículo.'
      },
      {
        termo: 'Borda do alvo',
        explicacao: 'caso de penumbra: não é claro se o termo se aplica, como no caso de bicicletas, aviões e patins.'
      }
    ],
    comoFunciona:
      'A imagem põe os casos em zonas: quanto mais perto do centro, menos dúvida. Hart usa exatamente essa distinção entre o caso familiar e o caso que tem só alguns dos aspectos.',
    ressalva:
      'O alvo é apoio de memória, invenção didática. A distinção entre caso simples e penumbra é de Hart (p. 139).',
    blocoResumo: 'bloco-2'
  },
  {
    id: 'regra-ou-padrao',
    titulo: 'Regra x padrão variável',
    tecnica: 'frase',
    dica: 'Regra manda, padrão pesa. A regra diz o que fazer sem pedir que se pondere nada, como a proibição de matar. O padrão pede uma ponderação que muda de caso para caso, como o preço justo ou o cuidado devido.',
    desafio: 'Diga, sem olhar, um exemplo de regra fixa e um de padrão variável, e explique por que um pede ponderação e o outro não.',
    guarda: [
      {
        termo: 'Regra (manda)',
        explicacao: 'a regra contra o ato de matar, em que o matar outrem domina os outros fatores, e a regra do lado da estrada, cuja importância é a uniformidade.'
      },
      {
        termo: 'Padrão variável (pesa)',
        explicacao: 'o preço justo, que exige inquérito e poder discricionário, e o cuidado devido, que só se define diante do caso concreto.'
      }
    ],
    comoFunciona:
      'A frase separa os dois tipos pelo verbo: a regra dispensa nova apreciação, o padrão exige que se pese o caso.',
    ressalva:
      'Manda e pesa são apoio de memória. A distinção é de Hart (pp. 144-146).',
    blocoResumo: 'bloco-6'
  },
  {
    id: 'formalismo-ou-exagero',
    titulo: 'Formalismo x exagero da indeterminação',
    tecnica: 'associacao',
    dica: 'Dois extremos, ambos errados. O formalismo finge que a escolha já foi feita e que a regra resolve tudo. O exagero trata quase tudo como aberto e esquece os limites que a linguagem legislativa ainda oferece.',
    desafio: 'Diga, sem olhar, o que o formalismo finge e o que o exagero esquece.',
    guarda: [
      {
        termo: 'Formalismo',
        explicacao: 'disfarça e minimiza a necessidade de escolha depois que a regra é editada, e fixa o significado dos termos em todos os casos.'
      },
      {
        termo: 'Exagero da indeterminação',
        explicacao: 'trata demasiadas coisas como casos perenemente em aberto e atribui pouco respeito aos limites da linguagem legislativa.'
      }
    ],
    comoFunciona:
      'Ao ligar cada extremo a um verbo, a dica mostra que os dois erros estão no mesmo ponto: não reconhecer a medida real da escolha.',
    ressalva:
      'Finge e esquece são apoio de memória. Hart descreve os dois extremos ao tratar da oscilação da teoria jurídica (p. 143).',
    blocoResumo: 'bloco-5'
  },
  {
    id: 'legislacao-ou-precedente',
    titulo: 'Legislação x precedente',
    tecnica: 'associacao',
    dica: 'Legislação: muitas palavras gerais, como a regra de que todos os homens e os rapazes devem tirar o chapéu ao entrar numa igreja (p. 137). Precedente: poucas palavras e um exemplo, como o pai que descobre a cabeça ao entrar. Um diz a regra em palavras; o outro mostra o que fazer.',
    desafio: 'Diga, sem olhar, qual dos dois expedientes usa o máximo de palavras gerais e qual usa o exemplo.',
    guarda: [
      {
        termo: 'Legislação',
        explicacao: 'uso máximo de palavras gerais para estabelecer classificações.'
      },
      {
        termo: 'Precedente',
        explicacao: 'uso mínimo dessas palavras, com um exemplo dotado de autoridade que se toma como modelo.'
      }
    ],
    comoFunciona:
      'O pai da regra e o pai do exemplo são o par que Hart usa para mostrar a diferença entre os dois expedientes.',
    ressalva:
      'Os pais e a igreja são exemplos não jurídicos que Hart usa para explicar a distinção (p. 137).',
    blocoResumo: 'bloco-1'
  },
  {
    id: 'duas-desvantagens',
    titulo: 'Ignorância de fato x indeterminação de finalidade',
    tecnica: 'frase',
    dica: 'Duas perguntas que a lei não consegue responder de antemão. Uma: o que vai acontecer? Outra: o que eu quero aqui, neste caso que ninguém previu?',
    desafio: 'Diga, sem olhar, as duas desvantagens que Hart aponta e o que cada uma impede.',
    guarda: [
      {
        termo: 'O que vai acontecer? (ignorância de fato)',
        explicacao: 'a impossibilidade de conhecer todas as combinações de circunstâncias que o futuro pode trazer.'
      },
      {
        termo: 'O que eu quero aqui? (indeterminação de finalidade)',
        explicacao: 'a finalidade da regra ainda não foi posta em confronto com casos que não se previu, e por isso fica indeterminada.'
      }
    ],
    comoFunciona:
      'As duas perguntas correspondem às duas causas: uma nasce do que não se conhece, e a outra, do que ainda não se decidiu.',
    ressalva:
      'As perguntas são apoio de memória. As duas desvantagens são de Hart (p. 141).',
    blocoResumo: 'bloco-3'
  }
];
