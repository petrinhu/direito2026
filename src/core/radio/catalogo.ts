/**
 * Catálogo do tocador de rádio (item 47 da ratificação de 13/11 e decisão de 21/11/2026): só as 5
 * rádios fixas, com o nome e o link da emissora como crédito. Reservas ficam de fora. Cada URL de
 * stream foi medida em 21/11/2026 (/var/tmp/rad-pesquisa/relatorio.md, seção 3). Permissão de uso
 * das emissoras não foi comprovada: ver o relatório do tocador.
 */

export type IdRadio =
  | 'radio-swiss-classic'
  | 'venice-classic'
  | 'ambient-sleeping-pill'
  | 'ambient-fm'
  | 'zero-n-chillout';

export type GeneroRadio = 'classica' | 'ambiente';

export interface Radio {
  readonly id: IdRadio;
  readonly nome: string;
  readonly genero: GeneroRadio;
  /** Formato do stream, como o site da emissora descreve. Só o que foi verificado. */
  readonly formato: string;
  /** Endereço do stream. Entra no `src` do elemento só depois do consentimento e do clique. */
  readonly url: string;
  /** Site oficial da emissora, mostrado como crédito. */
  readonly site: string;
}

export const RADIOS: readonly Radio[] = [
  {
    id: 'radio-swiss-classic',
    nome: 'Radio Swiss Classic',
    genero: 'classica',
    formato: 'MP3, 128 kbps',
    url: 'https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128',
    site: 'https://www.radioswissclassic.ch/'
  },
  {
    id: 'venice-classic',
    nome: 'Venice Classic Radio',
    genero: 'classica',
    formato: 'MP3',
    url: 'https://de2.streamingpulse.com/stream/vcr',
    site: 'https://www.veniceclassicradio.eu/'
  },
  {
    id: 'ambient-sleeping-pill',
    nome: 'Ambient Sleeping Pill',
    genero: 'ambiente',
    formato: 'MP3, alta qualidade (HIGH)',
    url: 'https://radio.stereoscenic.com/asp-h',
    site: 'https://www.ambientsleepingpill.com/'
  },
  {
    id: 'ambient-fm',
    nome: 'ambient.fm',
    genero: 'ambiente',
    formato: 'MP3',
    url: 'https://phoebe.streamerr.co:4140/ambient.mp3',
    site: 'https://www.ambient.fm/'
  },
  {
    id: 'zero-n-chillout',
    nome: '0N-Chillout',
    genero: 'ambiente',
    formato: 'AAC',
    url: 'https://0n-chillout.radionetz.de/0n-chillout.aac',
    site: 'https://www.0nradio.com/'
  }
];

export const RADIO_PADRAO: IdRadio = 'radio-swiss-classic';

export function ehIdRadio(valor: unknown): valor is IdRadio {
  return typeof valor === 'string' && RADIOS.some((radio) => radio.id === valor);
}

/** Id desconhecido (valor vindo do armazenamento ou de fora) cai na rádio padrão, sem lançar erro. */
export function radioPorId(valor: unknown): Radio {
  const achada = RADIOS.find((radio) => radio.id === valor);
  return achada ?? RADIOS.find((radio) => radio.id === RADIO_PADRAO)!;
}
