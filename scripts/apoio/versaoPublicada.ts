import type { Curriculo } from '../../src/core/curriculo/tipos';
import {
  textoFinalDoItem,
  validarNovidades,
  verificarComScript,
  type VerificadorDeTermos
} from './novidades';
import { compararVersoes, formatarVersao, lerVersao, type Versao } from './versao';

/**
 * Histórico do aviso de versão nova (AV-F4, docs/publicacao.md, "Aviso de versão nova").
 * Sem I/O: quem lê o disco e grava o pacote é scripts/separar-pacote.ts.
 *
 * lerNovidades confere a forma do arquivo versionado docs/versoes/novidades.json (cifrado,
 * JSON, campos). montarVersaoPublicada valida TODAS as versões (falha fechada), ordena da mais
 * nova para a mais velha, corta em 10 e monta o texto do versao.json. A validação das
 * novidades é a de scripts/apoio/novidades.ts (cadeira, usabilidade, tecnica, travas).
 */

export const TETO_HISTORICO = 10;
export const TETO_BYTES = 4096;

/** Os 10 primeiros bytes de todo arquivo cifrado pelo git-crypt (scripts/verificar-git-crypt.ts). */
const CABECALHO_GITCRYPT = Buffer.from('\0GITCRYPT\0', 'binary');

/** Uma versão do arquivo: o número e as novidades como `tipo:valor` (ou `tecnica`), nunca o texto final. */
export interface EntradaNovidades {
  readonly versao: string;
  readonly novidades: readonly string[];
}

export type ResultadoVersao<T> = { ok: true; valor: T } | { ok: false; motivo: string };

export interface MontagemVersao {
  readonly versaoDoPacote: string;
  readonly entradas: readonly EntradaNovidades[];
  readonly curriculo: Curriculo;
  readonly limpo?: VerificadorDeTermos;
}

/** Lê o conteúdo de docs/versoes/novidades.json (bytes) e confere a forma, sem validar novidades. */
export function lerNovidades(bytes: Buffer): ResultadoVersao<EntradaNovidades[]> {
  if (bytes.subarray(0, CABECALHO_GITCRYPT.length).equals(CABECALHO_GITCRYPT)) {
    return falha(
      'novidades.json está cifrado (git-crypt sem chave): destrave a árvore antes de montar o pacote'
    );
  }
  let bruto: unknown;
  try {
    bruto = JSON.parse(bytes.toString('utf-8'));
  } catch (erro) {
    return falha(`novidades.json: JSON inválido (${mensagem(erro)})`);
  }
  const versoes = (bruto as { versoes?: unknown } | null)?.versoes;
  if (!Array.isArray(versoes)) {
    return falha('novidades.json: o campo "versoes" precisa ser uma lista');
  }
  const entradas: EntradaNovidades[] = [];
  for (const [indice, entrada] of versoes.entries()) {
    if (!ehEntrada(entrada)) {
      return falha(
        `novidades.json: entrada ${indice} sem "versao" (texto) ou "novidades" (lista de textos)`
      );
    }
    entradas.push(entrada);
  }
  return { ok: true, valor: entradas };
}

/**
 * Monta o texto do versao.json. Recusa (sem gravar nada) se: a versão do package.json for
 * inválida; alguma entrada for inválida, repetida, sem novidade ou mais nova que o
 * package.json; alguma novidade falhar na validação ou nas travas; o texto passar de 4 KB;
 * o texto final falhar nas travas (segunda barreira, sobre o arquivo inteiro).
 */
export function montarVersaoPublicada(m: MontagemVersao): ResultadoVersao<string> {
  const limpo = m.limpo ?? verificarComScript;
  let pacote: Versao;
  try {
    pacote = lerVersao(m.versaoDoPacote);
  } catch (erro) {
    return falha(`package.json: ${mensagem(erro)}`);
  }
  const numeroDoPacote = formatarVersao(pacote);

  const validas: { versao: string; ordem: Versao; novidades: string[] }[] = [];
  const vistas = new Set<string>();
  for (const entrada of m.entradas) {
    let ordem: Versao;
    try {
      ordem = lerVersao(entrada.versao);
    } catch {
      return falha(`novidades.json: versão inválida "${entrada.versao}" (esperado A.B.C.D)`);
    }
    const numero = formatarVersao(ordem);
    if (vistas.has(numero)) return falha(`novidades.json: versão ${numero} repetida`);
    vistas.add(numero);
    if (compararVersoes(ordem, pacote) > 0) {
      return falha(
        `versão ${numero} do histórico é mais nova que a do package.json (${numeroDoPacote}): novidades.json e package.json estão dessincronizados`
      );
    }
    if (entrada.novidades.length === 0) {
      return falha(`versão ${numero} sem novidade (publicar exige ao menos uma)`);
    }
    const lista = validarNovidades('recurso', entrada.novidades, m.curriculo, limpo);
    if (!lista.ok) return falha(`versão ${numero}: ${lista.motivo}`);
    validas.push({ versao: numero, ordem, novidades: lista.itens.map(textoFinalDoItem) });
  }

  const historico = validas
    .sort((a, b) => compararVersoes(b.ordem, a.ordem))
    .slice(0, TETO_HISTORICO)
    .map(({ versao, novidades }) => ({ versao, novidades }));
  const corpo = JSON.stringify({ versao: numeroDoPacote, historico });

  const bytes = Buffer.byteLength(corpo, 'utf-8');
  if (bytes > TETO_BYTES) {
    return falha(`versao.json tem ${bytes} bytes: passa do teto de ${TETO_BYTES / 1024} KB`);
  }
  if (!limpo(corpo)) return falha('o versao.json não passa nas travas de publicação');
  return { ok: true, valor: corpo };
}

function ehEntrada(valor: unknown): valor is EntradaNovidades {
  if (typeof valor !== 'object' || valor === null) return false;
  const campos = valor as { versao?: unknown; novidades?: unknown };
  return (
    typeof campos.versao === 'string' &&
    Array.isArray(campos.novidades) &&
    campos.novidades.every((item) => typeof item === 'string')
  );
}

function falha(motivo: string): { ok: false; motivo: string } {
  return { ok: false, motivo };
}

function mensagem(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}
