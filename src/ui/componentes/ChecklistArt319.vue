<script setup lang="ts">
import { computed } from 'vue';

/**
 * Extra (a) da unidade de Redação Jurídica 1 (docs/arquitetura.md): os 8
 * itens do checklist do art. 319 do CPC, tirados literalmente do guia de
 * estudo (peticao-inicial.pdf, seção "01 — antes de começar"). O inciso
 * III do artigo (fato e fundamentos jurídicos) vira dois itens no guia,
 * por isso 8 itens para 7 incisos.
 *
 * Componente CONTROLADO: recebe `marcados` de fora (Unidade.vue, a partir
 * do mesmo RegistroProgressoUnidade que já guarda blocosLidos e o quiz) e
 * só emite `alternar`; não decide sozinho o que persiste, nem sabe se o
 * armazenamento está disponível (isso é responsabilidade de
 * RepositorioProgresso, core/progresso/tipos.ts).
 */
const ITENS: ReadonlyArray<{ id: string; texto: string }> = [
  { id: 'cpc-319-item-i', texto: 'O juízo ao qual é dirigida' },
  { id: 'cpc-319-item-ii', texto: 'A identificação das partes' },
  { id: 'cpc-319-item-iii-fatos', texto: 'Os fatos' },
  { id: 'cpc-319-item-iii-fundamentos', texto: 'Os fundamentos jurídicos' },
  { id: 'cpc-319-item-iv', texto: 'Os pedidos' },
  { id: 'cpc-319-item-v', texto: 'O valor da causa' },
  { id: 'cpc-319-item-vi', texto: 'As provas' },
  { id: 'cpc-319-item-vii', texto: 'Interesse em audiência de conciliação ou mediação' }
];

const props = defineProps<{ marcados: readonly string[] }>();
const emit = defineEmits<{ alternar: [string] }>();

const contagem = computed(() => props.marcados.length);

function estaMarcado(id: string): boolean {
  return props.marcados.includes(id);
}
</script>

<template>
  <div class="checklist-319" role="group" aria-label="Checklist dos requisitos do art. 319, CPC">
    <p class="checklist-319__contador">
      Requisitos do art. 319, CPC: <strong>{{ contagem }} de {{ ITENS.length }}</strong>
    </p>
    <ul class="checklist-319__lista">
      <li v-for="item in ITENS" :key="item.id" class="checklist-319__item">
        <label class="checklist-319__rotulo">
          <input
            type="checkbox"
            :checked="estaMarcado(item.id)"
            @change="emit('alternar', item.id)"
          />
          <span>{{ item.texto }}</span>
        </label>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.checklist-319 {
  max-width: var(--largura-coluna-leitura, 760px);
  margin-block: var(--esp-5, 1.5rem);
  padding: var(--esp-4, 1rem);
  background: var(--cor-fundo-elevado, #fff);
  border: 1px solid var(--cor-borda, #dcd7c8);
  border-radius: var(--raio-md, 10px);
}

.checklist-319__contador {
  margin-block-end: var(--esp-3, 0.75rem);
}

.checklist-319__lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--esp-2, 0.5rem);
}

.checklist-319__rotulo {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2, 0.5rem);
  min-height: var(--alvo-toque-minimo, 24px);
  min-width: var(--alvo-toque-minimo, 24px);
  cursor: pointer;
}

.checklist-319__rotulo input {
  /* O input em si também é alvo de toque: largura/altura mínimas, não só
     a label (achado do mesmo padrão de VisorResumo.vue). */
  width: var(--alvo-toque-minimo, 24px);
  height: var(--alvo-toque-minimo, 24px);
  flex-shrink: 0;
}

.checklist-319__rotulo input:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}
</style>
