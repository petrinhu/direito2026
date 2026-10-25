import type { FichaPensador, MapaFichamento } from '../../../tipos';

/**
 * Fonte única do Mapa mental e do Fichamento da Unidade 3 de Sociologia
 * Jurídica. Os pensadores são as duas autoras dos artigos e Hugo Monteiro
 * Ferreira, autor citado por Nóbrega. Cada ficha aponta para um bloco do
 * resumo que existe. A citação literal só aparece com o texto do próprio autor.
 */

const santos: FichaPensador = {
  id: 'santos',
  nome: 'Debora Maria dos Santos',
  nomeCurto: 'Santos',
  faseId: 'controle',
  obras: ['Controle parental em redes sociais digitais (Intercom, 2025)'],
  modoDePensar:
    'Estuda as estratégias de controle parental que Instagram, TikTok e YouTube oferecem, sob a perspectiva dos pais. A responsabilidade de mediar a relação das crianças com as redes recai sobre os pais, que precisam conhecer as ferramentas, e a autora aponta a falta de uma normativa mais dura do Estado.',
  conceitos: [
    'Controle parental: ferramentas dentro das plataformas e programas instalados',
    'Mediação parental e perfil de adulto responsável vinculado',
    'Riscos de conteúdo, contato e conduta (Hasebrink et al., 2009)',
    'Infâncias pluralizadas, com ênfase nas mediações (Othon, 2021)',
    'Preocupações dos pais: contato com estranhos em primeiro lugar'
  ],
  citacao: {
    texto: 'Estar seguro em ambiente online também é um direito da criança',
    fonte: 'SANTOS (2025), conclusão.'
  },
  paraODireito:
    'Ao tratar da proteção das crianças na internet, a autora mostra que os pais precisam entender as ferramentas e as estratégias de controle parental para lidar com uma indústria que movimenta bilhões em publicidade.',
  ressalva:
    'Santos dá peso às ferramentas e à norma do Estado. Nóbrega dá peso ao vínculo entre pais e filhos. A diferença de ênfase é atribuída a cada autora.',
  referencias: [
    'SANTOS, Debora Maria dos. Controle parental em redes sociais digitais: um estudo sobre segurança online de crianças e adolescentes a partir do entendimento dos pais no sertão pernambucano. Intercom, 2025.'
  ],
  blocoResumo: 'bloco-4'
};

const nobrega: FichaPensador = {
  id: 'nobrega',
  nome: 'Lia Pereira Nóbrega',
  nomeCurto: 'Nóbrega',
  faseId: 'geracao-do-quarto',
  obras: [
    'Tecnologias digitais e os possíveis impactos para a privacidade, a segurança e a subjetividade de crianças e adolescentes (Estudos de Psicanálise, n. 61, 2024)'
  ],
  modoDePensar:
    'A tecnologia digital, por si só, não é um problema: a questão é o uso que se faz dela. O risco maior está na ausência de vínculo e de diálogo entre pais e filhos, combinada com o uso excessivo de telas. As redes sociais escancaram o silêncio que já existe dentro das casas.',
  conceitos: [
    'Crimes digitais e risco de aliciamento, segundo Stanger (2023)',
    'Abuso que pode acontecer à distância, com aproximação por elogios',
    'Exposição de crianças pelos próprios pais e perda de controle sobre a informação',
    'Terceirização do cuidado e desvinculação emocional, segundo Ferreira',
    'Segurança maior na conexão real entre pais e filhos'
  ],
  citacao: {
    texto: 'A tecnologia digital, por si só, não é um problema.',
    fonte: 'NÓBREGA (2024), introdução.'
  },
  paraODireito:
    'Para a autora, a proteção de crianças e adolescentes na internet passa pelo afeto e pelo diálogo. Ela recusa delegar aos outros o cuidado com as crianças e aponta a família e a escola como lugares da educação digital.',
  ressalva:
    'Nóbrega diz que limites de idade e de tempo provavelmente não garantem segurança. Santos, ao contrário, dá peso às ferramentas e à norma do Estado.',
  referencias: [
    'NÓBREGA, Lia Pereira. Tecnologias digitais e os possíveis impactos para a privacidade, a segurança e a subjetividade de crianças e adolescentes. Estudos de Psicanálise, Rio de Janeiro, n. 61, p. 71-79, 2024.'
  ],
  blocoResumo: 'bloco-7'
};

const ferreira: FichaPensador = {
  id: 'ferreira',
  nome: 'Hugo Monteiro Ferreira',
  nomeCurto: 'Ferreira',
  faseId: 'geracao-do-quarto',
  obras: ['A geração do quarto'],
  modoDePensar:
    'Denuncia o isolamento de crianças e adolescentes no quarto, com pouca conversa com quem mora na casa. Para ele, a condição dessa geração exige novas posturas dos adultos, e a ausência dos pais é uma forma de abandono.',
  conceitos: [
    'Mais de três mil entrevistados, de 11 a 18 anos, ao longo de dois anos',
    'Mais de seis horas por dia isoladas no quarto',
    'Terceirizar uma criança gera desvinculações emocionais',
    'Adesão: a capacidade de ouvir quem fala, mesmo quando se discorda'
  ],
  citacao: {
    texto: 'Terceirizar uma criança é possibilitar a emergência de desvinculações emocionais',
    fonte: 'FERREIRA, citado por NÓBREGA (2024).'
  },
  paraODireito:
    'Quando se discute a responsabilidade dos adultos pela proteção dos filhos, a leitura de Ferreira mostra que a ausência dos pais também pesa sobre a segurança e o bem-estar da criança.',
  ressalva:
    'Ferreira é conhecido aqui pela leitura que Nóbrega faz do livro. O que se lê nesta ficha é a leitura dela, e não uma leitura direta da obra.',
  referencias: ['FERREIRA, Hugo Monteiro. A geração do quarto. Citado por NÓBREGA (2024).'],
  blocoResumo: 'bloco-7'
};

export const mapaFichamento: MapaFichamento = {
  titulo: 'Infância, redes sociais e tecnologias digitais',
  eras: [
    {
      id: 'contexto',
      nome: 'Bloco 1: Infância conectada',
      fases: [
        { id: 'perspectivas', nome: 'Como olhar a infância e as mídias' },
        { id: 'numeros', nome: 'Infâncias conectadas em números' }
      ]
    },
    {
      id: 'riscos',
      nome: 'Bloco 2: Riscos e crimes no ambiente digital',
      fases: [
        { id: 'tipos-de-risco', nome: 'Três tipos de risco' },
        { id: 'crimes', nome: 'Crimes e aliciamento' }
      ]
    },
    {
      id: 'mediacao',
      nome: 'Bloco 3: Mediação e controle parental',
      fases: [
        { id: 'controle', nome: 'Ferramentas de controle parental' },
        { id: 'preocupacoes', nome: 'O que os pais temem' },
        { id: 'exposicao', nome: 'Exposição e privacidade' }
      ]
    },
    {
      id: 'vinculo',
      nome: 'Bloco 4: Vínculo, isolamento e responsabilidade',
      fases: [
        { id: 'geracao-do-quarto', nome: 'A geração do quarto' },
        { id: 'responsabilidade', nome: 'Quem responde pela segurança' }
      ]
    }
  ],
  pensadores: [santos, nobrega, ferreira]
};
