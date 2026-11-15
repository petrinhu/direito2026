/**
 * Validação pura do histórico de versões (HIST-F1). Sem DOM, sem Vue: roda em Node e no navegador.
 * Ordem do arquivo src/dados/versoes/historico.json: mais antiga primeiro, estrita (sem repetida).
 */
export const LIMITE_ITEM_HISTORICO = 180;

const FORMATO_VERSAO = /^\d+\.\d+\.\d+\.\d+$/;
const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

export type ResultadoValidacao = { ok: true } | { ok: false; erros: string[] };

export function ehVersao(valor: unknown): boolean {
  return typeof valor === 'string' && FORMATO_VERSAO.test(valor);
}

/** Compara A.B.C.D por partes numéricas: negativo se a < b, zero se iguais, positivo se a > b. */
export function compararVersoes(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 4; i++) {
    const diferenca = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diferenca !== 0) return diferenca;
  }
  return 0;
}

/** Um item didático ou técnico: texto não vazio de até 180 caracteres (proxy de duas linhas). */
export function validarItem(texto: unknown): string[] {
  if (typeof texto !== 'string') return ['item não é texto'];
  if (texto.trim() === '') return ['item vazio'];
  const tamanho = [...texto].length;
  if (tamanho > LIMITE_ITEM_HISTORICO) {
    return [`item com ${tamanho} caracteres (máximo ${LIMITE_ITEM_HISTORICO})`];
  }
  return [];
}

function ehDataReal(texto: unknown): boolean {
  if (typeof texto !== 'string') return false;
  const m = FORMATO_DATA.exec(texto);
  if (!m) return false;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

function errosDaEntrada(entrada: unknown, indice: number): string[] {
  if (typeof entrada !== 'object' || entrada === null)
    return [`entrada ${indice}: não é um objeto`];
  const e = entrada as Record<string, unknown>;
  const rotulo = typeof e.versao === 'string' ? e.versao : `entrada ${indice}`;
  const erros: string[] = [];
  if (!ehVersao(e.versao)) erros.push(`${rotulo}: versão fora do formato A.B.C.D`);
  if (!ehDataReal(e.data)) erros.push(`${rotulo}: data inválida (use AAAA-MM-DD)`);
  for (const campo of ['didatico', 'tecnico'] as const) {
    const lista = e[campo];
    if (!Array.isArray(lista)) {
      erros.push(`${rotulo}: ${campo} não é uma lista`);
      continue;
    }
    // Cada lista precisa de pelo menos um item: a página Novidades e a Changelog mostram as duas.
    if (lista.length === 0) erros.push(`${rotulo}: ${campo} sem nenhum item`);
    for (const item of lista) {
      for (const erro of validarItem(item)) erros.push(`${rotulo}: ${campo}: ${erro}`);
    }
  }
  return erros;
}

/** Valida o histórico inteiro: formato, datas, itens, ao menos um item por versão e ordem estrita. */
export function validarHistorico(entradas: unknown): ResultadoValidacao {
  if (!Array.isArray(entradas)) return { ok: false, erros: ['o histórico precisa ser uma lista'] };
  if (entradas.length === 0) return { ok: false, erros: ['o histórico está vazio'] };
  const erros: string[] = [];
  entradas.forEach((entrada, i) => erros.push(...errosDaEntrada(entrada, i)));
  for (let i = 1; i < entradas.length; i++) {
    const anterior = entradas[i - 1] as { versao?: unknown };
    const atual = entradas[i] as { versao?: unknown };
    if (ehVersao(anterior.versao) && ehVersao(atual.versao)) {
      if (compararVersoes(anterior.versao as string, atual.versao as string) >= 0) {
        erros.push(`${atual.versao}: fora da ordem ou repetida (depois de ${anterior.versao})`);
      }
    }
  }
  return erros.length === 0 ? { ok: true } : { ok: false, erros };
}
