import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { carregadoresDoDisco } from './apoio/conteudoDoDisco';
import type { PerguntaQuiz } from '../src/core/unidade/tipos';
import type { FormaPergunta } from '../src/core/quiz/tipos';

/**
 * Gera a forma congelada dos quizzes (AV3-K4): para cada unidade com quiz, a lista
 * ORDENADA, na ordem do conteúdo, de id, tipo e número de alternativas. Não grava
 * nenhum texto. As respostas salvas antes da K4 indexam essa forma, então ela é
 * gerada UMA vez e nunca mais: se o arquivo já existe, este script recusa.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const SAIDA = resolve(RAIZ, 'src/app/quiz/formasCongeladas.ts');

function formaDe(pergunta: PerguntaQuiz): FormaPergunta {
  if (pergunta.tipo === 'verdadeiro-ou-falso') {
    return { id: pergunta.id, tipo: 'vf', alternativas: 2 };
  }
  return {
    id: pergunta.id,
    tipo: 'mc',
    alternativas: pergunta.alternativasHtml.length as 4 | 5
  };
}

function shaDoCommit(): string {
  return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: RAIZ }).toString().trim();
}

function renderizar(formas: Record<string, readonly FormaPergunta[]>, sha: string): string {
  const blocos = Object.entries(formas).map(([chave, lista]) => {
    const linhas = lista.map(
      (f) => `    { id: ${f.id}, tipo: '${f.tipo}', alternativas: ${f.alternativas} }`
    );
    return `  '${chave}': [\n${linhas.join(',\n')}\n  ]`;
  });
  return [
    `// Gerado por scripts/gerar-formas-congeladas.ts a partir do commit ${sha}.`,
    '// NÃO REGENERAR: esta forma é a que as respostas salvas antes da K4 (AV3-K4)',
    '// indexam. Mudar o conteúdo não muda este arquivo; o script recusa sobrescrever.',
    "import type { FormaPergunta } from '@/core/quiz/tipos';",
    '',
    'export const FORMAS_CONGELADAS: Readonly<Record<string, readonly FormaPergunta[]>> = {',
    blocos.join(',\n'),
    '};',
    ''
  ].join('\n');
}

async function principal(): Promise<void> {
  if (existsSync(SAIDA)) {
    console.error(`recusa: ${SAIDA} já existe. A forma congelada nunca é regenerada.`);
    process.exit(1);
  }

  const carregadores = carregadoresDoDisco();
  const chaves = Object.keys(carregadores).sort();
  const formas: Record<string, readonly FormaPergunta[]> = {};
  let analisados = 0;
  let falharam = 0;

  for (const chave of chaves) {
    try {
      const conteudo = await carregadores[chave]!();
      analisados += 1;
      if (conteudo.quiz !== undefined) {
        formas[chave] = conteudo.quiz.map(formaDe);
      }
    } catch (erro) {
      falharam += 1;
      console.error(`falhou ao carregar ${chave}: ${(erro as Error).message}`);
    }
  }

  const comQuiz = Object.keys(formas).length;
  console.log(
    `unidades_encontradas=${chaves.length} analisados=${analisados} falharam=${falharam} ` +
      `com_quiz=${comQuiz}`
  );
  if (falharam > 0 || analisados !== chaves.length) {
    console.error('varredura incompleta: nada gravado');
    process.exit(1);
  }
  if (comQuiz === 0) {
    console.error('varredura vazia (L-36): nenhuma unidade com quiz, nada gravado');
    process.exit(1);
  }

  writeFileSync(SAIDA, renderizar(formas, shaDoCommit()));
  console.log(`gravadas=${Object.keys(formas).length} em ${SAIDA}`);
}

await principal();
