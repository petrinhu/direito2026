import type { FichaPensador, MapaFichamento } from '../../../tipos';

/**
 * Fonte única do Mapa mental e do Fichamento de Filosofia Jurídica, 1a
 * unidade. Tudo vem do resumo da própria unidade (resumo.ts) e das fontes
 * que ele cita: nada é acrescentado ao material. Datas seguem as aulas;
 * onde os livros divergem, a ressalva da ficha atribui a cada autor. Citação
 * literal só aparece quando o texto consta do material, com a fonte.
 */

const AULAS_ANTIGA = 'Slides das aulas de Filosofia Jurídica na Idade Antiga.';
const AULAS_MEDIA = 'Slides da aula de Filosofia Jurídica na Idade Média.';
const NASCIMENTO =
  'NASCIMENTO, Filippe Augusto dos Santos. Manual de Humanística, cap. 2.';
const MARCONDES = 'MARCONDES, Danilo; STRUCHINER, Noel. Textos básicos de filosofia do direito.';
const WOLKMER_CAP1 =
  'WOLKMER, Antonio Carlos. Síntese de uma história das idéias jurídicas. Florianópolis, 2005, cap. 1.';
const WOLKMER_CAP2 =
  'WOLKMER, Antonio Carlos. Síntese de uma história das idéias jurídicas. Florianópolis, 2005, cap. 2.';

const sofocles: FichaPensador = {
  id: 'sofocles',
  nome: 'Sófocles e a tragédia ática (Antígona)',
  datas: 'século V a.C.',
  faseId: 'grecia-classica',
  obras: ['Antígona'],
  modoDePensar:
    'Existe uma medida de justiça acima do decreto. A lei do Estado, ligada à força, à razão e ao formalismo, choca-se com as leis divinas não escritas, ligadas ao amor, à piedade e à tradição.',
  conceitos: [
    'Lei do Estado x leis divinas não escritas',
    'Uma das primeiras formulações do debate entre direito natural e direito positivo',
    'Lei particular x lei universal (Aristóteles, na Retórica, recorre a Antígona)',
    'Hybris: o excesso de orgulho de que, segundo uma leitura, ambos os lados seriam vítimas'
  ],
  citacao: {
    texto:
      'Mas Zeus não foi o arauto delas para mim, nem essas leis são as ditadas entre os homens pela Justiça [...] normas divinas, não escritas, inevitáveis; não é de hoje, não é de ontem, é desde os tempos mais remotos que elas vigem.',
    fonte: 'Antígona, v. 511 a 520, na tradução do livro de apoio (MARCONDES; STRUCHINER).'
  },
  paraODireito:
    'Toda vez que alguém alega que uma ordem legal é injusta demais para ser cumprida, reaparece o argumento de Antígona: existe uma medida de justiça acima do decreto.',
  ressalva:
    'O livro de apoio registra que a leitura não é unânime: a maioria dos intérpretes vê Sófocles favorável à lei natural ou divina, mas nem Creonte nem Antígona teriam razão absoluta. Para a prova, vale a leitura das aulas.',
  referencias: [AULAS_ANTIGA, MARCONDES, WOLKMER_CAP1, NASCIMENTO],
  blocoResumo: 'bloco-1'
};

