// Ponte de linha de comando para scripts/publicar.sh. Não contém regra de
// versão: quem decide é scripts/apoio/versao.ts. Uso:
//   node --import tsx scripts/apoio/versao-cli.ts calcular <tipo> <atual> [forçada]
//   node --import tsx scripts/apoio/versao-cli.ts ler <package.json>
//   node --import tsx scripts/apoio/versao-cli.ts gravar <package.json> <nova>
// Erro sai com código 1 e mensagem em stderr. Sucesso imprime só o resultado.
import { readFileSync, writeFileSync } from 'node:fs';
import {
  calcularVersao,
  formatarVersao,
  lerVersao,
  reescreverVersaoDoPackage,
  validarVersaoForcada
} from './versao';

const USO =
  'uso: versao-cli.ts calcular <tipo> <atual> [forçada] | ler <package.json> | gravar <package.json> <nova>';

function lerCampoVersao(caminho: string): string {
  const objeto: unknown = JSON.parse(readFileSync(caminho, 'utf8'));
  if (typeof objeto !== 'object' || objeto === null || !('version' in objeto)) {
    throw new Error(`${caminho} sem campo "version"`);
  }
  const versao = (objeto as { version: unknown }).version;
  if (typeof versao !== 'string') {
    throw new Error(`campo "version" de ${caminho} não é texto`);
  }
  return formatarVersao(lerVersao(versao));
}

function executar(argumentos: readonly string[]): string {
  const [comando, ...resto] = argumentos;
  switch (comando) {
    case 'calcular': {
      const [tipo, atual, forcada] = resto;
      if (tipo === undefined || atual === undefined) {
        throw new Error(USO);
      }
      return calcularVersao(atual, tipo, forcada);
    }
    case 'ler': {
      const [caminho] = resto;
      if (caminho === undefined) {
        throw new Error(USO);
      }
      return lerCampoVersao(caminho);
    }
    case 'gravar': {
      const [caminho, nova] = resto;
      if (caminho === undefined || nova === undefined) {
        throw new Error(USO);
      }
      validarVersaoForcada(nova, [0, 0, 0, 0]);
      const texto = readFileSync(caminho, 'utf8');
      writeFileSync(caminho, reescreverVersaoDoPackage(texto, nova));
      return nova;
    }
    default:
      throw new Error(USO);
  }
}

try {
  process.stdout.write(`${executar(process.argv.slice(2))}\n`);
} catch (erro) {
  process.stderr.write(`versao-cli: ${erro instanceof Error ? erro.message : String(erro)}\n`);
  process.exitCode = 1;
}
