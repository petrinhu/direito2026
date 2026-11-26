import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * HART-PAGINACAO, critério da OS-0 (25/11/2026), sobre a decisão do líder de 23/11/2026 (citar a página
 * IMPRESSA da edição declarada, padrão ABNT).
 *
 * Varre src/conteudo atrás de citações de O Conceito de Direito (H. L. A. Hart) e reprova:
 *  - a citação sem localizador: página (p. / pp.), capítulo (cap. / caps. / capítulo) ou Pós-escrito;
 *  - a página marcada como "do PDF" ou entre colchetes, que não é a página impressa;
 *  - a referência bibliográfica que não declara a 3.ª edição (a da tradução da Fundação Calouste
 *    Gulbenkian, exigida pelo líder). A "segunda edição (1994)" é do original e não serve.
 *
 * Fora da varredura, por desenho: textoIntegral.ts (corpo do livro, paginado em colchetes), meta.ts
 * (descrição da unidade) e as linhas `obras:` inteiras (lista de obras, sem passagem citada).
 *
 * Isenção de menção em prosa: só as ocorrências listadas em MENCAO_EM_PROSA, pelo sha256 do trecho exato e pelo
 * arquivo. A isenção vale por ocorrência (só o título dentro do trecho), nunca pela linha inteira, e
 * nunca em linha de `fonte:`, `fontes:` ou `referencias:`: texto nesses campos é sempre citação.
 *
 * Dispensa de localizador: só em `referencias:` dos mapas de Filosofia u3 (mapa/), porque a obra inteira
 * segue a regra de FONTES-FM. A checagem de 3.ª edição e a de "do PDF" continuam valendo ali.
 *
 * O que este teste PROVA: a forma da citação (tem localizador, não marca PDF, declara a 3.ª edição).
 * Ele NÃO prova que a página é a impressa: isso exige a edição física, que não está nesta máquina.
 *
 * A prova do próprio critério está no fim do arquivo: casos de exemplo, sem mutação do conteúdo.
 */

const RAIZ = fileURLToPath(new URL('../../src/conteudo', import.meta.url));
const FORA_DO_ESCOPO = new Set(['textoIntegral.ts', 'meta.ts']);
const MAPA_FILOSOFIA_U3 = 'p1/filosofia-juridica/u3-moderna-contemporanea/mapa/';
const TITULO_TEXTO = 'O Conceito de Direito';
/**
 * Casa o título sem diferenciar maiúsculas e minúsculas ("O conceito de Direito" também entra), com
 * fronteira de palavra (não casa dentro de "do conceito") e só quando o título é seguido de pontuação,
 * de fecho de citação ou de "cap.", para não pegar a expressão genérica "o conceito de direito objetivo".
 */
