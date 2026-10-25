import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 1 a 10 do quiz do ECA Digital: objeto, alcance, definições e
 * fundamentos (arts. 1º a 4º). Todas de múltipla escolha com quatro
 * alternativas. As explicações descrevem o conteúdo de cada alternativa, sem
 * indicar posição, porque o motor embaralha as respostas a cada rodada.
 */
export const conceitos: readonly PerguntaQuiz[] = [
  {
    id: 1,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Segundo o art. 1º, a quais produtos e serviços a lei se aplica?`,
    alternativasHtml: [
      `A todo produto ou serviço de tecnologia da informação direcionado a crianças e adolescentes no País, ou de acesso provável por eles, independentemente de sua localização.`,
      `Somente aos jogos eletrônicos, que concentram o uso da internet por crianças.`,
      `Somente às redes sociais, excluídos os demais produtos digitais.`,
      `Somente aos produtos vendidos por lojas físicas instaladas no território nacional.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `Pelo art. 1º, a lei vale para todo produto ou serviço de tecnologia da informação direcionado a crianças e adolescentes no País ou de acesso provável por eles, seja qual for a localização, o desenvolvimento, a fabricação, a oferta, a comercialização ou a operação. Jogos, redes sociais e outros produtos entram nesse alcance. Limitar a lei às lojas físicas contraria o art. 2º, I, que trata de produtos fornecidos a distância, por meio eletrônico.`
  },
  {
    id: 2,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Qual das descrições a seguir corresponde à caixa de recompensa, segundo o art. 2º, IV?`,
    alternativasHtml: [
      `Serviço que transmite conteúdos previamente selecionados por um agente econômico responsável, sem meios automatizados de seleção.`,
      `Funcionalidade de certos jogos eletrônicos que permite comprar, mediante pagamento, itens virtuais consumíveis ou vantagens aleatórias, sem conhecimento prévio do seu conteúdo.`,
      `Mecanismo de bloqueio de anúncios integrado ao sistema operacional do aparelho.`,
      `Ampliação artificial do alcance de um conteúdo mediante pagamento pecuniário.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `Caixa de recompensa é a funcionalidade de certos jogos que vende itens consumíveis ou vantagens aleatórias, sem que o jogador saiba antes o conteúdo (art. 2º, IV). Conteúdos selecionados por um agente econômico responsável descrevem o serviço com controle editorial, definido no art. 2º, IX. O bloqueio de anúncios não consta das definições do art. 2º. A ampliação artificial do alcance mediante pagamento é o impulsionamento, definido no art. 2º, XII.`
  },
  {
    id: 3,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Segundo o art. 2º, V, qual das situações a seguir configura perfilamento?`,
    alternativasHtml: [
      `Um pai que instala, com autorização do filho, um aplicativo que mostra a localização do celular dele.`,
      `Uma loja de aplicativos que exibe, para todos os usuários, os programas mais baixados da semana.`,
      `Uma plataforma que avalia os dados de um usuário para classificá-lo em um grupo de interesse e inferir seus desejos de consumo.`,
      `Um aparelho que apenas armazena fotos, sem analisar seu conteúdo nem o comportamento de quem as acessa.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `Perfilamento é o tratamento de dados que avalia uma pessoa para classificá-la em grupo ou perfil e fazer inferências sobre seu comportamento, preferências e desejos de consumo (art. 2º, V). O aplicativo de localização se enquadra em produto de monitoramento infantil, definido no art. 2º, II. Já a lista de programas da semana, exibida igualmente a todos, deixa de lado qualquer avaliação individual. Guardar fotos, sem analisar nada sobre quem as acessa, também não produz inferência sobre comportamento.`
  },
  {
    id: 4,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Qual dos fundamentos a seguir consta do art. 4º, que trata do uso de produtos digitais por crianças e adolescentes?`,
    alternativasHtml: [
      `A prevalência dos interesses econômicos dos fornecedores sobre os das crianças.`,
      `A exigência de que crianças e adolescentes usem apenas aplicativos educativos.`,
      `A supressão da autonomia, porque a criança ainda não tem discernimento para decidir.`,
      `A proteção integral de crianças e adolescentes, com a prevalência absoluta de seus interesses.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `Os incisos I e II do art. 4º trazem a proteção integral e a prevalência absoluta dos interesses da criança e do adolescente, e o inciso VI manda proteger contra a exploração comercial. Quem põe os interesses econômicos à frente dos interesses infantis contraria esses fundamentos. Já o uso restrito a aplicativos educativos não é imposto em nenhum ponto do artigo. O inciso V impõe respeito à autonomia e ao desenvolvimento progressivo, o que afasta a ideia de suprimir a autonomia da criança.`
  },
  {
    id: 5,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Segundo o parágrafo único do art. 1º, qual das situações caracteriza acesso provável por crianças e adolescentes?`,
    alternativasHtml: [
      `Suficiente probabilidade de uso e atratividade do produto por crianças e adolescentes.`,
      `Cobrança de preço superior à média de mercado para o produto.`,
      `Oferta do produto somente em língua estrangeira.`,
      `Registro do produto em órgão público de qualquer país.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `A suficiente probabilidade de uso e atratividade está no inciso I do parágrafo único do art. 1º. Os incisos II e III cuidam da considerável facilidade de acesso e do significativo grau de risco à privacidade, à segurança e ao desenvolvimento. O preço e a língua da oferta ficam de fora desse parágrafo, e o registro em órgão público de qualquer país não aparece entre os critérios da lei.`
  },
  {
    id: 6,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Qual é o parâmetro que os produtos e serviços destinados a crianças e adolescentes devem ter, segundo o art. 3º?`,
    alternativasHtml: [
      `A preferência comercial do fornecedor, desde que informada ao usuário.`,
      `O melhor interesse da criança e do adolescente.`,
      `O interesse das plataformas de maior porte, que concentram o uso.`,
      `A vontade da criança, sem qualquer participação dos pais no uso do produto.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `Pelo art. 3º, o parâmetro é o melhor interesse da criança e do adolescente, com proteção prioritária. A preferência comercial do fornecedor e o interesse das plataformas de maior porte são estranhos ao texto. Excluir os pais, como faria a ideia de que a vontade da criança basta, vai contra o parágrafo único do mesmo artigo, que assegura o direito de ser acompanhado por eles no uso da internet.`
  },
  {
    id: 7,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Segundo o art. 2º, VIII, o que é um mecanismo de supervisão parental?`,
    alternativasHtml: [
      `Aplicativo instalado pelo próprio adolescente para registrar o que faz no celular.`,
      `Órgão público responsável por aplicar multas aos fornecedores.`,
      `Conjunto de configurações, ferramentas e salvaguardas tecnológicas que permitem aos pais supervisionar, limitar e gerenciar o uso do serviço.`,
      `Contrato firmado entre a família e a escola para o uso de computadores.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `O art. 2º, VIII, descreve o mecanismo de supervisão parental como conjunto de configurações, ferramentas e salvaguardas tecnológicas, integradas aos produtos, que permitem aos pais supervisionar, limitar e gerenciar o uso, o conteúdo acessado e o tratamento de dados. Um aplicativo que o próprio adolescente instala para registrar a própria atividade não se encaixa nela, já que a definição tem os pais como destinatários. Quem aplica a advertência e a multa é a autoridade administrativa (art. 35, § 5º, I e II), definida no art. 2º, X. Um contrato entre família e escola sobre o uso de computadores não figura entre as definições da lei.`
  },
  {
    id: 8,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Segundo o art. 2º, § 2º, o que a lei não considera produto ou serviço de tecnologia da informação?`,
    alternativasHtml: [
      `Jogos eletrônicos conectados à internet.`,
      `Aplicações de internet distribuídas por lojas de aplicações.`,
      `Sistemas operacionais de terminais.`,
      `As funcionalidades essenciais ao funcionamento da internet, como os protocolos e os padrões técnicos abertos que permitem a interconexão das redes.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `Pelo § 2º do art. 2º, ficam fora da definição as funcionalidades essenciais ao funcionamento da internet, como os protocolos e os padrões técnicos abertos que permitem a interconexão das redes de computadores. Jogos eletrônicos conectados, aplicações distribuídas por lojas e sistemas operacionais entram expressamente no inciso I do art. 2º.`
  },
  {
    id: 9,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Qual é o papel da autoridade administrativa autônoma, segundo o art. 2º, X?`,
    alternativasHtml: [
      `Zelar pela aplicação da lei e fiscalizar seu cumprimento em todo o território nacional, editando regulamentos e procedimentos.`,
      `Aprovar, antes do lançamento, todos os jogos eletrônicos destinados ao público infantil.`,
      `Substituir os pais na configuração das ferramentas de supervisão parental.`,
      `Julgar ações de reparação de danos causados às crianças e aos adolescentes.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `O art. 2º, X, define a autoridade como entidade da administração pública criada por lei, que zela pela aplicação da lei, fiscaliza seu cumprimento em todo o território nacional e edita regulamentos. Nenhum trecho da lei prevê aprovação prévia de jogos. A supervisão fica com os pais, e o dever de oferecer as ferramentas é dos fornecedores (art. 17, I). Julgar ações de reparação também escapa às funções dela: as sanções de suspensão e de proibição cabem ao Poder Judiciário (art. 35, § 5º).`
  },
  {
    id: 10,
    categoria: 'eca-conceitos',
    enunciadoHtml: `Segundo o art. 2º, XI, o que é monetização?`,
    alternativasHtml: [
      `Cobrança de taxa para o download de aplicativos nas lojas.`,
      `Remuneração direta ou indireta do usuário pela publicação, exibição ou divulgação de conteúdo, inclusive por visualizações, assinaturas, doações ou patrocínios.`,
      `Compra de seguidores para aumentar o alcance de um perfil.`,
      `Conversão de dados pessoais em moeda digital vendida a anunciantes.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `Pelo art. 2º, XI, monetização é a remuneração direta ou indireta do usuário pelo conteúdo que publica, exibe ou divulga, incluídas as receitas por visualizações, assinaturas, doações, patrocínios e publicidade. A cobrança de taxa no download de aplicativos está fora dessa definição. Comprar seguidores pode caracterizar impulsionamento, que o art. 2º, XII, define como ampliação artificial do alcance de conteúdo mediante pagamento. A transformação de dados pessoais em moeda digital vendida a anunciantes não faz parte do texto.`
  }
];
