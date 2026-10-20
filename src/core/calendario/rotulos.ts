import type { CategoriaEvento, TipoProva } from './tipos';

/** Forma usada dentro de frases: "a 3ª AV de ...", "a final de ...". */
const ROTULO_TIPO_EM_FRASE: Record<TipoProva, string> = {
  AV1: '1ª AV',
  AV2: '2ª AV',
  AV3: '3ª AV',
  chamada: '2ª chamada',
  final: 'final'
};

/** Forma usada como rótulo de categoria (legenda, título de evento). */
const ROTULO_CATEGORIA: Record<CategoriaEvento, string> = {
  AV1: '1ª AV',
  AV2: '2ª AV',
  AV3: '3ª AV',
  chamada: '2ª chamada',
  final: 'Final',
  feriado: 'Feriado',
  prazo: 'Prazo acadêmico',
  semestre: 'Semestre'
};

export function rotuloTipoProva(tipo: TipoProva): string {
  return ROTULO_TIPO_EM_FRASE[tipo];
}

export function rotuloCategoria(categoria: CategoriaEvento): string {
  return ROTULO_CATEGORIA[categoria];
}
