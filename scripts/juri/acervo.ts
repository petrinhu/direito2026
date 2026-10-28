/**
 * Ferramenta LOCAL da área da Júri: cifra as imagens do acervo e gera a credencial do admin.
 * Roda na máquina do perito, nunca no servidor e nunca dentro do repositório.
 *
 * Uso:
 *   node --import tsx scripts/juri/acervo.ts iniciar --originais <pasta> --saida <pasta-nova>
 *   node --import tsx scripts/juri/acervo.ts conferir --saida <pasta> --senha <provisória>
 *
 * stdout: só a senha provisória (iniciar) ou o resumo (conferir). stderr: contagens e avisos,
 * nunca segredo. Código 0 só com tudo conferido; 1 em falha; 2 em uso incorreto.
 */
import { lerArgumentos } from './argumentos';
import { conferir } from './conferir';
import { ErroFerramenta, ErroUso } from './erro';
import { iniciar } from './iniciar';

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
    if (comando.nome === 'iniciar') {
      const resultado = await iniciar({ originais: comando.originais, saida: comando.saida });
      process.stdout.write(`${resultado.senha}\n`);
      process.stderr.write(
        `iniciar: ${resultado.imagens} imagens cifradas, ids reusados quando já existiam\n`
      );
      for (const aviso of resultado.avisos) {
        process.stderr.write(`aviso do exiftool: ${aviso}\n`);
      }
      return 0;
    }
    const resultado = await conferir({ saida: comando.saida, senha: comando.senha });
    process.stdout.write(
      `conferido: ${resultado.imagens} imagens decifram com a senha, sem etiqueta de metadado\n`
    );
    return 0;
  } catch (erro) {
    process.stderr.write(`juri-acervo: ${mensagemDoErro(erro)}\n`);
    return erro instanceof ErroUso ? 2 : 1;
  }
}

process.exitCode = await principal(process.argv.slice(2));
