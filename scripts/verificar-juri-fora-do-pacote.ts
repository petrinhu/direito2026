/**
 * Portão de build da Júri (L-36, L-28): nenhum arquivo privado da Júri pode
 * estar em dist/. Reprova por qualquer um destes critérios, cada um sozinho:
 *   - extensão `.juri` (imagem cifrada do acervo);
 *   - nome proibido: acervo.json, credencial-admin.json, ids.tsv,
 *     conferencia.tsv, juri.json (saída e dados da ferramenta local);
 *   - magic "JURI" nos 4 primeiros bytes, qualquer que seja o nome.
 *
 * Lê só os 4 primeiros bytes de cada arquivo. Imprime SEMPRE
 * `encontrados=N analisados=N falharam=N`. Falha fechada: dist ausente, zero
 * arquivo, arquivo ilegível, ou analisados diferente de encontrados saem 1.
 *
 * Variável (opcional): DIST_PATH, pasta do pacote (padrão dist/ da raiz).
 */
import { closeSync, existsSync, openSync, readSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(process.env.DIST_PATH ?? join(AQUI, '../dist'));
const NOMES_PROIBIDOS = new Set([
  'acervo.json',
  'credencial-admin.json',
  'ids.tsv',
  'conferencia.tsv',
  'juri.json'
]);
const EXTENSAO_PROIBIDA = '.juri';
const MAGIC = Buffer.from('JURI', 'ascii');

function arquivosDe(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    return entrada.isDirectory() ? arquivosDe(caminho) : [caminho];
  });
}

function comecaComMagic(caminho: string): boolean {
  const fd = openSync(caminho, 'r');
  try {
    const cabecalho = Buffer.alloc(MAGIC.length);
    const lidos = readSync(fd, cabecalho, 0, MAGIC.length, 0);
    return lidos === MAGIC.length && cabecalho.equals(MAGIC);
  } finally {
    closeSync(fd);
  }
}

/** Motivos pelos quais o arquivo não pode estar no pacote (vazio = limpo). */
function motivosDe(caminho: string): string[] {
  const nome = basename(caminho);
  const motivos: string[] = [];
  if (nome.endsWith(EXTENSAO_PROIBIDA)) motivos.push('extensão .juri');
  if (NOMES_PROIBIDOS.has(nome)) motivos.push('nome proibido');
  if (comecaComMagic(caminho)) motivos.push('magic JURI no início');
  return motivos;
}

function principal(): number {
  if (!existsSync(DIST)) {
    console.error('verificar-juri-fora-do-pacote: pasta ausente (rode o build antes)');
    console.log('encontrados=0 analisados=0 falharam=0');
    return 1;
  }
  const arquivos = arquivosDe(DIST);
  let analisados = 0;
  let falharam = 0;
  for (const caminho of arquivos) {
    try {
      const motivos = motivosDe(caminho);
      analisados += 1;
      if (motivos.length > 0) {
        falharam += 1;
        console.error(
          `verificar-juri-fora-do-pacote: ${relative(DIST, caminho)} (${motivos.join(', ')})`
        );
      }
    } catch {
      falharam += 1;
      console.error(`verificar-juri-fora-do-pacote: ${relative(DIST, caminho)} ilegível`);
    }
  }
  console.log(
    `juri fora do pacote: encontrados=${arquivos.length} analisados=${analisados} falharam=${falharam}`
  );
  if (arquivos.length === 0) {
    console.error('verificar-juri-fora-do-pacote: zero arquivo em dist é varredura quebrada');
    return 1;
  }
  if (analisados !== arquivos.length) {
    console.error('verificar-juri-fora-do-pacote: varredura incompleta');
    return 1;
  }
  return falharam > 0 ? 1 : 0;
}

process.exitCode = principal();
