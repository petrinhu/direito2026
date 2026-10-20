import type { FichaPensador, MapaFichamento } from '../../../tipos';

/**
 * Fonte única do Mapa mental e do Fichamento de Filosofia Jurídica, 3a
 * unidade. Os dados vêm do resumo da própria unidade (resumo.ts) e da
 * obra de cada pensador. A referência de uma ficha nomeia só a obra. Citação
 * literal só aparece quando o texto é do próprio autor. O Bloco 3 aparece no
 * mapa como ramo de aviso, sem pensadores, porque o conteúdo ainda não foi
 * escrito.
 */

const MATERIAL_DE_AULA = 'Material de aula da disciplina.';

const maquiavel: FichaPensador = {
  id: 'maquiavel',
  nome: 'Maquiavel',
  datas: '1469-1527',
  faseId: 'formar-estado',
  obras: ['O Príncipe'],
  modoDePensar:
    'O Estado é um fato que se sustenta pela força do governante: governar é arte de guerra, e a dominação se dá pela força ou pela fraude, não pelo Direito nem pela justiça.',
  conceitos: [
    'Primeiro autor a defender a existência do Estado em sentido moderno',
    'Natureza humana pessimista',
    'O Estado unificado é questão de ser, e não de dever ser',
    'Legado: retoma a noção de Estado; sem Estado não há Constituição'
  ],
  paraODireito:
    'Quando um governo trata a lei apenas como instrumento para se manter no poder, a pergunta de Maquiavel é o que mantém o governante, e não o que o legitima.',
  ressalva:
    'Maquiavel fala do governante; o Estado em si só vira o centro do problema com Hobbes. Ainda não há, nele, preocupação com a legitimidade.',
  referencias: [MATERIAL_DE_AULA],
  blocoResumo: 'bloco-1'
};

const bodin: FichaPensador = {
  id: 'bodin',
  nome: 'Jean Bodin',
  datas: '1530-1596',
  faseId: 'formar-estado',
  obras: ['Os Seis Livros da República'],
  modoDePensar:
    'A soberania é o poder supremo, uno e indivisível: não há Estado sem poder soberano. O soberano faz as leis e não se sujeita a elas; está preso apenas às leis divinas e naturais.',
  conceitos: [
    'Soberania: poder supremo, uno e indivisível',
    'Legitimidade como base do poder soberano',
    'O soberano faz as leis e não se sujeita a elas'
  ],
  paraODireito:
    'Quando se diz que o poder do Estado é único dentro do território, está em jogo o conceito de soberania de Bodin.',
  ressalva:
    'O que sobreviveu de Bodin é a soberania, e não o direito divino, que pertence a Bossuet.',
  referencias: ['BODIN, Os Seis Livros da República (1576).'],
  blocoResumo: 'bloco-2'
};

const bossuet: FichaPensador = {
  id: 'bossuet',
  nome: 'Jacques Bossuet',
  datas: '1627-1704',
  faseId: 'formar-estado',
  obras: [],
  modoDePensar:
    'Ideólogo do poder régio por direito divino: o monarca reina em razão de um direito que vem de Deus, e qualquer rebeldia contra o príncipe cristão é sacrilégio e atentado à ordem sagrada.',
  conceitos: [
    'Teoria do direito divino dos reis',
    'Rebeldia contra o príncipe cristão como sacrilégio'
  ],
  paraODireito:
    'Serve de contraste: a soberania moderna se sustentou sem o fundamento religioso que Bossuet defendia.',
  ressalva:
    'O fundamento de Bossuet não prevaleceu na história; o que sobreviveu da primeira fase foi a soberania de Bodin.',
  referencias: [MATERIAL_DE_AULA],
  blocoResumo: 'bloco-2'
};

