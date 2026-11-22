<script setup lang="ts">
import { computed, defineAsyncComponent, inject } from 'vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import { rotuloSemViuva } from '@/app/curriculo/rotuloSemViuva';
import { itensDaCadeira } from '@/app/curriculo/itensDaCadeira';
import type { ReferenciaUnidade } from '@/core/curriculo/tipos';
import CartaoUnidade from '../componentes/CartaoUnidade.vue';
import EstadoEmBreve from '../componentes/EstadoEmBreve.vue';
import AlvoQuadroProva from '../componentes/AlvoQuadroProva.vue';

// Só a cadeira restrita carrega esta página (e o CSS dela), em chunk à parte.
const AreaRestrita = defineAsyncComponent(() => import('./AreaRestrita.vue'));
// Área da Júri: login próprio, em chunk próprio. Vem ANTES da restrita genérica
// (as duas são restritas; o campo area escolhe).
const AreaJuri = defineAsyncComponent(() => import('./AreaJuri.vue'));

const props = defineProps<{ periodo: string; cadeira: string }>();
const curriculo = inject(CHAVE_CURRICULO)!;

const periodo = computed(() => curriculo.find((p) => p.id === props.periodo));
const cadeira = computed(() => periodo.value?.cadeiras.find((c) => c.id === props.cadeira));

type ItemCadeira = ReturnType<typeof itensDaCadeira>[number];
type ItemAv = Extract<ItemCadeira, { tipo: 'av' }>;

/**
 * Blocos da página na mesma ordem do menu lateral. Unidades simples seguidas
 * formam uma grade só; cada AV vira uma seção. A fonte é itensDaCadeira, a
 * mesma que o MenuCurriculo lê, então rótulo e ordem não divergem do menu.
 */
type Bloco =
  { tipo: 'unidades'; chave: string; unidades: ReferenciaUnidade[] } | { tipo: 'av'; item: ItemAv };

const blocos = computed<Bloco[]>(() => {
  const atual = cadeira.value;
  if (!atual) return [];
  const saida: Bloco[] = [];
  for (const item of itensDaCadeira(atual)) {
    if (item.tipo === 'av') {
      saida.push({ tipo: 'av', item });
      continue;
    }
    const ultimo = saida.at(-1);
    if (ultimo?.tipo === 'unidades') ultimo.unidades.push(item.unidade);
    else saida.push({ tipo: 'unidades', chave: item.chave, unidades: [item.unidade] });
  }
  return saida;
});

function idSecao(chave: string, sufixo: string): string {
  return `cadeira-${cadeira.value?.id ?? ''}-${chave}${sufixo}`;
}
</script>

<template>
  <AreaJuri v-if="cadeira?.area === 'juri'" />
  <AreaRestrita v-else-if="cadeira?.restrita" />
  <div v-else-if="cadeira" class="pagina-cadeira">
    <h1>{{ rotuloSemViuva(cadeira.nome) }}</h1>
    <AlvoQuadroProva />
    <template v-for="bloco in blocos" :key="bloco.tipo === 'av' ? bloco.item.chave : bloco.chave">
      <section v-if="bloco.tipo === 'unidades'" class="pagina-cadeira__lista" aria-label="Unidades">
        <CartaoUnidade
          v-for="unidade in bloco.unidades"
          :key="unidade.id"
          :periodo="periodo!"
          :cadeira="cadeira"
          :unidade="unidade"
          :href="`/p/${periodo!.id}/${cadeira.id}/${unidade.id}`"
          :nivel-cabecalho="2"
        />
      </section>
      <section
        v-else
        class="pagina-cadeira__av"
        :aria-labelledby="idSecao(bloco.item.chave, '-titulo')"
      >
        <h2 :id="idSecao(bloco.item.chave, '-titulo')">{{ rotuloSemViuva(bloco.item.rotulo) }}</h2>
        <template v-for="grupo in bloco.item.grupos" :key="grupo.id">
          <CartaoUnidade
            v-if="grupo.direto && grupo.topicos[0]"
            :periodo="periodo!"
            :cadeira="cadeira"
            :unidade="grupo.topicos[0]"
            :href="`/p/${periodo!.id}/${cadeira.id}/${grupo.topicos[0].id}`"
            :nivel-cabecalho="3"
          />
          <section
            v-else
            class="pagina-cadeira__grupo"
            :aria-labelledby="idSecao(`${bloco.item.chave}-${grupo.id}`, '-titulo')"
          >
            <h3 :id="idSecao(`${bloco.item.chave}-${grupo.id}`, '-titulo')">
              {{ rotuloSemViuva(grupo.rotulo) }}
            </h3>
            <p v-if="grupo.topicos.length === 0">
              <EstadoEmBreve rotulo="Sem tópico publicado" />
            </p>
            <div v-else class="pagina-cadeira__lista">
              <CartaoUnidade
                v-for="topico in grupo.topicos"
                :key="topico.id"
                :periodo="periodo!"
                :cadeira="cadeira"
                :unidade="topico"
                :href="`/p/${periodo!.id}/${cadeira.id}/${topico.id}`"
                :nivel-cabecalho="4"
              />
            </div>
          </section>
        </template>
      </section>
    </template>
  </div>
  <EstadoEmBreve v-else rotulo="Cadeira não encontrada" />
</template>

<style scoped>
.pagina-cadeira {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem);
}

.pagina-cadeira__lista {
  display: grid;
  gap: var(--esp-5, 1.5rem);
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.pagina-cadeira__av {
  display: grid;
  gap: var(--esp-5, 1.5rem);
  margin-block-start: var(--esp-6, 2rem);
}

.pagina-cadeira__grupo {
  display: grid;
  gap: var(--esp-4, 1rem);
}
</style>
