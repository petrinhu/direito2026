<script setup lang="ts">
import { computed, ref } from 'vue';
import GradeCalendario from '../componentes/GradeCalendario.vue';
import LegendaCalendario from '../componentes/LegendaCalendario.vue';
import PainelDoDia from '../componentes/PainelDoDia.vue';
import ListaDatasDoMes from '../componentes/ListaDatasDoMes.vue';
import { dataDeHoje } from '@/app/calendario/dataDeHoje';
import { visaoDoDia } from '@/app/calendario/visaoDoDia';
import { visaoDatasDoMes } from '@/app/calendario/visaoDatasDoMes';
import { observacoesDoCalendario } from '@/app/calendario/eventosDoCalendario';
import '@/ui/estilos/calendario.css';

/**
 * Página do calendário (ordem do líder, 20/10/2026). `agora` é injetável para
 * teste; em produção, o dia é o de hoje em Recife.
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
  <div class="calendario">
    <h1 class="calendario__titulo">Calendário</h1>
    <p class="calendario__apresentacao">
      Provas, feriados e prazos do semestre. Toque numa data para ver o que acontece nela.
    </p>

    <LegendaCalendario />

    <GradeCalendario
      :hoje="hoje"
      @selecionar="selecionar"
      @mudar-mes="(mes: string) => (mesVisivel = mes)"
    />

    <PainelDoDia :visao="visaoDia" />

    <section class="calendario__lista" aria-labelledby="calendario-lista-titulo">
      <h2 id="calendario-lista-titulo" class="calendario__subtitulo">Datas do mês, em lista</h2>
      <p class="calendario__apoio">Mesma informação da grade, em botões que o teclado alcança.</p>
      <ListaDatasDoMes :datas="datasDoMes" :selecionada="diaSelecionado" @selecionar="selecionar" />
    </section>

    <section class="calendario__notas" aria-label="Observações do calendário">
      <p data-testid="nota-sala-digital" class="calendario__nota">
        As disciplinas de Economia e de Empreendedorismo seguem o calendário da sala digital.
      </p>
      <ul class="calendario__observacoes">
        <li v-for="texto in observacoes" :key="texto">{{ texto }}</li>
      </ul>
    </section>
  </div>
</template>
