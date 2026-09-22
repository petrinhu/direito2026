<script setup lang="ts">
import { reactive } from 'vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import EstadoEmBreve from './EstadoEmBreve.vue';

defineProps<{
  curriculo: Curriculo;
  /** Caminho da rota atual (sem barra inicial), para aria-current. */
  caminhoAtual: string;
}>();

// Disclosure aninhado (seção 11 da arquitetura), não menubar ARIA: é o
// padrão que o leitor de tela já espera para navegação hierárquica.
const abertos = reactive(new Set<string>());

function estaAberto(id: string): boolean {
  return abertos.has(id);
}

function alternar(id: string): void {
  if (abertos.has(id)) abertos.delete(id);
  else abertos.add(id);
}

function fechar(id: string, evento: KeyboardEvent): void {
  if (!abertos.has(id)) return;
  abertos.delete(id);
  (evento.currentTarget as HTMLElement | null)?.focus();
}

function ehAtual(caminho: string, caminhoAtual: string): boolean {
  return caminho === caminhoAtual;
}
</script>

<template>
  <nav aria-label="Currículo" class="menu-curriculo">
    <ul>
      <li v-for="periodo in curriculo" :key="periodo.id">
        <button
          type="button"
          :aria-expanded="estaAberto(`p-${periodo.id}`) ? 'true' : 'false'"
          :aria-controls="`lista-${periodo.id}`"
          class="menu-curriculo__botao"
          @click="alternar(`p-${periodo.id}`)"
          @keydown.esc="fechar(`p-${periodo.id}`, $event)"
        >
          {{ periodo.rotulo }}
        </button>
        <ul v-show="estaAberto(`p-${periodo.id}`)" :id="`lista-${periodo.id}`">
          <li v-if="periodo.cadeiras.length === 0">
            <EstadoEmBreve rotulo="Sem cadeira publicada" />
          </li>
          <li v-for="cadeira in periodo.cadeiras" :key="cadeira.id">
            <template v-if="cadeira.estado === 'em-breve'">
              <EstadoEmBreve :rotulo="cadeira.nome" />
            </template>
            <template v-else>
              <button
                type="button"
                :aria-expanded="estaAberto(`c-${cadeira.id}`) ? 'true' : 'false'"
                :aria-controls="`lista-${cadeira.id}`"
                class="menu-curriculo__botao"
                @click="alternar(`c-${cadeira.id}`)"
                @keydown.esc="fechar(`c-${cadeira.id}`, $event)"
              >
                {{ cadeira.nome }}
              </button>
              <ul v-show="estaAberto(`c-${cadeira.id}`)" :id="`lista-${cadeira.id}`">
                <li v-for="unidade in cadeira.unidades" :key="unidade.id">
                  <EstadoEmBreve v-if="unidade.estado === 'em-breve'" :rotulo="unidade.rotulo" />
                  <a
                    v-else
                    :href="`/p/${periodo.id}/${cadeira.id}/${unidade.id}`"
                    :aria-current="
                      ehAtual(`p/${periodo.id}/${cadeira.id}/${unidade.id}`, caminhoAtual)
                        ? 'page'
                        : undefined
                    "
                  >
                    {{ unidade.rotulo }}
                  </a>
                </li>
              </ul>
            </template>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.menu-curriculo ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-curriculo__botao {
  display: block;
  width: 100%;
  min-height: 44px;
  text-align: left;
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
}

.menu-curriculo__botao:focus-visible,
.menu-curriculo a:focus-visible {
  /* Par dedicado da lateral (achado do líder, 22/09/2026): o menu vive
     sempre sobre --cor-sidebar-fundo, nunca sobre --cor-fundo, então o
     anel de foco tem de ter contraste contra O FUNDO REAL do elemento
     (L-42), não contra o token genérico de marca. */
  outline: 2px solid var(--cor-sidebar-texto, #faf9f5);
  outline-offset: 2px;
}

.menu-curriculo a {
  display: block;
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  /* Era --cor-texto (pensado para --cor-fundo): mesma classe de bug do
     fundo da lateral, só que no texto do link. --cor-texto no tema claro
     é quase preto sobre um fundo de lateral que é sempre escuro nos dois
     temas: contraste medido 1,09:1 antes da correção. */
  color: var(--cor-sidebar-texto, #faf9f5);
  text-decoration: none;
}

.menu-curriculo a[aria-current='page'] {
  color: var(--cor-sidebar-item-ativo-texto, #faf9f5);
  font-weight: 600;
  background: var(--cor-sidebar-item-ativo-fundo, #1a3a5c);
}

/* EstadoEmBreve (rótulo e selo "em breve") também vive só dentro da
   lateral aqui: mesma correção, achada na mesma varredura de contraste.
   --cor-desativado-texto/--cor-selo-* são pensados para --cor-fundo, e
   mediam 4,27:1 (abaixo do piso de 4,5:1) contra o fundo escuro da
   lateral no tema claro. */
.menu-curriculo :deep(.estado-em-breve) {
  color: var(--cor-sidebar-texto-suave, #b8c0cc);
}

.menu-curriculo :deep(.estado-em-breve__selo) {
  color: var(--cor-sidebar-selo-texto, #d8d2ba);
  background: var(--cor-sidebar-selo-bg, #1a3a5c);
}
</style>
