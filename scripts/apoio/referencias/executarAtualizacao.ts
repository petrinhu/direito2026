import { compararAlternativas } from '../../../tests/caracterizacao/alternativas';
import type { Referencias } from './capturar';

/** Porta de saída do atualizar-referencias: gravar o arquivo e emitir linhas (AV3-K4). */
export interface PortaAtualizacao {
  gravar(atual: Referencias): Promise<void>;
  emitir(linha: string): void;
  emitirErro(linha: string): void;
}

/**
 * Decide e executa a atualização. Reordenação, remoção, alternativa fora do fim ou gabarito
 * trocado reprovam: nada é gravado e o código de saída é 1. O resto grava. Edição de texto no
 * lugar grava e aparece como AVISO, para quem publica conferir.
 */
export async function executarAtualizacao(
  anterior: Partial<Referencias>,
  atual: Referencias,
  porta: PortaAtualizacao
): Promise<0 | 1> {
  const alternativas = compararAlternativas(anterior.alternativas ?? {}, atual.alternativas);
  if (alternativas.reprovacoes.length > 0) {
    for (const linha of alternativas.reprovacoes) porta.emitirErro(`RECUSADO: ${linha}`);
    porta.emitirErro(
      'atualizar-referencias: alternativa reordenada, removida ou fora do fim (AV3-K4). Nada foi gravado.'
    );
    return 1;
  }
  await porta.gravar(atual);
  porta.emitir('atualizar-referencias: tests/caracterizacao/ regenerado a partir do estado atual.');
  for (const linha of alternativas.avisos)
    porta.emitir(`AVISO (conferir antes de publicar): ${linha}`);
  for (const linha of alternativas.aceitas) porta.emitir(`alternativas (aceita): ${linha}`);
  return 0;
}
