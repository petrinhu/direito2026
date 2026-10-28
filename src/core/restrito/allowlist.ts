import type { CodigoErroRestrito } from './tipos';

/**
 * Allowlist de HTML da área restrita, compartilhada pelas áreas que renderizam
 * conteúdo com marcação (Caderno restrito e Júri). Duas cópias que divergem são
 * regressão de segurança: por isso mora num módulo só, sem DOM (roda no Node).
 */
const TAG_PERMITIDA =
  /<\/?(?:p|strong|em|ul|ol|li|blockquote|table|thead|tbody|tr|th|td|h3|h4)>|<br ?\/?>/g;
const ENTIDADE_PERMITIDA = /&(?:amp|lt|gt|quot|#39|nbsp);/g;

/**
 * Allowlist por remoção: tira cada tag permitida (minúscula, sem nenhum
 * atributo) e exige que o resto não tenha `<` nem `>`. Comentário, CDATA,
 * maiúscula, atributo e tag pela metade sobram como `<` e reprovam.
 */
export function htmlRejeitado(texto: string): CodigoErroRestrito | undefined {
  const semTags = texto.replace(TAG_PERMITIDA, '');
  if (semTags.includes('<') || semTags.includes('>')) return 'html-proibido';
  if (semTags.replace(ENTIDADE_PERMITIDA, '').includes('&')) return 'entidade-proibida';
  return undefined;
}
