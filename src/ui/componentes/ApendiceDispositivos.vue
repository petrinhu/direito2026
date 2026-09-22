<script setup lang="ts">
import { computed } from 'vue';
import type { IndiceDispositivos } from '@/core/dispositivos/tipos';
import { montarRotuloDispositivo } from '@/app/dispositivos/rotulo';

const props = defineProps<{ dispositivos: IndiceDispositivos | undefined }>();

const lista = computed(() => (props.dispositivos ? Object.values(props.dispositivos) : []));
</script>

<template>
  <!--
    Seção 12.6: o balão não existe no papel. Fica no DOM sempre, escondida
    em tela (@media screen), para a impressão funcionar offline e sem
    depender de o leitor ter aberto algum balão antes.
  -->
  <section v-if="lista.length > 0" class="apendice-dispositivos" aria-label="Dispositivos citados">
    <h2>Dispositivos citados</h2>
    <ol>
      <li v-for="dispositivo in lista" :key="dispositivo.id">
        <strong>{{ montarRotuloDispositivo(dispositivo) }}</strong> ({{ dispositivo.diploma }}):
        {{ dispositivo.texto }}
        <span class="apendice-dispositivos__meta">
          Fonte: {{ dispositivo.urlFonte }}. Consultado em {{ dispositivo.dataConsulta }}.
          <template v-if="dispositivo.notaAlteracao"> {{ dispositivo.notaAlteracao }}</template>
        </span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
@media screen {
  .apendice-dispositivos {
    display: none;
  }
}

@media print {
  .apendice-dispositivos {
    break-before: page;
  }
  .apendice-dispositivos__meta {
    display: block;
    font-size: 0.85em;
    color: #333;
  }
}
</style>
