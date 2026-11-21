<script setup lang="ts">
import { computed, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  CHAVE_AVISO_VERSAO,
  CHAVE_CURRICULO,
  CHAVE_REPOSITORIO,
  CHAVE_SESSAO,
  CHAVE_STORE_BUSCA,
  CHAVE_STORE_MODO_ADAPTADO,
  CHAVE_STORE_TEMA
} from '@/app/chaves';
import { caminhoSuspendeModoAdaptado } from '@/app/curriculo/areaRestrita';
import LayoutBase from '@/ui/layout/LayoutBase.vue';
import AvisoVersaoPosicao from '@/ui/layout/AvisoVersaoPosicao.vue';
import AvisoVersaoNova from '@/ui/componentes/AvisoVersaoNova.vue';

const curriculo = inject(CHAVE_CURRICULO)!;
const repositorio = inject(CHAVE_REPOSITORIO)!;
const storeTema = inject(CHAVE_STORE_TEMA)!;
const storeBusca = inject(CHAVE_STORE_BUSCA)!;
const storeModoAdaptado = inject(CHAVE_STORE_MODO_ADAPTADO)!;
// Em produção a sessão sempre é provida (main.ts). Sem ela (App montado sem o
// cliente, em teste), o bloco da conta do menu simplesmente não aparece.
const sessao = inject(CHAVE_SESSAO, null);
const usuario = computed(() => sessao?.usuario.value ?? '');
const admin = computed(() => sessao?.admin.value ?? false);
// Banner de versão nova (AV-F11). Sem a chave (teste sem o composition root), não aparece.
const aviso = inject(CHAVE_AVISO_VERSAO, null);
const route = useRoute();
const router = useRouter();

// Ordem do líder: sem modo adaptado na área restrita do Interdisciplinar. A Júri
// mantém o modo (decisão do CTO). A preferência salva fica como está; só o efeito
// é suspenso enquanto a rota for da área que suspende.
const suspendeModo = computed(() => caminhoSuspendeModoAdaptado(curriculo, route.path));
watch(suspendeModo, (valor) => storeModoAdaptado.suspender(valor), { immediate: true });

function aoBuscar(termo: string): void {
  router.push({ path: '/busca', query: { q: termo } });
}
</script>

<template>
  <LayoutBase
    :curriculo="curriculo"
    :caminho-atual="route.path.replace(/^\//, '')"
    :repositorio="repositorio"
    :store-tema="storeTema"
    :store-busca="storeBusca"
    :store-modo-adaptado="storeModoAdaptado"
    :com-faixa="route.meta.faixaDeTopo === true"
    :usuario="usuario"
    :admin="admin"
    @buscar="aoBuscar"
    @sair="sessao?.sair()"
  >
    <router-view />
  </LayoutBase>
  <!-- Faixa fixa logo abaixo do cabeçalho (ratificado pelo líder, 46g). Só aparece algo depois do login:
       o controlador só consulta com usuário, e sem versão nova ou variante de sessão a faixa fica vazia. -->
  <!-- Sem usuário a faixa segue montada: a variante "Sua sessão terminou" (D-F12-2) depende dela. -->
  <AvisoVersaoPosicao v-if="aviso">
    <AvisoVersaoNova
      :versao-publicada="aviso.visaoAgora().versaoPublicada"
      :nome="aviso.visaoAgora().nome"
      :resumo="aviso.visaoAgora().resumo"
      :continua-conectado="aviso.visaoAgora().continuaConectado"
      :aviso-quiz="aviso.visaoAgora().avisoQuiz"
      :consultar="aviso.consultar"
      :marcar-recarregou-para="aviso.marcarRecarregouPara"
      :navegar-para-inicio="aviso.navegarParaInicio"
      :ao-fechar="aviso.fechar"
    />
  </AvisoVersaoPosicao>
</template>
