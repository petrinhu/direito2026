import type { ConteudoUnidade } from '../unidade/tipos';
import type { ErroDeUnidade } from './tipos';

/**
 * Toda ficha (mapa e fichamento) e todo mnemônico aponta para um bloco que
 * existe no resumo. A varredura acha o campo `blocoResumo` em qualquer nível.
 */
export function validarFichas(conteudo: ConteudoUnidade): ErroDeUnidade[] {
  const blocos = new Set(conteudo.resumo.map((bloco) => bloco.id));
  const referencias = [
    ...referenciasDeBloco(conteudo.mapaFichamento, 'mapaFichamento'),
    ...referenciasDeBloco(conteudo.mnemonicos, 'mnemonicos')
  ];
  return referencias
    .filter(({ bloco }) => !blocos.has(bloco))
    .map(({ caminho, bloco }) => ({
      regra: 'referencia-de-ficha' as const,
      caminho,
      detalhe: `aponta para "${bloco}", que não existe no resumo`
    }));
}

interface ReferenciaDeBloco {
  readonly caminho: string;
  readonly bloco: string;
}

function referenciasDeBloco(valor: unknown, caminho: string): ReferenciaDeBloco[] {
  if (Array.isArray(valor)) {
    return valor.flatMap((item, i) => referenciasDeBloco(item, `${caminho}[${i}]`));
  }
  if (valor && typeof valor === 'object') {
    const registro = valor as Record<string, unknown>;
    const achadas: ReferenciaDeBloco[] = [];
    if (typeof registro.blocoResumo === 'string') {
      achadas.push({ caminho: `${caminho}.blocoResumo`, bloco: registro.blocoResumo });
    }
    for (const [chave, item] of Object.entries(registro)) {
      achadas.push(...referenciasDeBloco(item, `${caminho}.${chave}`));
    }
    return achadas;
  }
  return [];
}
