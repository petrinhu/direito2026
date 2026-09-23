import { createApp } from 'vue';
import { registerSW } from 'virtual:pwa-register';
import App from './App.vue';
import { criarRouter } from '@/app/router';
import { carregarCurriculo } from '@/app/carregamento/carregarCurriculo';
import { criarRepositorioProgresso } from '@/app/persistencia/criarRepositorioProgresso';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import {
  CHAVE_CURRICULO,
  CHAVE_REPOSITORIO,
  CHAVE_STORE_BUSCA,
  CHAVE_STORE_MODO_ADAPTADO,
  CHAVE_STORE_TEMA
} from '@/app/chaves';
import type { Router } from 'vue-router';
import {
  agendarVerificacoesAtualizacao,
  type FonteAgendamentoSW
} from '@/app/atualizacaoSW/agendarVerificacoesAtualizacao';
import '@/ui/estilos/fontes.css';
import '@/ui/estilos/tokens.css';
import '@/ui/estilos/base.css';
import '@/ui/estilos/impressao.css';

/**
 * Onda anterior deixou o registro do service worker pendente de política
 * de atualização (comentário removido nesta correção, ver histórico do
 * git). Onda de 23/09/2026 (pedido do líder, verbatim: "pode dar comando
 * na página para o conteúdo ser recarregado sempre? Muita gente entra na
 * página nova e só ve a antiga e reclama que não apareceu nada") resolveu
 * isto: vite.config.ts agora usa registerType 'autoUpdate', que liga
 * skipWaiting + clientsClaim no service worker gerado. Com isso, quando o
 * navegador encontra uma versão nova, ela assume sozinha - sem esperar
 * todas as abas fecharem, que era a causa raiz de o leitor ficar preso na
 * versão antiga (no celular, "todas as abas fecharem" quase nunca
 * acontece). Uma vez ativa, essa versão nova recarrega automaticamente a
 * aba (comportamento embutido do plugin para este registerType); o que
 * falta a nós é só CHECAR por versão nova nos momentos certos, porque a
 * checagem automática do navegador não cobre bem um SPA (o usuário pode
 * ficar horas numa unidade sem disparar navegação nenhuma). Ver
 * docs/arquitetura.md, seção 9, para o raciocínio completo.
 */
function criarFonteAgendamentoSW(router: Router): FonteAgendamentoSW {
  return {
    definirIntervalo(callback, intervaloMs) {
      const id = window.setInterval(callback, intervaloMs);
      return () => window.clearInterval(id);
    },
    aoFicarVisivel(callback) {
      const ouvinte = () => {
        if (document.visibilityState === 'visible') callback();
      };
      document.addEventListener('visibilitychange', ouvinte);
      return () => document.removeEventListener('visibilitychange', ouvinte);
    },
    aoTrocarRota(callback) {
      return router.afterEach(() => callback());
    }
  };
}

async function bootstrap(): Promise<void> {
  const curriculo = await carregarCurriculo();
  const repositorio = criarRepositorioProgresso();
  const storeTema = criarStoreTema(repositorio);
  const storeBusca = criarStoreBusca();
  const storeModoAdaptado = criarStoreModoAdaptado(repositorio);

  const app = createApp(App);
  app.provide(CHAVE_CURRICULO, curriculo);
  app.provide(CHAVE_REPOSITORIO, repositorio);
  app.provide(CHAVE_STORE_TEMA, storeTema);
  app.provide(CHAVE_STORE_BUSCA, storeBusca);
  app.provide(CHAVE_STORE_MODO_ADAPTADO, storeModoAdaptado);

  const router = criarRouter();
  app.use(router);

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const verificar = () => {
        registration.update().catch(() => {
          // Falha de rede na checagem não é erro do leitor: a próxima
          // tentativa (intervalo, visibilidade ou rota) resolve sozinha.
        });
      };
      agendarVerificacoesAtualizacao(verificar, criarFonteAgendamentoSW(router));
    }
  });

  await router.isReady();
  app.mount('#app');
}

bootstrap();