const hobbes: FichaPensador = {
  id: 'hobbes',
  nome: 'Hobbes',
  datas: '1588-1679',
  faseId: 'formar-estado',
  obras: ['Leviatã (1651)'],
  modoDePensar:
    'Antes do Estado há guerra de todos contra todos, por competição, desconfiança e glória. Para ter paz, cada um renuncia a parte da sua liberdade em nome do Estado, administrado pelo monarca absoluto.',
  conceitos: [
    'Estado de natureza: guerra de todos contra todos',
    'Três causas de discórdia: competição, desconfiança e glória',
    'Contrato social e renúncia parcial da liberdade',
    'Leviatã e monarca absoluto',
    'Inaugura o jusnaturalismo e o contratualismo modernos'
  ],
  citacao: {
    texto: 'o homem é o lobo do próprio homem',
    fonte: 'Retomada de Plauto.'
  },
  paraODireito:
    'Quem defende que a segurança justifica abrir mão de parte da liberdade está usando a lógica de Hobbes. A pergunta que ele deixa é até onde vai essa renúncia.',
  ressalva:
    'Hobbes vê guerra no estado de natureza; Locke vê liberdade e igualdade (ver a ficha de Locke).',
  referencias: ['HOBBES, Leviatã (1651).'],
  blocoResumo: 'bloco-3'
};

const grotius: FichaPensador = {
  id: 'grotius',
  nome: 'Hugo Grotius',
  datas: '1583-1645',
  faseId: 'limitar-estado',
  obras: ['De iure belli ac pacis (1625)'],
  modoDePensar:
    'O direito natural deixa de depender de Deus e passa a se fundar na razão. A natureza do homem é ser sociável, e o Direito se revela pela razão.',
  conceitos: [
    'Natureza do homem: ser sociável',
    'Direito natural fundado na razão',
    'Valeria mesmo que Deus não existisse',
    'Precursor da secularização do direito natural'
  ],
  paraODireito:
    'Sustentar que uma regra é justa porque se justifica pela razão, e não pela autoridade religiosa, é um movimento que começa com Grotius.',
  ressalva:
    'A afirmação de que o direito natural valeria mesmo sem Deus foi chocante para a época.',
  referencias: ['GROTIUS, De iure belli ac pacis (1625).'],
  blocoResumo: 'bloco-4'
};

const pufendorf: FichaPensador = {
  id: 'pufendorf',
  nome: 'Samuel Pufendorf',
  datas: '1632-1694',
  faseId: 'limitar-estado',
  obras: ['De iure naturae et gentium (1672)'],
  modoDePensar:
    'Distingue Direito e Moral. Enquanto Hobbes funda o Direito no poder e Grotius na natureza das coisas, Pufendorf o funda na razão humana. A finalidade do direito natural é a sociabilidade: viver em comunidade.',
  conceitos: [
    'Distinção entre Direito e Moral, consolidada com Kant',
    'Fundamento do direito: a razão humana',
    'Finalidade do direito natural: a sociabilidade'
  ],
  paraODireito:
    'A distinção entre o que o Direito exige e o que a moral recomenda começa a ser construída aqui e se consolida com Kant.',
  ressalva:
    'A distinção entre Direito e Moral só se consolida com Kant.',
  referencias: ['PUFENDORF, De iure naturae et gentium (1672).'],
  blocoResumo: 'bloco-4'
};

const locke: FichaPensador = {
  id: 'locke',
  nome: 'John Locke',
  datas: '1632-1704',
  faseId: 'limitar-estado',
  obras: ['Dois Tratados sobre o Governo (1690)', 'Carta sobre a Tolerância (1689)'],
  modoDePensar:
    'O estado de natureza é de liberdade e igualdade, e não de guerra. Como nem todos respeitam as leis naturais e ninguém julga bem em causa própria, o governo civil entra como árbitro imparcial. Locke inverte a lógica do direito natural: em vez de legitimar o poder do rei, defende o indivíduo contra o Estado.',
  conceitos: [
    'Estado de natureza: liberdade e igualdade, com direitos à vida, à liberdade e à propriedade',
    'Governo civil como árbitro imparcial',
    'Contra a monarquia absoluta: ninguém julga a própria causa',
    'Tolerância religiosa como dever jurídico, segundo Comparato',
    'Três poderes: executivo, legislativo e federativo',
    'Soberania popular e direito à revolução'
  ],
  paraODireito:
    'Os direitos que o indivíduo tem antes do governo, e o direito de resistir à tirania, vêm de Locke. Essas ideias inspiraram a Declaração de Independência de 1776.',
  ressalva:
    'Para a prova, distinga o estado de natureza de Locke (liberdade) do de Hobbes (guerra).',
  referencias: [MATERIAL_DE_AULA],
  blocoResumo: 'bloco-5'
};

