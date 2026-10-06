<script setup lang="ts">
import { nextTick, useId } from 'vue';

const props = defineProps<{
  abas: readonly { id: string; rotulo: string }[];
  ativa: string;
  rotuloLista: string;
}>();

const emit = defineEmits<{ trocar: [id: string] }>();

const base = `ar-abas-${useId()}`;
const idAba = (id: string): string => `${base}-aba-${id}`;
const idPainel = (id: string): string => `${base}-painel-${id}`;

async function ativarComFoco(id: string): Promise<void> {
  emit('trocar', id);
  await nextTick();
  document.getElementById(idAba(id))?.focus();
}

function aoTeclar(evento: KeyboardEvent, indice: number): void {
  const total = props.abas.length;
  const alvo: Record<string, number> = {
    ArrowRight: (indice + 1) % total,
    ArrowLeft: (indice - 1 + total) % total,
    Home: 0,
    End: total - 1
  };
  const destino = alvo[evento.key];
  if (destino === undefined) return;
  evento.preventDefault();
  void ativarComFoco(props.abas[destino]!.id);
}
</script>

<template>
  <div class="ar-abas">
    <div role="tablist" class="ar-abas__lista" :aria-label="rotuloLista">
      <button
        v-for="(aba, indice) in abas"
        :id="idAba(aba.id)"
        :key="aba.id"
        type="button"
        role="tab"
        class="ar-abas__aba"
        :aria-selected="aba.id === ativa ? 'true' : 'false'"
        :aria-controls="idPainel(aba.id)"
        :tabindex="aba.id === ativa ? 0 : -1"
        @click="emit('trocar', aba.id)"
        @keydown="aoTeclar($event, indice)"
      >
        {{ aba.rotulo }}
      </button>
    </div>
    <div
      :id="idPainel(ativa)"
      role="tabpanel"
      class="ar-abas__painel"
      :aria-labelledby="idAba(ativa)"
    >
      <slot :aba="ativa" />
    </div>
  </div>
</template>

<style scoped>
.ar-abas__lista {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  padding-bottom: var(--esp-2, 0.5rem);
  border-bottom: 1px solid var(--cor-borda);
}

.ar-abas__aba {
  min-height: max(var(--alvo-toque-minimo, 24px), 44px);
  min-width: 44px;
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--cor-texto-suave);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.ar-abas__aba:hover {
  border-color: var(--cor-borda-forte);
}

.ar-abas__aba[aria-selected='true'] {
  border-color: var(--ar-ouro, var(--cor-primaria));
  background: var(--cor-fundo-sutil);
  color: var(--cor-primaria);
  box-shadow: 0 0 0 1px var(--ar-ouro, var(--cor-primaria)) inset;
}

.ar-abas__aba:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco);
  outline-offset: var(--foco-deslocamento, 2px);
}

.ar-abas__painel {
  padding-top: var(--esp-4, 1rem);
}
</style>
