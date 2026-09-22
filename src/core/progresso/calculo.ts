import type { RegistroProgressoUnidade } from './tipos';

export function criarRegistroVazio(agora: string): RegistroProgressoUnidade {
  return {
    versao: 1,
    atualizadoEm: agora,
    blocosLidos: [],
    ultimaAba: 'resumo'
  };
}

export function marcarBlocoLido(
  registro: RegistroProgressoUnidade,
  blocoId: string,
  agora: string
): RegistroProgressoUnidade {
  if (registro.blocosLidos.includes(blocoId)) {
    return { ...registro, atualizadoEm: agora };
  }
  return {
    ...registro,
    blocosLidos: [...registro.blocosLidos, blocoId],
    atualizadoEm: agora
  };
}

export function desmarcarBlocoLido(
  registro: RegistroProgressoUnidade,
  blocoId: string,
  agora: string
): RegistroProgressoUnidade {
  return {
    ...registro,
    blocosLidos: registro.blocosLidos.filter((id) => id !== blocoId),
    atualizadoEm: agora
  };
}

/**
 * Conta lidos contra o total de blocos que a unidade TEM HOJE, não contra o
 * que já esteve marcado alguma vez: se o conteúdo mudou e um bloco marcado
 * não existe mais, ele não entra na contagem nem no denominador.
 */
export function contarBlocosLidos(
  registro: RegistroProgressoUnidade,
  idsBlocosExistentes: readonly string[]
): { lidos: number; total: number } {
  const existentes = new Set(idsBlocosExistentes);
  const lidos = registro.blocosLidos.filter((id) => existentes.has(id)).length;
  return { lidos, total: idsBlocosExistentes.length };
}
