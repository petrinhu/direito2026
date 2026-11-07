<script setup lang="ts">
import { inject } from 'vue';
import { CHAVE_CLIENTE_RESTRITO } from '@/app/chaves';
import { carregarConteudoJuri } from '@/app/juri';
import { criarClienteApi } from '@/app/restrito/clienteApi';
import ConteudoJuri from '../area-juri/ConteudoJuri.vue';
import '../area-juri/estilo.css';

// A entrada no site é do portão do servidor: quem chega aqui já está logado, e a Júri não pede senha.
// Cliente único do site: a sessão vencida (401) leva à tela de entrada pelo mesmo aviso de sempre.
const cliente = inject(CHAVE_CLIENTE_RESTRITO, undefined) ?? criarClienteApi();

const carregar = () => carregarConteudoJuri(() => cliente.obterConteudoJuri());
</script>

<template>
  <div class="area-juri">
    <header class="juri-cabecalho">
      <p class="juri-cabecalho__olho">Caderno de Direito</p>
      <h1>Júri Simulado</h1>
    </header>

    <section class="juri-conteudo">
      <ConteudoJuri :carregar="carregar" />
    </section>
  </div>
</template>
