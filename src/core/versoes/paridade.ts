import { compararVersoes, ehVersao } from './validacao';

/**
 * Portão de paridade do histórico com o pacote (HIST-F4). Tudo é relativo ao package.json: nunca uma
 * versão literal. O topo de cada lista é o MAIOR número (não a posição no arquivo, porque o histórico
 * está em ordem crescente e o novidades.json em ordem decrescente).
 */
export interface ParidadeParametros {
  historico: readonly { versao: string }[];
  novidades: { versoes: readonly { versao: string }[] };
  pacote: string;
  /** No clone da tag as três fontes têm de coincidir no topo. */
  clonDaTag?: boolean;
}

export type ResultadoParidade = { ok: true } | { ok: false; erros: string[] };

function topo(versoes: readonly string[]): string | undefined {
  return versoes.reduce<string | undefined>(
    (maior, atual) => (maior === undefined || compararVersoes(atual, maior) > 0 ? atual : maior),
    undefined
  );
}

export function verificarParidade(p: ParidadeParametros): ResultadoParidade {
  const erros: string[] = [];
  if (!ehVersao(p.pacote)) erros.push('pacote: versão fora do formato A.B.C.D');
  const noHistorico = p.historico.map((e) => e.versao);
  const acimaDoPacote = noHistorico.filter((v) => compararVersoes(v, p.pacote) > 0);
  if (acimaDoPacote.length > 1) {
    erros.push(`histórico com ${acimaDoPacote.length} versões acima do pacote (no máximo uma)`);
  }
  const emNovidades = p.novidades.versoes.map((e) => e.versao);
  for (const versao of emNovidades) {
    if (!noHistorico.includes(versao))
      erros.push(`${versao} está em novidades.json e não no histórico`);
  }
  if (p.clonDaTag) {
    const topoHistorico = topo(noHistorico);
    const topoNovidades = topo(emNovidades);
    if (topoHistorico === undefined || compararVersoes(topoHistorico, p.pacote) !== 0) {
      erros.push(
        `no clone da tag, o topo do histórico (${topoHistorico ?? 'vazio'}) tem de ser o pacote (${p.pacote})`
      );
    }
    if (topoNovidades === undefined || compararVersoes(topoNovidades, p.pacote) !== 0) {
      erros.push(
        `no clone da tag, o topo do novidades.json (${topoNovidades ?? 'vazio'}) tem de ser o pacote (${p.pacote})`
      );
    }
  }
  return erros.length === 0 ? { ok: true } : { ok: false, erros };
}
