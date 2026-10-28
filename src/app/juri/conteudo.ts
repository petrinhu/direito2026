/**
 * Validação do JSON da Júri no lado do app: o conteúdo só vira o tipo validado aqui, e a
 * interface nunca recebe o JSON cru. O índice de imagens é o próprio `imagens` do
 * conteúdo: a API não entrega o índice do acervo (o imagem.php checa o id no acervo e
 * responde 404). Lacuna de contrato registrada no TODO.md.
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