const TITULO =
  /\bO Conceito de Direito(?=\s*(?:[,.;:)<'"“”`(]|\s+(?:cap|Cap|capítulo|Capítulo|tradução|Tradução)|$))/gi;

/**
 * Menção ao título em prosa, que não é citação (só nomeia a obra, sem atribuir passagem). Cada entrada guarda o
 * arquivo relativo a src/conteudo, o sha256 e o tamanho do trecho exato: o texto de estudo não entra em claro no
 * repositório. O teste compara, em cada linha do arquivo, toda janela desse tamanho com o hash (sensível a caixa).
 * Crases e aspas entram no trecho quando fazem parte da frase, para não isentar outra frase igual no mesmo arquivo.
 */
interface Mencao {
  arquivo: string;
  sha256: string;
  tamanho: number;
}

const MENCAO_EM_PROSA: readonly Mencao[] = [
  {
    arquivo: 'p1/intr-direito/u1/quiz.ts',
    sha256: '155b69faa726bf15db7fdf64acffa8bc6a6255cda407df874c9d444d1c4e4f31',
    tamanho: 32
  },
  {
    arquivo: 'p1/intr-direito/u1/resumo.ts',
    sha256: '3514c9e35efd3bdc1a8a3d733595e5e7fd1d705ce89ec3c3b00b4c10b2f436e2',
    tamanho: 39
  },
  {
    arquivo: 'p1/intr-direito/u3-livro-regras-primarias-secundarias/resumo.ts',
    sha256: '81cb0e2b6936773ef3bd8d2e7cfd7c47a8420c01411739a074d06a45c6d9dd65',
    tamanho: 45
  },
  {
    arquivo: 'p1/intr-direito/u3-material-norma-interpretacao/mapaFichamento.ts',
    sha256: '722a9eedabf86bd9babb336c440eaa3801fcfd8046fc3a36a22fff04a8aa56f2',
    tamanho: 30
  },
  {
    arquivo: 'p1/intr-direito/u3-material-norma-interpretacao/quiz/norma.ts',
    sha256: '6be10cb9b1c3000fa97c87d2d4d0b1c5d12c17d0790cf33800c6d115cd22cfe0',
    tamanho: 42
  },
  {
    arquivo: 'p1/intr-direito/u3-material-norma-interpretacao/quiz/norma.ts',
    sha256: '988fd6dd5363c9eb5b42a5e22132727ad9358d64f06ff5ed6df6562d26757e84',
    tamanho: 43
  },
  {
    arquivo: 'p1/intr-direito/u3-material-norma-interpretacao/resumo.ts',
    sha256: 'be7f342e6572bcdc48763c74c8518ee33088eeedf98ffc66c1859ce351b30bb9',
    tamanho: 49
  },
  {
    arquivo: 'p1/intr-direito/u3-material-norma-interpretacao/resumo.ts',
    sha256: '6d5c1a921174e83ee8f117e0de690ececad1345d1672caef7121254ffdc341a9',
    tamanho: 25
  }
];

function sha256(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

/** Localizador aceito: página, capítulo (capítulo inteiro) ou Pós-escrito. */
const LOCALIZADOR = /\bpp?\.\s*\d|\bcaps?\.|\bcap[ií]tulos?\b|\bPós-escrito\b/i;
const PAGINA_NAO_IMPRESSA = /do PDF|\[\s*\d/i;
/** A referência bibliográfica começa pelo nome do autor seguido de vírgula, antes do título. */
const AUTOR_ANTES_DO_TITULO =
  /(\bHART,|\bH\.\s?L\.\s?A\.\s?Hart,|\bHart,)\s*(H\.\s?L\.\s?A\.\s*)?["“]?\s*$/;
/** Terceira edição da tradução (3.ª ed.). A segunda e o original não servem. */
const TERCEIRA_EDICAO = /\b3\s*\.?\s*[ªaº°]\s*ed\b|\bterceira\s+edi[cç][aã]o\b/i;
/** Abertura de bloco de campo: `obras:` é lista sem passagem; os outros são citação. */
const ABERTURA_DE_CAMPO = /^\s*(obras|fonte|fontes|referencias):/;

interface Achado {
  cadeira: string;
  onde: string;
  trecho: string;
}

interface Avaliacao {
  total: number;
  semLocalizador: Achado[];
  paginaNaoImpressa: Achado[];
  semTerceiraEdicao: Achado[];
}

function arquivosDeConteudo(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivosDeConteudo(caminho);
    return nome.endsWith('.ts') && !FORA_DO_ESCOPO.has(nome) ? [caminho] : [];
  });
}

/** Do início do título até o próximo fecho de citação (aspa, crase, "<") ou o próximo título. */
function trechoDaCitacao(linha: string, inicio: number, proximoTitulo: number): string {
  let corpo = inicio + TITULO_TEXTO.length;
  if (/["”]/.test(linha.charAt(corpo))) corpo += 1;
  const limite = proximoTitulo > inicio ? proximoTitulo : linha.length;
  const resto = linha.slice(corpo, Math.min(limite, corpo + 220));
  const fecho = resto.search(/[<'"`“”]/);
  const final = fecho === -1 ? resto : resto.slice(0, fecho);
  return linha.slice(inicio, corpo) + final;
}

/** Faixas [início, fim) de cada trecho isento na linha, no arquivo dado: toda janela de mesmo tamanho cujo hash casa. */
function faixasDeMencao(
  arquivo: string,
  linha: string,
  lista: readonly Mencao[]
): Array<[number, number]> {
  return lista
    .filter((m) => m.arquivo === arquivo)
    .flatMap((m) => {
      const faixas: Array<[number, number]> = [];
      for (let posicao = 0; posicao + m.tamanho <= linha.length; posicao += 1) {
        if (sha256(linha.slice(posicao, posicao + m.tamanho)) === m.sha256)
          faixas.push([posicao, posicao + m.tamanho]);
      }
      return faixas;
    });
}

function cadeiraDe(arquivo: string): string {
  return arquivo.split('/')[1] ?? arquivo;
}

function vazia(): Avaliacao {
  return { total: 0, semLocalizador: [], paginaNaoImpressa: [], semTerceiraEdicao: [] };
}

/**
 * Avalia um arquivo de conteúdo, linha a linha. Função pura: recebe o caminho relativo a src/conteudo e
 * as linhas, e devolve os achados. A varredura real e os casos de exemplo usam esta mesma função.
 */
function avaliarArquivo(
  arquivo: string,
  linhas: readonly string[],
  lista: readonly Mencao[] = MENCAO_EM_PROSA
): Avaliacao {
  const v = vazia();
  const dispensaLocalizador = arquivo.startsWith(MAPA_FILOSOFIA_U3);

  const avaliarLinha = (linha: string, i: number, chave: string | null): void => {
    const posicoes = [...linha.matchAll(TITULO)].map((m) => m.index ?? 0);
    if (posicoes.length === 0) return;
    const isenta = chave === null ? faixasDeMencao(arquivo, linha, lista) : [];
    const dispensado = chave === 'referencias' && dispensaLocalizador;
    posicoes.forEach((inicio, k) => {
      if (isenta.some(([de, ate]) => inicio >= de && inicio < ate)) return;
      v.total += 1;
      const trecho = trechoDaCitacao(linha, inicio, posicoes[k + 1] ?? -1);
      const achado: Achado = {
        cadeira: cadeiraDe(arquivo),
        onde: `${arquivo}:${i + 1}`,
        trecho: trecho.slice(0, 110)
      };
      if (!dispensado && !LOCALIZADOR.test(trecho)) v.semLocalizador.push(achado);
      if (PAGINA_NAO_IMPRESSA.test(trecho)) v.paginaNaoImpressa.push(achado);
      const antes = linha.slice(Math.max(0, inicio - 40), inicio);
      if (AUTOR_ANTES_DO_TITULO.test(antes) && !TERCEIRA_EDICAO.test(linha))
        v.semTerceiraEdicao.push(achado);
    });
  };

  let bloco: { chave: string; obras: boolean } | null = null;
  linhas.forEach((linha, i) => {
    if (bloco) {
      const { chave, obras } = bloco;
      if (linha.includes(']')) bloco = null;
      if (!obras) avaliarLinha(linha, i, chave);
      return;
    }
    const abertura = ABERTURA_DE_CAMPO.exec(linha);
    if (!abertura) {
      avaliarLinha(linha, i, null);
      return;
    }
    const chave = abertura[1];
    if (chave === undefined) {
      avaliarLinha(linha, i, null);
      return;
    }
    const obras = chave === 'obras';
    if (linha.includes('[') && !linha.includes(']')) bloco = { chave, obras };
    if (!obras) avaliarLinha(linha, i, chave);
  });
  return v;
}

function varrer(): Avaliacao {
  const total = vazia();
  for (const caminho of arquivosDeConteudo(RAIZ)) {
    const arquivo = relative(RAIZ, caminho);
    const parcial = avaliarArquivo(arquivo, readFileSync(caminho, 'utf-8').split('\n'));
    total.total += parcial.total;
    total.semLocalizador.push(...parcial.semLocalizador);
    total.paginaNaoImpressa.push(...parcial.paginaNaoImpressa);
    total.semTerceiraEdicao.push(...parcial.semTerceiraEdicao);
  }
  return total;
}

const varredura = varrer();

function listar(achados: Achado[]): string {
  return [...achados]
    .sort((a, b) => a.cadeira.localeCompare(b.cadeira) || a.onde.localeCompare(b.onde))
    .map((a) => `[${a.cadeira}] ${a.onde} | ${a.trecho}`)
    .join('\n');
}

describe('HART-PAGINACAO: citações de O Conceito de Direito em src/conteudo', () => {
  it('o escopo não ficou vazio (há citações para varrer)', () => {
    expect(varredura.total).toBeGreaterThan(0);
  });

  it('toda citação de O Conceito de Direito traz localizador: página, capítulo ou Pós-escrito', () => {
    expect(varredura.semLocalizador, listar(varredura.semLocalizador)).toEqual([]);
  });

  it('nenhuma página é marcada como "do PDF" ou vem entre colchetes', () => {
    expect(varredura.paginaNaoImpressa, listar(varredura.paginaNaoImpressa)).toEqual([]);
  });

  it('toda referência bibliográfica declara a 3.ª edição da tradução', () => {
    expect(varredura.semTerceiraEdicao, listar(varredura.semTerceiraEdicao)).toEqual([]);
  });
});

/**
 * Prova do critério, com casos de exemplo dentro do próprio teste (sem mutar o conteúdo). Cada caso diz
 * o que o critério tem de pegar; se um deles deixar de reprovar, a varredura real perde a rede. Os trechos
 * são inventados: a isenção de teste é hasheada na hora, como as de MENCAO_EM_PROSA, e nenhuma frase das
 * fontes entra neste arquivo.
 */
describe('HART-PAGINACAO: o critério reprova o que deve (casos de exemplo)', () => {
  const ARQUIVO_INTRO = 'p1/intr-direito/u1/resumo.ts';
  const ARQUIVO_NORMA = 'p1/intr-direito/u3-material-norma-interpretacao/quiz/norma.ts';
  const ARQUIVO_RESUMO_NORMA = 'p1/intr-direito/u3-material-norma-interpretacao/resumo.ts';
  const ARQUIVO_POSITIVISMO = 'p1/filosofia-juridica/u3-moderna-contemporanea/mapa/positivismo.ts';

  /** Isenção de teste: trecho inventado, guardado por hash no próprio teste. */
  function isencaoDeTeste(arquivo: string, trecho: string): Mencao {
    return { arquivo, sha256: sha256(trecho), tamanho: trecho.length };
  }

  it('menção nova, fora da lista, no mesmo arquivo de uma isenta, continua reprovando', () => {
    const r = avaliarArquivo(ARQUIVO_NORMA, [
      '        `O Conceito de Direito, de Autor Fictício, traz a tese inventada.`,'
    ]);
    expect(r.semLocalizador).toHaveLength(1);
  });

  it('a isenção é por ocorrência: uma citação sem localizador ao lado de uma menção isenta reprova', () => {
    const isenta = [isencaoDeTeste(ARQUIVO_NORMA, '`O Conceito de Direito, de Autor Fictício.`')];
    const r = avaliarArquivo(
      ARQUIVO_NORMA,
      [
        '        `O Conceito de Direito, de Autor Fictício.` e também O Conceito de Direito, sem localizador.'
      ],
      isenta
    );
    expect(r.total).toBe(1);
    expect(r.semLocalizador).toHaveLength(1);
  });

  it('linha de fonte: com trecho isento reprova (fonte nunca é menção); a mesma frase em linha comum passa (controle)', () => {
    const isenta = [
      isencaoDeTeste(ARQUIVO_RESUMO_NORMA, 'em O Conceito de Direito, de Autor Fictício.')
    ];
    const fonte = avaliarArquivo(
      ARQUIVO_RESUMO_NORMA,
      ["    fonte: 'Estudo de apoio, em O Conceito de Direito, de Autor Fictício.',"],
      isenta
    );
    expect(fonte.semLocalizador).toHaveLength(1);
    const comum = avaliarArquivo(
      ARQUIVO_RESUMO_NORMA,
      ['    Estudo de apoio, em O Conceito de Direito, de Autor Fictício.'],
      isenta
    );
    expect(comum.total).toBe(0);
    expect(comum.semLocalizador).toHaveLength(0);
  });

  it('linha de referencias: de Filosofia sem 3.ª edição reprova, mesmo com a dispensa de localizador', () => {
    const r = avaliarArquivo(ARQUIVO_POSITIVISMO, [
      "  referencias: [MATERIAL_DE_AULA, 'HART, O Conceito de Direito (1961).'],"
    ]);
    expect(r.semTerceiraEdicao).toHaveLength(1);
    expect(r.semLocalizador).toHaveLength(0);
  });

  it('a mesma linha de referencias: de Filosofia, com "do PDF", reprova', () => {
    const r = avaliarArquivo(ARQUIVO_POSITIVISMO, [
      "  referencias: ['HART, O Conceito de Direito, tradução Inventada, 3.ª ed., p. 9 do PDF.'],"
    ]);
    expect(r.paginaNaoImpressa).toHaveLength(1);
  });

  it('a mesma linha de referencias: de Filosofia, com 3.ª edição e sem "do PDF", passa (controle)', () => {
    const r = avaliarArquivo(ARQUIVO_POSITIVISMO, [
      "  referencias: ['HART, O Conceito de Direito, tradução Inventada, 3.ª ed.'],"
    ]);
    expect(r.semTerceiraEdicao).toHaveLength(0);
    expect(r.semLocalizador).toHaveLength(0);
    expect(r.paginaNaoImpressa).toHaveLength(0);
  });

  it('a dispensa de localizador vale só em referencias: de Filosofia u3, não em outra cadeira', () => {
    const r = avaliarArquivo(ARQUIVO_INTRO, [
      "  referencias: ['HART, O Conceito de Direito, tradução, 3.ª ed.'],"
    ]);
    expect(r.semLocalizador).toHaveLength(1);
  });

  it('referencias: de várias linhas em Filosofia u3 é lido como bloco: sem 3.ª edição reprova', () => {
    const r = avaliarArquivo(ARQUIVO_POSITIVISMO, [
      '  referencias: [FONTE_INVENTADA,',
      "    'HART, O Conceito de Direito (1961).',",
      '  ],'
    ]);
    expect(r.semTerceiraEdicao).toHaveLength(1);
  });

  it('referencias: de Hart em Filosofia u3 sem 3.ª edição reprova, mesmo sem localizador (dispensa só vale para o localizador)', () => {
    const r = avaliarArquivo(ARQUIVO_POSITIVISMO, [
      "  referencias: [MATERIAL_DE_AULA, 'HART, O Conceito de Direito, trad. Autor Fictício, Editora Inventada, original de 1961.'],"
    ]);
    expect(r.semTerceiraEdicao).toHaveLength(1);
    expect(r.semLocalizador).toHaveLength(0);
  });

  it('menção nova em prosa de outra cadeira, sem localizador, reprova', () => {
    const r = avaliarArquivo(ARQUIVO_INTRO, [
      "    '“O Conceito de Direito” é o livro de Hart, sem passagem.'"
    ]);
    expect(r.semLocalizador).toHaveLength(1);
  });
});
