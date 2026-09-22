import { CAMPOS_OBRIGATORIOS_DISPOSITIVO, type DispositivoLegal } from './tipos';

/** Devolve a lista de campos obrigatórios que estão vazios ou ausentes. */
export function validarDispositivo(dispositivo: Partial<DispositivoLegal>): string[] {
  return CAMPOS_OBRIGATORIOS_DISPOSITIVO.filter((campo) => {
    const valor = dispositivo[campo];
    return valor === undefined || valor === null || valor === '';
  });
}
