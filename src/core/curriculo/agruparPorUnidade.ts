import { ErroDeConteudo } from './erroDeConteudo';
import { ORDEM_ABAS } from './ordemAbas';
import type { ChaveAba } from './tipos';

/** Partes de uma unidade que são arquivo de conteúdo (uma por aba, mais meta). */
export interface ArquivosDaUnidade {
  readonly meta: string;
  readonly resumo?: string;
  readonly mapaFichamento?: string;
  readonly mnemonicos?: string;
  readonly peticao?: string;
  /** `quiz.ts` ou `quiz/index.ts`, conforme a forma escolhida pela unidade. */
  readonly quiz?: string;
  /** Gerado pelo build a partir das citações; não é aba. */
  readonly dispositivos?: string;
}

export interface UnidadeDescoberta {
  /** Ex.: 'p1/intr-direito/u1'. */
  readonly chave: string;
  readonly periodo: string;
  readonly cadeira: string;
  readonly unidade: string;
  readonly arquivos: ArquivosDaUnidade;
  /** Abas que a unidade tem, na ordem de ORDEM_ABAS. */
  readonly abas: readonly ChaveAba[];
}

/**
 * Casa `pN/cadeira/unidade/resto` em qualquer prefixo (alias do Vite, caminho
 * absoluto de disco). Caminho sem os três segmentos (ex.: cadeira.ts, a
 * própria cadeira) não casa e é ignorado aqui: quem o descreve é o currículo.
 */
const CAMINHO_DE_UNIDADE = /(?:^|\/)(p\d+)\/([^/]+)\/([^/]+)\/(.+)$/;
const ID_UNIDADE = /^u\d+$/;
const ARQUIVO_TS = /^[^/]+\.ts$/;

type ParteDoArquivo = keyof ArquivosDaUnidade;

const PARTE_POR_NOME_DE_ARQUIVO: Readonly<Record<string, ParteDoArquivo>> = {
  'meta.ts': 'meta',
  'resumo.ts': 'resumo',
  'mapaFichamento.ts': 'mapaFichamento',
  'mnemonicos.ts': 'mnemonicos',
  'peticao.ts': 'peticao',
  'quiz.ts': 'quiz',
  'dispositivos.ts': 'dispositivos'
};

interface RegistroBruto {
  readonly chave: string;
  readonly periodo: string;
  readonly cadeira: string;
  readonly unidade: string;
  readonly arquivos: Partial<Record<ParteDoArquivo, string>>;
  quizArquivo?: string;
  quizIndex?: string;
  quizTemPasta: boolean;
}

/**
 * Descobre as unidades a partir da lista de caminhos dos arquivos de conteúdo.
 * Função pura: não lê disco nem glob. Quem chama (glob no site, fs nos scripts)
 * entrega os caminhos, e o resultado é o mesmo nos dois.
 */
export function agruparPorUnidade(caminhos: readonly string[]): UnidadeDescoberta[] {
  const registros = new Map<string, RegistroBruto>();

  for (const caminho of caminhos) {
    const casa = CAMINHO_DE_UNIDADE.exec(caminho);
    if (!casa) continue;
    const periodo = casa[1] ?? '';
    const cadeira = casa[2] ?? '';
    const unidade = casa[3] ?? '';
    const resto = casa[4] ?? '';
    if (!ID_UNIDADE.test(unidade)) {
      throw new ErroDeConteudo(
        `unidade fora do padrão uN: ${periodo}/${cadeira}/${unidade} (${caminho})`
      );
    }
    const chave = `${periodo}/${cadeira}/${unidade}`;
    const registro = registros.get(chave) ?? criarRegistro(chave, periodo, cadeira, unidade);
    registros.set(chave, registro);
    registrarArquivo(registro, caminho, resto);
  }

  return [...registros.values()]
    .sort((a, b) => (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0))
    .map(fecharUnidade);
}

function criarRegistro(
  chave: string,
  periodo: string,
  cadeira: string,
  unidade: string
): RegistroBruto {
  return { chave, periodo, cadeira, unidade, arquivos: {}, quizTemPasta: false };
}

function registrarArquivo(registro: RegistroBruto, caminho: string, resto: string): void {
  if (resto.startsWith('quiz/')) {
    registro.quizTemPasta = true;
    const sub = resto.slice('quiz/'.length);
    if (sub === 'index.ts') {
      registro.quizIndex = caminho;
    } else if (!ARQUIVO_TS.test(sub)) {
      throw new ErroDeConteudo(`caminho não reconhecido em ${registro.chave}: ${resto}`);
    }
    return;
  }
  if (!ARQUIVO_TS.test(resto)) {
    throw new ErroDeConteudo(`caminho não reconhecido em ${registro.chave}: ${resto}`);
  }
  const parte = PARTE_POR_NOME_DE_ARQUIVO[resto];
  if (!parte) {
    throw new ErroDeConteudo(`arquivo não reconhecido em ${registro.chave}: ${resto}`);
  }
  if (parte === 'quiz') {
    registro.quizArquivo = caminho;
    return;
  }
  registro.arquivos[parte] = caminho;
}

function fecharUnidade(registro: RegistroBruto): UnidadeDescoberta {
  const { chave } = registro;
  if (!registro.arquivos.meta) {
    throw new ErroDeConteudo(`pasta de unidade sem meta.ts em ${chave}`);
  }
  if (registro.quizArquivo && registro.quizTemPasta) {
    throw new ErroDeConteudo(`quiz.ts e pasta quiz/ ao mesmo tempo em ${chave}`);
  }
  if (registro.quizTemPasta && !registro.quizIndex) {
    throw new ErroDeConteudo(`pasta quiz/ sem quiz/index.ts em ${chave}`);
  }

  const arquivos: Partial<Record<ParteDoArquivo, string>> = { ...registro.arquivos };
  const quiz = registro.quizIndex ?? registro.quizArquivo;
  if (quiz) arquivos.quiz = quiz;

  return {
    chave,
    periodo: registro.periodo,
    cadeira: registro.cadeira,
    unidade: registro.unidade,
    arquivos: arquivos as ArquivosDaUnidade,
    abas: ORDEM_ABAS.filter((aba) => abaPresente(aba, arquivos))
  };
}

function abaPresente(aba: ChaveAba, arquivos: Partial<Record<ParteDoArquivo, string>>): boolean {
  switch (aba) {
    case 'resumo':
      return arquivos.resumo !== undefined;
    case 'mapa':
    case 'fichamento':
      return arquivos.mapaFichamento !== undefined;
    case 'mnemonicos':
      return arquivos.mnemonicos !== undefined;
    case 'peticao':
      return arquivos.peticao !== undefined;
    case 'quiz':
      return arquivos.quiz !== undefined;
  }
}
