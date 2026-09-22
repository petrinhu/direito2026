/**
 * Portão pós-build (achado do líder, 22/09/2026, medido no site
 * publicado): dist/busca/ colidia com a rota /busca da SPA. No Apache,
 * diretório com o mesmo nome do caminho pedido dispara redirecionamento
 * de diretório (301 para a barra final), e como a listagem é proibida, a
 * segunda requisição volta 403. Nenhuma rota da aplicação pode ter uma
 * pasta homônima no pacote.
 *
 * Compara os segmentos de primeiro nível das rotas (src/app/router/rotas.ts)
 * com os nomes de pasta de primeiro nível de dist/, e reprova em qualquer
 * interseção.
 */
import { readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extrairSegmentoPrimeiroNivel } from '../src/core/rotas/segmentoPrimeiroNivel';
import { rotas } from '../src/app/router/rotas';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.DIST_PATH ? resolve(process.env.DIST_PATH) : resolve(AQUI, '../dist');

function principal(): void {
  if (!statSync(DIST, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`verificar-colisao-rotas: pasta ausente: ${DIST} (rode 'npm run build' antes)`);
    process.exitCode = 1;
    return;
  }

  const segmentosDeRota = new Set(
    rotas
      .map((rota) => extrairSegmentoPrimeiroNivel(rota.path))
      .filter((segmento): segmento is string => segmento !== undefined)
  );

  const pastasDoPacote = readdirSync(DIST, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name);

  const colisoes = pastasDoPacote.filter((pasta) => segmentosDeRota.has(pasta));

  console.log(
    `rotas analisadas: ${rotas.length} / pastas do pacote analisadas: ${pastasDoPacote.length} / colisões: ${colisoes.length}`
  );

  if (pastasDoPacote.length === 0) {
    console.error('verificar-colisao-rotas: zero pasta analisada é portão quebrado');
    process.exitCode = 1;
    return;
  }

  if (colisoes.length > 0) {
    for (const pasta of colisoes) {
      console.error(
        `colisão: dist/${pasta}/ é uma pasta real, mas também é o primeiro segmento de uma rota da aplicação`
      );
    }
    process.exitCode = 1;
  }
}

principal();
