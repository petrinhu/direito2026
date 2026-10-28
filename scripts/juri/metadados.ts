import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TipoImagem } from '../../src/core/juri/formatoImagem';
import { ErroFerramenta } from './erro';
import { rodarExiftool } from './exiftool';

/*
 * Remoção de metadados e conferência "zero etiquetas". Fail-closed: toda etiqueta do
 * exiftool que NÃO esteja nesta lista exata reprova o arquivo. A lista foi medida com
 * exiftool 13.50 sobre PNG, JPEG (1 e 3 componentes) e WebP sintéticos, DEPOIS de
 * `-all=`: sobra só a estrutura que o decodificador precisa. A comparação é por nome
 * exato (ex.: File:Comment, o COM do JPEG, vive no grupo File): grupo inteiro seria furo.
 */

const COMUNS = [
  'File:FileType',
  'File:FileTypeExtension',
  'File:MIMEType',
  'Composite:ImageSize',
  'Composite:Megapixels'
] as const;

const ESPECIFICAS: Record<TipoImagem, readonly string[]> = {
  jpeg: [
    'File:ImageWidth',
    'File:ImageHeight',
    'File:EncodingProcess',
    'File:BitsPerSample',
    'File:ColorComponents',
    'File:YCbCrSubSampling'
  ],
  png: [
    'PNG:ImageWidth',
    'PNG:ImageHeight',
    'PNG:BitDepth',
    'PNG:ColorType',
    'PNG:Compression',
    'PNG:Filter',
    'PNG:Interlace'
  ],
  webp: ['RIFF:ImageWidth', 'RIFF:ImageHeight', 'RIFF:AlphaIsUsed']
};

const MIME: Record<TipoImagem, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

const EXTENSAO: Record<TipoImagem, string> = { jpeg: 'jpg', png: 'png', webp: 'webp' };

/** Grupos que descrevem o arquivo no disco, não o conteúdo: não entram na conferência. */
const FORA_DO_ARQUIVO = ['SourceFile', 'System:', 'ExifTool:'] as const;

export type RegistroExiftool = Record<string, unknown>;

export interface EntradaImagem {
  bytes: Uint8Array<ArrayBuffer>;
  tipo: TipoImagem;
}

/** Confere um registro do exiftool contra a allowlist do tipo. Só o NOME da etiqueta vai na mensagem. */
export function verificarSemEtiquetas(registro: RegistroExiftool, tipo: TipoImagem): void {
  if (registro['File:MIMEType'] !== MIME[tipo]) {
    throw new ErroFerramenta(`tipo de arquivo não confere com o tipo declarado (${tipo})`);
  }
  const permitidas = new Set<string>([...COMUNS, ...ESPECIFICAS[tipo]]);
  for (const chave of Object.keys(registro)) {
    if (FORA_DO_ARQUIVO.some((prefixo) => chave === prefixo || chave.startsWith(prefixo))) {
      continue;
    }
    if (!permitidas.has(chave)) {
      throw new ErroFerramenta(`etiqueta fora da lista permitida para ${tipo}: ${chave}`);
    }
  }
}

/** Avisos do exiftool sem o caminho temporário (que não tem nome de pessoa, mas fica fora da saída). */
export function resumirAvisos(stderr: string): string[] {
  const linhas = stderr
    .split('\n')
    .filter((linha) => linha.startsWith('Warning: '))
    .map((linha) =>
      linha
        .slice('Warning: '.length)
        .replace(/ - .*$/, '')
        .trim()
    );
  return [...new Set(linhas)];
}

/**
 * Apaga os metadados das cópias, em UMA chamada ao exiftool. O exiftool precisa reportar
 * exatamente o número de arquivos do lote: qualquer diferença reprova (L-36, contagem por item).
 */
export async function removerMetadados(caminhos: readonly string[]): Promise<string[]> {
  const { stdout, stderr } = await rodarExiftool(['-all=', '-overwrite_original', ...caminhos]);
  const atualizados = /(\d+) image files? updated/.exec(stdout);
  const quantos = Number(atualizados?.[1] ?? 0);
  if (quantos !== caminhos.length) {
    throw new ErroFerramenta(
      `remoção de metadados: ${quantos} de ${caminhos.length} imagens atualizadas`
    );
  }
  return resumirAvisos(stderr);
}

/** Lê os registros do lote (uma chamada) e confere que vieram todos e na mesma ordem. */
export async function lerRegistros(caminhos: readonly string[]): Promise<RegistroExiftool[]> {
  const { stdout } = await rodarExiftool(['-j', '-G1', '-a', '-s', ...caminhos]);
  const lista: unknown = JSON.parse(stdout);
  if (!Array.isArray(lista) || lista.length !== caminhos.length) {
    const lidos = Array.isArray(lista) ? lista.length : 0;
    throw new ErroFerramenta(
      `leitura de metadados: ${lidos} de ${caminhos.length} arquivos (L-36)`
    );
  }
  return lista.map((item: unknown, i) => {
    if (typeof item !== 'object' || item === null) {
      throw new ErroFerramenta('leitura de metadados: registro malformado');
    }
    const registro = item as RegistroExiftool;
    if (registro['SourceFile'] !== caminhos[i]) {
      throw new ErroFerramenta('leitura de metadados fora de ordem');
    }
    return registro;
  });
}

async function verificarCopias(
  caminhos: readonly string[],
  tipos: readonly TipoImagem[]
): Promise<void> {
  const registros = await lerRegistros(caminhos);
  registros.forEach((registro, i) => {
    const tipo = tipos[i];
    if (tipo === undefined) {
      throw new ErroFerramenta('verificação: tipo ausente para uma imagem do lote');
    }
    verificarSemEtiquetas(registro, tipo);
  });
}

/** Copias os bytes para uma pasta temporária 700 em TMPDIR (/var/tmp), roda a ação e apaga só essa pasta. */
async function comCopias<T>(
  entradas: readonly EntradaImagem[],
  acao: (caminhos: string[]) => Promise<T>
): Promise<T> {
  const base = process.env.TMPDIR ?? '/var/tmp';
  const dir = mkdtempSync(join(base, 'juri-acervo-'));
  chmodSync(dir, 0o700);
  try {
    const caminhos = entradas.map((entrada, i) => {
      const caminho = join(dir, `${i}.${EXTENSAO[entrada.tipo]}`);
      writeFileSync(caminho, entrada.bytes, { mode: 0o600 });
      return caminho;
    });
    return await acao(caminhos);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Remove metadados de cada imagem e confere, na cópia que vai ser cifrada, que zero etiquetas sobrou. */
export async function limparEVerificar(
  entradas: readonly EntradaImagem[]
): Promise<{ limpas: Uint8Array<ArrayBuffer>[]; avisos: string[] }> {
  const tipos = entradas.map((entrada) => entrada.tipo);
  return comCopias(entradas, async (caminhos) => {
    const avisos = await removerMetadados(caminhos);
    await verificarCopias(caminhos, tipos);
    const limpas = caminhos.map((caminho) => new Uint8Array(readFileSync(caminho)));
    return { limpas, avisos };
  });
}

/** Só confere (sem remover): usado no conferir, sobre o plaintext já decifrado. */
export async function verificarEntradas(entradas: readonly EntradaImagem[]): Promise<void> {
  const tipos = entradas.map((entrada) => entrada.tipo);
  await comCopias(entradas, (caminhos) => verificarCopias(caminhos, tipos));
}
