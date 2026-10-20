import { descricaoDoTipo, provaComoEvento } from './provaComoEvento';
import { rotuloCategoria } from './rotulos';
import type { Evento, Prova } from './tipos';

/**
 * A grade mensal mostra um chip por tipo de prova e dia, para não encher a
 * célula: as provas do mesmo tipo no mesmo dia viram um evento só, com a
 * contagem. O painel de descrições continua listando cada prova.
 */
export function agruparProvasParaGrade(provas: readonly Prova[]): Evento[] {
  const grupos = new Map<string, Prova[]>();
  for (const prova of provas) {
    const chave = `${prova.data}|${prova.tipo}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), prova]);
  }

  return [...grupos.values()].map((grupo) => {
    const primeira = grupo[0]!;
    if (grupo.length === 1) return provaComoEvento(primeira);
    const nomes = grupo.map((p) => p.cadeiraNome);
    return {
      inicio: primeira.data,
      fim: primeira.data,
      categoria: primeira.tipo,
      titulo: `${rotuloCategoria(primeira.tipo)}: ${grupo.length} cadeiras`,
      descricao: `${descricaoDoTipo(primeira.tipo)} de ${juntarNomes(nomes)}.`
    };
  });
}

function juntarNomes(nomes: readonly string[]): string {
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}
