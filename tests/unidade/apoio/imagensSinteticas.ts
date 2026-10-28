/**
 * Imagens SINTÉTICAS da ferramenta do acervo da Júri. Geradas em código: nenhum
 * binário versionado e nenhum dado real. Os JPEGs não são fotografias: são o
 * esqueleto de segmentos (SOI, JFIF, EXIF, COM, DQT, SOF0, DHT, SOS, EOI) que o
 * exiftool lê sem aviso. Os sentinelas abaixo provam por busca de bytes que o
 * metadado saiu do arquivo cifrado.
 */
import { deflateSync, crc32 } from 'node:zlib';

export const SENTINELA_EXIF_MARCA = 'MARCA-SINTETICA-EXIF';
export const SENTINELA_EXIF_AUTOR = 'AUTOR-SINTETICO-EXIF';
export const SENTINELA_COMENTARIO = 'COMENTARIO-SINTETICO-JPEG';
export const SENTINELA_PNG = 'AUTOR-SINTETICO-PNG';
export const SENTINELA_WEBP = 'MARCA-SINTETICA-WEBP';

/** Todos os sentinelas: nenhum pode sobreviver no arquivo cifrado. */
export const SENTINELAS_METADADO = [
  SENTINELA_EXIF_MARCA,
  SENTINELA_EXIF_AUTOR,
  SENTINELA_COMENTARIO,
  SENTINELA_PNG,
  SENTINELA_WEBP
] as const;

function comoBytes(buffer: Buffer): Uint8Array<ArrayBuffer> {
  return new Uint8Array(buffer);
}

function segmentoJpeg(marcador: number, carga: Buffer): Buffer {
  const cabecalho = Buffer.alloc(4);
  cabecalho[0] = 0xff;
  cabecalho[1] = marcador;
  cabecalho.writeUInt16BE(carga.length + 2, 2);
  return Buffer.concat([cabecalho, carga]);
}

/** TIFF little-endian com Make e Artist (ASCII) no IFD0. */
function tiffExif(marca: string, autor: string): Buffer {
  const campos = [
    { tag: 0x010f, valor: Buffer.from(`${marca}\0`, 'latin1') },
    { tag: 0x013b, valor: Buffer.from(`${autor}\0`, 'latin1') }
  ];
  const cabecalho = Buffer.alloc(8 + 2 + campos.length * 12 + 4);
  cabecalho.write('II', 0, 'latin1');
  cabecalho.writeUInt16LE(42, 2);
  cabecalho.writeUInt32LE(8, 4);
  cabecalho.writeUInt16LE(campos.length, 8);
  let deslocamento = cabecalho.length;
  campos.forEach((campo, i) => {
    const o = 10 + i * 12;
    cabecalho.writeUInt16LE(campo.tag, o);
    cabecalho.writeUInt16LE(2, o + 2);
    cabecalho.writeUInt32LE(campo.valor.length, o + 4);
    cabecalho.writeUInt32LE(deslocamento, o + 8);
    deslocamento += campo.valor.length;
  });
  return Buffer.concat([cabecalho, ...campos.map((campo) => campo.valor)]);
}

/**
 * JPEG baseline de 8x8 com 1 ou 3 componentes e tabelas mínimas: DC com o código '0' e
 * AC com EOB '00', então o escaneamento é 0x1f (cinza) ou 0x00 0x7f (cores). Sem fotografia.
 */
