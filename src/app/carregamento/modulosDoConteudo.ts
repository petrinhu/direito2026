import { ErroDeConteudo } from '@/core/curriculo/erroDeConteudo';

/**
 * Arquivos de conteúdo de cada unidade, achados pelo Vite. O padrão é literal
 * de propósito: o Vite só enxerga import.meta.glob com texto fixo. Os
 * sub-arquivos de quiz/ entram para que a descoberta veja uma pasta quiz/ e
 * reprove o que estiver errado (quiz.ts e quiz/ juntos, ou quiz/ sem index).
 * dispositivos.ts entra pelo mesmo padrão e é gerado antes do build.
 */
const MODULOS_DO_CONTEUDO = import.meta.glob([
  '../../conteudo/p*/*/*/*.ts',
  '../../conteudo/p*/*/*/quiz/*.ts'
]);

const PREFIXO = '../../conteudo/';

/** Caminhos relativos a src/conteudo, no mesmo formato que o disco devolve. */
export const CAMINHOS_DO_CONTEUDO: readonly string[] = Object.keys(MODULOS_DO_CONTEUDO).map(
  (chave) => chave.slice(PREFIXO.length)
);

export function importarDoConteudo(caminho: string): Promise<unknown> {
  const carregar = MODULOS_DO_CONTEUDO[PREFIXO + caminho];
  if (!carregar) {
    throw new ErroDeConteudo(`arquivo de conteúdo fora do glob: ${caminho}`);
  }
  return carregar();
}
