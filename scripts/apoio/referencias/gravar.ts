import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import type { Referencias } from './capturar';

/**
 * Leitura e escrita das referências de caracterização (tests/caracterizacao/
 * *.esperado.json). Cada arquivo guarda uma parte de Referencias. A escrita
 * passa pelo Prettier com a configuração do repositório, o mesmo formato que o
 * preci confere.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
export const PASTA_DAS_REFERENCIAS = resolve(AQUI, '../../../tests/caracterizacao');

const ARQUIVOS = {
  carregadores: 'carregadores.esperado.json',
  curriculo: 'curriculo.esperado.json',
  rotas: 'rotas.esperado.json',
  indiceBusca: 'indiceBusca.esperado.json'
} as const;

/** Lê as referências já gravadas. Arquivo ausente fica de fora (primeira geração). */
export function lerReferenciasGravadas(): Partial<Referencias> {
  const lidas: Partial<Record<keyof Referencias, unknown>> = {};
  for (const chave of Object.keys(ARQUIVOS) as Array<keyof typeof ARQUIVOS>) {
    const caminho = join(PASTA_DAS_REFERENCIAS, ARQUIVOS[chave]);
    if (existsSync(caminho)) {
      lidas[chave] = JSON.parse(readFileSync(caminho, 'utf-8'));
    }
  }
  return lidas as Partial<Referencias>;
}

/** Grava as quatro referências, cada uma formatada com o Prettier do repositório. */
export async function gravarReferencias(atual: Referencias): Promise<void> {
  for (const chave of Object.keys(ARQUIVOS) as Array<keyof typeof ARQUIVOS>) {
    const caminho = join(PASTA_DAS_REFERENCIAS, ARQUIVOS[chave]);
    const configuracao = await resolveConfig(caminho);
    const texto = await format(JSON.stringify(atual[chave], null, 2), {
      ...configuracao,
      parser: 'json'
    });
    writeFileSync(caminho, texto, 'utf-8');
  }
}
