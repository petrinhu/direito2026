import type { Cadeira, Periodo } from '@/core/curriculo/tipos';

export interface LinhaCadeira {
  readonly href: string;
  readonly rotulo: string;
  readonly texto: string;
  /** Atalho para cadeira de acesso restrito: mostra o cadeado, não o conteúdo. */
  readonly restrita: boolean;
}

/**
 * Linhas de uma placa da home: as unidades PUBLICADAS da cadeira, com o
 * atalho para a cadeira restrita inserido logo depois da unidade indicada em
 * `apos`. Nunca inventa linha: unidade em breve fica de fora, e atalho cuja
 * cadeira de destino não existe ou não está publicada não vira link.
 * Cadeira restrita não lista unidade nenhuma (o conteúdo não existe aqui).
 */
export function linhasDaCadeira(periodo: Periodo, cadeira: Cadeira): LinhaCadeira[] {
  if (cadeira.restrita) return [];

  const linhas: LinhaCadeira[] = [];
  const atalho = cadeira.atalhoUnidade;
  const destino = atalho
    ? periodo.cadeiras.find((c) => c.id === atalho.cadeiraId && c.estado === 'publicado')
    : undefined;
  const linhaAtalho: LinhaCadeira | undefined =
    atalho && destino
      ? {
          href: `/p/${periodo.id}/${destino.id}`,
          rotulo: atalho.rotulo,
          texto: 'Acesso restrito',
          restrita: true
        }
      : undefined;

  let atalhoColocado = false;
  for (const unidade of cadeira.unidades) {
    if (unidade.estado === 'publicado') {
      linhas.push({
        href: `/p/${periodo.id}/${cadeira.id}/${unidade.id}`,
        rotulo: unidade.rotulo,
        texto: unidade.titulo,
        restrita: false
      });
    }
    if (linhaAtalho && atalho && unidade.id === atalho.apos) {
      linhas.push(linhaAtalho);
      atalhoColocado = true;
    }
  }
  if (linhaAtalho && !atalhoColocado) linhas.push(linhaAtalho);
  return linhas;
}
