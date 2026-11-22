import { TETO_INDICE_BUSCA_BYTES } from './tipos';

export interface ResultadoValidacaoIndice {
  readonly ok: boolean;
  readonly mensagens: readonly string[];
}

/**
 * Piso de varredura obrigatório do gerador de índice de busca (L-36,
 * scripts/gerar-indice-busca.ts): zero documento indexado é varredura
 * quebrada, não conteúdo limpo, e o índice nunca pode passar do teto de
 * tamanho. O teto (RI6, seção 7) é sobre o tamanho COMPRIMIDO: quem chama
 * mede o gzip e passa esse número aqui. Extraída do script para arquivo
 * próprio (Foundation, sem I/O) só para poder ser testada de verdade (item 9
 * da onda, tests/unidade/busca.validarIndice.spec.ts) sem precisar rodar o
 * script inteiro (que lê o currículo real do disco) para exercitar o caminho
 * de falha.
 */
export function validarIndiceGerado(
  quantidadeDocumentos: number,
  tamanhoComprimidoBytes: number
): ResultadoValidacaoIndice {
  const mensagens: string[] = [];

  if (quantidadeDocumentos === 0) {
    mensagens.push('zero documento indexado é varredura quebrada, não conteúdo limpo');
  }

  if (tamanhoComprimidoBytes > TETO_INDICE_BUSCA_BYTES) {
    mensagens.push(
      `índice passou do teto de ${TETO_INDICE_BUSCA_BYTES} bytes comprimidos (seção 7, RI6): considerar fatiar por período`
    );
  }

  return { ok: mensagens.length === 0, mensagens };
}
