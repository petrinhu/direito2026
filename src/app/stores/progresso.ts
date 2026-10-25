import { ref, type Ref } from 'vue';
import {
  alternarItemChecklist,
  contarBlocosLidos,
  criarRegistroVazio,
  desmarcarBlocoLido,
  marcarBlocoLido
} from '@/core/progresso/calculo';
import { ENDERECOS_MOVIDOS } from '@/app/curriculo/enderecosMovidos';
import type {
  ChaveUnidade,
  RegistroProgressoUnidade,
  RepositorioProgresso
} from '@/core/progresso/tipos';

export interface StoreProgressoUnidade {
  readonly registro: Ref<RegistroProgressoUnidade>;
  marcarLido(blocoId: string): void;
  desmarcarLido(blocoId: string): void;
  /** Extra (a) da unidade de Redação Jurídica 1: alterna um item de checklist. */
  alternarChecklist(itemId: string): void;
  /** Atualiza e persiste qualquer subconjunto do registro (aba, semente e respostas do quiz). */
  atualizar(patch: Partial<Omit<RegistroProgressoUnidade, 'versao'>>): void;
  contagem(idsBlocosExistentes: readonly string[]): { lidos: number; total: number };
}

/**
 * Chave antiga de uma unidade movida (inverso de ENDERECOS_MOVIDOS), ou undefined.
 * Ordem do líder de 25/10/2026: o progresso segue o endereço novo.
 */
function chaveAntiga(chave: ChaveUnidade): ChaveUnidade | undefined {
  return Object.entries(ENDERECOS_MOVIDOS).find(([, nova]) => nova === chave)?.[0];
}

function lerRegistroInicial(
  repositorio: RepositorioProgresso,
  chave: ChaveUnidade
): RegistroProgressoUnidade {
  const antiga = chaveAntiga(chave);
  return (
    repositorio.ler(chave) ??
    (antiga === undefined ? undefined : repositorio.ler(antiga)) ??
    criarRegistroVazio(new Date().toISOString())
  );
}

export function criarStoreProgresso(
  repositorio: RepositorioProgresso,
  chave: ChaveUnidade
): StoreProgressoUnidade {
  const registro = ref<RegistroProgressoUnidade>(
    lerRegistroInicial(repositorio, chave)
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

  function alternarChecklist(itemId: string): void {
    persistir(alternarItemChecklist(registro.value, itemId, new Date().toISOString()));
  }

  function atualizar(patch: Partial<Omit<RegistroProgressoUnidade, 'versao'>>): void {
    persistir({ ...registro.value, ...patch, atualizadoEm: new Date().toISOString() });
  }

  return { registro, marcarLido, desmarcarLido, alternarChecklist, atualizar, contagem };
}
