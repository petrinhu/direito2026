<script setup lang="ts">
import { computed } from 'vue';
import type { ChaveAba } from '@/core/curriculo/tipos';
import { ROTULOS_ABA as ROTULOS } from '@/app/curriculo/rotulosAba';

const props = defineProps<{
  abas: readonly ChaveAba[];
  abaAtiva: ChaveAba;
}>();

const emit = defineEmits<{ navegar: [ChaveAba] }>();

const abasVisiveis = computed(() => props.abas);

function idPainel(aba: ChaveAba): string {
  return `painel-${aba}`;
}
function idTab(aba: ChaveAba): string {
  return `tab-${aba}`;
}

function irPara(aba: ChaveAba, evento: KeyboardEvent | MouseEvent): void {
  evento.preventDefault();
  emit('navegar', aba);
}

/** Setas movem o foco entre as abas, sem ativar sozinhas (padrão ARIA tablist). */
function moverFoco(indiceAtual: number, direcao: 1 | -1): void {
  const lista = abasVisiveis.value;
  const proximo = (indiceAtual + direcao + lista.length) % lista.length;
  const alvo = document.getElementById(idTab(lista[proximo]!));
  alvo?.focus();
}
</script>

<template>
  <div class="abas-unidade">
    <div role="tablist" aria-label="Abas da unidade" class="abas-unidade__lista">
      <a
        v-for="(aba, indice) in abasVisiveis"
        :id="idTab(aba)"
        :key="aba"
        role="tab"
        href="#"
        :aria-selected="aba === abaAtiva ? 'true' : 'false'"
        :aria-controls="idPainel(aba)"
        :tabindex="aba === abaAtiva ? 0 : -1"
        class="abas-unidade__tab"
        @click="irPara(aba, $event)"
        @keydown.right.prevent="moverFoco(indice, 1)"
        @keydown.left.prevent="moverFoco(indice, -1)"
      >
        {{ ROTULOS[aba] }}
      </a>
    </div>
    <div
      v-for="aba in abasVisiveis"
      v-show="aba === abaAtiva"
      :id="idPainel(aba)"
      :key="`painel-${aba}`"
      role="tabpanel"
      :aria-labelledby="idTab(aba)"
    >
      <slot :aba="aba" />
    </div>
  </div>
</template>

<style scoped>
.abas-unidade__lista {
  display: flex;
  gap: var(--esp-2, 0.5rem);
  border-bottom: 1px solid var(--cor-borda, #dcd7c8);
}

/* Modo de leitura adaptada: mesmo raciocínio de BarraTopo.vue, a fonte
   maior não cabe mais numa linha só em tela estreita; quebra em vez de
   estourar a largura da página. */
:root[data-modo-adaptado='on'] .abas-unidade__lista {
  flex-wrap: wrap;
}

.abas-unidade__tab {
  padding: var(--esp-3, 0.75rem) var(--esp-4, 1rem);
  text-decoration: none;
  color: var(--cor-texto-suave, #4a4a4a);
  border-bottom: 2px solid transparent;
}

.abas-unidade__tab[aria-selected='true'] {
  color: var(--cor-primaria, #163a5f);
  border-bottom-color: var(--cor-primaria, #163a5f);
  font-weight: 600;
}

.abas-unidade__tab:focus-visible {
  outline: 2px solid var(--cor-primaria, #163a5f);
  outline-offset: 2px;
}
</style>
