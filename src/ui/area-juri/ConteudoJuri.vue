<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue';
import type { ConteudoJuriValidado, ImagemAberta, ResultadoConteudoJuri } from '@/app/juri';
import AbasRestritas from '../area-restrita/AbasRestritas.vue';
import FichamentoJuri from './FichamentoJuri.vue';
import MapaJuri from './MapaJuri.vue';
import MnemonicosJuri from './MnemonicosJuri.vue';
import QuizJuri from './QuizJuri.vue';
import ResumoJuri from './ResumoJuri.vue';

const props = defineProps<{
  carregar: () => Promise<ResultadoConteudoJuri>;
  // eslint-disable-next-line no-unused-vars
  abrirImagem: (id: string) => Promise<ImagemAberta>;
}>();

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'mapa', rotulo: 'Mapa mental' },
  { id: 'fichamento', rotulo: 'Fichamento' },
  { id: 'mnemonicos', rotulo: 'Mnemônicos' },
  { id: 'quiz', rotulo: 'Quiz' }
];

type Estado =
  | { readonly fase: 'carregando' }
  | { readonly fase: 'pronto'; readonly conteudo: ConteudoJuriValidado }
  | { readonly fase: 'erro'; readonly motivo: 'invalido' | 'indisponivel' };

// shallowRef: o conteúdo validado é congelado e não precisa de proxy reativo.
const estado = shallowRef<Estado>({ fase: 'carregando' });
const aba = ref('resumo');

const conteudo = computed(() =>
  estado.value.fase === 'pronto' ? estado.value.conteudo : undefined
);
const motivoErro = computed(() => (estado.value.fase === 'erro' ? estado.value.motivo : undefined));

const MENSAGENS_DE_ERRO = {
  invalido:
    'Não foi possível abrir o conteúdo. Ele tem um defeito e não pode ser mostrado. Avise quem administra o grupo.',
  indisponivel: 'Não foi possível carregar o conteúdo. Verifique a conexão e tente de novo.'
} as const;

async function buscar(): Promise<void> {
  estado.value = { fase: 'carregando' };
  const resultado = await props.carregar();
  estado.value = resultado.ok
    ? { fase: 'pronto', conteudo: resultado.conteudo }
    : { fase: 'erro', motivo: resultado.motivo };
}

onMounted(() => void buscar());
</script>

<template>
  <div class="juri-visor" :data-estado="estado.fase">
    <p v-if="estado.fase === 'carregando'" role="status" class="juri-aviso">
      Carregando o conteúdo…
    </p>

    <div v-else-if="motivoErro" class="juri-erro">
      <p role="alert">{{ MENSAGENS_DE_ERRO[motivoErro] }}</p>
      <button v-if="motivoErro === 'indisponivel'" type="button" class="juri-botao" @click="buscar">
        Tentar de novo
      </button>
    </div>

    <AbasRestritas
      v-else-if="conteudo"
      :abas="ABAS"
      :ativa="aba"
      rotulo-lista="Seções do conteúdo"
      @trocar="aba = $event"
    >
      <ResumoJuri v-if="aba === 'resumo'" :conteudo="conteudo" :abrir-imagem="abrirImagem" />
      <MapaJuri v-else-if="aba === 'mapa'" :mapa="conteudo.mapa" />
      <FichamentoJuri v-else-if="aba === 'fichamento'" :fichamento="conteudo.fichamento" />
      <MnemonicosJuri v-else-if="aba === 'mnemonicos'" :mnemonicos="conteudo.mnemonicos" />
      <QuizJuri v-else-if="aba === 'quiz'" :perguntas="conteudo.quiz" />
    </AbasRestritas>
  </div>
</template>
