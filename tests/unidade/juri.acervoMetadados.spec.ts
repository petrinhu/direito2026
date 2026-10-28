import { describe, expect, it } from 'vitest';
import { ErroFerramenta } from '../../scripts/juri/erro';
import { detectarTipo } from '../../scripts/juri/originais';
import {
  limparEVerificar,
  verificarEntradas,
  verificarSemEtiquetas
} from '../../scripts/juri/metadados';
import {
  jpegSintetico,
  pngSintetico,
  SENTINELA_EXIF_MARCA,
  SENTINELAS_METADADO,
  webpSintetico
} from './apoio/imagensSinteticas';

/** Registro de exiftool mínimo e válido para um JPEG: só a estrutura permitida. */
const REGISTRO_JPEG_LIMPO = {
  SourceFile: '/var/tmp/x.jpg',
  'System:FileName': 'x.jpg',
  'File:FileType': 'JPEG',
  'File:FileTypeExtension': 'jpg',
  'File:MIMEType': 'image/jpeg',
  'File:ImageWidth': 8,
  'File:ImageHeight': 8,
  'File:EncodingProcess': 'Baseline DCT, Huffman coding',
  'File:BitsPerSample': 8,
  'File:ColorComponents': 1,
  'Composite:ImageSize': '8x8',
  'Composite:Megapixels': 0.000064
};

describe('detecção de tipo pelo conteúdo, não pela extensão', () => {
  it('reconhece PNG, JPEG e WebP pelos bytes de início', () => {
    expect(detectarTipo(pngSintetico())).toBe('png');
    expect(detectarTipo(jpegSintetico(1))).toBe('jpeg');
    expect(detectarTipo(webpSintetico())).toBe('webp');
  });

  it('PDF, texto e RIFF que não é WebP viram null', () => {
    expect(detectarTipo(new Uint8Array(Buffer.from('%PDF-1.4 sintetico', 'utf8')))).toBeNull();
    expect(detectarTipo(new Uint8Array(Buffer.from('RIFF0000WAVE', 'utf8')))).toBeNull();
  });

  it('arquivo curto demais vira null, sem ler além do fim', () => {
    expect(detectarTipo(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe('allowlist de etiquetas (zero metadado após a remoção)', () => {
  it('aceita registro só com a estrutura permitida', () => {
    expect(() => verificarSemEtiquetas(REGISTRO_JPEG_LIMPO, 'jpeg')).not.toThrow();
  });

  it('reprova etiqueta de comentário e nomeia só a etiqueta, nunca o valor', () => {
    const registro = { ...REGISTRO_JPEG_LIMPO, 'File:Comment': 'COMENTARIO-SENSIVEL-SINTETICO' };
    let erro: unknown;
    try {
      verificarSemEtiquetas(registro, 'jpeg');
    } catch (e) {
      erro = e;
    }
    expect(erro).toBeInstanceOf(ErroFerramenta);
    expect((erro as Error).message).toContain('File:Comment');
    expect((erro as Error).message).not.toContain('COMENTARIO-SENSIVEL-SINTETICO');
  });

  it('reprova etiqueta de outro formato (PNG:Author dentro de JPEG)', () => {
    const registro = { ...REGISTRO_JPEG_LIMPO, 'PNG:Author': 'x' };
    expect(() => verificarSemEtiquetas(registro, 'jpeg')).toThrow(/PNG:Author/);
  });

  it('reprova tipo de arquivo que não confere com o tipo esperado', () => {
    expect(() => verificarSemEtiquetas(REGISTRO_JPEG_LIMPO, 'png')).toThrow(/tipo de arquivo/);
  });

  it('ignora grupos que não estão no arquivo (System, ExifTool, SourceFile)', () => {
    const registro = {
      ...REGISTRO_JPEG_LIMPO,
      'ExifTool:Warning': 'aviso',
      'System:FileSize': '84 bytes'
    };
    expect(() => verificarSemEtiquetas(registro, 'jpeg')).not.toThrow();
  });
});

/** Confere que nenhum sentinela de metadado sobrou nos bytes. */
function semSentinelas(bytes: Uint8Array): boolean {
  const texto = Buffer.from(bytes);
  return SENTINELAS_METADADO.every((s) => !texto.includes(Buffer.from(s)));
}

describe('remoção real com exiftool (fixture não vazia, L-36)', () => {
  it('o JPEG com EXIF, COM e JFIF é reprovado sem remoção e sai limpo com ela', async () => {
    // Pré-condição: a fixture tem o metadado; sem isso a limpeza não prova nada.
    expect(Buffer.from(jpegSintetico(3)).includes(Buffer.from(SENTINELA_EXIF_MARCA))).toBe(true);
    await expect(verificarEntradas([{ bytes: jpegSintetico(3), tipo: 'jpeg' }])).rejects.toThrow(
      /fora da lista permitida/
    );
    const limpo = await limparEVerificar([{ bytes: jpegSintetico(3), tipo: 'jpeg' }]);
    expect(limpo.limpas).toHaveLength(1);
    expect(semSentinelas(limpo.limpas[0] ?? new Uint8Array())).toBe(true);
  }, 60_000);

  it('PNG (tEXt) e WebP (EXIF) com metadado saem limpos na mesma verificação', async () => {
    const entradas = [
      { bytes: pngSintetico(), tipo: 'png' as const },
      { bytes: webpSintetico(), tipo: 'webp' as const }
    ];
    // Pré-condição: cada fixture tem um sentinela próprio.
    expect(entradas.every((e) => !semSentinelas(e.bytes))).toBe(true);
    const limpo = await limparEVerificar(entradas);
    expect(limpo.limpas).toHaveLength(2);
    expect(limpo.limpas.every((bytes) => semSentinelas(bytes))).toBe(true);
  }, 60_000);
});
