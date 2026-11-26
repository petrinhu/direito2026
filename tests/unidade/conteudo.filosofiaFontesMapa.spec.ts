import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MATERIAL_DE_AULA } from '../../src/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/mapa/fontes';

/**
 * FONTES-FM (critério da OS-0, 25/11/2026): as fontes das fichas de Filosofia u3, em mapa/<fase>.ts.
 *
 * Três tipos de entrada, três regras:
 *  - passagem citada (chaves `fonte` e `fontes`): leva localizador da obra, que é a divisão dela (Livro,
 *    cap., §, epístola, seção; "seção" é o termo da NBR 10520), ou página impressa (p./pp.). O PDF da
 *    disciplina sem numeração impressa, com a redação do Warat (guardada por sha256 em PDF_SEM_NUMERACAO,
 *    ou "(p. N do PDF)"), também vale. Locke cita por § e conta.
 *  - verbete online (Stanford e afins): não tem página; exige URL e "Acesso em".
 *  - obra inteira (chave `referencias`, sem localizador): não leva página. Leva edição quando a obra
 *    está no material da disciplina, isto é, quando a ficha lista MATERIAL_DE_AULA. Ficam de fora as
 *    obras que o líder decidiu que estão fora do material (Montesquieu, Pufendorf, Hegel, Bossuet,
 *    Proudhon, Habermas e o De Cive).
 *
 * Escopo: os campos `referencias`, `fonte` e `fontes` de cada ficha, em todos os mapa/*.ts da unidade.
 * A string padrão MATERIAL_DE_AULA não é fonte e fica de fora. O campo `obras` (lista de obras sem
 * passagem) também fica de fora. Maquiavel, Bodin e Marx já foram conferidos (R5-2).
 *
 * O que este teste PROVA: a forma (nomeia, tem localizador ou é obra inteira com edição, verbete tem URL).
 * Ele NÃO prova que a página confere com a obra: isso exige a edição física.
 */

const JA_CONFERIDOS = /Maquiavel|Bodin|Marx/;
const FORA_DO_MATERIAL = /MONTESQUIEU|PUFENDORF|HEGEL|BOSSUET|PROUDHON|HABERMAS|De Cive/i;
const CHAVES_DE_PASSAGEM = new Set(['fonte', 'fontes']);
const CHAVE_DE_REFERENCIA = 'referencias';
const NOMEIA_A_FONTE = /\p{Lu}\p{Ll}+/u;
const LOCALIZADOR_REGEX =
  /\bpp?\.\s*\d|§|\bdo PDF\b|\bLivro\s+[IVXLCDM\d]|\bcaps?\.|\bcap\.|\bcap[ií]tulos?\b|\bepístola\b|\bseção\b/i;
/**
 * Redação do Warat para PDF sem numeração impressa. Guardada por sha256 e tamanho, para o trecho não entrar
 * em claro no repositório: o teste compara cada janela desse tamanho do texto, em minúsculas, com o hash.
 */
const PDF_SEM_NUMERACAO = {
  sha256: 'ee528a0e1b979dec5f6b206b2841a90999d7c3943deb832219cb3b5c6ffba1b5',
  tamanho: 51
};

