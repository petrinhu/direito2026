/**
 * Garante os dispositivos.ts gerados antes da suíte de unidade (TEST-UNIT-GERA-DISPOSITIVOS).
 *
 * Os dispositivos.ts saem de scripts/gerar-dispositivos-por-unidade.ts e o git os ignora. Numa
 * worktree nova eles faltam, e o `npm run test:unit` dava falhas falsas. Este script confere se
 * falta algum arquivo de unidade publicada. Se faltar, gera (o gerador é rápido, ver o tempo
 * impresso). Se nenhum faltar, sai sem gerar nada.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { curriculoDoDisco, RAIZ_DO_CONTEUDO } from './apoio/conteudoDoDisco';

const AQUI = dirname(fileURLToPath(import.meta.url));
const GERADOR = resolve(AQUI, 'gerar-dispositivos-por-unidade.ts');

async function principal(): Promise<void> {
  const curriculo = await curriculoDoDisco();
  const esperados: string[] = [];
  for (const periodo of curriculo) {
    for (const cadeira of periodo.cadeiras) {
      for (const unidade of cadeira.unidades) {
        if (unidade.estado !== 'publicado') continue;
        esperados.push(
          resolve(RAIZ_DO_CONTEUDO, periodo.id, cadeira.id, unidade.id, 'dispositivos.ts')
        );
      }
    }
  }

  const faltam = esperados.filter((caminho) => !existsSync(caminho));
  if (faltam.length === 0) return;

  const inicio = Date.now();
  console.log(
    `garantir-dispositivos: faltam ${faltam.length} de ${esperados.length}; gerando antes dos testes`
  );
  try {
    execFileSync(process.execPath, ['--import', 'tsx', GERADOR], { stdio: 'inherit' });
  } catch {
    console.error(
      'garantir-dispositivos: a geração falhou. Rode `node --import tsx scripts/gerar-dispositivos-por-unidade.ts` e veja a causa.'
    );
    process.exit(1);
  }
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`garantir-dispositivos: gerados em ${segundos}s`);
}

principal().catch((erro: unknown) => {
  console.error('garantir-dispositivos: falha inesperada', erro);
  process.exit(1);
});
