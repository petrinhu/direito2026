<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, onMounted, watch, ref } from 'vue';
import { CHAVE_CLIENTE_RESTRITO } from '@/app/chaves';
import { criarClienteApi, criarSessaoRestrita, TITULO_AREA_RESTRITA } from '@/app/restrito';
import EmblemaGrupo from '../area-restrita/EmblemaGrupo.vue';
import FormularioEntrada from '../area-restrita/FormularioEntrada.vue';
import FormularioTrocaSenha from '../area-restrita/FormularioTrocaSenha.vue';
import ConteudoRestritoVisor from '../area-restrita/ConteudoRestritoVisor.vue';
import PainelAdmin from '../area-restrita/PainelAdmin.vue';
import '../area-restrita/identidade-tokens.css';
import '../area-restrita/estilo.css';

const cliente = inject(CHAVE_CLIENTE_RESTRITO, undefined) ?? criarClienteApi();
const sessao = criarSessaoRestrita({ cliente });
const { fase, usuario, admin, conteudo, mensagem, ocupado, carregandoConteudo, segundosEspera } =
  sessao;

const titulo = ref<HTMLElement>();

onMounted(() => void sessao.iniciar());
// O conteúdo vive só na memória: sair da página (ou fechar a aba) o descarta.
onBeforeUnmount(() => sessao.descartar());

// Troca de fase = troca de tela: o foco vai para o título, para o leitor de tela
// saber onde está. Na primeira verificação (carregando) não rouba o foco.
watch(fase, async (nova, antiga) => {
  if (antiga === 'carregando') return;
  await nextTick();
  titulo.value?.focus();
});
</script>

<template>
  <div class="area-restrita" :data-fase="fase">
    <header class="ar-hero" :class="{ 'ar-hero--compacto': fase === 'ativa' }">
      <EmblemaGrupo v-if="fase !== 'ativa'" />
      <p class="ar-hero__olho">Caderno de Direito · Interdisciplinar</p>
      <h1 ref="titulo" tabindex="-1">{{ TITULO_AREA_RESTRITA }}</h1>
      <p v-if="fase !== 'ativa'" class="ar-hero__lead">
        Material de estudo e apresentação do grupo. O conteúdo só é entregue depois do login.
      </p>
    </header>

    <p v-if="fase === 'carregando'" role="status" class="ar-hero__lead">Verificando acesso…</p>

    <FormularioEntrada
      v-else-if="fase === 'anonima'"
      :ocupado="ocupado"
      :segundos-espera="segundosEspera"
      :mensagem="mensagem"
      @entrar="sessao.entrar"
    />

    <FormularioTrocaSenha
      v-else-if="fase === 'trocar-senha'"
      :ocupado="ocupado"
      :mensagem="mensagem"
      @trocar="sessao.trocarSenha"
    />

    <template v-else>
      <div class="ar-sessao">
        <p>
          Conectado como <strong>{{ usuario }}</strong>
        </p>
        <button
          type="button"
          class="ar-botao"
          data-acao="sair"
          :aria-disabled="ocupado ? 'true' : undefined"
          @click="sessao.sair()"
        >
          Sair
        </button>
      </div>

      <p v-if="carregandoConteudo" role="status">Carregando o conteúdo…</p>
      <ConteudoRestritoVisor
        v-else-if="conteudo"
        :conteudo="conteudo"
        :usuario="usuario"
        :admin="admin"
        :administrar="sessao.administrar"
      />
      <template v-else>
        <p v-if="mensagem" class="ar-alerta ar-alerta--erro" role="alert">{{ mensagem }}</p>
        <p>
          <button
            type="button"
            class="ar-botao"
            data-acao="tentar-de-novo"
            @click="sessao.recarregarConteudo()"
          >
            Tentar de novo
          </button>
        </p>
        <PainelAdmin v-if="admin" :usuario-atual="usuario" :administrar="sessao.administrar" />
      </template>
    </template>
  </div>
</template>