function sha256(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

function temPdfSemNumeracao(texto: string): boolean {
  const minusculo = texto.toLowerCase();
  for (let i = 0; i + PDF_SEM_NUMERACAO.tamanho <= minusculo.length; i += 1) {
    const janela = minusculo.slice(i, i + PDF_SEM_NUMERACAO.tamanho);
    if (sha256(janela) === PDF_SEM_NUMERACAO.sha256) return true;
  }
  return false;
}

function temLocalizador(texto: string): boolean {
  return LOCALIZADOR_REGEX.test(texto) || temPdfSemNumeracao(texto);
}
const VERBETE = /verbete/i;
const URL_DO_VERBETE = /https?:\/\/\S+/;
const ACESSO_EM = /Acesso em/;
const EDICAO = /\b\d+\s*\.?\s*[ªaº°]\s*ed\b|\bedi[cç][aã]o\b|PDF da disciplina/i;

const modulos = import.meta.glob<Record<string, unknown>>(
  '../../src/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/mapa/*.ts',
  { eager: true }
);

interface Fonte {
  cadeira: string;
  onde: string;
  ficha: string;
  chave: string;
  texto: string;
  emMaterial: boolean;
}

interface FichaDoModulo {
  arquivo: string;
  nome: string;
  objeto: unknown;
}

/** A cadeira é o segmento logo depois de src/conteudo/p1/ (ex.: filosofia-juridica). */
function cadeiraDe(caminho: string): string {
  return caminho.split('/src/conteudo/p1/')[1]?.split('/')[0] ?? caminho;
}

function linhaDoTexto(caminho: string, texto: string): number {
  const trecho = texto.slice(0, 40);
  const indice = readFileSync(caminho, 'utf-8')
    .split('\n')
    .findIndex((l) => l.includes(trecho));
  return indice === -1 ? 0 : indice + 1;
}

function coletarFontes(valor: unknown, ficha: FichaDoModulo, acc: Fonte[]): void {
  if (Array.isArray(valor)) {
    valor.forEach((item) => coletarFontes(item, ficha, acc));
    return;
  }
  if (!valor || typeof valor !== 'object') return;
  for (const [chave, conteudo] of Object.entries(valor)) {
    if (CHAVES_DE_PASSAGEM.has(chave) || chave === CHAVE_DE_REFERENCIA) {
      const textos: unknown[] = Array.isArray(conteudo) ? conteudo : [conteudo];
      const emMaterial = Array.isArray(conteudo) && conteudo.includes(MATERIAL_DE_AULA);
      for (const texto of textos) {
        if (typeof texto !== 'string' || texto === MATERIAL_DE_AULA) continue;
        const linha = linhaDoTexto(ficha.arquivo, texto);
        acc.push({
          cadeira: cadeiraDe(ficha.arquivo),
          onde: `${ficha.arquivo.split('/').slice(-2).join('/')}:${linha}`,
          ficha: ficha.nome,
          chave,
          texto,
          emMaterial
        });
      }
    } else {
      coletarFontes(conteudo, ficha, acc);
    }
  }
}

function fichasDasUnidades(): FichaDoModulo[] {
  const fichas: FichaDoModulo[] = [];
  for (const [caminhoRelativo, modulo] of Object.entries(modulos)) {
    const arquivo = fileURLToPath(new URL(caminhoRelativo, import.meta.url));
    for (const exportado of Object.values(modulo)) {
      const itens: unknown[] = Array.isArray(exportado) ? exportado : [exportado];
      for (const item of itens) {
        if (
          item &&
          typeof item === 'object' &&
          typeof (item as { nome?: unknown }).nome === 'string'
        ) {
          fichas.push({ arquivo, nome: (item as { nome: string }).nome, objeto: item });
        }
      }
    }
  }
  return fichas.filter((f) => !JA_CONFERIDOS.test(f.nome));
}

const fontes: Fonte[] = [];
const fichas = fichasDasUnidades();
for (const ficha of fichas) coletarFontes(ficha.objeto, ficha, fontes);

const semNome = fontes.filter((f) => !NOMEIA_A_FONTE.test(f.texto) || f.texto.trim().length < 12);
const passagensSemLocalizador = fontes.filter(
  (f) => CHAVES_DE_PASSAGEM.has(f.chave) && !temLocalizador(f.texto)
);
const verbetesSemUrlOuAcesso = fontes.filter(
  (f) => VERBETE.test(f.texto) && !(URL_DO_VERBETE.test(f.texto) && ACESSO_EM.test(f.texto))
);
const obrasInteirasSemEdicao = fontes.filter(
  (f) =>
    f.chave === CHAVE_DE_REFERENCIA &&
    f.emMaterial &&
    !VERBETE.test(f.texto) &&
    !temLocalizador(f.texto) &&
    !FORA_DO_MATERIAL.test(f.texto) &&
    !EDICAO.test(f.texto)
);

function listar(achados: Fonte[]): string {
  return achados.map((f) => `[${f.cadeira}] ${f.onde} | ${f.ficha} | ${f.texto}`).join('\n');
}

describe('FONTES-FM: fontes das fichas de Filosofia u3', () => {
  it('há fichas e fontes para conferir (escopo não vazio)', () => {
    expect(fichas.length).toBeGreaterThan(0);
    expect(fontes.length).toBeGreaterThan(0);
  });

  it('toda fonte nomeia a obra ou o autor', () => {
    expect(semNome, listar(semNome)).toEqual([]);
  });

  it('toda passagem citada traz localizador: divisão da obra, § ou página impressa (ou o PDF sem numeração)', () => {
    expect(passagensSemLocalizador, listar(passagensSemLocalizador)).toEqual([]);
  });

  it('todo verbete online traz URL e "Acesso em"', () => {
    expect(verbetesSemUrlOuAcesso, listar(verbetesSemUrlOuAcesso)).toEqual([]);
  });

  it('toda obra inteira do material declara a edição (obras fora do material ficam de fora)', () => {
    expect(obrasInteirasSemEdicao, listar(obrasInteirasSemEdicao)).toEqual([]);
  });
});
