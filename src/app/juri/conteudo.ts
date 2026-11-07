/**
 * Validação do JSON da Júri no lado do app: o conteúdo só vira o tipo validado aqui, e a
 * interface nunca recebe o JSON cru. O índice de imagens é o próprio `imagens` do
 * conteúdo: a API não entrega o acervo ao navegador, e o imagem.php confere o id contra o
 * acervo (quem não está no índice recebe 404).
 */
import { validarConteudoJuri } from '@/core/juri/validar';
import type { ConteudoJuriValidado } from '@/core/juri/tipos';

export type ResultadoConteudoJuri =
  | { readonly ok: true; readonly conteudo: ConteudoJuriValidado }
  | { readonly ok: false; readonly motivo: 'invalido' | 'indisponivel' };

/** Ids declarados em `imagens` do JSON bruto. Lixo vira conjunto vazio: o validador reprova. */
function idsDeclarados(bruto: unknown): Set<string> {
  if (typeof bruto !== 'object' || bruto === null || !('imagens' in bruto)) return new Set();
  const imagens = (bruto as { imagens: unknown }).imagens;
  if (!Array.isArray(imagens)) return new Set();
  const ids = new Set<string>();
  for (const item of imagens) {
    if (typeof item === 'object' && item !== null && 'id' in item) {
      const id = (item as { id: unknown }).id;
      if (typeof id === 'string') ids.add(id);
    }
  }
  return ids;
}

export function validarConteudoBruto(bruto: unknown): ResultadoConteudoJuri {
  const resultado = validarConteudoJuri(bruto, idsDeclarados(bruto));
  return resultado.ok
    ? { ok: true, conteudo: resultado.conteudo }
    : { ok: false, motivo: 'invalido' };
}

/**
 * Carga única do conteúdo da Júri: pede o JSON, valida, e devolve o resultado. Falha de
 * rede ou de servidor vira `indisponivel`; a sessão vencida (401) já avisa a volta à
 * entrada pelo transporte, então aqui ela também só cai em `indisponivel`.
 */
export async function carregarConteudoJuri(
  obter: () => Promise<unknown>
): Promise<ResultadoConteudoJuri> {
  let bruto: unknown;
  try {
    bruto = await obter();
  } catch {
    return { ok: false, motivo: 'indisponivel' };
  }
  return validarConteudoBruto(bruto);
}
