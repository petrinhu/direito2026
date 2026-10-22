<script setup lang="ts">
import { reactive } from 'vue';
import type { Curriculo, ReferenciaUnidade } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';
import { itensDaCadeira } from '@/core/curriculo/itensDaCadeira';
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';
import { rotuloSemViuva } from '@/app/curriculo/rotuloSemViuva';
import EstadoEmBreve from './EstadoEmBreve.vue';
import IconeCalendario from './IconeCalendario.vue';

const ABAS_DE_LINK_DIRETO = ['texto', 'mapa', 'fichamento', 'mnemonicos'] as const;

defineProps<{
  curriculo: Curriculo;
  /** Caminho da rota atual (sem barra inicial), para aria-current. */
  caminhoAtual: string;
}>();

// Disclosure aninhado (seção 11 da arquitetura), não menubar ARIA: é o
// padrão que o leitor de tela já espera para navegação hierárquica.
const abertos = reactive(new Set<string>());

function estaAberto(id: string): boolean {
  return abertos.has(id);
}

function alternar(id: string): void {
  if (abertos.has(id)) abertos.delete(id);
  else abertos.add(id);
}

function fechar(id: string, evento: KeyboardEvent): void {
  if (!abertos.has(id)) return;
  abertos.delete(id);
  (evento.currentTarget as HTMLElement | null)?.focus();
}

function ehAtual(caminho: string, caminhoAtual: string): boolean {
  return caminho === caminhoAtual;
}

function hrefUnidade(periodoId: string, cadeiraId: string, unidadeId: string): string {
  return `/p/${periodoId}/${cadeiraId}/${unidadeId}`;
}

function chaveUnidade(periodoId: string, cadeiraId: string, unidadeId: string): string {
  return `${periodoId}/${cadeiraId}/${unidadeId}`;
}

/** Chave de estado do submenu de uma AV (qualificada por período e cadeira: ids não colidem). */
function chaveAv(periodoId: string, cadeiraId: string, avChave: string): string {
  return `av-${periodoId}/${cadeiraId}/${avChave}`;
}

function chaveGrupo(
  periodoId: string,
  cadeiraId: string,
  avChave: string,
  grupoId: string
): string {
  return `g-${periodoId}/${cadeiraId}/${avChave}-${grupoId}`;
}

/**
 * 4o e 5o nível da árvore (ordem do líder, 22/09/2026, verbatim: "faltou
 * os submenus da 1a unidade: resumo, peticao comentada, quiz" e "submenus
 * de resumo, de peticao... e de quiz"). O menu não guarda mais conteúdo
 * de unidade nenhuma, ele só o BUSCA sob demanda, com o mesmo carregador
 * que Unidade.vue já usa (`unidade.carregar`, decorado por
 * src/app/carregamento antes de o currículo chegar aqui) — nunca importa
 * src/conteudo/*'/resumo|peticao|quiz diretamente, o que empacotaria o
 * HTML inteiro das 9 blocos/6 seções/60 perguntas em todo carregamento da
 * lateral. Cache simples por chave de unidade: busca uma vez, guarda o
 * resultado; fechar e reabrir não refaz a chamada.
 */
type EstadoDetalhe =
  { tipo: 'carregando' } | { tipo: 'pronto'; conteudo: ConteudoUnidade } | { tipo: 'indisponivel' };

const detalhes = reactive(new Map<string, EstadoDetalhe>());

function carregandoDetalhe(chave: string): boolean {
  return detalhes.get(chave)?.tipo === 'carregando';
}

function conteudoPronto(chave: string): ConteudoUnidade | undefined {
  const estado = detalhes.get(chave);
  return estado?.tipo === 'pronto' ? estado.conteudo : undefined;
}

