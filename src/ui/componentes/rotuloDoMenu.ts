import { rotuloSemViuva } from '@/app/curriculo/rotuloSemViuva';

/**
 * O último espaço, quando o que vem depois é um número só: dígitos, com ponto
 * ou vírgula ("27.1"), de qualquer tamanho. Lookahead, então só o espaço que
 * antecede o número final é trocado.
 */
const ESPACO_ANTES_DO_NUMERO_FINAL = /[ \u00a0](?=\d[\d.,]*$)/;

/**
 * Rótulo de nome no menu lateral (QA-MENU-PRJ1). Além da regra de palavra
 * curta de `rotuloSemViuva`, liga o número final ao nome com U+00A0, para que
 * "Jurídica 1" ou "Direito 2026" nunca quebrem entre o nome e o número.
 * Fica na UI do menu para não mudar a quebra de página nenhuma fora dele.
 */
export function rotuloDoMenu(texto: string): string {
  return rotuloSemViuva(texto).replace(ESPACO_ANTES_DO_NUMERO_FINAL, '\u00a0');
}
