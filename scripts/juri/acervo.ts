/**
 * Ferramenta LOCAL da área da Júri: prepara o acervo de imagens em claro (sem metadado) e
 * confere a saída. Roda na máquina do perito, nunca no servidor e nunca dentro do repositório.
 *
 * Uso:
 *   node --import tsx scripts/juri/acervo.ts preparar --originais <pasta> --saida <pasta-nova>
 *   node --import tsx scripts/juri/acervo.ts conferir --saida <pasta>
 *
 * stdout: só o resumo do conferir. stderr: contagens e avisos, nunca nome de original.
 * Código 0 só com tudo conferido; 1 em falha; 2 em uso incorreto.
 */
import { conferir } from './conferir';
import { lerArgumentos } from './argumentos';
import { ErroFerramenta, ErroUso } from './erro';
import { preparar } from './preparar';

function mensagemDoErro(erro: unknown): string {
  if (erro instanceof ErroFerramenta) {
    return erro.message;
  }
  // Erro de sistema (ex.: permissão, pasta inexistente) carrega o caminho na mensagem: mostra só o código.
  const codigo = (erro as { code?: string } | null | undefined)?.code ?? 'sem-codigo';
  return `falha inesperada (${codigo})`;
}

async function principal(args: readonly string[]): Promise<number> {
  process.umask(0o077);
  try {
    const comando = lerArgumentos(args);
    if (comando.nome === 'preparar') {
      const resultado = await preparar({ originais: comando.originais, saida: comando.saida });
      process.stderr.write(
        `preparar: ${resultado.imagens} imagens em claro, ids reusados quando já existiam\n`
      );
      for (const aviso of resultado.avisos) {
        process.stderr.write(`aviso do exiftool: ${aviso}\n`);
      }
      return 0;
    }
    const resultado = await conferir({ saida: comando.saida });
    process.stdout.write(`conferido: ${resultado.imagens} imagens, sem etiqueta fora da lista\n`);
    return 0;
  } catch (erro) {
    process.stderr.write(`juri-acervo: ${mensagemDoErro(erro)}\n`);
    return erro instanceof ErroUso ? 2 : 1;
  }
}

process.exitCode = await principal(process.argv.slice(2));
