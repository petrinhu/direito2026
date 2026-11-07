<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted } from 'vue';
import { CHAVE_CLIENTE_RESTRITO } from '@/app/chaves';
import { criarClienteApi, criarSessaoRestrita, TITULO_AREA_RESTRITA } from '@/app/restrito';
import EmblemaGrupo from '../area-restrita/EmblemaGrupo.vue';
import ConteudoRestritoVisor from '../area-restrita/ConteudoRestritoVisor.vue';
import '../area-restrita/identidade-tokens.css';
import '../area-restrita/estilo.css';

const cliente = inject(CHAVE_CLIENTE_RESTRITO, undefined) ?? criarClienteApi();
const sessao = criarSessaoRestrita({ cliente });
const { carregando, conteudo, mensagem } = sessao;

// A entrada no site é do portão do servidor: quem chega aqui já passou pela senha de abertura.
onMounted(() => void sessao.carregar());
// O conteúdo vive só na memória: sair da página o descarta.
onBeforeUnmount(() => sessao.descartar());
</script>

<template>
  <div class="area-restrita">
    <header class="ar-hero">
      <EmblemaGrupo />
      <p class="ar-hero__olho">Caderno de Direito · Interdisciplinar</p>
      <h1>{{ TITULO_AREA_RESTRITA }}</h1>
    </header>

    <p v-if="carregando" role="status">Carregando o conteúdo…</p>
    <ConteudoRestritoVisor v-else-if="conteudo" :conteudo="conteudo" />
    <template v-else>
      <p v-if="mensagem" class="ar-alerta ar-alerta--erro" role="alert">{{ mensagem }}</p>
      <p>
        <button
          type="button"
          class="ar-botao"
          data-acao="tentar-de-novo"
          @click="sessao.carregar()"
        >
          Tentar de novo
        </button>
      </p>
    </template>
  </div>
</template>
