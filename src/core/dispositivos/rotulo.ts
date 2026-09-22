import type { DispositivoLegal } from './tipos';

/** Monta o rótulo curto exibido no botão e no cabeçalho do balão. */
export function montarRotuloDispositivo(dispositivo: DispositivoLegal): string {
  if (dispositivo.inciso) {
    return `art. ${dispositivo.artigo}, ${dispositivo.inciso}, do ${dispositivo.diplomaSigla}`;
  }
  return `art. ${dispositivo.artigo} do ${dispositivo.diplomaSigla}`;
}
