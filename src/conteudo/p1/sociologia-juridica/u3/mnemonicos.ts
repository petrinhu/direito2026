import type { Mnemonico } from '../../../tipos';

/**
 * Mnemônicos da Unidade 3 de Sociologia Jurídica: apoios de memória para o que
 * mais se confunde. O conteúdo que cada um guarda vem do resumo (resumo.ts). O
 * que é invenção de apoio (a palavra, a frase, a imagem) vem declarado como
 * tal, e nenhum deles acrescenta ou deforma o que as autoras dizem.
 */
export const mnemonicos: readonly Mnemonico[] = [
  {
    id: 'recebe-encontra-age',
    titulo: 'Os três tipos de risco (Hasebrink)',
    tecnica: 'associacao',
    dica: 'Três verbos, um por risco, na ordem em que aparecem: a criança RECEBE conteúdo inapropriado (risco de conteúdo), ENCONTRA alguém que viola a sua privacidade ou a assedia (risco de contato), e AGE como autora da violência, por exemplo fazendo bullying (risco de conduta).',
    desafio: 'Diga o papel da criança em cada risco e dê um exemplo de cada um, sem olhar.',
    guarda: [
      {
        termo: 'Recebe (conteúdo)',
        explicacao: 'receptora: recebe conteúdo publicitário, spam ou mensagens inapropriadas.'
      },
      {
        termo: 'Encontra (contato)',
        explicacao: 'receptora-participante: tem a privacidade violada e comercializada, sofre bullying ou assédio online.'
      },
      {
        termo: 'Age (conduta)',
        explicacao: 'ator: compartilha imagens pornográficas na rede ou faz bullying com os pares.'
      }
    ],
    comoFunciona:
      'Cada verbo lembra o papel da criança, e esse papel é o critério que separa os três tipos.',
    ressalva:
      'Recebe, encontra e age são apoio de memória, invenção didática. A classificação é de Hasebrink et al. (2009), citados por Santos.',
    blocoResumo: 'bloco-2'
  },
  {
    id: 'preocupacoes-dos-pais',
    titulo: 'As cinco preocupações dos pais, em ordem',
    tecnica: 'chunking',
    dica: 'Três grandes e dois menores. Os três primeiros passam de 55%: contato com estranhos, conteúdo inapropriado e tempo excessivo. Os dois últimos ficam em 50% e 30%: privacidade e cyberbullying.',
    desafio: 'Diga as cinco preocupações na ordem e o percentual de cada uma.',
    guarda: [
      {
        termo: 'Trio grande',
        explicacao: 'contato com estranhos (75,8%), acesso a conteúdo inapropriado (65,2%) e uso excessivo de tempo (57,6%).'
      },
      {
        termo: 'Par menor',
        explicacao: 'proteção da privacidade do filho (50%) e cyberbullying (30,3%).'
      }
    ],
    comoFunciona:
      'Dois grupos curtos transformam a lista de cinco em dois blocos, e os percentuais confirmam a ordem.',
    ressalva:
      'Os percentuais são de uma pesquisa com pais de crianças de 10 a 15 anos, em escolas públicas de Petrolina, em 2024, e não valem para o país inteiro.',
    blocoResumo: 'bloco-5'
  },
  {
    id: 'santos-ou-nobrega',
    titulo: 'Santos ou Nóbrega: onde está a proteção?',
    tecnica: 'associacao',
    dica: 'Santos: FERRAMENTA e NORMA, ou seja, as ferramentas das plataformas e a normativa mais dura do Estado. Nóbrega: VÍNCULO, a conexão afetiva e o diálogo entre pais e filhos. Ferramenta e norma de um lado; vínculo do outro.',
    desafio: 'Diga, sem olhar, onde cada autora coloca a maior proteção da criança.',
    guarda: [
      {
        termo: 'Santos (ferramenta e norma)',
        explicacao: 'ferramentas de mediação nas plataformas e normativa mais dura do Estado.'
      },
      {
        termo: 'Nóbrega (vínculo)',
        explicacao: 'conexão real e rede afetiva entre pais e filhos; limites de idade e de tempo provavelmente não garantem segurança.'
      }
    ],
    comoFunciona:
      'Cada autora ganha uma palavra que resume onde ela coloca a proteção, e a palavra vira o critério de comparação.',
    ressalva:
      'Ferramenta, norma e vínculo são apoio de memória. A divergência é atribuída a cada autora, e não significa que uma negue o que a outra diz.',
    blocoResumo: 'bloco-9'
  },
  {
    id: 'redes-sao-lupas',
    titulo: 'As redes são lupa, não causa',
    tecnica: 'imagem',
    dica: 'Imagine uma lupa sobre a mesa da sala: ela não cria a poeira, só mostra o que já estava lá. Para Nóbrega, as redes sociais são a lupa, e o silêncio dentro das casas é a poeira.',
    desafio: 'Diga por que, para Nóbrega, a tecnologia não é a causa do problema.',
    guarda: [
      {
        termo: 'Lupa',
        explicacao: 'as redes sociais mostram o silenciamento dentro das casas e escancaram a falta de espaço e tempo para ficar juntos.'
      },
      {
        termo: 'Poeira',
        explicacao: 'o silenciamento e a ausência de diálogo, que já existiam antes das telas.'
      }
    ],
    comoFunciona:
      'A imagem separa o instrumento da causa: quem olha pela lupa vê o problema, mas não foi ela que o criou.',
    ressalva:
      'A lupa é a metáfora da própria autora. A poeira é imagem de apoio, invenção didática, para lembrar a ideia.',
    blocoResumo: 'bloco-7'
  },
  {
    id: 'cadeia-do-abandono',
    titulo: 'Ausência, culpa e permissividade: a cadeia',
    tecnica: 'frase',
    dica: 'Uma cadeia de três elos, nesta ordem: os pais ficam ausentes, sentem culpa, e a culpa leva à permissividade. O elo da culpa é o que liga a ausência ao descuido com os limites.',
    desafio: 'Refaça a cadeia de três elos, sem olhar, e diga o que a culpa pode levar os pais a fazer.',
    guarda: [
      {
        termo: 'Ausência',
        explicacao: 'pais que passam de 8 a 12 horas trabalhando, segundo Ferreira.'
      },
      {
        termo: 'Culpa',
        explicacao: 'os pais sabem da própria ausência e se sentem culpados.'
      },
      {
        termo: 'Permissividade',
        explicacao: 'compensação da ausência com permissividade, desatenção às orientações e indecisão diante de limites firmes.'
      }
    ],
    comoFunciona:
      'Cada elo causa o seguinte, e a cadeia mostra que a ausência tem efeito muito além das horas fora de casa.',
    ressalva:
      'A cadeia é apoio de memória, invenção didática. O conteúdo vem de Nóbrega, que lê Ferreira.',
    blocoResumo: 'bloco-7'
  }
];
