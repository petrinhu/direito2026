import { rotuloTipoProva } from './rotulos';
import type { Prova, TipoProva } from './tipos';

/** A partir de quantas cadeiras a frase conta em vez de listar os nomes. */
const LIMITE_DE_NOMES = 2;

/** Ordem de aparição dos tipos na frase (o primeiro tipo que aparece no dia). */
function tiposNaOrdem(provas: readonly Prova[]): TipoProva[] {
  const vistos: TipoProva[] = [];
  for (const p of provas) if (!vistos.includes(p.tipo)) vistos.push(p.tipo);
  return vistos;
}

function nomesDaCadeiras(provas: readonly Prova[]): string {
  const nomes = [...new Set(provas.map((p) => p.cadeiraNome))];
  if (nomes.length > LIMITE_DE_NOMES) return `${nomes.length} cadeiras`;
  if (nomes.length === 1) return nomes[0]!;
  return `${nomes[0]} e ${nomes[1]}`;
}

/**
 * Descrição das provas de um mesmo dia, em frase: "a 2ª AV de Introdução ao
 * Direito e Sociologia Jurídica". Tipos diferentes no mesmo dia são unidos
 * com "e" (cada um com o seu artigo).
 */
export function descricaoDasProvas(provas: readonly Prova[]): string {
  return tiposNaOrdem(provas)
    .map((tipo) => {
      const doTipo = provas.filter((p) => p.tipo === tipo);
      return `a ${rotuloTipoProva(tipo)} de ${nomesDaCadeiras(doTipo)}`;
    })
    .join(' e ');
}
