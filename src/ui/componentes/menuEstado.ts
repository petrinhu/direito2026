import type { InjectionKey } from 'vue';
import type { ReferenciaUnidade } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

/**
 * Estado do menu lateral, fornecido por MenuCurriculo a todo o submenu. Quem
 * abre e fecha, quem carrega o conteúdo e quem sabe se um rótulo está ativo
 * moram no MenuCurriculo; os componentes filhos (unidade e tópico com abas)
 * só leem daqui. Assim o markup das abas existe uma vez só.
 */
export interface EstadoMenu {
  estaAberto(id: string): boolean;
  alternar(id: string): void;
  fechar(id: string, evento: KeyboardEvent): void;
  alternarUnidade(chave: string, unidade: ReferenciaUnidade): Promise<void>;
  carregandoDetalhe(chave: string): boolean;
  conteudoPronto(chave: string): ConteudoUnidade | undefined;
  ehAtual(caminho: string, caminhoAtual: string): boolean;
}

export const ESTADO_MENU: InjectionKey<EstadoMenu> = Symbol('estado-menu-curriculo');

export function hrefUnidade(periodoId: string, cadeiraId: string, unidadeId: string): string {
  return `/p/${periodoId}/${cadeiraId}/${unidadeId}`;
}

export function chaveUnidade(periodoId: string, cadeiraId: string, unidadeId: string): string {
  return `${periodoId}/${cadeiraId}/${unidadeId}`;
}
