<script setup lang="ts">
import { ref } from 'vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { RepositorioProgresso } from '@/core/progresso/tipos';
import type { StoreTema } from '@/app/stores/tema';
import type { StoreBusca } from '@/app/stores/busca';
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';
import BarraTopo from './BarraTopo.vue';
import Rodape from './Rodape.vue';
import MenuCurriculo from '../componentes/MenuCurriculo.vue';
import AvisoArmazenamento from '../componentes/AvisoArmazenamento.vue';

defineProps<{
  curriculo: Curriculo;
  caminhoAtual: string;
  repositorio: RepositorioProgresso;
  storeTema: StoreTema;
  storeBusca: StoreBusca;
  storeModoAdaptado: StoreModoAdaptado;
}>();

const emit = defineEmits<{ buscar: [string] }>();

const gavetaAberta = ref(false);

function abrirGaveta(): void {
  gavetaAberta.value = true;
}

function fecharGaveta(): void {
  gavetaAberta.value = false;
}

function aoTeclaNaGaveta(evento: KeyboardEvent): void {
  if (evento.key === 'Escape') fecharGaveta();
}
</script>

<template>
  <a href="#conteudo-principal" class="layout-base__pular">Pular para o conteúdo</a>
  <BarraTopo
    :curriculo="curriculo"
    :caminho-atual="caminhoAtual"
    :store-tema="storeTema"
    :store-busca="storeBusca"
    :store-modo-adaptado="storeModoAdaptado"
    @abrir-gaveta="abrirGaveta"
    @buscar="(termo) => emit('buscar', termo)"
  />
  <div class="layout-base__corpo">
    <div v-if="gavetaAberta" class="layout-base__sobreposicao" @click="fecharGaveta" />
    <aside
      class="layout-base__gaveta"
      :class="{ 'layout-base__gaveta--aberta': gavetaAberta }"
      @keydown="aoTeclaNaGaveta"
    >
      <MenuCurriculo :curriculo="curriculo" :caminho-atual="caminhoAtual" />
    </aside>
    <main id="conteudo-principal" tabindex="-1" class="layout-base__conteudo">
      <slot />
    </main>
  </div>
  <Rodape :repositorio="repositorio" />
  <AvisoArmazenamento :repositorio="repositorio" />
</template>

<style scoped>
.layout-base__pular {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  background: var(--cor-fundo-elevado, #fff);
  padding: var(--esp-3, 0.75rem);
}

.layout-base__pular:focus {
  left: var(--esp-3, 0.75rem);
  top: var(--esp-3, 0.75rem);
}

.layout-base__corpo {
  display: flex;
  /* BarraTopo.vue virou position:fixed (cabeçalho recolhível, ordem do
     líder, 22/09/2026): sem este respiro o conteúdo nasceria coberto
     pela faixa. A folga extra (esp-2) absorve a onda + o fio de
     progresso, que ficam pendurados um pouco abaixo do cabeçalho. */
  padding-top: calc(var(--altura-cabecalho, 64px) + var(--esp-2, 0.5rem));
}

.layout-base__gaveta {
  width: var(--largura-sidebar, 280px);
  flex-shrink: 0;
  /* Par dedicado da lateral (achado do líder, 22/09/2026): fundo escuro
     nos dois temas, por desenho, então nunca uma variável que inverte
     com o tema (--cor-primaria-escura e --cor-texto-invertido colapsavam
     no mesmo valor no tema escuro, texto sumindo). */
  background: var(--cor-sidebar-fundo, #0d2440);
  color: var(--cor-sidebar-texto, #faf9f5);
  min-height: 100dvh;
  min-height: 100vh;
}

.layout-base__conteudo {
  flex: 1;
  min-width: 0;
}

.layout-base__sobreposicao {
  display: none;
}

@media (max-width: 880px) {
  .layout-base__gaveta {
    position: fixed;
    inset-block: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform var(--transicao-rapida, 150ms ease);
    z-index: 90;
    overflow-y: auto;
  }

  .layout-base__gaveta--aberta {
    transform: translateX(0);
  }

  .layout-base__sobreposicao {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 80;
  }
}

@media print {
  .layout-base__gaveta {
    display: none;
  }
}
</style>
