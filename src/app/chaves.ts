import type { InjectionKey } from 'vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { RepositorioProgresso } from '@/core/progresso/tipos';
import type { StoreTema } from './stores/tema';
import type { StoreBusca } from './stores/busca';

/** Chaves de injeção do composition root (main.ts). Ver App.vue. */
export const CHAVE_CURRICULO: InjectionKey<Curriculo> = Symbol('curriculo');
export const CHAVE_REPOSITORIO: InjectionKey<RepositorioProgresso> = Symbol('repositorioProgresso');
export const CHAVE_STORE_TEMA: InjectionKey<StoreTema> = Symbol('storeTema');
export const CHAVE_STORE_BUSCA: InjectionKey<StoreBusca> = Symbol('storeBusca');
