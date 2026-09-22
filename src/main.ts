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
import '@/ui/estilos/fontes.css';
import '@/ui/estilos/tokens.css';
import '@/ui/estilos/base.css';
import '@/ui/estilos/impressao.css';

/**
 * Pendência da onda: vite.config.ts já configurava o service worker
 * (workbox, registerType 'prompt', CacheFirst para conteúdo, NetworkFirst
 * para navegação), mas `injectRegister: null` significa que nada o
 * registra sozinho - e nenhum código chamava registerSW() em lugar
 * nenhum. Sem isto, a segunda visita a uma unidade já aberta, com a rede
 * desligada, nunca funcionava (o service worker simplesmente não existia
 * em tempo de execução).
 *
 * `registerType: 'prompt'` significa que uma atualização nova NÃO
 * substitui o service worker em uso sozinha (skipWaiting fica sob
 * controle): isto evita trocar o conteúdo sob o leitor no meio de uma
 * leitura (mesma preocupação já registrada no comentário de
 * vite.config.ts). Uma UI de "nova versão disponível" (onNeedRefresh)
 * fica fora do escopo desta correção - o essencial aqui é o registro
 * existir, para o cache funcionar; o prompt de atualização é melhoria
 * futura, não pendência desta onda.
 */
registerSW({ immediate: true });

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
  await router.isReady();
  app.mount('#app');
}

bootstrap();
