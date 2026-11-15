import { compararVersoes, ehVersao } from './validacao';

/**
 * Portão de paridade do histórico com o pacote (HIST-F4, revisão HIST ALTO 2). Tudo é relativo ao
 * package.json: nunca uma versão literal. O topo de cada lista é o MAIOR número (não a posição no arquivo).
 *
 * Estados aceitos na árvore:
 *   A: o topo do histórico é a SEGUINTE ao pacote (uma subida de um degrau no campo A, B, C ou D) e a
 *      segunda é o pacote. A publicação grava o histórico antes do commit de release (publicar.sh:392).
 *   B: o topo do histórico é o pacote.
 * No clone da tag só vale B, e o topo do novidades.json tem de ser o pacote.
 */
export interface ParidadeParametros {
  historico: readonly { versao: string }[];
  novidades: { versoes: readonly { versao: string }[] };
  pacote: string;
  /** No clone da tag: só o estado B, e o topo do novidades.json é o pacote. */
  clonDaTag?: boolean;
}

export type ResultadoParidade = { ok: true } | { ok: false; erros: string[] };

/** As quatro subidas de um degrau de A.B.C.D: a versão seguinte ao pacote, segundo o campo que sobe. */
function subidasDeUmDegrau(versao: string): string[] {
  const partes = versao.split('.').map(Number);
  return [0, 1, 2, 3].map((campo) =>
    partes.map((valor, i) => (i < campo ? valor : i === campo ? valor + 1 : 0)).join('.')
  );
}

function ordenadasDaMaisNova(versoes: readonly string[]): string[] {
  return [...versoes].sort((a, b) => compararVersoes(b, a));
}

export function verificarParidade(p: ParidadeParametros): ResultadoParidade {
  const erros: string[] = [];
  if (!ehVersao(p.pacote)) erros.push('pacote: versão fora do formato A.B.C.D');
  const noHistorico = p.historico.map((e) => e.versao);
  const emNovidades = p.novidades.versoes.map((e) => e.versao);
  for (const versao of emNovidades) {
    if (!noHistorico.includes(versao))
      erros.push(`${versao} está em novidades.json e não no histórico`);
  }
  const ordem = ordenadasDaMaisNova(noHistorico);
  const topo = ordem[0];
  const segunda = ordem[1];
  const topoNovidades = ordenadasDaMaisNova(emNovidades)[0];
  if (ehVersao(p.pacote) && topo !== undefined) {
    const topoEhPacote = compararVersoes(topo, p.pacote) === 0;
    if (p.clonDaTag) {
      if (!topoEhPacote)
        erros.push(
          `no clone da tag, o topo do histórico (${topo}) tem de ser o pacote (${p.pacote})`
        );
      if (topoNovidades === undefined || compararVersoes(topoNovidades, p.pacote) !== 0) {
        erros.push(
          `no clone da tag, o topo do novidades.json (${topoNovidades ?? 'vazio'}) tem de ser o pacote (${p.pacote})`
        );
      }
    } else if (!topoEhPacote) {
      const estadoA =
        subidasDeUmDegrau(p.pacote).includes(topo) &&
        segunda !== undefined &&
        compararVersoes(segunda, p.pacote) === 0;
      if (!estadoA) {
        erros.push(
          `topo do histórico (${topo}) não é o pacote (${p.pacote}) nem a seguinte de um degrau com o pacote logo abaixo`
        );
      }
    }
  } else if (topo === undefined) {
    erros.push('histórico vazio');
  }
  return erros.length === 0 ? { ok: true } : { ok: false, erros };
}
