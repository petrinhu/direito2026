<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import { usarSemMovimento, type Administrar } from '@/app/restrito';
import type { IndiceAlternativa } from '@/core/unidade/tipos';
import type { ConteudoRestritoValidado } from '@/core/restrito/tipos';
import VisorResumo from '../componentes/VisorResumo.vue';
import MotorQuiz from '../componentes/MotorQuiz.vue';
import AbasRestritas from './AbasRestritas.vue';
import MapaRestritoVisor from './MapaRestritoVisor.vue';
import SlidesVisor from './SlidesVisor.vue';
import PainelAdmin from './PainelAdmin.vue';

const props = defineProps<{
  conteudo: ConteudoRestritoValidado;
  usuario: string;
  admin: boolean;
  administrar: Administrar;
}>();

const semMovimento = usarSemMovimento(inject(CHAVE_STORE_MODO_ADAPTADO, undefined));

const abas = computed(() => [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'mapa', rotulo: 'Mapa mental' },
  { id: 'quiz', rotulo: 'Quiz' },
  { id: 'slides', rotulo: 'Slides' },
  ...(props.admin ? [{ id: 'admin', rotulo: 'Admin' }] : [])
]);

const aba = ref('resumo');

// O quiz vive só nesta memória: nada de localStorage, o progresso some ao sair.
const novaSemente = (): number => Math.floor(Math.random() * 2 ** 31);
const semente = ref<number | undefined>(novaSemente());
const respostas = ref<Record<number, IndiceAlternativa>>({});
const finalizada = ref(false);

function reiniciarQuiz(): void {
  respostas.value = {};
  finalizada.value = false;
  semente.value = novaSemente();
}
</script>

<template>
  <div class="ar-visor">
    <header class="ar-visor__cabecalho">
      <h2 class="ar-visor__titulo">{{ conteudo.meta.titulo }}</h2>
      <p class="ar-visor__subtitulo">{{ conteudo.meta.subtitulo }}</p>
      <p class="ar-visor__descricao">{{ conteudo.meta.descricao }}</p>
    </header>

    <section class="ar-cartao ar-visor__equipe" aria-labelledby="ar-equipe-titulo">
      <h2 id="ar-equipe-titulo">Equipe</h2>
      <p class="ar-visor__instituicao">{{ conteudo.equipe.instituicao }}</p>
      <ul class="ar-visor__integrantes">
        <li v-for="nome in conteudo.equipe.integrantes" :key="nome">{{ nome }}</li>
      </ul>
    </section>

    <AbasRestritas
      :abas="abas"
      :ativa="aba"
      rotulo-lista="Seções do conteúdo"
      @trocar="aba = $event"
    >
      <VisorResumo v-if="aba === 'resumo'" :blocos="conteudo.resumo" />
      <MapaRestritoVisor v-else-if="aba === 'mapa'" :mapa="conteudo.mapa" />
      <section v-else-if="aba === 'quiz'" aria-labelledby="ar-quiz-titulo">
        <h2 id="ar-quiz-titulo">Quiz</h2>
        <MotorQuiz
          :perguntas="conteudo.quiz"
          :semente="semente"
          :respostas-salvas="respostas"
          :finalizada="finalizada"
          letras
          @semente-gerada="semente = $event"
          @responder="(id, indice) => (respostas = { ...respostas, [id]: indice })"
          @finalizar="finalizada = true"
          @reiniciar="reiniciarQuiz"
        />
      </section>
      <SlidesVisor
        v-else-if="aba === 'slides'"
        :slides="conteudo.slides"
        :equipe="conteudo.equipe"
        :reduzir-movimento="semMovimento"
      />
      <PainelAdmin
        v-else-if="aba === 'admin' && admin"
        :usuario-atual="usuario"
        :administrar="administrar"
      />
    </AbasRestritas>
  </div>
</template>

<style scoped>
.ar-visor {
  display: grid;
  gap: var(--esp-4, 1rem);
}

.ar-visor__titulo {
  margin: 0;
  font-family: var(--fonte-titulo, serif);
  font-size: var(--escala-lg, 1.75rem);
  color: var(--cor-titulo-texto);
}

.ar-visor__subtitulo {
  margin: var(--esp-1, 0.25rem) 0 0;
  font-size: var(--escala-md, 1.25rem);
  color: var(--ar-ciano, var(--cor-texto));
}

.ar-visor__descricao {
  max-width: var(--largura-leitura, 68ch);
  color: var(--cor-texto-suave);
}

.ar-visor__equipe h2 {
  margin-top: 0;
  font-size: var(--escala-md, 1.25rem);
}

.ar-visor__instituicao {
  margin: 0 0 var(--esp-2, 0.5rem);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.ar-visor__integrantes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ar-visor__integrantes li {
  padding: var(--esp-1, 0.25rem) var(--esp-3, 0.75rem);
  border: 1px solid var(--cor-borda-forte);
  border-radius: 999px;
}

:root[data-modo-adaptado='on'] .ar-visor__integrantes li {
  border: 2px solid #000000;
}
</style>
