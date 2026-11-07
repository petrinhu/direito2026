/**
 * Portão da Júri fora do pacote (E13 e 5.5 do plano do CTO, LU-F4.5).
 *
 * A imagem da Júri agora vai em claro, então a magia "JURI" saiu e a prova passa
 * por NOME. Reprova, em cada alvo, qualquer caminho com:
 *   - extensão .juri;
 *   - nome proibido: acervo.json, credencial-admin.json, ids.tsv, conferencia.tsv, juri.json;
 *   - pasta originais/ em qualquer nível (o original do acervo nunca sai do lado de cá);
 *   - nome de id: 32 hex minúsculos (`^[0-9a-f]{32}$`);
 *   - arquivo sem extensão dentro de uma pasta imagens/ (imagem do acervo sem nome legível).
 *
 * Alvos: a árvore rastreada (git ls-files, só nomes, não conteúdo; a chave do
 * git-crypt não é necessária) e a pasta de build (dist/). Pacotes extras, por
 * VERIFICAR_JURI_PACOTES (caminhos separados por vírgula): é onde o F4.2 soma
 * webroot/ e app/.
 *
 * Piso (L-36): zero arquivo em qualquer alvo é falha; analisados tem de bater com
 * encontrados. Cada linha imprime `juri fora do pacote [alvo]: encontrados=N analisados=N falharam=N`.
 *
 * Variáveis (opcionais): DIST_PATH (padrão dist/), VERIFICAR_JURI_RAIZ (padrão a
 * raiz do repositório).
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(process.env.VERIFICAR_JURI_RAIZ ?? resolve(AQUI, '..'));
const DIST = resolve(process.env.DIST_PATH ?? join(AQUI, '../dist'));
const PACOTES_EXTRAS = (process.env.VERIFICAR_JURI_PACOTES ?? '')
  .split(',')
  .map((p) => p.trim())
  .filter((p) => p.length > 0)
  .map((p) => resolve(p));

const NOMES_PROIBIDOS = new Set([
  'acervo.json',
  'credencial-admin.json',
  'ids.tsv',
  'conferencia.tsv',
  'juri.json'
]);
const EXTENSAO_PROIBIDA = '.juri';
const ID_HEX = /^[0-9a-f]{32}$/;

/** Motivos pelos quais um caminho relativo (com `/`) não pode estar no pacote. */
function motivosDoCaminho(caminho: string): string[] {
  const partes = caminho.split('/');
  const nome = partes[partes.length - 1] ?? '';
  const pastas = partes.slice(0, -1);
  const motivos: string[] = [];
  if (nome.endsWith(EXTENSAO_PROIBIDA)) motivos.push('extensão .juri');
  if (NOMES_PROIBIDOS.has(nome)) motivos.push('nome proibido');
  if (ID_HEX.test(nome)) motivos.push('nome de id (32 hex)');
  if (pastas.includes('originais')) motivos.push('pasta originais');
  if (pastas.includes('imagens') && !nome.includes('.')) {
    motivos.push('imagem sem extensão em imagens/');
  }
  return motivos;
}

function listarArquivos(pasta: string, base: string = pasta): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho, base);
    return [relative(base, caminho)];
  });
}

function relative(base: string, caminho: string): string {
  return caminho
    .slice(base.length + 1)
    .split(sep)
    .join('/');
}

/** Nomes rastreados pelo git (sem conteúdo). Falha fechada: se o git não responde, reprova. */
function nomesRastreados(): string[] {
  const saida = execFileSync('git', ['-C', RAIZ, 'ls-files', '-z'], { encoding: 'utf-8' });
  return saida.split('\0').filter((n) => n.length > 0);
}

interface Alvo {
  readonly rotulo: string;
  readonly caminhos: () => string[];
}

function varrer(alvo: Alvo): number {
  let encontrados = 0;
  let analisados = 0;
  let falharam = 0;
  let caminhos: string[];
  try {
    caminhos = alvo.caminhos();
  } catch {
    console.error(`verificar-juri-fora-do-pacote: [${alvo.rotulo}] não foi possível listar`);
    console.log(`juri fora do pacote [${alvo.rotulo}]: encontrados=0 analisados=0 falharam=0`);
    return 1;
  }
  encontrados = caminhos.length;
  for (const caminho of caminhos) {
    analisados += 1;
    const motivos = motivosDoCaminho(caminho);
    if (motivos.length > 0) {
      falharam += 1;
      console.error(
        `verificar-juri-fora-do-pacote: [${alvo.rotulo}] ${caminho} (${motivos.join(', ')})`
      );
    }
  }
  console.log(
    `juri fora do pacote [${alvo.rotulo}]: encontrados=${encontrados} analisados=${analisados} falharam=${falharam}`
  );
  if (encontrados === 0) {
    console.error(
      `verificar-juri-fora-do-pacote: [${alvo.rotulo}] zero arquivo é varredura quebrada`
    );
    return 1;
  }
  if (analisados !== encontrados) {
    console.error(`verificar-juri-fora-do-pacote: [${alvo.rotulo}] varredura incompleta`);
    return 1;
  }
  return falharam > 0 ? 1 : 0;
}

function principal(): number {
  const alvos: Alvo[] = [
    { rotulo: 'arvore', caminhos: nomesRastreados },
    {
      rotulo: 'dist',
      caminhos: () => {
        if (!statSync(DIST, { throwIfNoEntry: false })?.isDirectory()) {
          throw new Error('dist ausente');
        }
        return listarArquivos(DIST);
      }
    },
    ...PACOTES_EXTRAS.map((pacote) => ({
      rotulo: pacote,
      caminhos: () => listarArquivos(pacote)
    }))
  ];
  let codigo = 0;
  for (const alvo of alvos) {
    codigo = Math.max(codigo, varrer(alvo));
  }
  return codigo;
}

process.exitCode = principal();
