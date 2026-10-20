<script setup lang="ts">
import CalendarioCompleto from '../componentes/CalendarioCompleto.vue';
import '@/ui/estilos/calendario.css';

/**
 * Página do calendário (ordem do líder, 20/10/2026). O miolo (grade, legenda,
 * painel, lista e notas) é o mesmo da janela modal do quadro de contagem.
 * `agora` é injetável para teste.
 */
const props = defineProps<{ agora?: Date }>();
</script>

<template>
  <div class="calendario">
    <h1 class="calendario__titulo">Calendário</h1>
    <p class="calendario__apresentacao">
      Provas, feriados e prazos do semestre. Toque numa data para ver o que acontece nela.
    </p>

    <CalendarioCompleto :agora="props.agora" />
  </div>
</template>
