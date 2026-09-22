<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { CHAVE_CURRICULO, CHAVE_REPOSITORIO } from '@/app/chaves';
import { criarStoreProgresso } from '@/app/stores/progresso';
import type { ChaveAba } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';
import type { IndiceDispositivos } from '@/core/dispositivos/tipos';
import AbasUnidade from '../componentes/AbasUnidade.vue';
import EstadoEmBreve from '../componentes/EstadoEmBreve.vue';
import VisorResumo from '../componentes/VisorResumo.vue';
import PecaComentadaVisor from '../componentes/PecaComentadaVisor.vue';
import MotorQuiz from '../componentes/MotorQuiz.vue';
import IndicadorProgresso from '../componentes/IndicadorProgresso.vue';
import BalaoDispositivo from '../componentes/BalaoDispositivo.vue';
import ApendiceDispositivos from '../componentes/ApendiceDispositivos.vue';

const props = defineProps<{
  periodo: string;
  cadeira: string;
  unidade: string;
  aba: ChaveAba;
}>();

const curriculo = inject(CHAVE_CURRICULO)!;
const repositorio = inject(CHAVE_REPOSITORIO)!;
const router = useRouter();

const referenciaUnidade = computed(() =>
  curriculo
    .find((p) => p.id === props.periodo)
    ?.cadeiras.find((c) => c.id === props.cadeira)
    ?.unidades.find((u) => u.id === props.unidade)
);

const chaveUnidade = computed(() => `${props.periodo}/${props.cadeira}/${props.unidade}`);
const storeProgresso = computed(() => criarStoreProgresso(repositorio, chaveUnidade.value));

const conteudo = ref<ConteudoUnidade | undefined>();
const carregando = ref(false);
const dispositivos = ref<IndiceDispositivos | undefined>();
const regiaoConteudoRef = ref<HTMLElement | undefined>();

async function carregar(): Promise<void> {
  const referencia = referenciaUnidade.value;
  if (!referencia?.carregar) return;
  carregando.value = true;
  try {
    conteudo.value = await referencia.carregar();
  } finally {
    carregando.value = false;
  }
  try {
    const modulo = await import(
      /* @vite-ignore */ `@/conteudo/${props.periodo}/${props.cadeira}/${props.unidade}/dispositivos`
    );
    dispositivos.value = modulo.dispositivos;
  } catch {
    // Gerado no build (scripts/gerar-dispositivos-por-unidade.ts, seção
    // 12.5); ausente em dev antes de rodar o gerador. O balão trata isso
    // como "indisponível sem conexão", nunca como balão vazio.
    dispositivos.value = undefined;
  }
}

onMounted(carregar);
watch(() => [props.periodo, props.cadeira, props.unidade], carregar);

function navegarAba(aba: ChaveAba): void {
  const base = `/p/${props.periodo}/${props.cadeira}/${props.unidade}`;
  router.push(aba === 'resumo' ? base : `${base}/${aba}`);
  storeProgresso.value.atualizar({ ultimaAba: aba });
}

const contagemBlocos = computed(() =>
  conteudo.value ? storeProgresso.value.contagem(conteudo.value.resumo.map((b) => b.id)) : { lidos: 0, total: 0 }
);
</script>

<template>
  <EstadoEmBreve v-if="!referenciaUnidade" rotulo="Unidade não encontrada" />
  <div v-else ref="regiaoConteudoRef" class="pagina-unidade">
    <h1>{{ referenciaUnidade.titulo }}</h1>
    <IndicadorProgresso
      v-if="conteudo && aba === 'resumo'"
      :lidos="contagemBlocos.lidos"
      :total="contagemBlocos.total"
    />
    <AbasUnidade :abas="referenciaUnidade.abas" :aba-ativa="aba" @navegar="navegarAba">
      <template #default>
        <p v-if="carregando">Carregando…</p>
        <template v-else-if="conteudo">
          <VisorResumo
            v-if="aba === 'resumo'"
            :blocos="conteudo.resumo"
            @bloco-lido="storeProgresso.marcarLido($event)"
          />
          <PecaComentadaVisor v-else-if="aba === 'peticao' && conteudo.peticao" :peca="conteudo.peticao" />
          <MotorQuiz
            v-else-if="aba === 'quiz' && conteudo.quiz"
            :perguntas="conteudo.quiz"
            :semente="storeProgresso.registro.value.quizSemente"
            :respostas-salvas="storeProgresso.registro.value.quizRespostas ?? {}"
            :finalizada="storeProgresso.registro.value.quizFinalizado ?? false"
            @semente-gerada="(semente) => storeProgresso.atualizar({ quizSemente: semente })"
            @responder="
              (idPergunta, indice) =>
                storeProgresso.atualizar({
                  quizRespostas: { ...storeProgresso.registro.value.quizRespostas, [idPergunta]: indice }
                })
            "
            @finalizar="storeProgresso.atualizar({ quizFinalizado: true })"
            @reiniciar="
              storeProgresso.atualizar({ quizSemente: undefined, quizRespostas: {}, quizFinalizado: false })
            "
          />
        </template>
      </template>
    </AbasUnidade>
    <ApendiceDispositivos :dispositivos="dispositivos" />
    <BalaoDispositivo :regiao="regiaoConteudoRef" :dispositivos="dispositivos" />
  </div>
</template>

<style scoped>
.pagina-unidade {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem);
}
</style>
