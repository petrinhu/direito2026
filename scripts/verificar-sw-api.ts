/**
 * Portão pós-build do service worker (área restrita): o sw.js gerado tem
 * de (1) negar o fallback de navegação para /api/, (2) tratar /api/ como
 * NetworkOnly ANTES das outras regras de cache e (3) não ter nenhum .php no
 * precache. Lê o arquivo gerado de verdade, não a configuração.
 *
 * DIST_PATH (opcional) aponta para outra pasta, para provar o portão
 * vermelho numa cópia (L-36).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.DIST_PATH ? resolve(process.env.DIST_PATH) : resolve(AQUI, '../dist');
const CAMINHO_SW = join(DIST, 'sw.js');

function principal(): number {
  if (!existsSync(CAMINHO_SW)) {
    console.error('verificar-sw-api: sw.js ausente (rode o build antes): sw analisados: 0');
    return 1;
  }
  const sw = readFileSync(CAMINHO_SW, 'utf-8');
  if (sw.length === 0) {
    console.error('verificar-sw-api: sw.js vazio é portão quebrado');
    return 1;
  }

  const problemas: string[] = [];
  if (!sw.includes('denylist:[/^\\/api\\//]')) {
    problemas.push('navigateFallbackDenylist sem /^\\/api\\//');
  }
  const regraApi = sw.indexOf('startsWith("/api/")');
  if (regraApi < 0 || !sw.includes('NetworkOnly')) {
    problemas.push('regra NetworkOnly para /api/ ausente');
  }
  const primeiraOutra = sw.indexOf('conteudo-unidades');
  if (regraApi >= 0 && primeiraOutra >= 0 && regraApi > primeiraOutra) {
    problemas.push('regra de /api/ vem depois de outra regra de cache');
  }
  const php = (sw.match(/\.php/gi) ?? []).length;
  if (php > 0) problemas.push(`.php no service worker: ${php}`);

  console.log(`sw analisados: 1 / problemas: ${problemas.length} / .php no precache: ${php}`);
  for (const p of problemas) console.error(`verificar-sw-api: ${p}`);
  return problemas.length > 0 ? 1 : 0;
}

process.exitCode = principal();
