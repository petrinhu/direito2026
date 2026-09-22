import { ref, type Ref } from 'vue';
import {
  contarBlocosLidos,
  criarRegistroVazio,
  desmarcarBlocoLido,
  marcarBlocoLido
} from '@/core/progresso/calculo';
import type { ChaveUnidade, RegistroProgressoUnidade, RepositorioProgresso } from '@/core/progresso/tipos';

export interface StoreProgressoUnidade {
  readonly registro: Ref<RegistroProgressoUnidade>;
  marcarLido(blocoId: string): void;
  desmarcarLido(blocoId: string): void;
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

  return { registro, marcarLido, desmarcarLido, contagem };
}
