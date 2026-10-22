/**
 * Id de unidade: `uN` (AV simples) ou `uN-grupo-topico` (tópico de um grupo da
 * AV, ex.: u3-livro-textura-aberta). O número da pasta é o que vale para a
 * ordem e para o rótulo AVN; o rótulo nunca vem do meta.ts (ordem do líder,
 * 22/10/2026).
 */
const ID_DE_UNIDADE = /^u(\d+)(?:-([a-z0-9]+)-([a-z0-9]+(?:-[a-z0-9]+)*))?$/;

export interface IdDeUnidade {
  readonly numero: number;
  /** Só existe no tópico de grupo (uN-grupo-topico). */
  readonly grupo?: string;
  readonly topico?: string;
}

/** Lê o id de uma pasta de unidade. Undefined quando o id não segue o padrão. */
export function lerIdDeUnidade(id: string): IdDeUnidade | undefined {
  const casa = ID_DE_UNIDADE.exec(id);
  if (!casa) return undefined;
  const numero = Number(casa[1]);
  if (casa[2] === undefined || casa[3] === undefined) return { numero };
  return { numero, grupo: casa[2], topico: casa[3] };
}

/** Rótulo curto da AV, derivado do número da pasta (AV1, AV2, AV3...). */
export function rotuloDaAv(numero: number): string {
  return `AV${numero}`;
}
