<script setup lang="ts">
import type { StoreBusca } from '@/app/stores/busca';

const props = defineProps<{ store: StoreBusca }>();
const emit = defineEmits<{ enviar: [string] }>();

function aoDigitar(evento: Event): void {
  const valor = (evento.target as HTMLInputElement).value;
  props.store.consultar(valor);
}

function aoEnviar(): void {
  emit('enviar', props.store.termo.value);
}
</script>

<template>
  <form role="search" class="campo-busca" @submit.prevent="aoEnviar">
    <label for="campo-busca-input" class="campo-busca__rotulo">Buscar no conteúdo</label>
    <input
      id="campo-busca-input"
      type="search"
      autocomplete="off"
      class="campo-busca__input"
      :value="store.termo.value"
      placeholder="Buscar..."
      @focus="store.garantirMotorCarregado()"
      @input="aoDigitar"
    />
    <span v-if="store.carregando.value" class="campo-busca__carregando" aria-live="polite">
      Carregando índice de busca…
    </span>
  </form>
</template>

<style scoped>
.campo-busca {
  display: flex;
  align-items: center;
  gap: var(--esp-2, 0.5rem);
}

.campo-busca__rotulo {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.campo-busca__input {
  /* Nunca menor que 16px em tela estreita: evita o zoom automático do iOS
     Safari ao focar (guia de compatibilidade, seção 9). */
  font-size: max(16px, var(--escala-sm, 0.9375rem));
  min-height: 44px;
  padding: 0 var(--esp-3, 0.75rem);
  border: 1px solid var(--cor-borda, #dcd7c8);
  border-radius: var(--raio-md, 10px);
  background: var(--cor-fundo-elevado, #fff);
  /* Era `color: inherit`: dentro da barra de topo (fundo escuro fixo,
     texto sempre claro), o campo herdava a cor clara da barra por cima
     do próprio fundo claro do input, quase branco sobre branco. O input
     tem fundo PRÓPRIO (--cor-fundo-elevado, que segue o tema), então a
     cor de texto certa é a que acompanha esse fundo, --cor-texto, nunca
     herdada do container em volta. Contraste medido: 1,05:1 antes,
     17,04:1 depois (achado do líder, 22/09/2026, mesma varredura). */
  color: var(--cor-texto, #1c1c1c);
}

.campo-busca__input:focus-visible {
  outline: 2px solid var(--cor-primaria, #163a5f);
  outline-offset: 2px;
}
</style>
