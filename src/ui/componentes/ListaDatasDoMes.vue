<script setup lang="ts">
import type { VisaoDataDoMes } from '@/app/calendario/visaoDatasDoMes';

/**
 * Alternativa ao clique na grade: cada dia com evento é um botão nativo, que
 * o teclado alcança e ativa com Enter ou Espaço. Leva ao mesmo painel.
 */
defineProps<{ datas: VisaoDataDoMes[]; selecionada: string }>();
defineEmits<{ selecionar: [data: string] }>();
</script>

<template>
  <div class="lista-datas-do-mes">
    <p v-if="datas.length === 0" class="lista-datas-do-mes__vazio">
      Nenhuma data marcada neste mês.
    </p>
    <ul v-else class="lista-datas-do-mes__lista" data-testid="lista-datas-do-mes">
      <li v-for="d in datas" :key="d.data">
        <button
          type="button"
          class="lista-datas-do-mes__botao"
          :aria-pressed="d.data === selecionada ? 'true' : 'false'"
          @click="$emit('selecionar', d.data)"
        >
          {{ d.rotulo }}: {{ d.quantidade === 1 ? '1 evento' : `${d.quantidade} eventos` }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lista-datas-do-mes__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--esp-2, 0.5rem);
}

.lista-datas-do-mes__botao {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  border-radius: var(--raio-md, 10px);
  border: 1px solid var(--cor-borda-forte, #c3bca4);
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-texto, #1c1c1c);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.lista-datas-do-mes__botao[aria-pressed='true'] {
  border: 2px solid var(--cor-primaria, #163a5f);
  font-weight: 600;
}

.lista-datas-do-mes__botao:focus-visible {
  outline: 2px solid var(--cor-foco, #163a5f);
  outline-offset: 2px;
}

.lista-datas-do-mes__vazio {
  margin: 0;
  color: var(--cor-texto-suave, #4a4a4a);
}
</style>
