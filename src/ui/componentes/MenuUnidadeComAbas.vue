<script setup lang="ts">
import { computed, inject } from 'vue';
import type { ChaveAba, ReferenciaUnidade } from '@/core/curriculo/tipos';
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';
import { rotuloSemViuva } from '@/app/curriculo/rotuloSemViuva';
import EstadoEmBreve from './EstadoEmBreve.vue';
import { ESTADO_MENU, chaveUnidade, hrefUnidade } from './menuEstado';

/**
 * Uma unidade (ou um tópico de grupo) do menu, com as abas dela. O rótulo leva
 * à página; a seta, num botão à parte, expande as abas. Resumo e Petição
 * comentada abrem seus blocos e seções. Quem guarda o estado de abrir e fechar
 * é o MenuCurriculo (ESTADO_MENU), para o markup das abas existir uma vez só.
 */
const props = defineProps<{
  periodoId: string;
  cadeiraId: string;
  unidade: ReferenciaUnidade;
  /** Rótulo cru: para unidade, o rótulo ("Unidade 1"); para tópico, o título. */
  rotulo: string;
  caminhoAtual: string;
  /** Nível em que as abas aparecem: 4 para unidade, 5 para tópico de grupo. */
  nivelAbas: 4 | 5;
}>();

const estado = inject(ESTADO_MENU)!;

interface Subitem {
  readonly id: string;
  readonly titulo: string;
  readonly href: string;
}

const chave = computed(() => chaveUnidade(props.periodoId, props.cadeiraId, props.unidade.id));
const idAbas = computed(() => `u-${chave.value}`);
const caminhoPagina = computed(() =>
  hrefUnidade(props.periodoId, props.cadeiraId, props.unidade.id)
);
const temAbas = computed(() => props.unidade.abas.length > 0);
const classeAbas = computed(
  () => `menu-curriculo__nivel-${props.nivelAbas} menu-curriculo__lista--guia`
);
const ariaAtual = computed(() =>
  estado.ehAtual(`p/${props.periodoId}/${props.cadeiraId}/${props.unidade.id}`, props.caminhoAtual)
    ? 'page'
    : undefined
);

/** Abas que aparecem no menu: Petição só depois que o conteúdo chega (tem seções). */
const abasVisiveis = computed<readonly ChaveAba[]>(() =>
  props.unidade.abas.filter(
    (aba) => aba !== 'peticao' || Boolean(estado.conteudoPronto(chave.value)?.peticao)
  )
);

function ehAbaComSubmenu(aba: ChaveAba): boolean {
  return aba === 'resumo' || aba === 'peticao';
}

/** Caminho relativo da aba (sem barra inicial), no formato de caminhoAtual. Resumo é a própria unidade. */
function caminhoRelativoDaAba(aba: ChaveAba): string {
  const base = `p/${props.periodoId}/${props.cadeiraId}/${props.unidade.id}`;
  return aba === 'resumo' ? base : `${base}/${aba}`;
}

function ariaDaAba(aba: ChaveAba): 'page' | undefined {
  return estado.ehAtual(caminhoRelativoDaAba(aba), props.caminhoAtual) ? 'page' : undefined;
}

function estadoDaAba(aba: ChaveAba): string {
  return `ab-${aba}-${chave.value}`;
}

function listaDaAba(aba: ChaveAba): string {
  return `lista-${aba}-${chave.value}`;
}

function hrefDaAba(aba: ChaveAba): string {
  return aba === 'peticao' ? `${caminhoPagina.value}/peticao` : caminhoPagina.value;
}

function textoDoSubmenu(aba: ChaveAba): string {
  return aba === 'peticao' ? 'seções' : 'blocos';
}

function subitensDaAba(aba: ChaveAba): Subitem[] {
  const conteudo = estado.conteudoPronto(chave.value);
  if (!conteudo) return [];
  if (aba === 'peticao') {
    return (conteudo.peticao?.secoes ?? []).map((secao) => ({
      id: secao.id,
      titulo: secao.titulo,
      href: `${caminhoPagina.value}/peticao#${secao.id}`
    }));
  }
  return conteudo.resumo.map((bloco) => ({
    id: bloco.id,
    titulo: bloco.titulo,
    href: `${caminhoPagina.value}#${bloco.id}`
  }));
}
</script>

<template>
  <li>
    <div v-if="unidade.estado === 'em-breve'" class="menu-curriculo__linha">
      <!-- Em breve: mesma coluna de recuo do nome; sem seta, porque não expande. -->
      <span class="menu-curriculo__recuo" aria-hidden="true" />
      <EstadoEmBreve :rotulo="rotuloSemViuva(rotulo)" />
    </div>
    <template v-else>
      <div class="menu-curriculo__linha">
        <button
          v-if="temAbas"
          type="button"
          class="menu-curriculo__toggle"
          :aria-expanded="estado.estaAberto(idAbas) ? 'true' : 'false'"
          :aria-controls="`lista-${idAbas}`"
          :aria-label="`Mostrar submenu de ${rotulo}`"
          @click="estado.alternarUnidade(chave, unidade)"
          @keydown.esc="estado.fechar(idAbas, $event)"
        >
          <span class="menu-curriculo__seta" aria-hidden="true" />
        </button>
        <a :href="caminhoPagina" class="menu-curriculo__link-unidade" :aria-current="ariaAtual">
          {{ rotuloSemViuva(rotulo) }}
        </a>
      </div>
      <ul
        v-if="temAbas"
        v-show="estado.estaAberto(idAbas)"
        :id="`lista-${idAbas}`"
        :class="classeAbas"
      >
        <li v-if="estado.carregandoDetalhe(chave)" class="menu-curriculo__carregando">
          Carregando…
        </li>
        <template v-else-if="estado.conteudoPronto(chave)">
          <!-- Ordem de unidade.abas, que já vem em ORDEM_ABAS (agruparPorUnidade). -->
          <template v-for="aba in abasVisiveis" :key="aba">
            <li v-if="ehAbaComSubmenu(aba)">
              <div class="menu-curriculo__linha">
                <button
                  type="button"
                  class="menu-curriculo__toggle menu-curriculo__toggle--aba"
                  :aria-expanded="estado.estaAberto(estadoDaAba(aba)) ? 'true' : 'false'"
                  :aria-controls="listaDaAba(aba)"
                  :aria-label="`Mostrar ${textoDoSubmenu(aba)} de ${ROTULOS_ABA[aba]}`"
                  @click="estado.alternar(estadoDaAba(aba))"
                  @keydown.esc="estado.fechar(estadoDaAba(aba), $event)"
                >
                  <span class="menu-curriculo__seta" aria-hidden="true" />
                </button>
                <a
                  :href="hrefDaAba(aba)"
                  class="menu-curriculo__link-aba"
                  :aria-current="ariaDaAba(aba)"
                >
                  {{ ROTULOS_ABA[aba] }}
                </a>
              </div>
              <ul
                v-show="estado.estaAberto(estadoDaAba(aba))"
                :id="listaDaAba(aba)"
                class="menu-curriculo__nivel-5 menu-curriculo__lista--guia"
              >
                <li v-for="subitem in subitensDaAba(aba)" :key="subitem.id">
                  <a :href="subitem.href">{{ subitem.titulo }}</a>
                </li>
              </ul>
            </li>
            <li v-else>
              <a
                :href="`${caminhoPagina}/${aba}`"
                class="menu-curriculo__botao"
                :aria-current="ariaDaAba(aba)"
              >
                {{ ROTULOS_ABA[aba] }}
              </a>
            </li>
          </template>
        </template>
      </ul>
    </template>
  </li>
</template>