async function alternarUnidade(chave: string, unidade: ReferenciaUnidade): Promise<void> {
  const idAberto = `u-${chave}`;
  alternar(idAberto);
  if (!estaAberto(idAberto)) return;
  if (detalhes.has(chave)) return;
  if (!unidade.carregar) {
    // Currículo ainda não decorado com o carregador (ex.: dado de teste
    // sintético). Não há conteúdo a mostrar: nada de inventar título.
    detalhes.set(chave, { tipo: 'indisponivel' });
    return;
  }
  detalhes.set(chave, { tipo: 'carregando' });
  try {
    const conteudo = await unidade.carregar();
    detalhes.set(chave, { tipo: 'pronto', conteudo });
  } catch {
    detalhes.set(chave, { tipo: 'indisponivel' });
  }
}
</script>

<template>
  <nav aria-label="Currículo" class="menu-curriculo">
    <!--
      Link do calendário, no topo da barra, acima do 1º período (ordem do líder,
      20/10/2026). É um link de página, não um nível do currículo: sem disclosure.
    -->
    <ul class="menu-curriculo__topo">
      <li>
        <a
          href="/calendario"
          class="menu-curriculo__calendario"
          :aria-current="ehAtual('calendario', caminhoAtual) ? 'page' : undefined"
        >
          <IconeCalendario />
          Calendário
        </a>
      </li>
    </ul>
    <ul class="menu-curriculo__nivel-1">
      <li v-for="periodo in curriculo" :key="periodo.id">
        <button
          type="button"
          :aria-expanded="estaAberto(`p-${periodo.id}`) ? 'true' : 'false'"
          :aria-controls="`lista-${periodo.id}`"
          class="menu-curriculo__botao"
          @click="alternar(`p-${periodo.id}`)"
          @keydown.esc="fechar(`p-${periodo.id}`, $event)"
        >
          <span class="menu-curriculo__seta" aria-hidden="true" />
          {{ periodo.rotulo }}
        </button>
        <ul
          v-show="estaAberto(`p-${periodo.id}`)"
          :id="`lista-${periodo.id}`"
          class="menu-curriculo__nivel-2 menu-curriculo__lista--guia"
        >
          <li v-if="periodo.cadeiras.length === 0">
            <EstadoEmBreve rotulo="Sem cadeira publicada" />
          </li>
          <li v-for="cadeira in periodo.cadeiras" :key="cadeira.id">
            <template v-if="cadeira.estado === 'em-breve'">
              <EstadoEmBreve :rotulo="rotuloSemViuva(cadeira.nome)" />
            </template>
            <a
              v-else-if="cadeira.restrita"
              :href="`/p/${periodo.id}/${cadeira.id}`"
              class="menu-curriculo__link-unidade menu-curriculo__link-restrita"
              :aria-current="
                ehAtual(`p/${periodo.id}/${cadeira.id}`, caminhoAtual) ? 'page' : undefined
              "
            >
              {{ rotuloSemViuva(cadeira.nome) }}
            </a>
            <template v-else>
              <button
                type="button"
                :aria-expanded="estaAberto(`c-${cadeira.id}`) ? 'true' : 'false'"
                :aria-controls="`lista-${cadeira.id}`"
                class="menu-curriculo__botao"
                @click="alternar(`c-${cadeira.id}`)"
                @keydown.esc="fechar(`c-${cadeira.id}`, $event)"
              >
                <span class="menu-curriculo__seta" aria-hidden="true" />
                {{ rotuloSemViuva(cadeira.nome) }}
              </button>
              <ul
                v-show="estaAberto(`c-${cadeira.id}`)"
                :id="`lista-${cadeira.id}`"
                class="menu-curriculo__nivel-3 menu-curriculo__lista--guia"
              >
                <template v-for="item in itensDaCadeira(cadeira)" :key="item.chave">
                  <li v-if="item.tipo === 'av'">
                    <!--
                      AV (ordem do líder, 22/10/2026): um botão de submenu com o rótulo
                      AVN; dentro, os grupos (Livro, Material de estudo). A AV não é página,
                      por isso o rótulo é um span e não um link.
                    -->
                    <div class="menu-curriculo__linha">
                      <button
                        type="button"
                        class="menu-curriculo__toggle"
                        :aria-expanded="
                          estaAberto(chaveAv(periodo.id, cadeira.id, item.chave)) ? 'true' : 'false'
                        "
                        :aria-controls="`lista-av-${chaveAv(periodo.id, cadeira.id, item.chave)}`"
                        :aria-label="`Mostrar submenu de ${item.rotulo}`"
                        @click="alternar(chaveAv(periodo.id, cadeira.id, item.chave))"
                        @keydown.esc="fechar(chaveAv(periodo.id, cadeira.id, item.chave), $event)"
                      >
                        <span class="menu-curriculo__seta" aria-hidden="true" />
                      </button>
                      <span class="menu-curriculo__rotulo-av">{{
                        rotuloSemViuva(item.rotulo)
                      }}</span>
                    </div>
                    <ul
                      v-show="estaAberto(chaveAv(periodo.id, cadeira.id, item.chave))"
                      :id="`lista-av-${chaveAv(periodo.id, cadeira.id, item.chave)}`"
                      class="menu-curriculo__nivel-4 menu-curriculo__lista--guia"
                    >
                      <li v-for="grupo in item.grupos" :key="grupo.id">
                        <EstadoEmBreve v-if="grupo.topicos.length === 0" :rotulo="grupo.rotulo" />
                        <template v-else>
                          <button
                            type="button"
                            class="menu-curriculo__botao"
                            :aria-expanded="
                              estaAberto(chaveGrupo(periodo.id, cadeira.id, item.chave, grupo.id))
                                ? 'true'
                                : 'false'
                            "
                            :aria-controls="`lista-g-${chaveGrupo(periodo.id, cadeira.id, item.chave, grupo.id)}`"
                            @click="
                              alternar(chaveGrupo(periodo.id, cadeira.id, item.chave, grupo.id))
                            "
                            @keydown.esc="
                              fechar(
                                chaveGrupo(periodo.id, cadeira.id, item.chave, grupo.id),
                                $event
                              )
                            "
                          >
                            <span class="menu-curriculo__seta" aria-hidden="true" />
                            {{ grupo.rotulo }}
                          </button>
                          <ul
                            v-show="
                              estaAberto(chaveGrupo(periodo.id, cadeira.id, item.chave, grupo.id))
                            "
                            :id="`lista-g-${chaveGrupo(periodo.id, cadeira.id, item.chave, grupo.id)}`"
                            class="menu-curriculo__nivel-5 menu-curriculo__lista--guia"
                          >
                            <li v-for="topico in grupo.topicos" :key="topico.id">
                              <EstadoEmBreve
                                v-if="topico.estado === 'em-breve'"
                                :rotulo="topico.titulo"
                              />
                              <a
                                v-else
                                :href="hrefUnidade(periodo.id, cadeira.id, topico.id)"
                                class="menu-curriculo__botao"
                                :aria-current="
                                  ehAtual(
                                    `p/${periodo.id}/${cadeira.id}/${topico.id}`,
                                    caminhoAtual
                                  )
                                    ? 'page'
                                    : undefined
                                "
                              >
                                {{ topico.titulo }}
                              </a>
                            </li>
                          </ul>
                        </template>
                      </li>
                    </ul>
                  </li>
                  <template
                    v-for="unidade in item.tipo === 'unidade' ? [item.unidade] : []"
                    :key="unidade.id"
                  >
                    <li>
                      <EstadoEmBreve
                        v-if="unidade.estado === 'em-breve'"
                        :rotulo="rotuloSemViuva(unidade.rotulo)"
                      />
                      <template v-else>
                        <div class="menu-curriculo__linha">
                          <button
                            v-if="unidade.abas.length > 0"
                            type="button"
                            class="menu-curriculo__toggle"
                            :aria-expanded="
                              estaAberto(`u-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`)
                                ? 'true'
                                : 'false'
                            "
                            :aria-controls="`lista-u-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`"
                            :aria-label="`Mostrar submenu de ${unidade.rotulo}`"
                            @click="
                              alternarUnidade(
                                chaveUnidade(periodo.id, cadeira.id, unidade.id),
                                unidade
                              )
                            "
                            @keydown.esc="
                              fechar(
                                `u-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`,
                                $event
                              )
                            "
                          >
                            <span class="menu-curriculo__seta" aria-hidden="true" />
                          </button>
                          <a
                            :href="hrefUnidade(periodo.id, cadeira.id, unidade.id)"
                            class="menu-curriculo__link-unidade"
                            :aria-current="
                              ehAtual(`p/${periodo.id}/${cadeira.id}/${unidade.id}`, caminhoAtual)
                                ? 'page'
                                : undefined
                            "
                          >
                            {{ rotuloSemViuva(unidade.rotulo) }}
                          </a>
                        </div>
                        <ul
                          v-if="unidade.abas.length > 0"
                          v-show="
                            estaAberto(`u-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`)
                          "
                          :id="`lista-u-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`"
                          class="menu-curriculo__nivel-4 menu-curriculo__lista--guia"
                        >
                          <li
                            v-if="
                              carregandoDetalhe(chaveUnidade(periodo.id, cadeira.id, unidade.id))
                            "
                            class="menu-curriculo__carregando"
                          >
                            Carregando…
                          </li>
                          <template
                            v-else-if="
                              conteudoPronto(chaveUnidade(periodo.id, cadeira.id, unidade.id))
                            "
                          >
                            <li v-if="unidade.abas.includes('resumo')">
                              <button
                                type="button"
                                class="menu-curriculo__botao"
                                :aria-expanded="
                                  estaAberto(
                                    `ab-resumo-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`
                                  )
                                    ? 'true'
                                    : 'false'
                                "
                                :aria-controls="`lista-resumo-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`"
                                @click="
                                  alternar(
                                    `ab-resumo-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`
                                  )
                                "
                                @keydown.esc="
                                  fechar(
                                    `ab-resumo-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`,
                                    $event
                                  )
                                "
                              >
                                <span class="menu-curriculo__seta" aria-hidden="true" />
                                {{ ROTULOS_ABA.resumo }}
                              </button>
                              <ul
                                v-show="
                                  estaAberto(
                                    `ab-resumo-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`
                                  )
                                "
                                :id="`lista-resumo-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`"
                                class="menu-curriculo__nivel-5 menu-curriculo__lista--guia"
                              >
                                <li
                                  v-for="bloco in conteudoPronto(
                                    chaveUnidade(periodo.id, cadeira.id, unidade.id)
                                  )!.resumo"
                                  :key="bloco.id"
                                >
                                  <a
                                    :href="`${hrefUnidade(periodo.id, cadeira.id, unidade.id)}#${bloco.id}`"
                                  >
                                    {{ bloco.titulo }}
                                  </a>
                                </li>
                              </ul>
                            </li>
                            <li
                              v-if="
                                unidade.abas.includes('peticao') &&
                                conteudoPronto(chaveUnidade(periodo.id, cadeira.id, unidade.id))
                                  ?.peticao
                              "
                            >
                              <button
                                type="button"
                                class="menu-curriculo__botao"
                                :aria-expanded="
                                  estaAberto(
                                    `ab-peticao-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`
                                  )
                                    ? 'true'
                                    : 'false'
                                "
                                :aria-controls="`lista-peticao-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`"
                                @click="
                                  alternar(
                                    `ab-peticao-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`
                                  )
                                "
                                @keydown.esc="
                                  fechar(
                                    `ab-peticao-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`,
                                    $event
                                  )
                                "
                              >
                                <span class="menu-curriculo__seta" aria-hidden="true" />
                                {{ ROTULOS_ABA.peticao }}
                              </button>
                              <ul
                                v-show="
                                  estaAberto(
                                    `ab-peticao-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`
                                  )
                                "
                                :id="`lista-peticao-${chaveUnidade(periodo.id, cadeira.id, unidade.id)}`"
                                class="menu-curriculo__nivel-5 menu-curriculo__lista--guia"
                              >
                                <li
                                  v-for="secao in conteudoPronto(
                                    chaveUnidade(periodo.id, cadeira.id, unidade.id)
                                  )!.peticao!.secoes"
                                  :key="secao.id"
                                >
                                  <a
                                    :href="`${hrefUnidade(periodo.id, cadeira.id, unidade.id)}/peticao#${secao.id}`"
                                  >
                                    {{ secao.titulo }}
                                  </a>
                                </li>
                              </ul>
                            </li>
                            <!--
                          Abas novas de Filosofia Jurídica (ordem do líder,
                          01/10/2026): link direto, sem submenu, como o do
                          quiz. A ordem de `unidade.abas` manda: o menu só
                          mostra as que a unidade declara.
                        -->
                            <template v-for="aba in ABAS_DE_LINK_DIRETO" :key="aba">
                              <li v-if="unidade.abas.includes(aba)">
                                <a
                                  :href="`${hrefUnidade(periodo.id, cadeira.id, unidade.id)}/${aba}`"
                                  class="menu-curriculo__botao"
                                >
                                  {{ ROTULOS_ABA[aba] }}
                                </a>
                              </li>
                            </template>
                            <li v-if="unidade.abas.includes('quiz')">
                              <!--
                            Ordem do líder, 22/09/2026, verbatim: "quiz
                            nao precisa de submenu". Item final, link
                            direto para a aba, sem seta (não abre nada) e
                            sem nível 5: era agrupado por categoria com
                            contagem, removido por esta mesma ordem.
                          -->
                              <a
                                :href="`${hrefUnidade(periodo.id, cadeira.id, unidade.id)}/quiz`"
                                class="menu-curriculo__botao"
                              >
                                {{ ROTULOS_ABA.quiz }}
                              </a>
                            </li>
                          </template>
                        </ul>
                      </template>
                    </li>
                    <li v-if="cadeira.atalhoUnidade?.apos === unidade.id">
                      <!--
                    Atalho para a cadeira restrita (ordem do líder, 20/10/2026):
                    fica entre a Unidade 1 e a unidade seguinte, sem submenu. A
                    seta lateral é decorativa (aria-hidden), igual à das unidades,
                    e ocupa a mesma coluna: o pedido do líder foi "a seta lateral
                    também, mesmo sem expandir", porque o atalho conta como a
                    unidade 2. O aria-label diz que é atalho, para o leitor de tela
                    não confundir com o item próprio Interdisciplinar da mesma lista.
                  -->
                      <div class="menu-curriculo__linha">
                        <span class="menu-curriculo__recuo" aria-hidden="true">
                          <span class="menu-curriculo__seta" />
                        </span>
                        <a
                          :href="`/p/${periodo.id}/${cadeira.atalhoUnidade.cadeiraId}`"
                          class="menu-curriculo__link-unidade"
                          :aria-label="`${cadeira.atalhoUnidade.rotulo}, atalho para a área restrita`"
                          :aria-current="
                            ehAtual(
                              `p/${periodo.id}/${cadeira.atalhoUnidade.cadeiraId}`,
                              caminhoAtual
                            )
                              ? 'page'
                              : undefined
                          "
                        >
                          {{ cadeira.atalhoUnidade.rotulo }}
                        </a>
                      </div>
                    </li>
                  </template>
                </template>
              </ul>
            </template>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.menu-curriculo ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
