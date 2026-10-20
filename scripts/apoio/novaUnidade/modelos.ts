/**
 * Textos dos arquivos-modelo que o gerador escreve. Cada modelo é um TS
 * válido, já no estado vazio que passa na validação, com um comentário curto
 * com as regras de texto do líder. As regras moram em comentário e nunca em
 * valor exportado: os validadores só varrem valores.
 */

import {
  TEXTO_PENDENTE_CURTO,
  TEXTO_PENDENTE_META
} from '../../../src/core/conteudo/regrasDeTexto';

export interface EntradaDaUnidade {
  readonly periodo: string;
  readonly nomeDaCadeira: string;
  readonly unidade: string;
  readonly titulo: string;
  readonly peticao: boolean;
}

export interface EntradaDaCadeira {
  readonly periodo: string;
  readonly nome: string;
  readonly ordem: number;
}

const REGRAS_DE_TEXTO = [
  'Regras de texto (ordem do líder):',
  '- Nunca "na aula X", "no slide Y" nem "o material": a fonte é a disciplina.',
  '- Fonte genérica, sempre: "Material de aula da disciplina.".',
  '- Sem travessão (nem em-dash, nem en-dash).',
  '- Sem nome de pessoa da turma, do professor ou da instituição.'
];

/** Um literal de texto entre apóstrofos, com \ e ' escapados (o nome pode ter apóstrofo). */
export function literal(texto: string): string {
  return `'${texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Comentário de bloco com um parágrafo e as regras do líder. */
function comentario(descricao: string[], extras: string[] = []): string {
  const linhas = [...descricao, '', ...REGRAS_DE_TEXTO, ...extras];
  return `/**\n${linhas.map((linha) => (linha === '' ? ' *' : ` * ${linha}`)).join('\n')}\n */`;
}

function numeroDaUnidade(unidade: string): string {
  return unidade.slice(1);
}

function numeroDoPeriodo(periodo: string): string {
  return periodo.slice(1);
}

/** Os arquivos de uma unidade nova, pelo caminho relativo à pasta da unidade. */
export function modeloDaUnidade(entrada: EntradaDaUnidade): Record<string, string> {
  const arquivos: Record<string, string> = {
    'meta.ts': modeloDoMeta(entrada),
    'resumo.ts': modeloDoResumo(),
    'mapaFichamento.ts': modeloDoMapa(entrada),
    'mnemonicos.ts': modeloDosMnemonicos(),
    'quiz/index.ts': modeloDoQuiz()
  };
  if (entrada.peticao) {
    arquivos['peticao.ts'] = modeloDaPeticao(entrada);
  }
  return arquivos;
}

/** Descrição da cadeira nova (cadeira.ts). Nasce em-breve, sem atalho e sem restrição. */
export function modeloDaCadeira(entrada: EntradaDaCadeira): string {
  const descricao = [
    `Cadeira do ${numeroDoPeriodo(entrada.periodo)}º período. Esta pasta se descreve: nome, ordem`,
    'no menu e estado vêm daqui. Nasce em-breve; publicar é trocar o estado para',
    "'publicado' quando ao menos uma unidade estiver publicada."
  ];
  return [
    "import type { DescricaoCadeira } from '../../tipos';",
    '',
    `/**\n${descricao.map((linha) => ` * ${linha}`).join('\n')}\n */`,
    'export const cadeira: DescricaoCadeira = {',
    `  nome: ${literal(entrada.nome)},`,
    `  ordem: ${entrada.ordem},`,
    "  estado: 'em-breve'",
    '};',
    ''
  ].join('\n');
}

function modeloDoMeta(entrada: EntradaDaUnidade): string {
  const subtitulo = `${entrada.nomeDaCadeira} · Unidade ${numeroDaUnidade(entrada.unidade)} · faculdade · ${numeroDoPeriodo(entrada.periodo)}º período`;
  return [
    "import type { MetaUnidade } from '../../../tipos';",
    '',
    comentario([
      `Metadados da Unidade ${numeroDaUnidade(entrada.unidade)}. Nasce em-breve: a unidade fica`,
      "fora do menu até o estado virar 'publicado', e isso só depois de o resumo, o mapa,",
      'o fichamento, os mnemônicos e o quiz terem texto.'
    ]),
    'export const meta: MetaUnidade = {',
    `  rotulo: ${literal(`Unidade ${numeroDaUnidade(entrada.unidade)}`)},`,
    "  estado: 'em-breve',",
    `  titulo: ${literal(entrada.titulo)},`,
    `  subtitulo: ${literal(subtitulo)},`,
    `  descricao: ${literal(TEXTO_PENDENTE_META)}`,
    '};',
    ''
  ].join('\n');
}

function modeloDoResumo(): string {
  return [
    "import type { BlocoResumo } from '../../../tipos';",
    '',
    comentario(
      [
        'Resumo da unidade, em blocos teóricos. Nasce vazio.',
        'Cada bloco: id estável (bloco-0, bloco-1...), numero a partir de 1, titulo sem',
        '"Bloco N" (a página já numera), fonte, corpoHtml sem repetir a fonte, resumo',
        '(itens curtos) e exemploHtml.'
      ],
      []
    ),
    'export const resumo: readonly BlocoResumo[] = [];',
    ''
  ].join('\n');
}

function modeloDoMapa(entrada: EntradaDaUnidade): string {
  return [
    "import type { MapaFichamento } from '../../../tipos';",
    '',
    comentario([
      'Mapa mental e fichamento da unidade. Nasce sem eras nem pensadores.',
      'Cada pensador aponta para um bloco do resumo (blocoResumo) que existe.'
    ]),
    'export const mapaFichamento: MapaFichamento = {',
    `  titulo: ${literal(entrada.titulo)},`,
    '  eras: [],',
    '  pensadores: []',
    '};',
    ''
  ].join('\n');
}

function modeloDosMnemonicos(): string {
  return [
    "import type { Mnemonico } from '../../../tipos';",
    '',
    comentario([
      'Mnemônicos da unidade: apoios de memória para o que mais se confunde. Nasce vazio.',
      'Cada um aponta para um bloco do resumo (blocoResumo) e declara a técnica usada.'
    ]),
    'export const mnemonicos: readonly Mnemonico[] = [];',
    ''
  ].join('\n');
}

function modeloDoQuiz(): string {
  return [
    "import type { PerguntaQuiz } from '../../../../tipos';",
    '',
    comentario([
      'Quiz da unidade: múltipla escolha, com quatro alternativas (ou cinco, sempre o mesmo',
      'número em todo o quiz). Nasce vazio. A explicação nunca cita letra nem posição de',
      'alternativa, porque o motor embaralha as respostas.'
    ]),
    'export const quiz: readonly PerguntaQuiz[] = [];',
    ''
  ].join('\n');
}

function modeloDaPeticao(entrada: EntradaDaUnidade): string {
  return [
    "import type { PecaComentada } from '../../../tipos';",
    '',
    comentario([
      'Peça comentada da unidade. Nasce sem seções: a peça e o comentário entram',
      'quando houver texto.'
    ]),
    'export const peticao: PecaComentada = {',
    `  titulo: ${literal(`Peça comentada: ${entrada.titulo}`)},`,
    `  notaHtml: '<p>${TEXTO_PENDENTE_CURTO}</p>',`,
    '  secoes: []',
    '};',
    ''
  ].join('\n');
}
