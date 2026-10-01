<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { MapaFichamento } from '@/core/fichamento/tipos';
import { filtrarFichas, ordenarFichas, rotuloDaFase } from '@/app/fichamento';
import FichaPensadorCartao from './FichaPensadorCartao.vue';

const props = defineProps<{
  dados: MapaFichamento;
  /** Endereço da unidade sem barra final. Ex.: '/p/p1/filosofia-juridica/u1'. */
  baseUnidade: string;
}>();

/** 'todos', 'era:<id>' ou 'fase:<id>'. */
const periodo = ref('todos');
const termo = ref('');
const abertas = ref<ReadonlySet<string>>(new Set());

const fichasFiltradas = computed(() => {
  const [tipo, id] = periodo.value.split(':');
  return filtrarFichas(props.dados, {
    eraId: tipo === 'era' ? id : undefined,
    faseId: tipo === 'fase' ? id : undefined,
    termo: termo.value
  });
});

const grupos = computed(() => ordenarFichas(props.dados, fichasFiltradas.value));
const filtroAtivo = computed(() => periodo.value !== 'todos' || termo.value.trim() !== '');

const resumoDoFiltro = computed(() => {
  const total = fichasFiltradas.value.length;
  if (total === 0) return 'Nenhuma ficha encontrada';
  return total === 1 ? '1 ficha' : `${total} fichas`;
});

function alternar(id: string): void {
  const novo = new Set(abertas.value);
  if (novo.has(id)) novo.delete(id);
  else novo.add(id);
  abertas.value = novo;
}

function abrirTodas(): void {
  abertas.value = new Set(fichasFiltradas.value.map((f) => f.id));
}

function fecharTodas(): void {
  abertas.value = new Set();
}

function limparFiltros(): void {
  periodo.value = 'todos';
  termo.value = '';
}

/** Âncora de ficha na URL (vinda do mapa ou da busca): abre aquela ficha. */
function abrirFichaDaAncora(): void {
  const alvo = window.location.hash.replace(/^#ficha-/, '');
  if (!window.location.hash.startsWith('#ficha-')) return;
  if (props.dados.pensadores.some((f) => f.id === alvo)) {
    abertas.value = new Set(abertas.value).add(alvo);
  }
}

onMounted(() => {
  abrirFichaDaAncora();
  window.addEventListener('hashchange', abrirFichaDaAncora);
});
onBeforeUnmount(() => window.removeEventListener('hashchange', abrirFichaDaAncora));
</script>

<template>
  <section class="fichamento" aria-labelledby="fichamento-titulo">
    <h2 id="fichamento-titulo" class="fichamento__titulo">Fichamento</h2>
    <p class="fichamento__ajuda">
      Uma ficha por pensador, na ordem do período histórico: ideia central, conceitos-chave, citação
      (quando o material traz), comentário para o Direito hoje e referências. Abra uma ficha pelo
      nome dela.
    </p>

    <div class="fichamento__filtros">
      <div class="fichamento__controle">
        <label for="fichamento-periodo">Período ou fase</label>
        <select id="fichamento-periodo" v-model="periodo" class="fichamento__periodo">
          <option value="todos">Todos os períodos</option>
          <optgroup v-for="era in dados.eras" :key="era.id" :label="era.nome">
            <option :value="`era:${era.id}`">Toda a {{ era.nome }}</option>
            <option v-for="fase in era.fases" :key="fase.id" :value="`fase:${fase.id}`">
              {{ fase.nome }}
            </option>
          </optgroup>
        </select>
      </div>
      <div class="fichamento__controle">
        <label for="fichamento-busca">Buscar nas fichas</label>
        <input
          id="fichamento-busca"
          v-model="termo"
          type="search"
          class="fichamento__busca"
          autocomplete="off"
          enterkeyhint="search"
        />
      </div>
    </div>

    <div class="fichamento__acoes">
      <button type="button" class="fichamento__acao" @click="abrirTodas">
        Abrir todas as fichas
      </button>
      <button type="button" class="fichamento__acao" @click="fecharTodas">
        Fechar todas as fichas
      </button>
      <button
        v-if="filtroAtivo"
        type="button"
        class="fichamento__acao fichamento__limpar"
        @click="limparFiltros"
      >
        Limpar filtros
      </button>
    </div>

    <p role="status" class="fichamento__status">{{ resumoDoFiltro }}</p>

    <nav
      v-if="fichasFiltradas.length > 0"
      aria-label="Índice das fichas"
      class="fichamento__indice"
    >
      <ol>
        <li v-for="ficha in fichasFiltradas" :key="ficha.id">
          <a :href="`#ficha-${ficha.id}`">{{ ficha.nome }}</a>
        </li>
      </ol>
    </nav>

    <section v-for="grupo in grupos" :key="grupo.fase.id" class="fichamento__grupo">
      <h3 class="fichamento__grupo-titulo">{{ grupo.era.nome }}, {{ grupo.fase.nome }}</h3>
      <FichaPensadorCartao
        v-for="ficha in grupo.fichas"
        :key="ficha.id"
        :ficha="ficha"
        :rotulo-fase="rotuloDaFase(dados, ficha.faseId)"
        :aberta="abertas.has(ficha.id)"
        :base-unidade="baseUnidade"
        @alternar="alternar"
      />
    </section>
  </section>
</template>

<style scoped>
.fichamento {
  max-width: var(--largura-coluna-leitura, 760px);
  margin-inline: auto;
  padding-block: var(--esp-5, 1.5rem);
}

.fichamento__titulo {
  margin-top: 0;
}

.fichamento__filtros {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--esp-3, 0.75rem);
}

.fichamento__controle {
  display: flex;
  flex-direction: column;
  gap: var(--esp-1, 0.25rem);
  min-width: 0;
}

.fichamento__controle label {
  font-weight: 600;
}

.fichamento__periodo,
.fichamento__busca {
  width: 100%;
  min-height: max(var(--alvo-toque-minimo, 24px), 44px);
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda-forte, #c3bca4));
  border-radius: var(--raio-sm, 6px);
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-texto, #1c1c1c);
  font: inherit;
}

.fichamento__periodo:focus-visible,
.fichamento__busca:focus-visible,
.fichamento__acao:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}

.fichamento__acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  margin-block: var(--esp-4, 1rem);
}

.fichamento__acao {
  min-height: max(var(--alvo-toque-minimo, 24px), 44px);
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda-forte, #c3bca4));
  border-radius: var(--raio-sm, 6px);
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-primaria, #163a5f);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.fichamento__status {
  margin: 0 0 var(--esp-3, 0.75rem);
  color: var(--cor-texto-suave, #4a4a4a);
}

.fichamento__indice ol {
  margin: 0;
  padding-inline-start: var(--esp-5, 1.5rem);
  columns: 1;
}

.fichamento__indice a {
  display: inline-flex;
  align-items: center;
  min-height: var(--alvo-toque-minimo, 24px);
}

.fichamento__grupo-titulo {
  margin-block: var(--esp-5, 1.5rem) var(--esp-2, 0.5rem);
  font-size: var(--escala-md, 1.25rem);
  color: var(--cor-titulo-texto, #0d2440);
}

@media (min-width: 640px) {
  .fichamento__filtros {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fichamento__indice ol {
    columns: 2;
  }
}

@media print {
  .fichamento__filtros,
  .fichamento__acoes,
  .fichamento__status,
  .fichamento__ajuda {
    display: none;
  }
}
</style>