const sofistas: FichaPensador = {
  id: 'sofistas',
  nome: 'Os sofistas',
  datas: 'século V a.C.',
  faseId: 'grecia-classica',
  obras: [],
  modoDePensar:
    'Questionam a diferença entre a ordem natural (physis) e a ordem humana (nomos). Ceticismo quanto a uma justiça em si: cada sujeito julga a partir da sua circunstância, e a justiça do caso concreto ganha peso.',
  conceitos: [
    'Physis x nomos',
    'Protágoras (481-411 a.C.): homo mensura, relativismo e individualismo',
    'Trasímaco (459-400 a.C.): a justiça é a conveniência do mais forte',
    'Outros nomes citados nas aulas: Górgias (485-380), Pródico (465-395), Hípias (443-399)',
    'Precursores primitivos do relativismo e do positivismo jurídicos'
  ],
  citacao: {
    texto: 'o homem é a medida de todas as coisas',
    fonte: 'Protágoras (homo mensura), conforme os slides da aula de fixação da Idade Antiga.'
  },
  paraODireito:
    'Quem diz que "a lei é o que o poder estabelece" está repetindo Trasímaco; quem diz que "cada caso é um caso e cada um julga por si" está mais perto de Protágoras.',
  ressalva:
    'É das confusões mais cobradas em verdadeiro ou falso: a "conveniência do mais forte" é de Trasímaco, e o homo mensura é de Protágoras. Os sofistas não formam uma corrente única.',
  referencias: [AULAS_ANTIGA, NASCIMENTO, WOLKMER_CAP1],
  blocoResumo: 'bloco-2'
};

const socrates: FichaPensador = {
  id: 'socrates',
  nome: 'Sócrates',
  datas: '469-399 a.C.',
  faseId: 'grecia-classica',
  obras: ['Críton (diálogo de Platão, lido no livro de apoio)'],
  modoDePensar:
    'Idealista: busca pela razão uma verdade e uma justiça absolutas. A justiça é cumprir a lei da pólis; as leis expressam os interesses da coletividade, e respeitá-las é condição do bem comum.',
  conceitos: [
    'Maiêutica (a "parteira das ideias") e dialética',
    'A virtude não se ensina, descobre-se',
    'Obediência às leis da pólis, mesmo às más, para não encorajar quem as viola',
    'Recusa da fuga proposta por Críton'
  ],
  paraODireito:
    'Caso clássico de tensão entre consciência e ordem jurídica: obedecer à sentença mesmo a considerando injusta, para preservar a autoridade das leis. A injustiça da condenação não autorizou a fuga.',
  ressalva:
    'Nas aulas, a razão da recusa é que o bom cidadão deve obedecer também às leis más. Wolkmer descreve essa mesma obediência como levada até uma lei "errada ou até criminosa".',
  referencias: [AULAS_ANTIGA, NASCIMENTO, MARCONDES, WOLKMER_CAP1],
  blocoResumo: 'bloco-3'
};

const platao: FichaPensador = {
  id: 'platao',
  nome: 'Platão',
  datas: '427-348 a.C.',
  faseId: 'grecia-classica',
  obras: ['A República (livros I e II)', 'As Leis', 'Protágoras'],
  modoDePensar:
    'A justiça é um arquétipo ideal, harmonia da alma e da cidade. Cada cidadão cumpre rigidamente o seu papel (os sábios pensam e governam, os guerreiros lutam e defendem, os artífices trabalham e produzem), e o desvio dessa ordem gera injustiça.',
  conceitos: [
    'Justiça orgânica e Estado forte, com direitos individuais subordinados ao social',
    'A justiça jamais produz o mal: rejeita "bem aos amigos, mal aos inimigos"',
    'Contesta Trasímaco: a justiça é natural (katà physin), não mera convenção',
    'Em As Leis, a lei escrita é sinal de progresso e noção primitiva de Estado de Direito',
    'Justiça como sabedoria e virtude da alma; injustiça como ignorância e vício (Wolkmer)'
  ],
  paraODireito:
    'Uma pena pensada apenas como vingança contra o infrator esbarra na objeção de Platão: causar mal degrada quem o pratica. A discussão sobre a finalidade da pena começa por aí.',
  ressalva:
    'Nem tudo o que aparece nos diálogos é a posição de Platão: o mito de Giges (República II) é exposição de Glauco, e o mito de Prometeu (Protágoras) representa a posição de Protágoras. Sobre as datas, as aulas dão 427-348 a.C., e os livros de apoio trazem 428-347 e 427-347; o resumo segue as aulas.',
  referencias: [AULAS_ANTIGA, NASCIMENTO, MARCONDES, WOLKMER_CAP1],
  blocoResumo: 'bloco-4'
};

