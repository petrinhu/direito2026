import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 31 a 40 do quiz de Sociologia Jurídica, Unidade 3: vínculo familiar,
 * isolamento, responsabilidade e a lei citada por Santos. Todas de múltipla
 * escolha com quatro alternativas. As explicações descrevem o conteúdo de cada
 * alternativa, sem indicar posição, porque o motor embaralha as respostas.
 */
export const vinculo: readonly PerguntaQuiz[] = [
  { id: 31, categoria: 'vinculo-familiar', enunciadoHtml: `Segundo Nóbrega, quem costuma postar fotos e vídeos das crianças, às vezes ainda bebês, sem avaliar as consequências?`, alternativasHtml: [
        `Os colegas de escola, que compartilham imagens sem avisar a família.`,
        `As empresas de tecnologia, para treinar os seus sistemas.`,
        `Os avós, que não costumam usar redes sociais.`,
        `Os próprios pais e responsáveis.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Nóbrega aponta os próprios pais como os que postam fotos e vídeos dos filhos, às vezes bebês, sem consentimento e sem avaliar as consequências. Os colegas de escola e as empresas de tecnologia não são apontados como autores dessa exposição no texto. Os avós também não aparecem na crítica da autora.` },

    { id: 32, categoria: 'vinculo-familiar', enunciadoHtml: `Quantas crianças e adolescentes Hugo Monteiro Ferreira entrevistou para o livro A geração do quarto, segundo Nóbrega?`, alternativasHtml: [
        `Cerca de trezentos, com idade entre 5 e 10 anos.`,
        `Mais de três mil, com idade entre 11 e 18 anos.`,
        `Cerca de trinta mil, com idade entre 14 e 25 anos.`,
        `Cerca de cem, somente em escolas particulares.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Segundo Nóbrega, Ferreira entrevistou, ao longo de dois anos, mais de três mil meninos e meninas entre 11 e 18 anos. As outras alternativas trazem números e faixas etárias que o texto não apresenta.` },

    { id: 33, categoria: 'vinculo-familiar', enunciadoHtml: `Por quanto tempo, por dia, essas crianças passam isoladas no quarto, segundo Ferreira, citado por Nóbrega?`, alternativasHtml: [
        `Mais de seis horas.`,
        `Menos de uma hora.`,
        `Cerca de duas horas.`,
        `Exatamente doze horas, sem intervalo.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Ferreira aponta que essas crianças passam mais de seis horas por dia isoladas no quarto, quase sem conversar com quem mora na mesma casa. As alternativas de menos de uma hora e de cerca de duas horas subestimam o tempo descrito. Doze horas exatas, sem intervalo, é um número que o texto não traz.` },

    { id: 34, categoria: 'vinculo-familiar', enunciadoHtml: `Qual é a crítica de Ferreira à terceirização do cuidado das crianças?`, alternativasHtml: [
        `Ela garante às crianças mais contato com os pais, desde que bem planejada.`,
        `Ela é recomendada para diminuir o tempo de tela, sem prejuízo ao vínculo.`,
        `Deixar a criança com terceiros em nome da vida profissional pode gerar desvinculações emocionais.`,
        `Ela traz apenas benefícios financeiros, sem efeitos sobre a vida emocional.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Ferreira afirma que terceirizar uma criança é possibilitar a emergência de desvinculações emocionais. A ideia de que a terceirização garante mais contato com os pais contradiz essa crítica. Apresentá-la como recurso para reduzir o tempo de tela também não é a posição do autor. Dizer que ela traz apenas benefícios financeiros ignora o efeito emocional que o autor aponta.` },

    { id: 35, categoria: 'vinculo-familiar', enunciadoHtml: `Segundo Nóbrega, o que a culpa dos pais pode levá-los a fazer, diante da própria ausência?`, alternativasHtml: [
        `Aumentar de imediato os limites de tempo de tela, sem nenhuma conversa com os filhos.`,
        `Afastar-se das decisões da casa e deixar a família sem orientação.`,
        `Denunciar as plataformas às autoridades, por conta própria.`,
        `Compensar a ausência com permissividade, ficando desatentos às orientações e indecisos diante de limites firmes.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Nóbrega explica que a culpa pode levar os pais a compensar a ausência com permissividade. Eles acabam desatentos às orientações e indecisos quando um limite mais firme é necessário. Aumentar os limites de tempo sem conversa vai na direção oposta ao que o texto descreve. A denúncia das plataformas às autoridades não aparece no texto, e o afastamento das decisões da casa não é o efeito descrito pela autora.` },

    { id: 36, categoria: 'vinculo-familiar', enunciadoHtml: `Para Nóbrega, o que as redes sociais fazem em relação ao silenciamento dentro das casas?`, alternativasHtml: [
        `Criam o silenciamento, porque substituem as conversas da família.`,
        `Resolvem o silenciamento, porque permitem conversas em grupo à distância.`,
        `Não têm relação com o que acontece dentro de casa.`,
        `Funcionam como lupas: mostram um silenciamento que já existia.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Nóbrega compara as redes sociais a lupas que mostram o silenciamento que já existia dentro das casas, e não o criam. Dizer que elas criam esse silêncio inverte a tese da autora. Afirmar que resolvem o problema com conversas em grupo contradiz o texto, que fala em escancarar a falta de espaço e de tempo para ficar juntos. Dizer que não têm relação com o que acontece em casa também não corresponde ao que a autora sustenta.` },

    { id: 37, categoria: 'vinculo-familiar', enunciadoHtml: `Segundo Nóbrega, com base em Ferreira, o que é adesão?`, alternativasHtml: [
        `A obediência a todas as regras impostas pelos pais, sem nenhuma exceção.`,
        `A capacidade de ouvir quem fala, mesmo quando se discorda, sem excluir a interlocução.`,
        `A aceitação automática de tudo o que aparece nas redes sociais.`,
        `O hábito de publicar as próprias opiniões em público.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Adesão, segundo Ferreira citado por Nóbrega, é a capacidade de ouvir quem fala, ainda que se discorde, respeitando quem fala sem excluir a interlocução. Ela não é obediência cega às regras dos pais. Também não é a aceitação automática do que circula nas redes, nem o hábito de publicar opiniões, que o texto não associa à adesão.` },

    { id: 38, categoria: 'vinculo-familiar', enunciadoHtml: `Segundo Nóbrega, onde pode estar a maior segurança das crianças no mundo digital?`, alternativasHtml: [
        `Nos limites de idade e de tempo de uso, aplicados com rigor.`,
        `No número de seguidores que os pais têm nas redes.`,
        `Na conexão real e na rede afetiva construída entre pais e filhos.`,
        `Na proibição total de telas até a adolescência.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Nóbrega afirma que talvez a maior segurança esteja na conexão real e na rede afetiva entre pais e filhos. Ela diz que limites de idade e de tempo provavelmente não garantem segurança, o que torna incorreta a ideia de que os limites bastam. O número de seguidores dos pais não é tratado no texto. A proibição total de telas também não é a saída que a autora defende.` },

    { id: 39, categoria: 'vinculo-familiar', enunciadoHtml: `Qual das duas autoras coloca a maior segurança no vínculo afetivo e no diálogo entre pais e filhos?`, alternativasHtml: [
        `Lia Pereira Nóbrega, que aponta a conexão afetiva e o diálogo entre pais e filhos.`,
        `Debora Maria dos Santos, que coloca o foco nas ferramentas de controle e na regulação do Estado.`,
        `As duas, com a mesma ênfase no controle parental por aplicativos.`,
        `Nenhuma das duas, porque ambas tratam a segurança apenas como questão técnica.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Nóbrega é quem coloca a maior segurança na conexão real e na rede afetiva entre pais e filhos, e sustenta que o diálogo possibilita as adesões. Santos foca nas ferramentas de controle e numa normativa mais dura do Estado. Dizer que as duas dão a mesma ênfase ao controle por aplicativos ignora a diferença entre elas. Dizer que nenhuma trata do vínculo contradiz o texto de Nóbrega, que é justamente sobre ele.` },

    { id: 40, categoria: 'vinculo-familiar', enunciadoHtml: `Por que Santos observa que a coleta de dados foi feita antes da Lei nº 15.100/2025?`, alternativasHtml: [
        `Porque a lei proibia o uso de celulares apenas em escolas particulares.`,
        `Porque a pesquisa foi feita dentro das próprias plataformas digitais.`,
        `Porque a lei foi revogada logo depois da coleta.`,
        `Porque, no período da coleta, em junho de 2024, a lei ainda não tinha sido sancionada.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Santos registra que, no período da coleta, em junho de 2024, a Lei nº 15.100/2025 ainda não tinha sido sancionada. A lei proíbe o uso de celulares em escolas em todo o território nacional, e não apenas nas particulares. A pesquisa não foi feita dentro das plataformas, e o texto não diz que a lei foi revogada. De acordo com a referência citada pela autora, a lei é de 13 de janeiro de 2025.` }
];