/* Separa o link do calendário da árvore de períodos, com o mesmo tom de guia
   já usado nas listas (rgba fixo, ver o comentário de --lista--guia abaixo). */
.menu-curriculo__topo {
  padding-bottom: var(--esp-2, 0.5rem);
  margin-bottom: var(--esp-2, 0.5rem);
  border-bottom: 1px solid rgba(184, 192, 204, 0.35);
}

/* Guia de árvore: linha vertical ligando cada nível ao seu pai, decorativa
   (a hierarquia real já está na estrutura de <ul> aninhados, seção 11 da
   arquitetura; a linha só reforça visualmente o que o DOM já expressa).
   Cor: o mesmo tom já aprovado no par "texto suave sobre a lateral"
   (8,52:1, ver design.contrasteTokens.spec.ts), a 35% de opacidade — não é
   texto, não precisa do piso de contraste de leitura, e por ser derivada
   de um token já existente não cria par novo para o portão auditar. */
.menu-curriculo__lista--guia {
  /* rgba fixo, não color-mix/rgb(from ...): mesmo tom hexadecimal de
     --cor-sidebar-texto-suave (#b8c0cc, idêntico nos dois temas, a
     lateral é sempre escura), só que escrito em rgba para não depender
     de sintaxe de cor relativa no pipeline de build (lightningcss). */
  border-left: 1px solid rgba(184, 192, 204, 0.35);
}