const aristoteles: FichaPensador = {
  id: 'aristoteles',
  nome: 'Aristóteles',
  datas: '384-322 a.C.',
  faseId: 'grecia-classica',
  obras: ['Política', 'Ética a Nicômaco (livro V)', 'Retórica'],
  modoDePensar:
    'O homem é animal político (zóon politikón): a justiça resolve a dependência mútua e a escassez de recursos. A virtude, inclusive a justiça, é o justo meio, sem excesso nem falta, e por buscar equilíbrio a justiça liga-se à igualdade.',
  conceitos: [
    'Justo meio (mesótes)',
    'Justiça universal (cumprir as leis) e particular (comutativa e distributiva)',
    'Comutativa: relações privadas, igualdade aritmética',
    'Distributiva: Estado x indivíduo, igualdade proporcional, por mérito ou necessidade',
    'Justo natural e justo legal',
    'Equidade: corretivo da lei geral no caso concreto',
    'Regimes de governo: o critério é a finalidade ética, não o número de governantes'
  ],
  citacao: {
    texto: 'o direito é a razão livre de qualquer paixão',
    fonte: 'Aristóteles, Política III, 1287a, no livro de apoio (MARCONDES; STRUCHINER).'
  },
  paraODireito:
    'Um concurso que reserva vagas por necessidade aplica a lógica distributiva; um contrato em que cada parte devolve o equivalente ao que recebeu aplica a comutativa; o juiz que abranda a regra geral por causa de um caso peculiar aplica a equidade.',
  referencias: [AULAS_ANTIGA, NASCIMENTO, MARCONDES],
  blocoResumo: 'bloco-5'
};

const epicuro: FichaPensador = {
  id: 'epicuro',
  nome: 'Epicuro',
  faseId: 'helenismo-roma',
  obras: [],
  modoDePensar:
    'Contratualismo primitivo: a justiça não existe em si, nasce de pactos de não causar nem sofrer dano.',
  conceitos: ['Justiça como pacto', 'Contratualismo primitivo'],
  paraODireito:
    'A ideia de que o justo nasce de um acordo entre as pessoas, e não de algo que existe em si, aparece aqui em forma primitiva.',
  ressalva:
    'Epicuro (tradição helenística) é lembrado nas aulas ao lado dos sofistas, e por isso o resumo o trata junto deles.',
  referencias: [AULAS_ANTIGA, NASCIMENTO],
  blocoResumo: 'bloco-2'
};

const estoicos: FichaPensador = {
  id: 'estoicos',
  nome: 'Os estoicos',
  faseId: 'helenismo-roma',
  obras: [],
  modoDePensar:
    'Defendem a vida segundo a natureza e uma lei natural universal e suprema, emanada da razão e inspiradora das leis positivas. Segundo Wolkmer, o estoicismo foi fundado por Zenão.',
  conceitos: [
    'Lei natural universal e suprema',
    'A razão como fonte da lei',
    'A ideia passa ao pensamento romano e chega à teologia moral cristã'
  ],
  paraODireito:
    'A ideia de que certos direitos valem para qualquer pessoa, mesmo onde a lei local silencia, é herança estoica e ciceroniana.',
  referencias: [AULAS_ANTIGA, WOLKMER_CAP1],
  blocoResumo: 'bloco-6'
};

