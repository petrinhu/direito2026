import type { BlocoResumo } from '../unidade/tipos';
import type { ErroDeUnidade } from './tipos';

/**
 * Regras de apresentação de cada bloco do resumo. A fonte aparece logo acima
 * do corpo, então repeti-la dentro do corpo a mostra duas vezes na mesma tela.
 * A página já numera os blocos, então o título não começa com "Bloco N".
 */
export function validarBlocos(resumo: readonly BlocoResumo[]): ErroDeUnidade[] {
  return resumo.flatMap((bloco, i) => {
    const base = `resumo[${i}]`;
    const erros: ErroDeUnidade[] = [];
    const corpoVisivel = textoVisivel(bloco.corpoHtml);
    if (bloco.fonte.trim() !== '' && corpoVisivel.includes(bloco.fonte.trim())) {
      erros.push({
        regra: 'fonte-repetida-no-corpo',
        caminho: `${base}.fonte`,
        detalhe: `a fonte "${bloco.fonte.trim()}" também aparece no corpo do bloco`
      });
    }
    if (/^bloco\s*\d+/i.test(bloco.titulo.trim())) {
      erros.push({
        regra: 'titulo-com-numero-de-bloco',
        caminho: `${base}.titulo`,
        detalhe: `título "${bloco.titulo.trim()}" começa com número de bloco`
      });
    }
    return erros;
  });
}

/** Texto que o leitor vê no corpo: tags removidas e espaços colapsados. */
function textoVisivel(corpoHtml: string): string {
  return corpoHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