export function jpegSintetico(componentes: 1 | 3 = 1): Uint8Array<ArrayBuffer> {
  const compSof = Buffer.concat(
    Array.from({ length: componentes }, (_, i) => Buffer.from([i + 1, 0x11, 0]))
  );
  const compSos = Buffer.concat(
    Array.from({ length: componentes }, (_, i) => Buffer.from([i + 1, 0x00]))
  );
  const tabelaDc = Buffer.alloc(16);
  tabelaDc[0] = 1;
  const tabelaAc = Buffer.alloc(16);
  tabelaAc[1] = 1;
  const escaneamento = componentes === 1 ? Buffer.from([0x1f]) : Buffer.from([0x00, 0x7f]);
  const partes = [
    Buffer.from([0xff, 0xd8]),
    segmentoJpeg(0xe0, Buffer.from('JFIF\0\x01\x01\x00\x00\x01\x00\x01\x00\x00', 'latin1')),
    segmentoJpeg(
      0xe1,
      Buffer.concat([
        Buffer.from('Exif\0\0', 'latin1'),
        tiffExif(SENTINELA_EXIF_MARCA, SENTINELA_EXIF_AUTOR)
      ])
    ),
    segmentoJpeg(0xfe, Buffer.from(SENTINELA_COMENTARIO, 'latin1')),
    segmentoJpeg(0xdb, Buffer.concat([Buffer.from([0]), Buffer.alloc(64, 1)])),
    segmentoJpeg(0xc0, Buffer.concat([Buffer.from([8, 0, 8, 0, 8, componentes]), compSof])),
    segmentoJpeg(0xc4, Buffer.concat([Buffer.from([0x00]), tabelaDc, Buffer.from([0x00])])),
    segmentoJpeg(0xc4, Buffer.concat([Buffer.from([0x10]), tabelaAc, Buffer.from([0x00])])),
    segmentoJpeg(
      0xda,
      Buffer.concat([Buffer.from([componentes]), compSos, Buffer.from([0, 63, 0])])
    ),
    escaneamento,
    Buffer.from([0xff, 0xd9])
  ];
  return comoBytes(Buffer.concat(partes));
}

function blocoPng(tipo: string, dados: Buffer): Buffer {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const tipoEDados = Buffer.concat([Buffer.from(tipo, 'latin1'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tipoEDados));
  return Buffer.concat([tamanho, tipoEDados, crc]);
}

/** PNG 2x2 RGB com um tEXt carregando o sentinela (metadado de texto do PNG). */
export function pngSintetico(): Uint8Array<ArrayBuffer> {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(2, 0);
  ihdr.writeUInt32BE(2, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  // Cada linha começa com o byte de filtro 0: duas linhas de 2 pixels RGB.
  const pixels = Buffer.from([0, 255, 0, 0, 0, 255, 0, 0, 0, 0, 255, 255, 255, 255]);
  const assinatura = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return comoBytes(
    Buffer.concat([
      assinatura,
      blocoPng('IHDR', ihdr),
      blocoPng('tEXt', Buffer.from(`Author\0${SENTINELA_PNG}`, 'latin1')),
      blocoPng('IDAT', deflateSync(pixels)),
      blocoPng('IEND', Buffer.alloc(0))
    ])
  );
}

/** WebP (RIFF) 1x1 lossless com um chunk EXIF carregando o sentinela. */
export function webpSintetico(): Uint8Array<ArrayBuffer> {
  const chunk = (id: string, dados: Buffer): Buffer => {
    const cabecalho = Buffer.alloc(8);
    cabecalho.write(id, 0, 'latin1');
    cabecalho.writeUInt32LE(dados.length, 4);
    const preenchimento = dados.length % 2 === 1 ? Buffer.alloc(1) : Buffer.alloc(0);
    return Buffer.concat([cabecalho, dados, preenchimento]);
  };
  const vp8l = Buffer.from([0x2f, 0, 0, 0, 0, 0]);
  const corpo = Buffer.concat([
    Buffer.from('WEBP', 'latin1'),
    chunk('VP8L', vp8l),
    chunk('EXIF', tiffExif(SENTINELA_WEBP, SENTINELA_EXIF_AUTOR))
  ]);
  const riff = Buffer.alloc(8);
  riff.write('RIFF', 0, 'latin1');
  riff.writeUInt32LE(corpo.length, 4);
  return comoBytes(Buffer.concat([riff, corpo]));
}
