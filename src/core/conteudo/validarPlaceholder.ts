import type { ConteudoUnidade } from '../unidade/tipos';
import { textosDoValor } from './caminhosDeTexto';
import { TEXTO_PENDENTE_CURTO, TEXTO_PENDENTE_META } from './regrasDeTexto';
import type { ErroDeUnidade } from './tipos';

const PENDENTES: ReadonlySet<string> = new Set([TEXTO_PENDENTE_META, TEXTO_PENDENTE_CURTO]);

/**
 * Texto de espera do gerador só pode existir em unidade em-breve. Numa unidade
 * publicada, qualquer campo cujo texto inteiro (sem tags) seja um dos textos de
 * espera reprova. Em em-breve a regra não vale, e o texto é só marcação de
 * trabalho pendente.
 */
export function validarPlaceholder(conteudo: ConteudoUnidade): ErroDeUnidade[] {
  if (conteudo.meta.estado !== 'publicado') return [];
  return textosDoValor(conteudo).flatMap(({ caminho, texto }) => {
    const semTags = texto.replace(/<[^>]+>/g, '').trim();
    if (!PENDENTES.has(semTags)) return [];
    return [{ regra: 'placeholder', caminho, detalhe: `texto de espera do gerador: "${semTags}"` }];
  });
}
