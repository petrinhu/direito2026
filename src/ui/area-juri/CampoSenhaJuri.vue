<script setup lang="ts">
import { ref } from 'vue';

// Campo de senha da Júri: rótulo ligado, tipo que alterna com "Mostrar", e a
// descrição (regra, contador) ligada por aria-describedby. Só o valor sai daqui.
defineProps<{
  id: string;
  nome: string;
  rotulo: string;
  autocomplete: string;
  mostrar: boolean;
  invalido?: boolean;
  descrito?: string;
}>();

const valor = defineModel<string>({ required: true });
const campo = ref<HTMLInputElement>();

defineExpose({
  focar: (): void => campo.value?.focus()
});
</script>

<template>
  <div class="juri-campo">
    <label :for="id">{{ rotulo }}</label>
    <input
      :id="id"
      ref="campo"
      v-model="valor"
      :name="nome"
      :type="mostrar ? 'text' : 'password'"
      :autocomplete="autocomplete"
      autocapitalize="none"
      autocorrect="off"
      spellcheck="false"
      :aria-describedby="descrito"
      :aria-invalid="invalido ? 'true' : undefined"
    />
  </div>
</template>
