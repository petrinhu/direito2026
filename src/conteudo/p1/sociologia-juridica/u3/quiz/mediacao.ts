import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 21 a 30 do quiz de Sociologia Jurídica, Unidade 3: mediação
 * parental, controle parental e as preocupações dos pais. Todas de múltipla
 * escolha com quatro alternativas. As explicações descrevem o conteúdo de cada
 * alternativa, sem indicar posição, porque o motor embaralha as respostas.
 */
export const mediacao: readonly PerguntaQuiz[] = [
  { id: 21, categoria: 'mediacao-parental', enunciadoHtml: `Segundo Santos, o que já pode ser considerado uma ferramenta de controle parental?`, alternativasHtml: [
        `Somente um programa instalado no aparelho, que não se confunde com a própria plataforma.`,
        `Qualquer conversa entre pais e filhos sobre as regras de uso das redes.`,
        `A proibição total de celulares dentro das escolas públicas.`,
        `Um modo kids ou infantil oferecido pela própria plataforma.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Santos afirma que, quando uma plataforma disponibiliza um modo kids ou infantil, isso já é uma ferramenta de controle parental. A autora reconhece que muitas ferramentas são associadas a programas instalados, mas isso não exclui as configurações da própria plataforma. A conversa entre pais e filhos não é tratada como ferramenta no texto. A proibição de celulares nas escolas aparece como lei citada por Santos, e não como ferramenta de controle parental.` },

    { id: 22, categoria: 'mediacao-parental', enunciadoHtml: `Qual destas é citada por Santos como estratégia de mediação dentro das próprias plataformas?`, alternativasHtml: [
        `Conectar o perfil de um adulto responsável ao perfil da criança ou do adolescente.`,
        `Apagar automaticamente o histórico do aparelho a cada vinte e quatro horas.`,
        `Desligar a conexão de internet da casa durante a noite inteira.`,
        `Proibir qualquer foto da criança em redes sociais, mesmo as de familiares.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Santos cita a possibilidade de conectar o perfil de um adulto responsável ao de uma criança ou adolescente, para mediar a experiência. Ela também lembra as configurações de perfil público ou fechado e o bloqueio de comentários com determinados assuntos. Apagar o histórico a cada vinte e quatro horas e desligar a internet à noite não aparecem no texto. Nenhum dos dois textos propõe proibir fotos de crianças: Nóbrega critica a exposição feita pelos próprios pais, e Santos não cita isso como ferramenta da plataforma.` },

    { id: 23, categoria: 'mediacao-parental', enunciadoHtml: `Segundo Santos, por que muitos pais não usam as ferramentas de mediação disponíveis?`, alternativasHtml: [
        `Porque as plataformas proíbem os pais de configurar qualquer recurso.`,
        `Porque as ferramentas só funcionam em computadores de mesa.`,
        `Porque essas estratégias não são amplamente divulgadas, e muitos pais nem sabem que existem.`,
        `Porque os filhos desativam os recursos sem que os pais percebam.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Santos afirma que essas estratégias não são amplamente divulgadas e que muitos pais nem sabem que elas existem. A proibição de configuração pelas plataformas não aparece no texto. Ferramentas restritas a computadores também não são afirmação da autora. A desativação dos recursos pelos filhos é uma hipótese que o texto não apresenta.` },

    { id: 24, categoria: 'mediacao-parental', enunciadoHtml: `Quem foram os participantes da pesquisa de Santos?`, alternativasHtml: [
        `Crianças de zero a oito anos matriculadas em escolas particulares de capitais.`,
        `Pais de crianças de 10 a 15 anos, matriculadas em três escolas públicas estaduais de Petrolina.`,
        `Professores de escolas públicas de todo o estado de Pernambuco.`,
        `Adolescentes de 16 a 18 anos que usam redes sociais com frequência.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A pesquisa ouviu, por meio de questionários aplicados em junho de 2024, pais de crianças de 10 a 15 anos matriculadas em três escolas públicas estaduais de Petrolina. As crianças de zero a oito anos aparecem apenas na pesquisa citada dos Estados Unidos. Os professores e os adolescentes de 16 a 18 anos não são o grupo ouvido por Santos.` },

    { id: 25, categoria: 'mediacao-parental', enunciadoHtml: `Qual foi a preocupação mais citada pelos pais, segundo Santos?`, alternativasHtml: [
        `Contato com estranhos, citado por 75,8% dos pais.`,
        `Acesso a conteúdo inapropriado, citado por 65,2% dos pais.`,
        `Uso excessivo de tempo nas redes, citado por 57,6% dos pais.`,
        `Cyberbullying, citado por 30,3% dos pais.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O contato com estranhos é a principal preocupação, com 75,8% das respostas, e a autora sugere que isso provavelmente envolva o risco de crimes como assédio e pedofilia. O acesso a conteúdo inapropriado ocupa o segundo lugar, com 65,2%. O uso excessivo de tempo vem em terceiro, com 57,6%. O cyberbullying aparece em quinto lugar, com 30,3%.` },

    { id: 26, categoria: 'mediacao-parental', enunciadoHtml: `Na ordem de preocupações dos pais, qual ficou em quarto lugar?`, alternativasHtml: [
        `Cyberbullying, com 30,3%.`,
        `Uso excessivo de tempo nas redes, com 57,6%.`,
        `Proteção da privacidade do filho, com 50%.`,
        `Acesso a conteúdo inapropriado, com 65,2%.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A proteção da privacidade do filho ficou em quarto lugar, com 50%. O cyberbullying ficou em quinto, com 30,3%. O uso excessivo de tempo ficou em terceiro, com 57,6%. O acesso a conteúdo inapropriado ficou em segundo, com 65,2%.` },

    { id: 27, categoria: 'mediacao-parental', enunciadoHtml: `Qual funcionalidade foi apontada como a mais importante por 79,3% dos participantes da pesquisa de Santos?`, alternativasHtml: [
        `Restrição de tempo de uso.`,
        `Notificações sobre atividades suspeitas.`,
        `Conexão exclusiva por rede Wi-Fi.`,
        `Bloqueio de conteúdo.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O bloqueio de conteúdo foi apontado como o mais importante por 79,3% dos participantes. A restrição de tempo de uso ficou em segundo lugar, com 57,7%. As notificações sobre atividades suspeitas ficaram em terceiro. A conexão exclusiva por Wi-Fi não aparece entre as funcionalidades avaliadas no texto.` },

    { id: 28, categoria: 'mediacao-parental', enunciadoHtml: `Em que posição ficaram as notificações sobre atividades suspeitas, entre as funcionalidades avaliadas por Santos?`, alternativasHtml: [
        `Em primeiro lugar, à frente do bloqueio de conteúdo.`,
        `Em terceiro lugar.`,
        `Em segundo lugar, logo depois do bloqueio de conteúdo.`,
        `Não foram citadas entre as funcionalidades mais importantes.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `As notificações sobre atividades suspeitas ficaram em terceiro lugar, depois do bloqueio de conteúdo e da restrição de tempo de uso. Colocá-las em primeiro lugar contraria o resultado. Ficar em segundo lugar também não corresponde ao texto, em que essa posição é ocupada pela restrição de tempo. Dizer que não foram citadas contradiz o artigo, que as lista entre as mais importantes.` },

    { id: 29, categoria: 'mediacao-parental', enunciadoHtml: `Segundo a conclusão de Santos, o que muitas vezes falta aos pais?`, alternativasHtml: [
        `Esclarecimento necessário e as ferramentas certas para proteger os filhos.`,
        `Tempo livre para acompanhar as crianças na escola.`,
        `Interesse em usar as redes sociais para o trabalho.`,
        `Acesso a computadores modernos em casa.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Santos conclui que muitos pais não possuem o esclarecimento necessário nem as ferramentas certas para proteger os filhos. O tempo livre para acompanhar a escola e o interesse em usar redes no trabalho não são apontados no texto. O acesso a computadores modernos também não é o problema que a autora descreve.` },

    { id: 30, categoria: 'mediacao-parental', enunciadoHtml: `Por que Nóbrega considera preocupante a exposição de crianças nas redes?`, alternativasHtml: [
        `Porque as fotos perdem qualidade quando são compartilhadas várias vezes.`,
        `Porque a lei proíbe qualquer foto de criança na internet.`,
        `Porque, depois de postado, o conteúdo dificilmente sai de circulação, e não se controla o impacto nem o uso por terceiros.`,
        `Porque as plataformas apagam as publicações depois de um ano.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Nóbrega lembra que uma informação postada dificilmente sai de circulação, e que não se controla o impacto nem o uso que terceiros farão dela. A perda de qualidade das fotos não é o argumento do texto. A proibição legal de qualquer foto de criança não aparece no artigo. O apagamento automático depois de um ano também não é afirmado pela autora.` }
];
