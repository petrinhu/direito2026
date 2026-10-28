<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CHAVE_CLIENTE_JURI } from '@/app/chaves';
import { criarClienteJuri } from '@/app/juri/clienteJuri';
import { criarSessaoJuri } from '@/app/juri/sessaoJuri';
import DestravarJuri from '../area-juri/DestravarJuri.vue';
import EntradaJuri from '../area-juri/EntradaJuri.vue';
import TrocaSenhaJuri from '../area-juri/TrocaSenhaJuri.vue';
import '../area-juri/estilo.css';

// Só a cadeira da Júri carrega esta página (e o CSS dela), em chunk à parte.
const cliente = inject(CHAVE_CLIENTE_JURI, undefined) ?? criarClienteJuri();
const sessao = criarSessaoJuri({ cliente });
const { fase, usuario, mensagem, ocupado } = sessao;

const titulo = ref<HTMLElement>();

onMounted(() => void sessao.iniciar());
// Sair da página apaga a chave da memória. A sessão continua no servidor: a próxima
// visita pede só a senha.
onBeforeUnmount(() => sessao.descartar());

// Troca de fase = troca de tela: o foco vai para o título, para o leitor de tela
// saber onde está. Na primeira verificação (carregando) não rouba o foco.
watch(fase, async (nova, antiga) => {
  if (antiga === 'carregando') return;
  await nextTick();
  titulo.value?.focus({ preventScroll: true });
});
</script>

<template>
  <div class="area-juri" :data-fase="fase" :data-ocupado="ocupado ? 'true' : 'false'">
    <header class="juri-cabecalho">
      <p class="juri-cabecalho__olho">Caderno de Direito</p>
      <h1 ref="titulo" tabindex="-1">Júri Simulado</h1>
    </header>

    <p v-if="fase === 'carregando'" role="status" class="juri-aviso">Verificando acesso…</p>

    <div
      v-if="fase === 'travada' || fase === 'troca-pendente' || fase === 'aberta'"
      class="juri-sessao"
    >
      <p>
        Entrou como <strong>{{ usuario }}</strong
        >.
      </p>
      <button
        type="button"
        class="juri-botao juri-botao--secundario"
        data-acao="sair"
        @click="sessao.sair()"
      >
        Sair
      </button>
    </div>

    <EntradaJuri
      v-if="fase === 'deslogado'"
      :ocupado="ocupado"
      :mensagem="mensagem"
      @entrar="sessao.entrar"
    />
    <DestravarJuri
      v-else-if="fase === 'travada'"
      :ocupado="ocupado"
      :mensagem="mensagem"
      @destravar="sessao.destravar"
    />
    <TrocaSenhaJuri
      v-else-if="fase === 'troca-pendente'"
      :ocupado="ocupado"
      :mensagem="mensagem"
      @trocar="sessao.trocarSenha"
    />
    <section v-else-if="fase === 'aberta'" class="juri-conteudo">
      <p class="juri-conteudo__aviso">Conteúdo em preparação.</p>
    </section>
  </div>
</template>
