import { dataIsoNoFuso } from '@/core/calendario/datas';
import type { DataIso } from '@/core/calendario/tipos';

/** Dia de hoje no calendário do curso (Recife), para um instante dado. */
export function dataDeHoje(agora: Date): DataIso {
  return dataIsoNoFuso(agora);
}
