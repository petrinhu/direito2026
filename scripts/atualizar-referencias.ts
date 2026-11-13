import { capturarReferencias } from './apoio/referencias/capturar';
import { gravarReferencias, lerReferenciasGravadas } from './apoio/referencias/gravar';
import { resumirMudancas } from './apoio/referencias/resumo';
import { compararAlternativas } from '../tests/caracterizacao/alternativas';

/**
 * Regenera as referências de caracterização (tests/caracterizacao/*.esperado.json)
 * a partir do estado atual do conteúdo, e imprime o que mudou em relação à
 * referência anterior: unidades, cadeiras, rotas e documentos de busca que
 * entraram (+), saíram (-) ou mudaram de forma (~).
 *
 * É o passo de QUEM ACRESCENTOU conteúdo: depois de criar a unidade, confira no
 * resumo que só aparece o que você acrescentou, e commite junto. Caracterização
 * continua reprovando mudança não intencional, porque o teste compara o código
 * com o arquivo gravado, e este comando só grava quando você roda.
 *
 * Piso de varredura (L-36): sem nenhuma unidade publicada, sai com erro em
 * vez de gravar referência vazia.
 */
async function principal(): Promise<void> {
  const anterior = lerReferenciasGravadas();
  const atual = await capturarReferencias();
  if (Object.keys(atual.carregadores.unidades).length === 0) {
    throw new Error('nenhuma unidade publicada encontrada: varredura vazia, nada foi gravado');
  }
  const resumo = resumirMudancas(anterior, atual);
  const alternativas = compararAlternativas(anterior.alternativas ?? {}, atual.alternativas);
  if (alternativas.reprovacoes.length > 0) {
    for (const linha of alternativas.reprovacoes) console.error(`RECUSADO: ${linha}`);
    console.error(
      'atualizar-referencias: alternativa reordenada, removida ou fora do fim (AV3-K4). Nada foi gravado.'
    );
    process.exit(1);
  }
  await gravarReferencias(atual);

  console.log('atualizar-referencias: tests/caracterizacao/ regenerado a partir do estado atual.');
  for (const linha of resumo.linhas) console.log(linha);
  for (const linha of alternativas.aceitas) console.log(`alternativas (aceita): ${linha}`);
  console.log(
    'Confira que o resumo mostra só o que você acrescentou. Depois commite junto com o conteúdo.'
  );
}

await principal();
