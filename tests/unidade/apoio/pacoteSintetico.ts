import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Fixture sintético do pacote separado (LU-F4.2). Nenhum conteúdo real: cada
 * arquivo tem um texto curto e inventado, só para existir com o nome certo.
 */

/** Arquivos que o webroot deve conter (plano 1.1), em forma relativa. */
export const WEBROOT_ESPERADO: readonly string[] = [
  '.htaccess',
  'robots.txt',
  'sw.js',
  'entrada.css',
  'icones/favicon.svg',
  'api/portao.php',
  'api/saude.php',
  'api/nucleo/.htaccess',
  'api/nucleo/config.php',
  'api/juri/imagem.php'
];

/** Arquivos que o app deve conter, sem o manifesto. */
export const APP_ESPERADO: readonly string[] = [
  'index.html',
  'assets/app-abc123.js',
  'assets/app-abc123.css',
  'assets/fonte-abc123.woff2',
  'assets/imagem-abc123.webp',
  'assets/busca-indice.json'
];

export function plantar(raiz: string, caminho: string, conteudo: string): void {
  const alvo = join(raiz, caminho);
  mkdirSync(dirname(alvo), { recursive: true });
  writeFileSync(alvo, conteudo);
}

/** Planta um dist sintético completo: webroot e app, sem 404.html (o build não gera mais). */
export function plantarDist(dist: string): void {
  for (const caminho of [...WEBROOT_ESPERADO, ...APP_ESPERADO]) {
    plantar(dist, caminho, `sintetico ${caminho}\n`);
  }
}