const montesquieu: FichaPensador = {
  id: 'montesquieu',
  nome: 'Montesquieu',
  datas: '1689-1755',
  faseId: 'limitar-estado',
  obras: ['O Espírito das Leis (1748)'],
  modoDePensar:
    'Todo homem que possui poder é levado a abusar dele, e só o poder contém o poder. Os três poderes, executivo, legislativo e judiciário, devem ser separados: reunidos na mesma pessoa, não existe liberdade.',
  conceitos: [
    'Só o poder contém o poder',
    'Três poderes: executivo, legislativo e judiciário',
    'Legislativo entregue a representantes do povo',
    'Base do Estado de Direito: a legalidade',
    'Liberdade política só nos governos moderados, e enquanto não se abusa do poder'
  ],
  citacao: {
    texto: 'só o poder contém o poder',
    fonte: MATERIAL_DE_AULA
  },
  paraODireito:
    'Quando se exige que quem faz a lei não seja também quem julga a sua aplicação, o argumento é de Montesquieu: sem separação, o julgador vira legislador ou opressor.',
  referencias: ['MONTESQUIEU, O Espírito das Leis (1748).'],
  blocoResumo: 'bloco-7'
};

const rousseau: FichaPensador = {
  id: 'rousseau',
  nome: 'Jean-Jacques Rousseau',
  datas: '1712-1778',
  faseId: 'limitar-estado',
  obras: ['Do Contrato Social (1762)'],
  modoDePensar:
    'O homem nasce livre e, por toda parte, encontra-se sob ferros. A ordem social é fruto de uma convenção, não da natureza: cada um se entrega por completo à comunidade, em condição igual para todos.',
  conceitos: [
    'Vontade geral',
    'Soberania que não pode ser representada nem alienada',
    'Corpo social como titular do poder',
    'Poder Constituinte: inalienável, indivisível e imprescritível'
  ],
  citacao: {
    texto: 'o homem nasce livre e, por toda parte, encontra-se sob ferros',
    fonte: 'Abertura do Contrato Social.'
  },
  paraODireito:
    'Quando se diz que o povo é o titular do poder constituinte, a raiz teórica é Rousseau.',
  ressalva:
    'Para o autor, o inglês só é livre no dia em que elege o parlamento: é a crítica à representação, aplicada à soberania.',
  referencias: ['ROUSSEAU, Do Contrato Social (1762).'],
  blocoResumo: 'bloco-8'
};

const kant: FichaPensador = {
  id: 'kant',
  nome: 'Immanuel Kant',
  datas: '1724-1804',
  faseId: 'limitar-estado',
  obras: ['Fundamentação da metafísica dos costumes (1785)'],
  modoDePensar:
    'Imperativo é uma fórmula que determina comportamentos e tem no núcleo o verbo dever. O hipotético vale para atingir um fim; o categórico é bom em si mesmo e cumprido incondicionalmente. O Direito é, em regra, hipotético; o campo da moral é o categórico.',
  conceitos: [
    'Imperativos de destreza, hipotético e categórico',
    'Fórmula: age apenas segundo a máxima que você possa querer que se torne lei universal',
    'Liberdade como fundamento do Direito, limitada pela liberdade dos outros',
    'Dignidade: o que está acima de todo preço; a pessoa é fim, nunca meio',
    'Dignidade da pessoa humana, individual e não sacrificável em nome do grupo'
  ],
  paraODireito:
    'Quem cumpre a norma só por medo da multa age no plano hipotético; quem a cumpre por entender que ela é justa age no plano categórico. Já a dignidade da pessoa, por ser individual, não pode ser sacrificada em nome do grupo.',
  ressalva:
    'A dimensão ecológica da dignidade é uma proposta da doutrina atual, uma crítica ao modelo antropocêntrico, e não uma tese atribuída a Kant.',
  referencias: ['KANT, Fundamentação da metafísica dos costumes (1785).'],
  blocoResumo: 'bloco-9'
};

