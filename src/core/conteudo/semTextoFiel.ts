import type { ConteudoUnidade } from '../unidade/tipos';

/**
 * Corpo do texto integral (OCR) fora das regras de redação e de travessão.
 * Exceção registrada no GODS_LAWS.md (transcrição fiel de obra de terceiro, ordem
 * do líder de 21/10/2026): a cópia mantém os sinais do original, inclusive
 * travessão e "o material". Título e fonte NÃO entram nessa exceção: continuam
 * sob todas as regras, por isso só `blocos` é esvaziado.
 */
export function semTextoFiel(conteudo: ConteudoUnidade): ConteudoUnidade {
  if (!conteudo.textoIntegral) return conteudo;
  return { ...conteudo, textoIntegral: { ...conteudo.textoIntegral, blocos: [] } };
}
