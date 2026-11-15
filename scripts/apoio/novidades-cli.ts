// Ponte de linha de comando para scripts/publicar.sh (AV-F5, docs/publicacao.md, "Aviso de versão
// nova"). Não contém regra de novidade: quem valida é scripts/apoio/novidades.ts, e quem lê o
// histórico é scripts/apoio/versaoPublicada.ts. Uso:
//   node --import tsx scripts/apoio/novidades-cli.ts validar <recurso|correcao|construcao> [bruto...]
//       imprime, por item, "bruto<TAB>texto final". Nunca imprime a lista de termos.
//   node --import tsx scripts/apoio/novidades-cli.ts gravar <novidades.json> <versão> [item...]
//       acrescenta a entrada da versão no topo do arquivo (itens estruturados, nunca o texto final).
//   node --import tsx scripts/apoio/novidades-cli.ts conferir-historico <versao.json> <versão>
//       confere que historico[0].versao é a versão dada.
// Erro sai com código 1 e só o motivo em stderr.
import { readFileSync, writeFileSync } from 'node:fs';
import { curriculoDoDisco } from './conteudoDoDisco';
import {
  analisarNovidade,
  textoFinalDoItem,
  validarNovidades,
  type TipoPublicacao
} from './novidades';
import { lerNovidades } from './versaoPublicada';

const USO =
  'uso: novidades-cli.ts validar <tipo> [bruto...] | gravar <novidades.json> <versão> [item...] | conferir-historico <versao.json> <versão>';
const TIPOS: readonly TipoPublicacao[] = ['recurso', 'correcao', 'construcao'];
const VERSAO = /^[0-9]+(\.[0-9]+)+$/;

function conferirVersao(versao: string): void {
  if (!VERSAO.test(versao)) throw new Error(`versão fora do formato numérico: "${versao}"`);
}

async function validar(tipo: string, brutos: readonly string[]): Promise<string[]> {
  if (!TIPOS.includes(tipo as TipoPublicacao)) throw new Error(`tipo inválido: "${tipo}"`);
  const tipoTipado = tipo as TipoPublicacao;
  if (tipoTipado === 'construcao') {
    if (brutos.length > 0) {
      throw new Error('"construcao" não aceita --novidade: a novidade dela é sempre tecnica');
    }
    return [`tecnica\t${textoFinalDoItem({ tipo: 'tecnica' })}`];
  }
  if (brutos.length === 0) {
    throw new Error(`"${tipo}" exige ao menos uma --novidade`);
  }
  const curriculo = await curriculoDoDisco();
  const r = validarNovidades(tipoTipado, brutos, curriculo);
  if (!r.ok) throw new Error(r.motivo);
  return brutos.map((bruto, indice) => {
    const item = r.itens[indice];
    if (item === undefined) throw new Error('validação devolveu menos itens que o pedido');
    return `${bruto}\t${textoFinalDoItem(item)}`;
  });
}

async function gravar(arquivo: string, versao: string, itens: readonly string[]): Promise<string> {
  conferirVersao(versao);
  if (itens.length === 0) throw new Error('gravar: ao menos um item de novidade');
  const curriculo = await curriculoDoDisco();
  for (const item of itens) {
    // O motivo basta: o item bruto não é impresso, porque pode conter o termo barrado.
    const r = analisarNovidade(item, curriculo);
    if (!r.ok) throw new Error(`novidade recusada: ${r.motivo}`);
  }
  const lida = lerNovidades(readFileSync(arquivo));
  if (!lida.ok) throw new Error(lida.motivo);
  if (lida.valor.some((entrada) => entrada.versao === versao)) {
    throw new Error(`a versão ${versao} já está em novidades.json`);
  }
  const novo = { versoes: [{ versao, novidades: [...itens] }, ...lida.valor] };
  writeFileSync(arquivo, `${JSON.stringify(novo, null, 2)}\n`);
  return versao;
}

function conferirHistorico(arquivo: string, versao: string): string {
  conferirVersao(versao);
  const objeto: unknown = JSON.parse(readFileSync(arquivo, 'utf8'));
  const historico = (objeto as { historico?: unknown } | null)?.historico;
  if (!Array.isArray(historico) || historico.length === 0) {
    throw new Error('versao.json sem historico');
  }
  const topo = (historico[0] as { versao?: unknown } | undefined)?.versao;
  if (topo !== versao) {
    throw new Error(`versao.json: historico[0] é "${String(topo)}", esperado "${versao}"`);
  }
  return `historico[0] confere com ${versao}`;
}

async function executar(argumentos: readonly string[]): Promise<string> {
  const [comando, ...resto] = argumentos;
  switch (comando) {
    case 'validar': {
      const [tipo, ...brutos] = resto;
      if (tipo === undefined) throw new Error(USO);
      return (await validar(tipo, brutos)).join('\n');
    }
    case 'gravar': {
      const [arquivo, versao, ...itens] = resto;
      if (arquivo === undefined || versao === undefined) throw new Error(USO);
      return gravar(arquivo, versao, itens);
    }
    case 'conferir-historico': {
      const [arquivo, versao] = resto;
      if (arquivo === undefined || versao === undefined) throw new Error(USO);
      return conferirHistorico(arquivo, versao);
    }
    default:
      throw new Error(USO);
  }
}

async function principal(): Promise<void> {
  try {
    process.stdout.write(`${await executar(process.argv.slice(2))}\n`);
  } catch (erro) {
    process.stderr.write(`novidades-cli: ${erro instanceof Error ? erro.message : String(erro)}\n`);
    process.exitCode = 1;
  }
}

void principal();