/* Largura do botão do triângulo da unidade: 32px no modo normal; 44px no modo
   adaptado, que exige alvo de 44x44 (docs/modo-adaptado.md, seção 2). */
.menu-curriculo {
  --menu-toggle: 32px;
}

:root[data-modo-adaptado='on'] .menu-curriculo {
  --menu-toggle: 44px;
}

/* Seta/chevron: mesmo elemento de ligação usado em todos os níveis que
   abrem e fecham (ordem do líder, 22/09/2026, item 4). Gira 90 graus
   quando o nível está aberto; é puramente decorativa (aria-hidden), o
   estado real já vai em aria-expanded no botão. */
.menu-curriculo__seta {
  display: inline-block;
  width: 0;
  height: 0;
  margin-right: var(--esp-2, 0.5rem);
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 6px solid currentColor;
  transition: transform var(--transicao-rapida, 150ms ease);
  flex-shrink: 0;
}

[aria-expanded='true'] > .menu-curriculo__seta {
  transform: rotate(90deg);
}

.menu-curriculo__botao {
  display: flex;
  align-items: center;
  width: 100%;
  /* Achado 3 da revisão: min-width explícito (width:100% já garante isso
     na prática, dentro da gaveta de 280px, mas o piso passa a ser
     declarado, não implícito). */
  min-width: 44px;
  min-height: 44px;
  text-align: left;
  background: none;
  border: none;
  /* Cor por nível: --menu-cor vem da lista do nível (--cor-menu-* em
     tokens.css); o período, sem lista própria, herda a cor da lateral. */
  color: var(--menu-cor, inherit);
  font: inherit;
  cursor: pointer;
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
}

