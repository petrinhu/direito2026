import { ROTULOS_CATEGORIA_QUIZ } from '../src/conteudo/quiz/categorias';
import { validarUnidade } from '../src/core/conteudo/validarUnidade';
import { carregadoresDoDisco, RAIZ_DO_CONTEUDO } from './apoio/conteudoDoDisco';

/**
 * Valida o conteúdo de TODA unidade descoberta em src/conteudo, antes do build
 * (mesma função pura que tests/unidade/conteudo.varredura.spec.ts usa, só que
 * lendo do disco). Item a item, e sempre imprime encontradas/validadas/falharam.
 * Sai com 1 se não achar nenhuma unidade (varredura vazia não é código limpo),
 * se alguma unidade reprovar ou se alguma não puder ser lida.
 *
 * O argumento opcional é a raiz do conteúdo: só existe para o controle de
 * varredura vazia (aponta para uma pasta sem unidades e o script tem de sair 1).
 */
async function main(): Promise<number> {
  const raiz = process.argv[2] ?? RAIZ_DO_CONTEUDO;
  let carregadores: ReturnType<typeof carregadoresDoDisco>;
  try {
    carregadores = carregadoresDoDisco(raiz);
  } catch (erro) {
    console.log(`FALHA descoberta: ${mensagem(erro)}`);
    console.log('encontradas=0 validadas=0 falharam=1');
    return 1;
  }

  const chaves = Object.keys(carregadores);
  let validadas = 0;
  let falharam = 0;
  for (const chave of chaves) {
    try {
      const conteudo = await carregadores[chave]!();
      const erros = validarUnidade(conteudo, ROTULOS_CATEGORIA_QUIZ);
      if (erros.length === 0) {
        validadas += 1;
        continue;
      }
      falharam += 1;
      for (const erro of erros) {
        console.log(`FALHA ${chave} ${erro.caminho} [${erro.regra}] ${erro.detalhe}`);
      }
    } catch (erro) {
      falharam += 1;
      console.log(`FALHA ${chave}: ${mensagem(erro)}`);
    }
  }

  console.log(`encontradas=${chaves.length} validadas=${validadas} falharam=${falharam}`);
  const passou = chaves.length > 0 && falharam === 0 && validadas === chaves.length;
  return passou ? 0 : 1;
}

function mensagem(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}

process.exitCode = await main();
