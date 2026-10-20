import {
  montarCurriculo,
  type DescricaoCadeira,
  type DescricaoUnidade
} from '@/core/curriculo/montarCurriculo';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Currículo do site, montado a partir das pastas de src/conteudo/ (D1: cada
 * pasta se descreve). Cada cadeira traz cadeira.ts; cada unidade traz meta.ts;
 * as abas são os arquivos presentes na pasta. Nada disto é escrito à mão aqui.
 *
 * As descrições são pequenas e entram eager (no pacote principal). O conteúdo
 * da unidade continua sob demanda, pelo glob de src/app/carregamento.
 */
const CADEIRAS = import.meta.glob<{ cadeira: DescricaoCadeira }>('./p*/*/cadeira.ts', {
  eager: true
});
const METAS = import.meta.glob<{ meta: DescricaoUnidade }>('./p*/*/*/meta.ts', { eager: true });
const ARQUIVOS_DE_UNIDADE = Object.keys(
  import.meta.glob(['./p*/*/*/*.ts', './p*/*/*/quiz/*.ts'])
);

/** Chaves do glob vêm com './' na frente; a montagem usa caminho relativo a src/conteudo. */
function relativo(chave: string): string {
  return chave.slice('./'.length);
}

export const curriculo: Curriculo = montarCurriculo({
  caminhos: ARQUIVOS_DE_UNIDADE.map(relativo),
  cadeiras: Object.fromEntries(
    Object.entries(CADEIRAS).map(([chave, modulo]) => [relativo(chave), modulo.cadeira])
  ),
  metas: Object.fromEntries(
    Object.entries(METAS).map(([chave, modulo]) => [relativo(chave), modulo.meta])
  )
});
