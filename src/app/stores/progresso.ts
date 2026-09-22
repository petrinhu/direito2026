import { ref, type Ref } from 'vue';
import {
  contarBlocosLidos,
  criarRegistroVazio,
  desmarcarBlocoLido,
  marcarBlocoLido
} from '@/core/progresso/calculo';
import type {
  ChaveUnidade,
  RegistroProgressoUnidade,
  RepositorioProgresso
} from '@/core/progresso/tipos';

export interface StoreProgressoUnidade {
  readonly registro: Ref<RegistroProgressoUnidade>;
  marcarLido(blocoId: string): void;
  desmarcarLido(blocoId: string): void;
  /** Atualiza e persiste qualquer subconjunto do registro (aba, semente e respostas do quiz). */
  atualizar(patch: Partial<Omit<RegistroProgressoUnidade, 'versao'>>): void;
  contagem(idsBlocosExistentes: readonly string[]): { lidos: number; total: number };
}

export function criarStoreProgresso(
  repositorio: RepositorioProgresso,
  chave: ChaveUnidade
): StoreProgressoUnidade {
  const registro = ref<RegistroProgressoUnidade>(
    repositorio.ler(chave) ?? criarRegistroVazio(new Date().toISOString())
  ) as Ref<RegistroProgressoUnidade>;

  function persistir(novo: RegistroProgressoUnidade): void {
    registro.value = novo;
    repositorio.salvar(chave, novo);
  }

  function marcarLido(blocoId: string): void {
    persistir(marcarBlocoLido(registro.value, blocoId, new Date().toISOString()));
  }

  function desmarcarLido(blocoId: string): void {
    persistir(desmarcarBlocoLido(registro.value, blocoId, new Date().toISOString()));
  }

  function contagem(idsBlocosExistentes: readonly string[]) {
    return contarBlocosLidos(registro.value, idsBlocosExistentes);
  }

  function atualizar(patch: Partial<Omit<RegistroProgressoUnidade, 'versao'>>): void {
    persistir({ ...registro.value, ...patch, atualizadoEm: new Date().toISOString() });
  }

  return { registro, marcarLido, desmarcarLido, atualizar, contagem };
}
