/**
 * Portão pós-build (achado do líder, 22/09/2026): a lista explícita de
 * pastas em public/.htaccess (RewriteCond REQUEST_URI ^/(assets|icones)...)
 * precisa bater EXATAMENTE com as pastas de primeiro nível que este build
 * de fato produziu em dist/. Diverge para menos, uma pasta real do pacote
 * fica fora da lista e cai incorretamente na SPA. Diverge para mais, é
 * sinal de lista desatualizada (pasta removida num build anterior).
 *
 * Desde a área restrita, o pacote TEM de levar api/ (endpoints PHP): a
 * pasta e dois arquivos-chave são exigidos, e a lista do .htaccess precisa
 * incluir 'api' e negar api/nucleo/ (regra RewriteRule ^api/nucleo).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extrairPastasPermitidas } from '../src/core/rotas/extrairPastasPermitidas';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.DIST_PATH ? resolve(process.env.DIST_PATH) : resolve(AQUI, '../dist');

const PASTAS_OBRIGATORIAS = ['assets', 'icones', 'api'];
const ARQUIVOS_OBRIGATORIOS = ['api/saude.php', 'api/nucleo/.htaccess'];

function principal(): void {
  if (!statSync(DIST, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`verificar-htaccess-pastas: pasta ausente: ${DIST} (rode 'npm run build' antes)`);
    process.exitCode = 1;
    return;
  }

  const htaccessPath = resolve(DIST, '.htaccess');
  if (!statSync(htaccessPath, { throwIfNoEntry: false })?.isFile()) {
    console.error(`verificar-htaccess-pastas: .htaccess ausente em ${DIST}`);
    process.exitCode = 1;
    return;
  }

  const pastasPermitidas = new Set(extrairPastasPermitidas(readFileSync(htaccessPath, 'utf-8')));
  const pastasReais = new Set(
    readdirSync(DIST, { withFileTypes: true })
      .filter((entrada) => entrada.isDirectory())
      .map((entrada) => entrada.name)
  );

  const ausentes = [
    ...PASTAS_OBRIGATORIAS.filter((p) => !pastasReais.has(p)).map((p) => `${p}/`),
    ...ARQUIVOS_OBRIGATORIOS.filter(
      (a) => !statSync(resolve(DIST, a), { throwIfNoEntry: false })?.isFile()
    )
  ];
  for (const a of ausentes) {
    console.error(`dist/${a} é obrigatório no pacote (área restrita) e não está lá`);
  }
  if (ausentes.length > 0) process.exitCode = 1;

  if (!/^\s*RewriteRule\s+\^api\/nucleo/m.test(readFileSync(htaccessPath, 'utf-8'))) {
    console.error('.htaccess sem a regra que nega api/nucleo/ (RewriteRule ^api/nucleo...)');
    process.exitCode = 1;
  }

  const faltandoNaLista = [...pastasReais].filter((p) => !pastasPermitidas.has(p));
  const sobrandoNaLista = [...pastasPermitidas].filter((p) => !pastasReais.has(p));

  console.log(
    `pastas do pacote: ${pastasReais.size} / pastas na lista do .htaccess: ${pastasPermitidas.size} / divergências: ${faltandoNaLista.length + sobrandoNaLista.length}`
  );

  if (pastasPermitidas.size === 0) {
    console.error(
      'verificar-htaccess-pastas: lista vazia é portão quebrado (regex não achou nada)'
    );
    process.exitCode = 1;
    return;
  }

  for (const pasta of faltandoNaLista) {
    console.error(
      `dist/${pasta}/ existe no pacote mas não está na lista do .htaccess: ficaria fora da regra e cairia na SPA por engano`
    );
  }
  for (const pasta of sobrandoNaLista) {
    console.error(
      `.htaccess libera '${pasta}' mas o pacote não tem mais essa pasta: lista desatualizada`
    );
  }

  if (faltandoNaLista.length > 0 || sobrandoNaLista.length > 0) {
    process.exitCode = 1;
  }
}

principal();
