import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { aadDoEmbrulho } from '../../src/core/juri/aadEmbrulho';
import { base64ParaBytes, bytesParaBase64Url } from '../../src/core/juri/base64';
import { decifrarImagem, derivar, desembrulharCek } from '../../src/core/juri/cifra';
import { ErroCifra } from '../../src/core/juri/erroCifra';
import { idDeHex } from '../../src/core/juri/idImagem';
import { hexParaBytes, sha256Hex } from './codigos';
import { lerConferencia, type LinhaConferencia } from './conferenciaTsv';
import {
  LOGIN_ADMIN,
  validarAcervo,
  validarCredencial,
  type Acervo,
  type CredencialAdmin
} from './credencial';
import { ErroFerramenta } from './erro';
import { verificarEntradas, type EntradaImagem } from './metadados';

export interface OpcoesConferir {
  saida: string;
  senha: string;
}

export interface ResultadoConferir {
  imagens: number;
}

function lerJson(caminho: string, nome: string): unknown {
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch {
    throw new ErroFerramenta(`${nome}: ausente ou não é JSON válido`);
  }
}

/** A conta só abre com a senha: AUTH igual ao da credencial e embrulho que desembrulha. */
async function abrirCek(cred: CredencialAdmin, senha: string) {
  const salt = base64ParaBytes(cred.salt);
  const { kek, auth } = await derivar(senha, salt);
  if (bytesParaBase64Url(auth) !== cred.auth) {
    throw new ErroFerramenta('a senha não confere com a credencial');
  }
  try {
    return await desembrulharCek(cred.embrulho, kek, aadDoEmbrulho(LOGIN_ADMIN, salt));
  } catch {
    throw new ErroFerramenta('o embrulho não abre com esta senha');
  }
}

/** A pasta imagens/ tem exatamente os arquivos do índice: nem sobra (kid antigo), nem falta. */
function conferirDiretorio(saida: string, acervo: Acervo): void {
  const esperados = acervo.indice.map((entrada) => `${entrada.id}.juri`).sort();
  const listados = readdirSync(join(saida, 'imagens')).sort();
  if (esperados.length !== listados.length || esperados.some((nome, i) => nome !== listados[i])) {
    throw new ErroFerramenta(
      `imagens/ tem ${listados.length} arquivo(s) e o índice pede ${esperados.length}: sobra ou falta arquivo`
    );
  }
}

function conferirConjunto(acervo: Acervo, conferencia: Map<string, LinhaConferencia>): void {
  const ids = acervo.indice.map((entrada) => entrada.id);
  if (conferencia.size !== ids.length || ids.some((id) => !conferencia.has(id))) {
    throw new ErroFerramenta('conferencia.tsv não cobre exatamente o índice do acervo');
  }
}

/** Decifra cada .juri com a CEK e confere tamanho, tipo e conteúdo contra a cópia limpa registrada. */
async function decifrarTodas(
  saida: string,
  acervo: Acervo,
  cek: Awaited<ReturnType<typeof desembrulharCek>>,
  conferencia: Map<string, LinhaConferencia>
): Promise<EntradaImagem[]> {
  const kid = hexParaBytes(acervo.kid);
  const entradas: EntradaImagem[] = [];
  for (const [i, entrada] of acervo.indice.entries()) {
    const numero = i + 1;
    const arquivo = new Uint8Array(readFileSync(join(saida, 'imagens', `${entrada.id}.juri`)));
    const linha = conferencia.get(entrada.id);
    if (
      linha === undefined ||
      arquivo.byteLength !== entrada.bytes ||
      linha.bytes !== arquivo.byteLength
    ) {
      throw new ErroFerramenta(`imagem ${numero}: tamanho do arquivo diferente do índice`);
    }
    let decifrada: Awaited<ReturnType<typeof decifrarImagem>>;
    try {
      decifrada = await decifrarImagem(arquivo, cek, kid, idDeHex(entrada.id));
    } catch (erro) {
      const codigo = erro instanceof ErroCifra ? erro.codigo : 'desconhecido';
      throw new ErroFerramenta(`imagem ${numero} não decifra (${codigo})`);
    }
    if (decifrada.tipo !== entrada.tipo) {
      throw new ErroFerramenta(`imagem ${numero}: tipo do cabeçalho diferente do índice`);
    }
    if (sha256Hex(decifrada.bytes) !== linha.sha256) {
      throw new ErroFerramenta(`imagem ${numero} não confere com a cópia limpa registrada`);
    }
    entradas.push({ bytes: decifrada.bytes, tipo: entrada.tipo });
  }
  return entradas;
}

/** Prova de ida e volta: senha -> AUTH -> CEK -> cada imagem decifra, bate com a cópia limpa e não tem etiqueta. */
export async function conferir(opcoes: OpcoesConferir): Promise<ResultadoConferir> {
  const saida = resolve(opcoes.saida);
  const cred = validarCredencial(
    lerJson(join(saida, 'credencial-admin.json'), 'credencial-admin.json')
  );
  const acervo = validarAcervo(lerJson(join(saida, 'acervo.json'), 'acervo.json'));
  const conferencia = lerConferencia(readFileSync(join(saida, 'conferencia.tsv'), 'utf8'));
  conferirConjunto(acervo, conferencia);
  conferirDiretorio(saida, acervo);
  const cek = await abrirCek(cred, opcoes.senha);
  const entradas = await decifrarTodas(saida, acervo, cek, conferencia);
  await verificarEntradas(entradas);
  return { imagens: acervo.indice.length };
}