const cicero: FichaPensador = {
  id: 'cicero',
  nome: 'Cícero (106-43 a.C.) e os juristas romanos',
  faseId: 'helenismo-roma',
  obras: ['Sobre as Leis (De legibus)', 'Digesto de Justiniano'],
  modoDePensar:
    'O direito se funda na natureza, não nas opiniões dos homens nem só nas leis escritas. A máxima que os slides lhe atribuem, Natura juris ab homines repetenda est natura, diz que a essência do Direito deve ser buscada na essência humana.',
  conceitos: [
    'Primeiro "autêntico" filósofo do Direito; incorporou platonismo, aristotelismo e estoicismo',
    'Ius naturale: fundado na razão universal, vale para todos os povos',
    'Ius civile: fundado na vontade do povo, próprio de um povo determinado',
    'Ius gentium: comum a todos os povos',
    'Digesto: extratos de 39 jurisconsultos (Ulpiano, Paulo, Papiniano e Gaio)',
    'Preceitos: honeste vivere, alterum non laedere, suum cuique tribuere'
  ],
  citacao: {
    texto: 'vontade constante e perpétua de dar a cada um o seu direito',
    fonte:
      'Definição de justiça de Ulpiano, no Digesto, conforme Wolkmer (Síntese de uma história das idéias jurídicas, cap. 2).'
  },
  paraODireito:
    'A ideia de que a lei de cada país vale para os seus cidadãos é o ius civile em sua forma moderna.',
  ressalva:
    'A classificação do ius gentium é discutida: o Manual de Humanística registra que Bobbio o aproxima do direito natural, enquanto Del Vecchio o trata como uma espécie de direito internacional, categoria do direito positivo. O resumo mantém a tripartição das aulas e retém o essencial: as três categorias não se equivalem.',
  referencias: [AULAS_ANTIGA, NASCIMENTO, WOLKMER_CAP1, WOLKMER_CAP2],
  blocoResumo: 'bloco-6'
};

const agostinho: FichaPensador = {
  id: 'agostinho',
  nome: 'Santo Agostinho',
  datas: '354-430',
  faseId: 'patristica',
  obras: ['Confissões', 'A Cidade de Deus'],
  modoDePensar:
    'Organicismo cristão: só na coletividade dos fiéis, a Igreja, está o caminho da salvação. Retoma o dualismo platônico e distingue duas leis, a de Deus, perfeita e acabada, e a dos homens, imperfeita e cheia de vícios. No choque, prevalece a lei de Deus: jusnaturalismo teológico.',
  conceitos: [
    'Jusnaturalismo teológico',
    'Cidade de Deus (perfeita, de lei ideal e imutável) x Cidade dos Homens (imperfeita)',
    'Lei eterna, natural e humana, segundo Wolkmer'
  ],
  paraODireito:
    'Quando se diz que uma lei humana não pode contrariar uma ordem superior, reaparece a estrutura de Agostinho: um plano de valores acima da norma posta, agora com fundamento religioso, e não mais apenas na razão como em Cícero.',
  ressalva:
    'O livro de Marcondes e Struchiner não traz texto de Agostinho; o resumo só registra o que as aulas e Wolkmer dizem dele.',
  referencias: [AULAS_MEDIA, NASCIMENTO, WOLKMER_CAP2],
  blocoResumo: 'bloco-7'
};

