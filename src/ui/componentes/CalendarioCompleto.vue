<script setup lang="ts">
import { computed, ref } from 'vue';
import GradeCalendario from './GradeCalendario.vue';
import LegendaCalendario from './LegendaCalendario.vue';
import PainelDoDia from './PainelDoDia.vue';
import ListaDatasDoMes from './ListaDatasDoMes.vue';
import { dataDeHoje } from '@/app/calendario/dataDeHoje';
import { visaoDoDia } from '@/app/calendario/visaoDoDia';
import { visaoDatasDoMes } from '@/app/calendario/visaoDatasDoMes';
import { observacoesDoCalendario } from '@/app/calendario/eventosDoCalendario';
import '@/ui/estilos/calendario.css';

/**
 * Miolo do calendário (legenda, grade, painel do dia, lista de datas e notas),
 * usado pela página /calendario e pela janela modal do quadro de contagem
 * (ordem do líder, 20/10/2026). `agora` é injetável para teste; em produção, o
 * dia é o de hoje em Recife. A página põe o título; a modal põe o dela.
 */
const props = defineProps<{ agora?: Date }>();

const hoje = computed(() => dataDeHoje(props.agora ?? new Date()));
const diaSelecionado = ref<string>(hoje.value);
const mesVisivel = ref<string>(hoje.value.slice(0, 7));

const visaoDia = computed(() => visaoDoDia(diaSelecionado.value));
const datasDoMes = computed(() => visaoDatasDoMes(mesVisivel.value));
const observacoes = observacoesDoCalendario();

function selecionar(data: string): void {
  diaSelecionado.value = data;
}
</script>

<template>
  <div class="calendario-completo">
    <LegendaCalendario />

    <GradeCalendario
      :hoje="hoje"
      @selecionar="selecionar"
      @mudar-mes="(mes: string) => (mesVisivel = mes)"
    />

    <PainelDoDia :visao="visaoDia" />

    <section class="calendario__lista" aria-labelledby="calendario-lista-titulo">
      <h2 id="calendario-lista-titulo" class="calendario__subtitulo">Datas do mês, em lista</h2>
      <p class="calendario__apoio">Mesmas datas da grade, em botões acessíveis pelo teclado.</p>
      <ListaDatasDoMes :datas="datasDoMes" :selecionada="diaSelecionado" @selecionar="selecionar" />
    </section>

    <section class="calendario__notas" aria-label="Observações do calendário">
      <p data-testid="nota-sala-digital" class="calendario__nota">
        As provas de Economia e de Empreendedorismo são online, na sala digital, de 13/10 a
        15/11/2026.
      </p>
      <ul class="calendario__observacoes">
        <li v-for="texto in observacoes" :key="texto">{{ texto }}</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.calendario-completo {
  display: grid;
  gap: var(--esp-5, 1.5rem);
}
</style>
