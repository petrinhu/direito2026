import { readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { agruparPorUnidade } from '../../src/core/curriculo/agruparPorUnidade';
import {
  montarCarregadores,
  montarCarregadoresDispositivos
} from '../../src/app/carregamento/montarCarregadores';
import type { RegistroDeCarregadores } from '../../src/app/carregamento/decorarCurriculo';
import type { IndiceDispositivos } from '../../src/core/dispositivos/tipos';

/**
 * Leitura direta de src/conteudo/ no disco, para scripts Node (tsx) e para o
 * e2e (Playwright), onde import.meta.glob não existe. Acha exatamente os
 * mesmos arquivos que o glob do Vite (paridade em
 * tests/unidade/conteudo.paridadeGlobDisco.spec.ts) e entrega à mesma função
 * pura. Nada aqui decide o que é unidade: isso é de agruparPorUnidade.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
export const RAIZ_DO_CONTEUDO = resolve(AQUI, '../../src/conteudo');

/**
 * Caminhos relativos à raiz do conteúdo, no mesmo conjunto que o glob enxerga:
 * `pN/cadeira/unidade/*.ts` e `pN/cadeira/unidade/quiz/*.ts`. Pastas e
 * arquivos com ponto no início ficam de fora, como no glob.
 */
export function caminhosDoDisco(raiz: string = RAIZ_DO_CONTEUDO): string[] {
  const caminhos: string[] = [];
  for (const periodo of listarPastas(raiz).filter((nome) => nome.startsWith('p'))) {
    for (const cadeira of listarPastas(join(raiz, periodo))) {
      for (const unidade of listarPastas(join(raiz, periodo, cadeira))) {
        const pasta = join(raiz, periodo, cadeira, unidade);
        const base = `${periodo}/${cadeira}/${unidade}`;
        for (const arquivo of listarTs(pasta)) caminhos.push(`${base}/${arquivo}`);
        for (const sub of listarTs(join(pasta, 'quiz'))) caminhos.push(`${base}/quiz/${sub}`);
      }
    }
  }
  return caminhos.sort();
}

/** Importa o arquivo pelo caminho relativo a src/conteudo (mesmo contrato do glob). */
export function importarDoDisco(caminho: string): Promise<unknown> {
  return import(pathToFileURL(join(RAIZ_DO_CONTEUDO, caminho)).href);
}

/** Carregadores do conteúdo, montados do disco (mesma montagem do site). */
export function carregadoresDoDisco(raiz: string = RAIZ_DO_CONTEUDO): RegistroDeCarregadores {
  return montarCarregadores(agruparPorUnidade(caminhosDoDisco(raiz)), importarDoDisco);
}

/** Carregadores de dispositivos por unidade, montados do disco. */
export function carregadoresDispositivosDoDisco(
  raiz: string = RAIZ_DO_CONTEUDO
): Record<string, () => Promise<IndiceDispositivos>> {
  return montarCarregadoresDispositivos(agruparPorUnidade(caminhosDoDisco(raiz)), importarDoDisco);
}

function listarPastas(pasta: string): string[] {
  return listar(pasta).filter((nome) => statSync(join(pasta, nome)).isDirectory());
}

function listarTs(pasta: string): string[] {
  return listar(pasta).filter(
    (nome) => nome.endsWith('.ts') && statSync(join(pasta, nome)).isFile()
  );
}

function listar(pasta: string): string[] {
  try {
    return readdirSync(pasta).filter((nome) => !nome.startsWith('.'));
  } catch (erro) {
    if (erro instanceof Error && 'code' in erro && erro.code === 'ENOENT') return [];
    throw erro;
  }
}
