import { RADIO_PADRAO, ehIdRadio, type IdRadio } from './catalogo';

/**
 * Memória do tocador (item 42: lembrar rádio e volume; decisão de 21/11: o sim do consentimento
 * também fica lembrado). Função pura: recebe o armazenamento como parâmetro, para que a falha de
 * localStorage (Safari em modo privado, cota cheia, acesso negado) seja testável sem navegador.
 * Nada aqui lança: falha de leitura vira padrão, falha de gravação vira `false`.
 */

export const CHAVE_PREFERENCIAS_RADIO = 'caderno-direito.radio';
export const VOLUME_PADRAO = 60;

export interface PreferenciasRadio {
  readonly radio: IdRadio;
  /** Inteiro de 0 a 100, escala do controle de volume. */
  readonly volume: number;
  /**
   * Emissoras para as quais o aluno já confirmou o aviso de IP (LGPD). Vale por emissora: cada
   * uma é um destinatário diferente do IP, então aceitar uma não aceita as outras.
   */
  readonly consentimentos: readonly IdRadio[];
}

/** O que a função usa do armazenamento. `localStorage` satisfaz esta forma. */
export interface ArmazenamentoLike {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
}

export function sanearVolume(valor: unknown): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return VOLUME_PADRAO;
  if (valor < 0 || valor > 100) return VOLUME_PADRAO;
  return Math.round(valor);
}

function lerConsentimentos(bruto: unknown): readonly IdRadio[] {
  if (!Array.isArray(bruto)) return [];
  const validos = bruto.filter((id): id is IdRadio => ehIdRadio(id));
  return [...new Set(validos)];
}

function padrao(): PreferenciasRadio {
  return { radio: RADIO_PADRAO, volume: VOLUME_PADRAO, consentimentos: [] };
}

export function lerPreferencias(
  armazenamento: ArmazenamentoLike | null | undefined,
  chave: string
): PreferenciasRadio {
  let bruto: string | null;
  try {
    bruto = armazenamento?.getItem(chave) ?? null;
  } catch {
    return padrao();
  }
  if (bruto === null) return padrao();

  let lido: unknown;
  try {
    lido = JSON.parse(bruto);
  } catch {
    return padrao();
  }
  if (typeof lido !== 'object' || lido === null) return padrao();
  const campos = lido as Record<string, unknown>;

  return {
    radio: ehIdRadio(campos.radio) ? campos.radio : RADIO_PADRAO,
    volume: sanearVolume(campos.volume),
    consentimentos: lerConsentimentos(campos.consentimentos)
  };
}

/** Devolve `true` se gravou. Quem chama segue funcionando sem a memória quando devolve `false`. */
export function gravarPreferencias(
  armazenamento: ArmazenamentoLike | null | undefined,
  chave: string,
  preferencias: PreferenciasRadio
): boolean {
  try {
    armazenamento?.setItem(chave, JSON.stringify(preferencias));
    return armazenamento !== null && armazenamento !== undefined;
  } catch {
    return false;
  }
}

/**
 * Sair da conta apaga só o consentimento (decisão do líder, 21/11): rádio e volume ficam. Nunca lança;
 * devolve `true` se gravou.
 */
export function limparConsentimentos(
  armazenamento: ArmazenamentoLike | null | undefined,
  chave: string
): boolean {
  try {
    const atual = lerPreferencias(armazenamento, chave);
    return gravarPreferencias(armazenamento, chave, { ...atual, consentimentos: [] });
  } catch {
    return false;
  }
}
