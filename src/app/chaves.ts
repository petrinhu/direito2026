import type { InjectionKey } from 'vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { RepositorioProgresso } from '@/core/progresso/tipos';
import type { StoreTema } from './stores/tema';
import type { StoreBusca } from './stores/busca';
import type { StoreModoAdaptado } from './stores/modoAdaptado';
import type { ClienteApi } from './restrito/clienteApi';
import type { SessaoGlobal } from './sessao/sessaoGlobal';
import type { ControladorAviso } from './versaoNova/controladorAviso';
import type { StoreRadio } from './radio/tocadorRadio';

/** Chaves de injeção do composition root (main.ts). Ver App.vue. */
export const CHAVE_CURRICULO: InjectionKey<Curriculo> = Symbol('curriculo');
export const CHAVE_REPOSITORIO: InjectionKey<RepositorioProgresso> = Symbol('repositorioProgresso');
export const CHAVE_STORE_TEMA: InjectionKey<StoreTema> = Symbol('storeTema');
export const CHAVE_STORE_BUSCA: InjectionKey<StoreBusca> = Symbol('storeBusca');
export const CHAVE_STORE_MODO_ADAPTADO: InjectionKey<StoreModoAdaptado> =
  Symbol('storeModoAdaptado');

/** Opcional: testes injetam um cliente falso; em produção a página cria o real. */
export const CHAVE_CLIENTE_RESTRITO: InjectionKey<ClienteApi> = Symbol('clienteRestrito');
/** Opcional, como a anterior: testes injetam a API falsa da Júri; em produção a página cria a real. */

/** Sessão do site inteiro (usuário, admin, sair). Criada em main.ts. */
export const CHAVE_SESSAO: InjectionKey<SessaoGlobal> = Symbol('sessao');
/** Tocador de rádio (barra do topo e o único <audio> do app). Criado em main.ts. */
export const CHAVE_RADIO: InjectionKey<StoreRadio> = Symbol('radio');
/** Banner de versão nova (AV-F11). Criado em main.ts; App.vue monta a faixa. */
export const CHAVE_AVISO_VERSAO: InjectionKey<ControladorAviso> = Symbol('avisoVersao');
