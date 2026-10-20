import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas do Bloco 2 (Filosofia Social) do quiz de Filosofia Jurídica, 3a
 * unidade: Proudhon e Marx. Ids 17 a 20, todas de múltipla escolha com quatro
 * alternativas. As explicações não indicam posição de alternativa, porque o
 * motor embaralha as respostas a cada rodada.
 */
export const social: readonly PerguntaQuiz[] = [
  { id: 17, categoria: 'filosofia-social', enunciadoHtml: `Proudhon é apresentado como a fase mais atenuada da crítica ao capitalismo. Qual é a posição dele sobre a propriedade?`, alternativasHtml: [
        `Abolir toda propriedade privada, inclusive a pequena, para que o Estado administre os bens coletivamente.`,
        `Censurar a grande propriedade, mas admitir a manutenção da pequena propriedade privada.`,
        `Defender a propriedade privada sem limites, como fundamento de qualquer ordem justa.`,
        `Confiar a redistribuição da propriedade à luta de classes e à revolução proletária.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Proudhon censura a grande propriedade, mas admite manter a pequena; por isso sua crítica é a mais atenuada. Ele queria que os meios de produção passassem aos artesãos, sem abandonar por completo as estruturas capitalistas. A resposta que propõe abolir toda propriedade privada, inclusive a pequena, vai além do que Proudhon defende. A que defende a propriedade sem limites é a posição contrária à crítica dele. A que confia a redistribuição à luta de classes e à revolução proletária é a de Marx, que Proudhon nega.` },

    { id: 18, categoria: 'filosofia-social', enunciadoHtml: `No pensamento de Marx, como o Direito se relaciona com a infraestrutura econômica?`, alternativasHtml: [
        `O Direito faz parte da superestrutura e serve para manter a infraestrutura capitalista.`,
        `O Direito é a própria infraestrutura, porque regula diretamente a produção de riquezas.`,
        `O Direito é independente da economia e nasce apenas da vontade livre dos cidadãos.`,
        `O Direito é o fundamento da propriedade, e a infraestrutura deriva das leis que o Estado edita.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Para Marx, o Direito é elemento da superestrutura, o que se levanta sobre a infraestrutura, e serve para manter a infraestrutura capitalista. A resposta que coloca o Direito como a própria infraestrutura inverte a relação, porque a infraestrutura é o que gera riqueza: indústria, agricultura, comércio e mineração. A que faz o Direito independente da economia nega justamente a dependência que Marx estuda. A que faz a infraestrutura derivar das leis inverte a ordem da determinação: são os meios de produção que condicionam o Direito.` },

    { id: 19, categoria: 'filosofia-social', enunciadoHtml: `Qual afirmação sobre a posição de Marx quanto ao Direito está correta?`, alternativasHtml: [
        `Marx formulou uma teoria marxista do direito, na qual a lei é a expressão da justiça universal.`,
        `Marx defende que o Direito seja fortalecido como instrumento de justiça social pelos tribunais.`,
        `Marx vê o Direito como instrumento de dominação burguesa e, por isso, defende que ele seja abolido.`,
        `Marx vê no Direito a principal garantia da liberdade do proletariado diante do capital.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para Marx, o Direito é instrumento de dominação burguesa e do status quo, e por isso deveria ser abolido. Ele não formulou uma teoria marxista do direito. A afirmação de uma teoria marxista da lei como expressão da justiça universal é o contrário da posição de Marx. A de que Marx quer fortalecer o Direito como instrumento de justiça social confunde Marx com a dimensão social de Proudhon e com o constitucionalismo que vem depois. A de que o Direito protege o proletariado contra o capital inverte a função que Marx atribui ao Direito.` },

    { id: 20, categoria: 'filosofia-social', enunciadoHtml: `Qual é a diferença central entre Proudhon e Marx quanto à ruptura com o capitalismo?`, alternativasHtml: [
        `Proudhon defende a revolução proletária, e Marx defende a manutenção da pequena propriedade privada.`,
        `Ambos defendem a manutenção do Estado como forma de proteção da pequena propriedade.`,
        `Proudhon defende a luta de classes como motor da história, e Marx, a coletivização dos artesãos sem romper com o capitalismo.`,
        `Proudhon coletiviza os meios de produção sem romper por completo com o capitalismo; Marx pensa a luta de classes e defende que o Direito deveria ser abolido.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Proudhon propõe coletivizar os meios de produção sem abandonar por completo as estruturas capitalistas. Marx pensa a luta de classes e a revolução proletária, e defende que o Direito deveria ser abolido. A resposta que atribui a Proudhon a revolução proletária, e a Marx a manutenção da pequena propriedade, inverte as duas posições: quem nega a revolução proletária é Proudhon. A que diz que os dois defendem o Estado como proteção da pequena propriedade não corresponde a Proudhon, que nega a necessidade do Estado. A que troca de novo os papéis, com Proudhon na luta de classes e Marx na coletivização, também inverte as posições.` }
];
