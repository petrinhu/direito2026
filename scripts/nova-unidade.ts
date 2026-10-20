import { executarNovaUnidade } from './apoio/novaUnidade/executar';

/**
 * CLI do `npm run nova-unidade -- <pN> <cadeira> <uN> "Título" [--peticao] [--cadeira "Nome"]`.
 * Toda a lógica está em scripts/apoio/novaUnidade/; aqui só se imprime o resultado.
 */
const resultado = await executarNovaUnidade(process.argv.slice(2));
for (const linha of resultado.linhas) console.log(linha);
for (const erro of resultado.erros) console.error(erro);
process.exitCode = resultado.codigo;
