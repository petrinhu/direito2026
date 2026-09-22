import type { PecaComentada } from '../../../tipos';

/**
 * Petição comentada do caso fictício "Juliana Silva x Renata Rocha"
 * (ação de indenização por danos materiais, dano por infiltração).
 * Extraída do piloto, dividida em seis seções (mesma divisão dos <h3>
 * do original), com o texto da peça em `corpoHtml` e o comentário "como
 * fazer" correspondente em `comentarioHtml`, lado a lado. As citações de
 * artigo estão marcadas para o balão (ver docs/arquitetura.md, seção
 * 12.1). O nome do professor que forneceu o caso foi substituído pela
 * palavra genérica "professor", por instrução do líder.
 */
export const peticao: PecaComentada = {
  titulo: 'Petição comentada: caso Juliana Silva x Renata Rocha',
  notaHtml:
    'Caso e modelo de peça fornecidos pelo professor (dano material por infiltração). Os comentários em fundo azul explicam como redigir cada trecho quando você for escrever a sua própria peça; os placeholders em reticências (dados que o enunciado não forneceu) foram mantidos exatamente como no modelo original, sem preenchimento nem invenção.',
  secoes: [
    {
      id: 'enderecamento',
      titulo: 'Endereçamento',
      corpoHtml: `
      <p>Excelentíssimo(a) Senhor(a) Doutor(a) Juiz(a) de Direito da ... Vara Cível da Comarca do Recife, PE.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>O endereçamento é o "para quem" a peça se dirige: sempre o juízo competente para a causa. O número da vara fica em reticências porque só é conhecido depois da distribuição do processo, que acontece só após o protocolo. Ao escrever sua própria peça, mantenha esse campo em aberto até saber a vara exata, e use sempre o tratamento "Excelentíssimo(a) Senhor(a) Doutor(a) Juiz(a) de Direito", identificando corretamente a comarca.
      `,
    },
    {
      id: 'qualificacao',
      titulo: 'Qualificação',
      corpoHtml: `
      <p>Juliana Silva, nacionalidade ..., estado civil ..., profissão ..., portadora do RG nº ... e inscrita no CPF nº ..., endereço eletrônico: ..., residente e domiciliada na Rua ..., nº ..., Bairro ..., Recife/PE, CEP ..., vem, por meio de seu advogado ..., OAB/PE nº ... (procuração anexa), respeitosamente, à presença de Vossa Excelência, com fundamento nos arts. <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">186</button> e <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">927</button> do Código Civil e art. 5º, incisos <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">X</button> e <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">V</button>, da Constituição Federal, propor a presente</p>
      <p class="acao-nome">AÇÃO DE INDENIZAÇÃO POR DANOS MATERIAIS</p>
      <p>em face de Renata Rocha, nacionalidade ..., estado civil ..., profissão ..., portadora do RG nº ... e inscrita no CPF nº ..., endereço eletrônico: ..., residente e domiciliada na Rua ..., nº ..., Bairro ..., Cidade, Estado, CEP ..., pelos fatos e fundamentos a seguir expostos.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>O <button type="button" class="citacao" data-dispositivo="cpc-319-ii" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, II, do CPC</button> exige qualificação completa: nome, prenome, estado civil, existência de união estável, profissão, CPF/CNPJ, endereço eletrônico, domicílio e residência de autor e réu. Ao redigir sua própria peça, reúna esses dados reais do cliente e, se possível, do réu; quando não tiver algum deles, deixe reticências como faz o modelo, e nunca invente. Nomear corretamente a ação (aqui, "Ação de Indenização por Danos Materiais") e já anunciar o fundamento legal no cabeçalho ajuda o juízo a situar o pedido desde a primeira leitura.
      `,
    },
    {
      id: 'dos-fatos',
      titulo: 'Dos Fatos',
      corpoHtml: `
      <p>A autora constatou infiltração em seu apartamento, proveniente do imóvel da ré, que ocasionou danos a móveis e equipamentos de sua propriedade.</p>
      <p>Verificou-se que o vazamento decorreu da falta de manutenção da tubulação do apartamento superior. A autora buscou solução amigável; entretanto, a ré recusou-se a ressarcir os danos causados.</p>
      <p>Diante disso, não restou alternativa senão a propositura da presente ação.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>"Dos Fatos" deve ser sucinto e cronológico: conta o que aconteceu, sem ainda entrar na discussão jurídica (essa vem em "Do Direito"). Siga a segunda das cinco perguntas de toda petição, "conte os fatos em ordem cronológica": aqui, primeiro a infiltração e os danos, depois a identificação da origem no apartamento superior, e por fim a tentativa amigável frustrada. Evite floreios ou antecipar fundamentação legal nesta seção.
      `,
    },
    {
      id: 'do-direito',
      titulo: 'Do Direito',
      corpoHtml: `
      <p>É a parte mais desenvolvida da peça. A fundamentação encadeia, em quatro passos, o ilícito, o nexo causal, o dever de reparar e o reforço constitucional, sempre amarrada aos três artigos indicados pelo próprio caso (arts. <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">186</button> e <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">927</button> do Código Civil e art. 5º, incisos <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">V</button> e <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">X</button>, da Constituição Federal), sem trazer institutos de fora deles.</p>

      <p style="font-weight:600; margin-bottom:.3rem;">1. O ato ilícito por omissão negligente (<button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186 do Código Civil</button>)</p>
      <p>A conduta da ré configura ato ilícito, nos termos do <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186 do Código Civil</button>, ao violar direito da autora por omissão negligente, consistente na falta de manutenção adequada de sua unidade. A doutrina da responsabilidade civil identifica, nesse tipo de situação, uma conduta (aqui, omissiva: deixar de manter a tubulação em condições adequadas) que, por negligência, dá causa a um resultado danoso a terceiro.</p>

      <p style="font-weight:600; margin-bottom:.3rem;">2. O nexo causal entre a omissão e o dano</p>
      <p>No caso em análise, resta evidente o nexo causal entre a omissão da ré e os prejuízos materiais suportados pela autora: sem a falta de manutenção da tubulação, o vazamento e os consequentes danos ao sofá, ao tapete persa e aos equipamentos eletrônicos não teriam ocorrido. A responsabilidade civil, portanto, é inequívoca, impondo o dever de indenizar integralmente os danos comprovados.</p>

      <p style="font-weight:600; margin-bottom:.3rem;">3. O dever de reparar (<button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927 do Código Civil</button>)</p>
      <p>Configurado o ato ilícito do <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186</button>, exsurge o dever de reparar previsto no <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927 do Código Civil</button>, segundo o qual aquele que, por ato ilícito, causa dano a outrem fica obrigado a repará-lo. Reunidos os pressupostos gerais da responsabilidade civil (conduta, dano, nexo causal e culpa, aqui na modalidade de negligência), impõe-se a necessidade de condenação da ré ao ressarcimento integral dos prejuízos sofridos pela autora.</p>

      <p style="font-weight:600; margin-bottom:.3rem;">4. O reforço constitucional (art. 5º, incisos <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">V</button> e <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">X</button>, da Constituição Federal)</p>
      <p>Ademais, a Constituição Federal, nos termos do art. 5º, incisos <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">X</button> e <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">V</button>, garante o direito à indenização por danos decorrentes de violação a direitos. Ainda que se trate de dano material, a proteção constitucional reforça o dever de reparação: a conduta da ré afronta o dever de boa convivência e de não prejudicar terceiros.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Ao redigir esta subdivisão na sua própria peça, identifique a conduta específica do réu (ação ou omissão), nomeie o tipo legal (aqui, <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186 do CC</button>) e conecte concretamente o dispositivo ao fato narrado. Não basta transcrever o artigo: é preciso "encaixar" o fato nele, explicando por que aquela omissão específica se enquadra como ato ilícito.

      <strong>Como fazer</strong>Para demonstrar o nexo causal na redação, mostre, passo a passo, que sem a conduta do réu o dano não teria acontecido (uma espécie de "teste de causa e efeito" em linguagem simples), sempre remetendo às provas anunciadas no caso (vistoria técnica, orçamentos e comprovantes dos danos).

      <strong>Como fazer</strong>Sempre feche esse elo de forma explícita no texto: primeiro o <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186</button> define o ilícito, depois o <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927</button> impõe a consequência (o dever de reparar). Ao mencionar os pressupostos da responsabilidade civil, faça-o sem exagero, apenas para organizar o raciocínio, sem trazer institutos de fora dos artigos já indicados no caso.

      <strong>Como fazer</strong>Mesmo quando o caso é de dano material (e não moral), citar o art. 5º reforça a tese ao situar o dever de indenizar como garantia constitucional, e não apenas infralegal. Use esse dispositivo como reforço da fundamentação, e não como fundamento central: o núcleo da tese continua sendo os arts. <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">186</button> e <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">927</button> do Código Civil.
      `,
    },
    {
      id: 'dos-pedidos',
      titulo: 'Dos Pedidos',
      corpoHtml: `
      <p>Diante do exposto, requer:</p>
      <p>a) a condenação do réu ao pagamento de indenização por danos materiais em R$ ..., conforme artigos <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">186</button> e <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">927</button> do Código Civil e art. 5º, incisos <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">X</button> e <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">V</button>, da Constituição Federal;</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Este é o momento da quinta e última das cinco perguntas de toda petição: transformar o problema em pedidos concretos. O pedido deve ser certo, determinado ou determinável (mesmo que o valor exato fique em aberto aqui por falta de dado no caso), e deve sempre remeter aos mesmos fundamentos já apresentados em "Do Direito", sem introduzir bases jurídicas novas nesta seção.
      `,
    },
    {
      id: 'valor-causa-encerramento',
      titulo: 'Valor da causa e encerramento',
      corpoHtml: `
      <p>Dá-se à causa o valor de R$ ... (... reais).</p>
      <p>Termos em que pede e espera deferimento.</p>
      <p>Local e data.</p>
      <p class="assinatura">Nome do advogado, OAB nº ...</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>O <button type="button" class="citacao" data-dispositivo="cpc-319-v" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, V, do CPC</button> exige a indicação do valor da causa, aqui mantido em reticências por falta de dado real no caso (não inventar valores). O fecho padrão ("termos em que pede e espera deferimento"), a indicação de local e data, e a assinatura com o número de inscrição na OAB são elementos formais obrigatórios que fecham qualquer petição.
      `,
    },
  ],
};
