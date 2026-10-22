import type { ConteudoUnidade } from '../unidade/tipos';
import { textosDoValor } from './caminhosDeTexto';
import { semTextoFiel } from './semTextoFiel';
import { TRAVESSAO } from './regrasDeTexto';
import type { ErroDeUnidade } from './tipos';

/**
 * Travessão longo ou médio em qualquer texto da unidade (meta, resumo, petição,
 * mapa, fichamento, mnemônicos e quiz). Sem isenção: a regra do líder é
 * universal para o conteúdo público, e a pergunta do professor também é público.
 */
export function validarTravessao(conteudo: ConteudoUnidade): ErroDeUnidade[] {
  return textosDoValor(semTextoFiel(conteudo)).flatMap(({ caminho, texto }) => {
    const achado = TRAVESSAO.exec(texto);
    if (!achado) return [];
    return [
      {
        regra: 'travessao',
        caminho,
        detalhe: `travessão (U+${achado[0].charCodeAt(0).toString(16).toUpperCase()}) no texto`
      }
    ];
  });
}
