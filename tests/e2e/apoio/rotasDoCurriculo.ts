import type { ChaveAba, Curriculo } from '../../../src/core/curriculo/tipos';

/**
 * Rotas dos testes de ponta a ponta, montadas a partir do currículo (dado
 * puro de src/conteudo/curriculo.ts) em vez de escritas à mão em cada
 * arquivo de teste. Uma unidade nova entra no currículo e passa a ser
 * exercitada sozinha; nenhuma unidade futura fica de fora por esquecimento.
 */
export interface RotaDoCurriculo {
  /** Caminho servido, ex.: '/p/p1/intr-direito/u1/quiz'. */
  readonly caminho: string;
  /** Texto que o <h1> da página tem de conter. */
  readonly h1: string;
  /** Nome legível para o relatório do teste. */
  readonly nome: string;
  readonly tipo: 'periodo' | 'cadeira' | 'unidade';
}

/** Período com material, cada cadeira publicada e cada aba que a unidade tem. */
export function rotasDoCurriculo(curriculo: Curriculo): RotaDoCurriculo[] {
  const rotas: RotaDoCurriculo[] = [];
  for (const periodo of curriculo) {
    if (periodo.cadeiras.length === 0) continue;
    rotas.push({
      caminho: `/p/${periodo.id}`,
      h1: periodo.rotulo,
      nome: periodo.rotulo,
      tipo: 'periodo'
    });
    for (const cadeira of periodo.cadeiras) {
      if (cadeira.estado !== 'publicado') continue;
      rotas.push({
        caminho: `/p/${periodo.id}/${cadeira.id}`,
        h1: cadeira.nome,
        nome: cadeira.nome,
        tipo: 'cadeira'
      });
      for (const unidade of cadeira.unidades) {
        if (unidade.estado !== 'publicado') continue;
        const base = `/p/${periodo.id}/${cadeira.id}/${unidade.id}`;
        for (const aba of unidade.abas) {
          rotas.push({
            caminho: aba === 'resumo' ? base : `${base}/${aba}`,
            h1: unidade.titulo,
            nome: `${cadeira.nome}: unidade (${aba})`,
            tipo: 'unidade'
          });
        }
      }
    }
  }
  return rotas;
}

/** Só as páginas de unidade (uma por aba), para o teste de acessibilidade. */
export function rotasDeUnidades(curriculo: Curriculo): RotaDoCurriculo[] {
  return rotasDoCurriculo(curriculo).filter((r) => r.tipo === 'unidade');
}

const TODAS_AS_ABAS: readonly ChaveAba[] = ['resumo', 'peticao', 'quiz'];

/**
 * Endereços de aba que a unidade NÃO tem (ex.: petição numa cadeira sem
 * petição). Cada um tem de abrir "Página não encontrada", nunca uma página
 * em branco nem o conteúdo de outra aba.
 */
export function rotasDeAbaAusente(curriculo: Curriculo): string[] {
  const caminhos: string[] = [];
  for (const periodo of curriculo) {
    for (const cadeira of periodo.cadeiras) {
      for (const unidade of cadeira.unidades) {
        if (unidade.estado !== 'publicado') continue;
        for (const aba of TODAS_AS_ABAS) {
          if (aba === 'resumo' || unidade.abas.includes(aba)) continue;
          caminhos.push(`/p/${periodo.id}/${cadeira.id}/${unidade.id}/${aba}`);
        }
      }
    }
  }
  return caminhos;
}
