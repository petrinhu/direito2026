import { normalizarTermo } from '../busca/normalizar';
import type { EraHistorica, FaseHistorica, FichaPensador, MapaFichamento } from './tipos';

export interface FiltroFichas {
  readonly eraId?: string;
  readonly faseId?: string;
  readonly termo?: string;
}

export interface GrupoFichas {
  readonly era: EraHistorica;
  readonly fase: FaseHistorica;
  readonly fichas: readonly FichaPensador[];
}

function textoPesquisavel(ficha: FichaPensador): string {
  return normalizarTermo(
    [
      ficha.nome,
      ficha.datas ?? '',
      ...ficha.obras,
      ficha.modoDePensar,
      ...ficha.conceitos,
      ficha.citacao?.texto ?? '',
      ficha.paraODireito,
      ficha.ressalva ?? ''
    ].join(' ')
  );
}

function fasesDaEra(dados: MapaFichamento, eraId: string): Set<string> {
  const era = dados.eras.find((e) => e.id === eraId);
  return new Set(era ? era.fases.map((f) => f.id) : []);
}

/** Filtra as fichas por era, fase e termo (sem diferenciar maiúscula nem acento). */
export function filtrarFichas(dados: MapaFichamento, filtro: FiltroFichas): FichaPensador[] {
  const termo = normalizarTermo((filtro.termo ?? '').trim());
  const fasesDaEraPedida = filtro.eraId ? fasesDaEra(dados, filtro.eraId) : undefined;
  return dados.pensadores.filter((ficha) => {
    if (fasesDaEraPedida && !fasesDaEraPedida.has(ficha.faseId)) return false;
    if (filtro.faseId && ficha.faseId !== filtro.faseId) return false;
    return termo === '' || textoPesquisavel(ficha).includes(termo);
  });
}

/** "Idade Antiga, Grécia clássica": a que era e fase a ficha pertence. */
export function rotuloDaFase(dados: MapaFichamento, faseId: string): string {
  for (const era of dados.eras) {
    const fase = era.fases.find((f) => f.id === faseId);
    if (fase) return `${era.nome}, ${fase.nome}`;
  }
  return faseId;
}

/** Agrupa as fichas por era e fase, na ordem do currículo; omite grupos vazios. */
export function ordenarFichas(
  dados: MapaFichamento,
  fichas: readonly FichaPensador[]
): GrupoFichas[] {
  const grupos: GrupoFichas[] = [];
  for (const era of dados.eras) {
    for (const fase of era.fases) {
      const dessaFase = fichas.filter((f) => f.faseId === fase.id);
      if (dessaFase.length > 0) grupos.push({ era, fase, fichas: dessaFase });
    }
  }
  return grupos;
}
