import type { Cadeira, ChaveAba, Curriculo, Periodo, ResolucaoRota } from './tipos';

const ABAS_VALIDAS: readonly ChaveAba[] = ['resumo', 'peticao', 'quiz'];

function ehChaveAba(valor: string | undefined): valor is ChaveAba {
  return valor !== undefined && (ABAS_VALIDAS as readonly string[]).includes(valor);
}

/**
 * Resolve um caminho de URL (`/p/:periodo/:cadeira/:unidade/:aba?`) contra o
 * currículo. Função pura, sem router e sem DOM (L-33, camada Back).
 */
export function resolverRota(curriculo: Curriculo, caminho: string): ResolucaoRota {
  const partes = caminho
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter((p) => p.length > 0);

  // Esperado: ['p', periodoId, cadeiraId?, unidadeId?, abaId?]
  if (partes[0] !== 'p' || !partes[1]) {
    return { tipo: 'inexistente' };
  }

  const periodo: Periodo | undefined = curriculo.find((p) => p.id === partes[1]);
  if (!periodo) return { tipo: 'inexistente' };

  const cadeiraId = partes[2];
  if (!cadeiraId) {
    return { tipo: 'em-breve', periodo };
  }

  const cadeira: Cadeira | undefined = periodo.cadeiras.find((c) => c.id === cadeiraId);
  if (!cadeira) return { tipo: 'inexistente' };

  const unidadeId = partes[3];
  if (!unidadeId) {
    return { tipo: 'em-breve', periodo, cadeira };
  }

  const unidade = cadeira.unidades.find((u) => u.id === unidadeId);
  if (!unidade) return { tipo: 'inexistente' };

  if (unidade.estado === 'em-breve') {
    return { tipo: 'em-breve', periodo, cadeira, unidade };
  }

  const abaPedida = partes[4];
  const aba: ChaveAba =
    ehChaveAba(abaPedida) && unidade.abas.includes(abaPedida) ? abaPedida : 'resumo';

  // Aba pedida explicitamente mas que a unidade não tem: não existe
  // silenciosamente virar "resumo" quando o leitor pediu outra coisa que
  // não existe. Só cai pra resumo quando a URL não pediu aba nenhuma.
  if (abaPedida && ehChaveAba(abaPedida) && !unidade.abas.includes(abaPedida)) {
    return { tipo: 'em-breve', periodo, cadeira, unidade };
  }

  return { tipo: 'encontrado', periodo, cadeira, unidade, aba };
}
