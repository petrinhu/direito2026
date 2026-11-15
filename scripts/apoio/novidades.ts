import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { Curriculo } from '../../src/core/curriculo/tipos';

/**
 * Novidades de uma publicação (AV-F3, plano de aviso de versão). Cada `--novidade` vira um
 * item estruturado, validado contra o currículo e contra a trava de termos, e ganha um
 * texto final que o aluno vê no banner. Nada aqui imprime a lista privada de termos.
 */
export type TipoPublicacao = 'recurso' | 'correcao' | 'construcao';

export type ItemNovidade =
  | { tipo: 'cadeira'; periodo: string; cadeira: string; texto: string }
  | { tipo: 'usabilidade'; texto: string }
  | { tipo: 'tecnica' };

export type Resultado<T> = { ok: true; item: T } | { ok: false; motivo: string };

export type ListaResultado = { ok: true; itens: ItemNovidade[] } | { ok: false; motivo: string };

export type VerificadorDeTermos = (texto: string) => boolean;

const MAXIMO_POR_VERSAO = 5;
const MAXIMO_TEXTO_FINAL = 60;
const TECNICA_TEXTO = 'Melhoria técnica';
const USABILIDADE = /^[\p{L}\p{N} ,.():']+$/u;
// Domínio: qualquer TLD (letras depois do ponto), não só uma lista. Ponto seguido de espaço ou
// de número ("Filosofia atualizada.", "art.12") não casa.
const ENDERECO = /https?:\/\/|www\.|@|\b[\p{L}\p{N}-]+\.\p{L}{2,}\b/iu;
const TRAVESSOES = /[\u2013\u2014]/;

/**
 * Trava de termos pelo script de R3, sem imprimir nada: só o código de saída conta. A
 * lista de termos mora fora do repositório (VERIFICAR_PROIBICOES_TERMOS, ou o padrão).
 */
export function verificarComScript(texto: string): boolean {
  // ESM (package.json "type": "module"): não existe __dirname; o caminho sai de import.meta.url.
  const script = fileURLToPath(new URL('../verificar-proibicoes.sh', import.meta.url));
  const r = spawnSync('bash', [script, '-'], { input: texto, stdio: ['pipe', 'ignore', 'ignore'] });
  return r.status === 0;
}

export function travaDeTermos(texto: string, limpo: VerificadorDeTermos): boolean {
  return limpo(texto);
}

export function analisarNovidade(
  bruto: string,
  curriculo: Curriculo,
  limpo: VerificadorDeTermos = verificarComScript
): Resultado<ItemNovidade> {
  const doisPontos = bruto.indexOf(':');
  const tipo = doisPontos < 0 ? bruto : bruto.slice(0, doisPontos);
  const valor = doisPontos < 0 ? '' : bruto.slice(doisPontos + 1);

  let item: ItemNovidade;
  if (tipo === 'tecnica' && valor === '') {
    item = { tipo: 'tecnica' };
  } else if (tipo === 'cadeira') {
    const r = acharCadeira(valor, curriculo);
    if (!r.ok) return r;
    item = r.item;
  } else if (tipo === 'usabilidade') {
    const motivo = motivoDeUsabilidade(valor);
    if (motivo !== null) return { ok: false, motivo };
    item = { tipo: 'usabilidade', texto: valor };
  } else {
    return { ok: false, motivo: `tipo de novidade desconhecido: "${tipo}"` };
  }

  const final = textoFinalDoItem(item);
  if (final.length > MAXIMO_TEXTO_FINAL) {
    return { ok: false, motivo: `texto final com mais de ${MAXIMO_TEXTO_FINAL} caracteres` };
  }
  if (!travaDeTermos(final, limpo)) {
    return { ok: false, motivo: 'o texto da novidade não passa nas travas de publicação' };
  }
  return { ok: true, item };
}

export function textoFinalDoItem(item: ItemNovidade): string {
  if (item.tipo === 'cadeira') return `${item.texto}`;
  if (item.tipo === 'usabilidade') return `Novo: ${item.texto}`;
  return TECNICA_TEXTO;
}

export function validarNovidades(
  tipo: TipoPublicacao,
  brutas: readonly string[],
  curriculo: Curriculo,
  limpo: VerificadorDeTermos = verificarComScript
): ListaResultado {
  if (tipo === 'construcao') return { ok: true, itens: [{ tipo: 'tecnica' }] };
  if (brutas.length === 0) {
    return { ok: false, motivo: `"${tipo}" exige ao menos uma novidade` };
  }
  if (brutas.length > MAXIMO_POR_VERSAO) {
    return { ok: false, motivo: `no máximo ${MAXIMO_POR_VERSAO} novidades por versão` };
  }
  const itens: ItemNovidade[] = [];
  for (const bruto of brutas) {
    const r = analisarNovidade(bruto, curriculo, limpo);
    if (!r.ok) return { ok: false, motivo: r.motivo };
    itens.push(r.item);
  }
  return { ok: true, itens };
}

function acharCadeira(valor: string, curriculo: Curriculo): Resultado<ItemNovidade> {
  const barra = valor.indexOf('/');
  const periodoId = barra < 0 ? '' : valor.slice(0, barra);
  const cadeiraId = barra < 0 ? '' : valor.slice(barra + 1);
  const periodo = curriculo.find((p) => p.id === periodoId);
  const cadeira = periodo?.cadeiras.find((c) => c.id === cadeiraId);
  if (!periodo || !cadeira) return { ok: false, motivo: 'cadeira não existe no currículo' };
  if (cadeira.restrita) {
    return {
      ok: false,
      motivo: 'área restrita não é anunciada por nome: use tecnica ou usabilidade'
    };
  }
  return {
    ok: true,
    item: {
      tipo: 'cadeira',
      periodo: periodo.id,
      cadeira: cadeira.id,
      texto: `${cadeira.nome} (${periodo.rotulo}) atualizada`
    }
  };
}

function motivoDeUsabilidade(texto: string): string | null {
  const tamanho = [...texto].length;
  if (tamanho < 3 || tamanho > 40) return 'usabilidade precisa ter de 3 a 40 caracteres';
  if (!USABILIDADE.test(texto))
    return "usabilidade só aceita letras, dígitos, espaço e , . ( ) : '";
  if (ENDERECO.test(texto)) return 'usabilidade não pode trazer endereço';
  if (TRAVESSOES.test(texto)) return 'usabilidade não pode ter travessão';
  return null;
}
