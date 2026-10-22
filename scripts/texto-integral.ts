import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import type { TextoIntegral } from '../src/core/textoIntegral/tipos';
import {
  converterMarkdown,
  ErroDeConversao,
  formatarArquivoTextoIntegral
} from './apoio/textoIntegral/converterMarkdown';

/**
 * CLI do `npm run texto-integral -- <arquivo.md> <pN> <cadeira> <unidade> --fonte "..."
 * [--substituir] [--raiz <dir>]`. Converte o markdown do OCR em
 * src/conteudo/<pN>/<cadeira>/<unidade>/textoIntegral.ts, sem alterar caractere.
 */
const USO =
  'uso: npm run texto-integral -- <arquivo.md> <pN> <cadeira> <unidade> --fonte "..." [--substituir] [--raiz <dir>]';
const RAIZ_PADRAO = fileURLToPath(new URL('..', import.meta.url));

function executar(argv: readonly string[]): number {
  const lido = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: {
      fonte: { type: 'string' },
      substituir: { type: 'boolean', default: false },
      raiz: { type: 'string' }
    }
  });
  const [arquivo, periodo, cadeira, unidade, ...sobra] = lido.positionals;
  if (!arquivo || !periodo || !cadeira || !unidade || sobra.length > 0) {
    return erro(USO);
  }
  const fonte = lido.values.fonte?.trim() ?? '';
  if (fonte === '') return erro('--fonte é obrigatório (referência bibliográfica do trecho)');

  const pasta = join(
    resolve(lido.values.raiz ?? RAIZ_PADRAO),
    'src/conteudo',
    periodo,
    cadeira,
    unidade
  );
  if (!existsSync(join(pasta, 'meta.ts'))) {
    return erro(`pasta sem meta.ts: ${pasta}. Crie a unidade antes (npm run nova-unidade).`);
  }

  let texto: TextoIntegral;
  try {
    texto = converterMarkdown(readFileSync(arquivo, 'utf-8'), fonte);
  } catch (falha) {
    if (falha instanceof ErroDeConversao) return erro(falha.message);
    throw falha;
  }

  const destino = join(pasta, 'textoIntegral.ts');
  try {
    writeFileSync(destino, formatarArquivoTextoIntegral(texto), {
      flag: lido.values.substituir ? 'w' : 'wx'
    });
  } catch (falha) {
    if ((falha as { code?: string }).code === 'EEXIST') {
      return erro(`já existe: ${destino}. Use --substituir para regravar.`);
    }
    throw falha;
  }

  const paginas = texto.blocos
    .flatMap((b) => (b.tipo === 'paragrafo' ? b.trechos : []))
    .filter((t) => t.tipo === 'pagina');
  const italicos = texto.blocos
    .flatMap((b) => (b.tipo === 'paragrafo' ? b.trechos : []))
    .filter((t) => t.tipo === 'italico');
  const paragrafos = texto.blocos.filter((b) => b.tipo === 'paragrafo').length;
  console.log(`gravado: ${destino}`);
  console.log(
    `blocos: ${texto.blocos.length} (parágrafos ${paragrafos}, subtítulos ${texto.blocos.length - paragrafos})`
  );
  console.log(`trechos de página: ${paginas.length}`);
  console.log(`trechos em itálico: ${italicos.length}`);
  return 0;
}

function erro(mensagem: string): number {
  console.error(mensagem);
  return 1;
}

process.exitCode = executar(process.argv.slice(2));
