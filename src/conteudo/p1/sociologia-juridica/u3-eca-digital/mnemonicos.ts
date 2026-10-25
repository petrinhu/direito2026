import type { Mnemonico } from '../../../tipos';

/**
 * Mnemônicos do ECA Digital: apoios de memória para o que mais se confunde. O
 * conteúdo que cada um guarda vem do resumo (resumo.ts). O que é invenção de
 * apoio (a sigla, a frase, a imagem) vem declarado como tal, e nenhum deles
 * acrescenta ou deforma o que a lei diz.
 */
export const mnemonicos: readonly Mnemonico[] = [
  {
    id: 'sancoes-amsp',
    titulo: 'As quatro penalidades e quem as aplica',
    tecnica: 'acronimo',
    dica: 'A-M-S-P: Advertência, Multa, Suspensão, Proibição. As iniciais seguem a ordem dos incisos do art. 35. As duas primeiras são da autoridade administrativa; as duas finais, do Poder Judiciário.',
    desafio: 'Diga as quatro penalidades na ordem e quem aplica cada uma, sem olhar.',
    guarda: [
      {
        termo: 'A (advertência)',
        explicacao: 'com prazo de até 30 dias para adotar medidas corretivas; aplicada pela autoridade administrativa.'
      },
      {
        termo: 'M (multa)',
        explicacao: 'calculada sobre o faturamento do grupo no Brasil ou, sem faturamento, por usuário cadastrado; aplicada pela autoridade administrativa.'
      },
      {
        termo: 'S (suspensão)',
        explicacao: 'suspensão temporária das atividades; aplicada pelo Poder Judiciário.'
      },
      {
        termo: 'P (proibição)',
        explicacao: 'proibição do exercício das atividades; aplicada pelo Poder Judiciário.'
      }
    ],
    comoFunciona:
      'A ordem da sigla é a ordem dos incisos do art. 35. O par inicial é da autoridade administrativa, e o par final é do Judiciário, conforme o § 5º.',
    ressalva:
      'A sigla AMSP é apoio de memória, invenção didática. A divisão de competência está no § 5º do art. 35.',
    blocoResumo: 'bloco-12'
  },
  {
    id: 'idade-18-16',
    titulo: 'Dezoito anos para o conteúdo, dezesseis para o vínculo',
    tecnica: 'associacao',
    dica: 'Dezoito é o limite para o conteúdo impróprio: a barreira é o acesso (art. 9º). Dezesseis é o limite para o vínculo: a conta de quem tem até 16 anos precisa estar ligada a um responsável (art. 24). Uma regra trata do que se vê; a outra, de quem responde pela conta.',
    desafio: 'Diga, sem olhar, a idade de cada regra e o que cada uma controla.',
    guarda: [
      {
        termo: 'Dezoito',
        explicacao: 'conteúdo, produto ou serviço impróprio, inadequado ou proibido para menores de 18 anos: o acesso deve ser impedido.'
      },
      {
        termo: 'Dezesseis',
        explicacao: 'contas de crianças e adolescentes de até 16 anos vinculadas a um responsável legal.'
      }
    ],
    comoFunciona:
      'Cada número fica ligado a uma função: 18 para o que a pessoa pode acessar, 16 para quem responde pela conta.',
    ressalva:
      'A associação é apoio de memória. Os dois artigos cuidam de situações diferentes, e não se somam.',
    blocoResumo: 'bloco-3'
  },
  {
    id: 'verificacao-a-cada-acesso',
    titulo: 'Verificação de idade: a cada acesso, sem autodeclaração',
    tecnica: 'frase',
    dica: 'Frase de três partes: "mecanismo confiável, a cada acesso, sem autodeclaração". Cada parte corresponde a uma exigência do § 1º do art. 9º.',
    desafio: 'Recite a frase de três partes e diga por que a autodeclaração não basta.',
    guarda: [
      {
        termo: 'Mecanismo confiável',
        explicacao: 'a verificação precisa ser confiável, e não apenas uma resposta dada pelo usuário.'
      },
      {
        termo: 'A cada acesso',
        explicacao: 'a verificação se repete em cada acesso ao conteúdo impróprio.'
      },
      {
        termo: 'Sem autodeclaração',
        explicacao: 'a lei veda que a própria pessoa declare a idade.'
      }
    ],
    comoFunciona:
      'O ritmo da frase ajuda a lembrar as três exigências, e cada uma corresponde a uma parte do parágrafo.',
    ressalva:
      'A frase é apoio de memória, e não texto da lei. O enunciado original está no § 1º do art. 9º.',
    blocoResumo: 'bloco-3'
  },
  {
    id: 'notificacao-identificada',
    titulo: 'Notificação sem anonimato: o que a lei exige',
    tecnica: 'frase',
    dica: 'Sem identificação do conteúdo e de quem notifica, a notificação é nula. Denúncia anônima é vedada.',
    desafio: 'Diga o que a notificação deve conter e por que a denúncia anônima não serve.',
    guarda: [
      {
        termo: 'Conteúdo',
        explicacao: 'elementos que permitam a identificação técnica específica do conteúdo apontado como violador.'
      },
      {
        termo: 'Autor',
        explicacao: 'elementos que permitam a identificação de quem faz a notificação.'
      },
      {
        termo: 'Nulidade',
        explicacao: 'sem esses elementos, a notificação é nula, e a denúncia anônima é vedada.'
      }
    ],
    comoFunciona:
      'A frase reúne as exigências do § 2º do art. 29: o conteúdo, o autor e a consequência de não cumpri-las.',
    ressalva:
      'A frase é apoio de memória. O conteúdo vem do § 2º do art. 29.',
    blocoResumo: 'bloco-9'
  },
  {
    id: 'cadeia-solidaria',
    titulo: 'Responsabilidade solidária: ninguém sai da cadeia',
    tecnica: 'imagem',
    dica: 'Imagine uma corrente de bicicleta: basta um elo frágil para a força toda falhar. Na cadeia digital, o art. 15 diz que cumprir as obrigações de um capítulo não libera os demais agentes, e todos respondem juntos pela proteção integral.',
    desafio: 'Diga por que cumprir a parte de verificação de idade não libera os outros agentes da cadeia.',
    guarda: [
      {
        termo: 'Corrente',
        explicacao: 'agentes da cadeia digital, como fornecedores, lojas de aplicações e sistemas operacionais (arts. 12 e 15).'
      },
      {
        termo: 'Elo',
        explicacao: 'cumprir as obrigações do capítulo IV, sobre aferição de idade, não exime os demais agentes.'
      },
      {
        termo: 'Solidariedade',
        explicacao: 'todos garantem, de forma solidária, a proteção integral de crianças e adolescentes.'
      }
    ],
    comoFunciona:
      'A imagem mostra que a força do conjunto depende de cada elo, e a lei diz o mesmo sobre a responsabilidade de todos os agentes.',
    ressalva:
      'A imagem é apoio de memória. A solidariedade é a do próprio art. 15.',
    blocoResumo: 'bloco-3'
  }
];
