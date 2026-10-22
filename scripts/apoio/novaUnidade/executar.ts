import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { interpretarArgumentos, type ArgumentosNovaUnidade } from './argumentos';
import { gravarArquivos } from './disco';
import { planejarNovaUnidade, type PlanoNovaUnidade } from './planejar';

/** Raiz deste repositório (scripts/apoio/novaUnidade/ fica três níveis abaixo). */
const RAIZ_DO_PROJETO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export interface ResultadoNovaUnidade {
  readonly codigo: 0 | 1;
  /** Saída normal, impressa em stdout. */
  readonly linhas: readonly string[];
  /** Erros, impressos em stderr. */
  readonly erros: readonly string[];
}

/**
 * Ponto de entrada do `npm run nova-unidade`: interpreta, planeja, grava e
 * imprime os próximos passos. Não lança: todo caso vira código 0 ou 1, para
 * que a CLI e os testes vejam o mesmo resultado.
 */
export async function executarNovaUnidade(argv: readonly string[]): Promise<ResultadoNovaUnidade> {
  try {
    const argumentos = interpretarArgumentos(argv);
    const raiz = argumentos.raiz ?? RAIZ_DO_PROJETO;
    const plano = await planejarNovaUnidade(argumentos, join(raiz, 'src', 'conteudo'));
    await gravarArquivos(plano.arquivos);
    return { codigo: 0, linhas: linhasDeSucesso(argumentos, plano, raiz), erros: [] };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    return { codigo: 1, linhas: [], erros: [`ERRO: ${mensagem}`] };
  }
}

function linhasDeSucesso(
  argumentos: ArgumentosNovaUnidade,
  plano: PlanoNovaUnidade,
  raiz: string
): string[] {
  const aqui = (caminho: string): string => relative(raiz, caminho);
  const meta = join(plano.pastaDaUnidade, 'meta.ts');
  const linhas = [`Unidade criada em ${aqui(plano.pastaDaUnidade)}, estado em-breve.`];
  if (plano.cadeiraNova) {
    linhas.push(
      `Cadeira nova: ${aqui(plano.caminhoDaCadeira)} (ordem ${plano.ordemDaCadeira}, em-breve).`
    );
  }
  linhas.push(
    '',
    'Próximos passos:',
    `1. Escreva os textos da unidade: resumo.ts, mapaFichamento.ts, mnemonicos.ts, quiz/index.ts${argumentos.peticao ? ' e peticao.ts' : ''}. Os modelos trazem as regras do líder em comentário.`,
    '2. Confira: node --import tsx scripts/validar-conteudo.ts && npx vue-tsc --noEmit',
    `3. Publique: troque estado: 'em-breve' por 'publicado' em ${aqui(meta)}${plano.cadeiraNova ? ` e em ${aqui(plano.caminhoDaCadeira)}` : ''}.`,
    '4. Antes do commit: npm run atualizar-referencias (ele regrava a caracterização e mostra o que entrou; confira que só aparece o que você acrescentou) e depois npm run preci.',
    '5. Ao publicar uma cadeira, o teste do atalho Interdisciplinar exige o bloco atalhoUnidade em cadeira.ts (docs/como-adicionar-conteudo.md, seção 2).'
  );
  if (argumentos.unidade.includes('-')) {
    linhas.push(
      `6. Tópico de grupo: o grupo "${argumentos.unidade.split('-')[1]}" da AV precisa estar declarado em cadeira.ts (campo grupos), senão a montagem recusa o tópico.`
    );
  }
  return linhas;
}