.menu-curriculo__botao:focus-visible,
.menu-curriculo a:focus-visible,
.menu-curriculo__toggle:focus-visible {
  /* Par dedicado da lateral (achado do líder, 22/09/2026): o menu vive
     sempre sobre --cor-sidebar-fundo, nunca sobre --cor-fundo, então o
     anel de foco tem de ter contraste contra O FUNDO REAL do elemento
     (L-42), não contra o token genérico de marca. */
  outline: 2px solid var(--cor-sidebar-texto, #faf9f5);
  outline-offset: 2px;
}

.menu-curriculo a {
  display: flex;
  align-items: center;
  /* Achado 3 da revisão: min-width nunca tinha sido conferido. */
  min-width: 44px;
  min-height: 44px;
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  /* Era --cor-texto (pensado para --cor-fundo): mesma classe de bug do
     fundo da lateral, só que no texto do link. --cor-texto no tema claro
     é quase preto sobre um fundo de lateral que é sempre escuro nos dois
     temas: contraste medido 1,09:1 antes da correção. */
  color: var(--menu-cor, var(--cor-sidebar-texto, #faf9f5));
  text-decoration: none;
}

.menu-curriculo a[aria-current='page'] {
  color: var(--cor-sidebar-item-ativo-texto, #faf9f5);
  font-weight: 600;
  background: var(--cor-sidebar-item-ativo-fundo, #1a3a5c);
}

/* Quiz é link direto (sem submenu, sem triângulo): reserva o espaço do
   triângulo e usa o mesmo respiro dos botões irmãos, para o texto alinhar
   com "Resumo" e "Petição comentada". */
.menu-curriculo a.menu-curriculo__botao {
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
}

.menu-curriculo a.menu-curriculo__botao::before {
  content: '';
  display: inline-block;
  width: 6px;
  margin-right: var(--esp-2, 0.5rem);
  flex-shrink: 0;
}

/* Modo de leitura adaptada: --cor-sidebar-item-ativo-fundo vira branco
   igual ao resto da lateral (docs/modo-adaptado.md, seção 3, "mesma
   régua" preto/branco), então o item atual perderia o destaque de fundo.
   Uma borda sólida preta substitui o preenchimento como segundo sinal,
   além do font-weight (que já existe) e do aria-current (para leitor de
   tela): cor nunca é o único sinal em lugar nenhum do modo. */
:root[data-modo-adaptado='on'] .menu-curriculo a[aria-current='page'] {
  border: 2px solid var(--cor-texto, #000000);
}

/* Linha da unidade: link (navega) + botão de alternar (só expande/recolhe
   o submenu) lado a lado, dois alvos de foco distintos e cada um com seu
   próprio papel — padrão descrito nas referências pesquisadas (sumário de
   documentação com trilha + disclosure separados). */
.menu-curriculo__linha {
  display: flex;
  align-items: stretch;
}

.menu-curriculo a.menu-curriculo__link-unidade {
  flex: 1;
  min-width: 0;
  /* O texto começa logo depois do botão do triângulo. */
  padding-left: 0;
}

.menu-curriculo__toggle {
  flex-shrink: 0;
  width: var(--menu-toggle);
  min-width: var(--menu-toggle);
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  /* Mesmo respiro à esquerda do botão dos outros níveis: o triângulo da
     unidade alinha com os dos demais, todos do lado esquerdo. */
  padding: 0 0 0 var(--esp-3, 0.75rem);
  background: none;
  border: none;
  color: var(--menu-cor, inherit);
  cursor: pointer;
}

/* Coluna da seta do atalho Interdisciplinar: mesma largura e mesmo recuo
   interno do botão de triângulo das unidades (padding-left igual), para a seta
   e o texto caírem na mesma coluna. Sem botão e sem foco: é só decoração. */
.menu-curriculo__recuo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: var(--menu-toggle);
  min-width: var(--menu-toggle);
  padding-left: var(--esp-3, 0.75rem);
}

.menu-curriculo__carregando {
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  color: var(--cor-sidebar-texto-suave, #b8c0cc);
  font-size: var(--escala-xs, 0.8125rem);
}

/* Recuo e fonte por profundidade (ordem do líder, 22/09/2026, item 1):
   cada nível recua mais e usa fonte um pouco menor que o pai, até um
   PISO de legibilidade (13px, --escala-xs, o mesmo piso já usado em
   legendas no resto do site) do qual nenhum nível fica abaixo. Passo de
   12px do nível 2 ao 3 (onde ainda há poucos níveis abertos ao mesmo
   tempo), afunilando para 8px do nível 4 ao 5 (onde os cinco níveis já
   podem estar abertos juntos) — TETO de recuo acumulado: 40px (2,5rem),
   pouco mais de um sétimo dos 280px da lateral, para nunca espremer o
   texto nem estourar a largura (a quebra de linha natural do <a>/<button>
   cuida do resto, sem overflow horizontal). */
.menu-curriculo ul.menu-curriculo__nivel-2 {
  --menu-cor: var(--cor-menu-cadeira, #faf9f5);
  margin-left: var(--esp-3, 0.75rem);
  padding-left: var(--esp-2, 0.5rem);
}

.menu-curriculo__nivel-2 > li > .menu-curriculo__botao {
  font-size: var(--escala-sm, 0.9375rem);
}

/* Rótulos de período e de cadeira em Cormorant, com numerais lining, como no
   protótipo aprovado (mockups/home-neoclassica.html). Títulos do site inteiro
   (decisão do líder, 20/10/2026); unidades e abas seguem em Inter. Fora do modo
   de leitura adaptada apenas: lá o menu segue com o que o modo já define (escala
   própria em tokens.css), sem trocar família nem tamanho aqui. */
:root:not([data-modo-adaptado='on']) .menu-curriculo__nivel-1 > li > .menu-curriculo__botao {
  font-family: var(--fonte-titulo);
  font-variant-numeric: lining-nums;
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1.2;
}

:root:not([data-modo-adaptado='on']) .menu-curriculo__nivel-2 > li > .menu-curriculo__botao,
:root:not([data-modo-adaptado='on']) .menu-curriculo__nivel-2 > li > a {
  font-family: var(--fonte-titulo);
  font-variant-numeric: lining-nums;
  font-weight: 600;
  font-size: 1.1875rem;
  line-height: 1.25;
}

.menu-curriculo ul.menu-curriculo__nivel-3 {
  --menu-cor: var(--cor-menu-unidade, #faf9f5);
  margin-left: var(--esp-3, 0.75rem);
  padding-left: var(--esp-2, 0.5rem);
}

.menu-curriculo__nivel-3 > li > .menu-curriculo__linha .menu-curriculo__link-unidade,
.menu-curriculo__nivel-3 > li > .menu-curriculo__linha .menu-curriculo__seta {
  font-size: 0.875rem;
}

.menu-curriculo ul.menu-curriculo__nivel-4 {
  --menu-cor: var(--cor-menu-aba, #faf9f5);
  /* Cada nível tem de começar o TEXTO pelo menos 12px à direita do texto do
     pai. Na linha da unidade o texto vem depois do botão do triângulo (largura
     --menu-toggle), então o recuo do nível 4 acompanha essa largura. */
  margin-left: calc(var(--menu-toggle) - 20px);
  padding-left: var(--esp-2, 0.5rem);
}

.menu-curriculo__nivel-4 > li > .menu-curriculo__botao {
  font-size: 0.875rem;
}

.menu-curriculo ul.menu-curriculo__nivel-5 {
  --menu-cor: var(--cor-menu-item, #faf9f5);
  margin-left: 22px;
  padding-left: var(--esp-1, 0.25rem);
}

.menu-curriculo__nivel-5 > li > a {
  font-size: var(--escala-xs, 0.8125rem);
}

/* EstadoEmBreve (rótulo e selo "em breve") também vive só dentro da
   lateral aqui: mesma correção, achada na mesma varredura de contraste.
   --cor-desativado-texto/--cor-selo-* são pensados para --cor-fundo, e
   mediam 4,27:1 (abaixo do piso de 4,5:1) contra o fundo escuro da
   lateral no tema claro. */
.menu-curriculo :deep(.estado-em-breve) {
  color: var(--cor-sidebar-texto-suave, #b8c0cc);
}

.menu-curriculo :deep(.estado-em-breve__selo) {
  color: var(--cor-sidebar-selo-texto, #d8d2ba);
  background: var(--cor-sidebar-selo-bg, #1a3a5c);
}

@media (max-width: 880px) {
  /* Gaveta estreita (LayoutBase.vue): nunca rolagem horizontal, mesmo no
     nível 5 com título de bloco longo. */
  .menu-curriculo,
  .menu-curriculo ul {
    max-width: 100%;
    overflow-wrap: break-word;
  }
}
</style>
