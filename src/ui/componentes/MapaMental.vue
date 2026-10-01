<script setup lang="ts">
import { nextTick, ref } from 'vue';
import type { NoMapa } from '@/core/fichamento/tipos';
import { abertosIniciais, idsExpansiveis, interpretarTecla, nosVisiveis } from '@/app/fichamento';
import NoMapaMental from './NoMapaMental.vue';

const props = defineProps<{
  arvore: NoMapa;
  /** Endereço da unidade sem barra final. Ex.: '/p/p1/filosofia-juridica/u1'. */
  baseUnidade: string;
}>();

const abertos = ref<ReadonlySet<string>>(abertosIniciais(props.arvore));
const focoId = ref(props.arvore.id);

function trocarAbertos(novo: Set<string>): void {
  abertos.value = novo;
}

function abrir(id: string): void {
  trocarAbertos(new Set(abertos.value).add(id));
}

function fechar(id: string): void {
  const novo = new Set(abertos.value);
  novo.delete(id);
  trocarAbertos(novo);
}

function alternar(id: string): void {
  if (abertos.value.has(id)) fechar(id);
  else abrir(id);
}

async function irPara(id: string): Promise<void> {
  focoId.value = id;
  await nextTick();
  document.getElementById(id)?.focus();
}

function aoAlternarPorClique(id: string): void {
  focoId.value = id;
  alternar(id);
}

function aoTeclar(evento: KeyboardEvent): void {
  const alvo = (evento.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]');
  if (!alvo || evento.altKey || evento.ctrlKey || evento.metaKey) return;
  const acao = interpretarTecla(props.arvore, abertos.value, alvo.id, evento.key);
  if (!acao) return;
  evento.preventDefault();
  if (acao.abrir) abrir(acao.abrir);
  if (acao.fechar) fechar(acao.fechar);
  if (acao.alternar) alternar(acao.alternar);
  if (acao.foco) void irPara(acao.foco);
  if (acao.ativar) document.getElementById(acao.ativar)?.querySelector('a')?.click();
}

function abrirTodos(): void {
  trocarAbertos(new Set(idsExpansiveis(props.arvore)));
}

function fecharAteAsFases(): void {
  trocarAbertos(abertosIniciais(props.arvore));
  const visivel = nosVisiveis(props.arvore, abertos.value).some((no) => no.id === focoId.value);
  // O item com tabindex 0 ficou dentro de um ramo que acabou de fechar:
  // volta à raiz, em vez de deixar o ciclo de Tab sem nenhum item.
  if (!visivel) focoId.value = props.arvore.id;
}
</script>

<template>
  <section class="mapa-mental" aria-labelledby="mapa-mental-titulo">
    <h2 id="mapa-mental-titulo" class="mapa-mental__titulo">Mapa mental</h2>
    <p class="mapa-mental__ajuda">
      Do período histórico ao pensador e ao modo de pensar dele. Toque ou clique num ramo para abrir
      e fechar. Pelo teclado: setas para andar, seta para a direita abre, seta para a esquerda
      fecha, Enter ou Espaço alterna. Prefere texto corrido? Veja o
      <a :href="`${baseUnidade}/fichamento`">Fichamento</a>.
    </p>
    <div class="mapa-mental__acoes">
      <button type="button" class="mapa-mental__acao" @click="abrirTodos">
        Abrir todos os ramos
      </button>
      <button type="button" class="mapa-mental__acao" @click="fecharAteAsFases">
        Fechar até as fases
      </button>
    </div>
    <div class="mapa-mental__area">
      <ul
        role="tree"
        aria-label="Mapa mental de Filosofia Jurídica"
        class="mapa-mental__arvore"
        @keydown="aoTeclar"
      >
        <NoMapaMental
          :no="arvore"
          :nivel="1"
          :posicao="1"
          :tamanho="1"
          :abertos="abertos"
          :foco-id="focoId"
          :base-unidade="baseUnidade"
          @alternar="aoAlternarPorClique"
        />
      </ul>
    </div>
  </section>
</template>

<style scoped>
.mapa-mental {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding-block: var(--esp-5, 1.5rem);
}

.mapa-mental__titulo {
  margin-top: 0;
}

.mapa-mental__ajuda {
  max-width: var(--largura-leitura, 68ch);
}

.mapa-mental__acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  margin-block: var(--esp-4, 1rem);
}

.mapa-mental__acao {
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

.mapa-mental__acao:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}

/* Em tela estreita a árvore usa também a margem lateral da página: é onde
   cabe a coluna de texto dos níveis mais fundos. */
@media (max-width: 639px) {
  .mapa-mental {
    margin-inline: calc(-1 * var(--esp-3, 0.75rem));
  }
}

/* A árvore pode rolar dentro do próprio contêiner; a página nunca rola de lado. */
.mapa-mental__area {
  max-width: 100%;
  overflow-x: auto;
}

.mapa-mental__arvore {
  margin: 0;
  padding: 0;
  list-style: none;
}

@media print {
  .mapa-mental__acoes,
  .mapa-mental__ajuda {
    display: none;
  }

  .mapa-mental__area {
    overflow: visible;
  }

  /* Todos os ramos saem no papel, mesmo os que estavam fechados na tela. */
  .mapa-mental :deep([role='group']) {
    display: block !important;
  }
}
</style>
