import { parseArgs } from 'node:util';
import { lerIdDeUnidade } from '../../../src/core/curriculo/idDeUnidade';

/** Argumento que não passa no formato. A mensagem nomeia o valor ruim. */
export class ErroDeArgumento extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeArgumento';
  }
}

export interface ArgumentosNovaUnidade {
  /** Pasta do período, pN de p1 a p10. */
  readonly periodo: string;
  /** Pasta da cadeira, em kebab-case sem acento. */
  readonly cadeira: string;
  /** Pasta da unidade, uN com N a partir de 1. */
  readonly unidade: string;
  readonly titulo: string;
  readonly peticao: boolean;
  /** Nome da cadeira, só quando ela é nova (--cadeira "Nome"). */
  readonly nomeCadeira?: string;
  /** Raiz do projeto. Padrão: a raiz deste repositório (uso em teste: --raiz). */
  readonly raiz?: string;
}

export const USO =
  'uso: npm run nova-unidade -- <pN> <cadeira> <uN> "Título" [--peticao] [--cadeira "Nome"]';

const PERIODO = /^p(?:10|[1-9])$/;
const CADEIRA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Lê os argumentos da linha de comando e recusa o que não tem o formato
 * (pN de 1 a 10, cadeira em kebab-case sem acento, uN a partir de 1, título
 * não vazio). Função pura: não toca o disco.
 */
export function interpretarArgumentos(argv: readonly string[]): ArgumentosNovaUnidade {
  const lido = lerFlags(argv);
  const [periodo, cadeira, unidade, titulo, ...sobra] = lido.positionals;
  if (
    periodo === undefined ||
    cadeira === undefined ||
    unidade === undefined ||
    titulo === undefined
  ) {
    throw new ErroDeArgumento(`faltam argumentos. ${USO}`);
  }
  if (sobra.length > 0) {
    throw new ErroDeArgumento(`argumentos demais: ${sobra.join(' ')}. ${USO}`);
  }
  if (!PERIODO.test(periodo)) {
    throw new ErroDeArgumento(`periodo inválido: "${periodo}". Use p1 a p10.`);
  }
  if (!CADEIRA.test(cadeira)) {
    throw new ErroDeArgumento(
      `cadeira inválida: "${cadeira}". Use kebab-case sem acento, por exemplo "filosofia-juridica".`
    );
  }
  if (lerIdDeUnidade(unidade) === undefined) {
    throw new ErroDeArgumento(
      `unidade inválida: "${unidade}". Use uN, com N a partir de 1, ou uN-grupo-topico (ex.: u3-material-apostila).`
    );
  }
  if (titulo.trim() === '') {
    throw new ErroDeArgumento('o título da unidade não pode ser vazio.');
  }
  const nomeCadeira = lido.values.cadeira;
  if (nomeCadeira !== undefined && nomeCadeira.trim() === '') {
    throw new ErroDeArgumento(
      '--cadeira precisa de um nome, por exemplo --cadeira "Filosofia Jurídica".'
    );
  }

  return {
    periodo,
    cadeira,
    unidade,
    titulo: titulo.trim(),
    peticao: lido.values.peticao === true,
    ...(nomeCadeira !== undefined ? { nomeCadeira: nomeCadeira.trim() } : {}),
    ...(lido.values.raiz !== undefined ? { raiz: lido.values.raiz } : {})
  };
}

function lerFlags(argv: readonly string[]) {
  try {
    return parseArgs({
      args: [...argv],
      allowPositionals: true,
      strict: true,
      options: {
        peticao: { type: 'boolean' },
        cadeira: { type: 'string' },
        raiz: { type: 'string' }
      }
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    throw new ErroDeArgumento(`${mensagem}. ${USO}`);
  }
}
