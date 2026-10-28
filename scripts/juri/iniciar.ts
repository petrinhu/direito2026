import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { aadDoEmbrulho } from '../../src/core/juri/aadEmbrulho';
import { bytesParaBase64, bytesParaBase64Url } from '../../src/core/juri/base64';
import {
  cifrarImagem,
  decifrarImagem,
  derivar,
  embrulharCek,
  gerarCek
} from '../../src/core/juri/cifra';
import { ErroCifra } from '../../src/core/juri/erroCifra';
import { idDeHex } from '../../src/core/juri/idImagem';
import { gerarSenhaProvisoria } from '../../src/core/juri/senha';
import { aleatorios, bytesParaHex, idAleatorio, sha256Hex } from './codigos';
import { serializarConferencia, type LinhaConferencia } from './conferenciaTsv';
import { LOGIN_ADMIN, type EntradaAcervo } from './credencial';
import { gravarPrivado, limparCriados, verificarOriginais, verificarSaida } from './arquivos';
import { ErroFerramenta } from './erro';
import { anexarIds, lerIdsArquivo, NOME_IDS, resolverIds } from './idsTsv';
import { limparEVerificar } from './metadados';
import { listarOriginais } from './originais';

const BYTES_KID = 16;
const BYTES_SALT = 16;

export interface OpcoesIniciar {
  originais: string;
  saida: string;
}

export interface ResultadoIniciar {
  /** A senha provisória: a ÚNICA coisa secreta que sai da ferramenta, e só pelo stdout. */
  senha: string;
  imagens: number;
  avisos: string[];
}

function porId<T extends { id: string }>(a: T, b: T): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Erro da cifra vira falha da ferramenta com o código estável, nunca o erro cru do WebCrypto. */
function traduzirErro(erro: unknown): unknown {
  if (erro instanceof ErroCifra) {
    return new ErroFerramenta(`cifra falhou (${erro.codigo})`);
  }
  return erro;
}

/**
 * Gera a saída de um acervo: CEK nova, kid novo, senha provisória nova, salt novo; ids
 * reusados do ids.tsv da pasta de originais. Falha no meio desfaz só o que criou.
 */
export async function iniciar(opcoes: OpcoesIniciar): Promise<ResultadoIniciar> {
  const originais = resolve(opcoes.originais);
  const saida = resolve(opcoes.saida);
  verificarOriginais(originais);
  const imagens = listarOriginais(originais);
  const caminhoIds = join(originais, NOME_IDS);
  const { idPorSha, novas } = resolverIds(imagens, lerIdsArquivo(caminhoIds), idAleatorio);
  verificarSaida(saida, originais);

  const criados: string[] = [];
  try {
    if (!existsSync(saida)) {
      mkdirSync(saida, { mode: 0o700 });
      criados.push(saida);
    }
    chmodSync(saida, 0o700);
    const pastaImagens = join(saida, 'imagens');
    mkdirSync(pastaImagens, { mode: 0o700 });
    criados.push(pastaImagens);

    const senha = gerarSenhaProvisoria();
    const cek = await gerarCek();
    const kid = aleatorios(BYTES_KID);
    const salt = aleatorios(BYTES_SALT);
    const { kek, auth } = await derivar(senha, salt);
    const embrulho = await embrulharCek(cek, kek, aadDoEmbrulho(LOGIN_ADMIN, salt));
    const { limpas, avisos } = await limparEVerificar(imagens);

    const indice: EntradaAcervo[] = [];
    const conferencia: LinhaConferencia[] = [];
    for (const [i, original] of imagens.entries()) {
      const limpa = limpas[i];
      const id = idPorSha.get(original.sha256);
      if (limpa === undefined || id === undefined) {
        throw new ErroFerramenta(`imagem ${i + 1}: sem cópia limpa ou sem id (falha interna)`);
      }
      const cifrada = await cifrarImagem(limpa, cek, { kid, id: idDeHex(id), tipo: original.tipo });
      const volta = await decifrarImagem(cifrada, cek, kid, idDeHex(id));
      if (
        volta.tipo !== original.tipo ||
        Buffer.compare(Buffer.from(volta.bytes), Buffer.from(limpa)) !== 0
      ) {
        throw new ErroFerramenta(`ida e volta da cifra não confere (imagem ${i + 1})`);
      }
      gravarPrivado(join(pastaImagens, `${id}.juri`), cifrada, criados);
      indice.push({ id, tipo: original.tipo, bytes: cifrada.byteLength });
      conferencia.push({ id, sha256: sha256Hex(limpa), bytes: cifrada.byteLength });
    }
    indice.sort(porId);
    conferencia.sort(porId);

    gravarPrivado(
      join(saida, 'credencial-admin.json'),
      JSON.stringify({
        login: LOGIN_ADMIN,
        salt: bytesParaBase64(salt),
        auth: bytesParaBase64Url(auth),
        embrulho: { v: embrulho.v, iv: embrulho.iv, ct: embrulho.ct }
      }),
      criados
    );
    gravarPrivado(
      join(saida, 'acervo.json'),
      JSON.stringify({ kid: bytesParaHex(kid), indice }),
      criados
    );
    gravarPrivado(join(saida, 'conferencia.tsv'), serializarConferencia(conferencia), criados);
    anexarIds(caminhoIds, novas);
    return { senha, imagens: imagens.length, avisos };
  } catch (erro) {
    limparCriados(criados);
    throw traduzirErro(erro);
  }
}