const tomas: FichaPensador = {
  id: 'tomas-de-aquino',
  nome: 'Tomás de Aquino',
  datas: '1225-1274',
  faseId: 'escolastica',
  obras: ['Suma Teológica'],
  modoDePensar:
    'Faz a grande síntese entre Aristóteles, "o Filósofo", e o cristianismo: razão e fé, com a filosofia e o intelecto a serviço da fé revelada. Retoma a divisão aristotélica da justiça e a integra à caridade.',
  conceitos: [
    'Lei eterna: a lei de Deus, fundamento de todas as demais',
    'Lei natural: participação da criatura racional na lei eterna, alcançável pela razão',
    'Lei humana: a lei posta, com base na lei natural e voltada à utilidade comum',
    'Lei divina: a que vem das Escrituras (os slides destacam as três primeiras; Wolkmer completa as quatro)',
    'Justiça comutativa e distributiva, integradas à caridade',
    'Hierarquia dos fins: os últimos, da Igreja; os terrenos, do Estado'
  ],
  citacao: {
    texto: 'não será lei, senão a corrupção da lei',
    fonte:
      'Sobre a lei humana que se afasta da lei natural, conforme Wolkmer (Síntese de uma história das idéias jurídicas, cap. 2).'
  },
  paraODireito:
    'Ao discutir se uma norma legal muito injusta ainda obriga, as duas leituras da bibliografia dão respostas diferentes: em uma, a lei que se afasta da natural deixa de ser lei em sentido pleno; na outra, a lei humana deve ser respeitada mesmo quando se mostre contrária ao bem comum.',
  ressalva:
    'Lei humana contra lei natural: para Wolkmer, a que se afasta da natural "não será lei, senão a corrupção da lei"; para o Manual de Humanística, deve prevalecer a humana. No conflito com a lei eterna, prevalece a eterna nas duas leituras. Estado e Igreja: os slides mantêm o Estado subordinado à Igreja quanto aos fins últimos, e o Manual fala em separação, com subordinação só entre a ordem natural e a sobrenatural. Datas: 1225-1274 nas aulas, e 1224 para o nascimento no livro de apoio.',
  referencias: [AULAS_MEDIA, NASCIMENTO, MARCONDES, WOLKMER_CAP2],
  blocoResumo: 'bloco-8'
};

const escoto: FichaPensador = {
  id: 'escoto',
  nome: 'Duns Escoto',
  datas: '1266-1308',
  faseId: 'contraponto',
  obras: [],
  modoDePensar:
    'Contra o organicismo dominante, afirma o primado do individual sobre o geral e da liberdade sobre a ordem: Deus se revela a cada pessoa em sua individualidade.',
  conceitos: ['Primado do individual sobre o geral', 'Primado da liberdade sobre a ordem'],
  paraODireito:
    'Com Ockham, prepara a passagem do organicismo ao indivíduo e à modernidade, segundo a síntese das aulas.',
  referencias: [AULAS_MEDIA, NASCIMENTO],
  blocoResumo: 'bloco-9'
};

const ockham: FichaPensador = {
  id: 'ockham',
  nome: 'Guilherme de Ockham',
  datas: '1285-1327',
  faseId: 'contraponto',
  obras: [],
  modoDePensar:
    'Separa o racional do teológico (a verdade é alcançável pelo conhecimento racional), distingue a potência divina da multiplicidade dos indivíduos e critica o universalismo da lei natural.',
  conceitos: [
    'Separação entre razão e teologia',
    'Crítica ao universalismo da lei natural',
    'Fortalecimento do direito positivo',
    'Direito subjetivo: os direitos que o indivíduo tem por lhe terem sido conferidos'
  ],
  paraODireito:
    'A ideia moderna de que cada pessoa tem direitos próprios, e não apenas lugar numa ordem maior, tem raízes na crítica de Ockham ao universalismo. Ele é lembrado nas aulas como um dos pontos de partida da noção de direito subjetivo.',
  referencias: [AULAS_MEDIA, NASCIMENTO],
  blocoResumo: 'bloco-9'
};

export const mapaFichamento: MapaFichamento = {
  titulo: 'Filosofia Jurídica: Idade Antiga e Idade Média',
  eras: [
    {
      id: 'antiga',
      nome: 'Idade Antiga',
      fases: [
        { id: 'grecia-classica', nome: 'Grécia clássica', datas: 'a partir do século V a.C.' },
        { id: 'helenismo-roma', nome: 'Helenismo e Roma' }
      ]
    },
    {
      id: 'media',
      nome: 'Idade Média',
      datas: 'séculos IV a XIV',
      fases: [
        { id: 'patristica', nome: 'Patrística' },
        { id: 'escolastica', nome: 'Escolástica' },
        { id: 'contraponto', nome: 'Contraponto ao organicismo' }
      ]
    }
  ],
  pensadores: [
    sofocles,
    sofistas,
    socrates,
    platao,
    aristoteles,
    epicuro,
    estoicos,
    cicero,
    agostinho,
    tomas,
    escoto,
    ockham
  ]
};