const hegel: FichaPensador = {
  id: 'hegel',
  nome: 'Hegel',
  datas: '1770-1831',
  faseId: 'limitar-estado',
  obras: ['Filosofia do Direito (1820)'],
  modoDePensar:
    'O que é racional é real, e o que é real é racional. A dialética é o próprio modo pelo qual a realidade se desenvolve. Para Hegel, o contrato social é ficção: o Estado é um fato que se impõe, não a soma de indivíduos isolados.',
  conceitos: [
    'Racional e real',
    'Dialética como desenvolvimento da realidade',
    'Crítica ao contrato social como ficção',
    'Primazia do Estado sobre a sociedade civil',
    'Caracterização na leitura adotada: realista'
  ],
  paraODireito:
    'Quem entende o Estado como instituição que se impõe, e não como soma de vontades individuais, está mais perto de Hegel do que de Locke.',
  ressalva:
    'Na leitura adotada aqui, Hegel rompe com a tradição idealista que vinha desde Sócrates e adota uma visão realista: o racional é real e o real é racional. Parte da historiografia, porém, o classifica como idealista (idealismo absoluto).',
  referencias: ['HEGEL, Filosofia do Direito (1820).'],
  blocoResumo: 'bloco-11'
};

const proudhon: FichaPensador = {
  id: 'proudhon',
  nome: 'Proudhon',
  datas: '1809-1865',
  faseId: 'filosofia-social',
  obras: [],
  modoDePensar:
    'Fase mais atenuada da crítica ao capitalismo: censura a grande propriedade, mas admite manter a pequena propriedade privada. Queria que os meios de produção passassem aos artesãos, sem abandonar por completo as estruturas capitalistas.',
  conceitos: [
    'Coletivizar sem romper por completo com o capitalismo',
    'Justiça é social: o homem só é homem pela sociedade',
    'Nega a luta de classes, a revolução proletária, a ditadura do proletariado e a necessidade do Estado'
  ],
  paraODireito:
    'Com Proudhon começa a dimensão social e anti-individualista que depois leva ao constitucionalismo social: a justiça depende de condições sociais, e não só de liberdades formais.',
  ressalva:
    'Proudhon admite a pequena propriedade privada; a crítica dele é atenuada, ao contrário da de Marx.',
  referencias: [MATERIAL_DE_AULA],
  blocoResumo: 'bloco-13'
};

const marx: FichaPensador = {
  id: 'marx',
  nome: 'Karl Marx',
  datas: '1818-1883',
  faseId: 'filosofia-social',
  obras: ['O Capital (1867)'],
  modoDePensar:
    'Estuda as relações sociais a partir das relações produtivas: quem tem os meios de produção subjuga quem só tem o próprio trabalho. O Direito é parte da superestrutura que mantém a infraestrutura capitalista.',
  conceitos: [
    'Meios de produção: burguesia x proletariado',
    'Infraestrutura: indústria, agricultura, comércio e mineração',
    'Superestrutura: Estado, Constituição, religião, cultura, ideologia e Direito',
    'O Direito como instrumento de dominação burguesa e do status quo'
  ],
  paraODireito:
    'Quando se pergunta a quem uma norma serve, e se ela apenas reflete a estrutura econômica, a pergunta é de Marx. O receio de ruptura gerado por essas críticas ajudou a produzir o constitucionalismo social no Ocidente.',
  ressalva:
    'Marx não formulou uma teoria marxista do direito. O Direito aparece na sua obra como superestrutura, que por isso deveria ser abolido.',
  referencias: ['MARX, O Capital (1867).'],
  blocoResumo: 'bloco-14'
};

export const mapaFichamento: MapaFichamento = {
  titulo: 'Filosofia Moderna e Contemporânea',
  eras: [
    {
      id: 'moderna',
      nome: 'Bloco 1: Filosofia Moderna',
      datas: 'de 1453 ao século XVIII',
      fases: [
        { id: 'formar-estado', nome: 'Primeira fase: formar o Estado' },
        { id: 'limitar-estado', nome: 'Segunda fase: limitar o Estado' }
      ]
    },
    {
      id: 'social',
      nome: 'Bloco 2: Filosofia Social',
      datas: 'século XIX',
      fases: [{ id: 'filosofia-social', nome: 'Crítica ao capitalismo' }]
    },
    {
      id: 'contemporanea',
      nome: 'Bloco 3: Teorias contemporâneas da justiça',
      datas: 'séculos XX e XXI',
      fases: [{ id: 'aguardando-material', nome: 'Aguardando material do professor' }]
    }
  ],
  pensadores: [
    maquiavel,
    bodin,
    bossuet,
    hobbes,
    grotius,
    pufendorf,
    locke,
    montesquieu,
    rousseau,
    kant,
    hegel,
    proudhon,
    marx
  ]
};
