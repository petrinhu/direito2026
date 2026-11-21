import { createApp } from 'vue';
import App from './App.vue';
import { criarRouter } from '@/app/router';
import { carregarCurriculo } from '@/app/carregamento/carregarCurriculo';
import { criarRepositorioProgresso } from '@/app/persistencia/criarRepositorioProgresso';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import {
  CHAVE_AVISO_VERSAO,
  CHAVE_CLIENTE_RESTRITO,
  CHAVE_CURRICULO,
  CHAVE_REPOSITORIO,
  CHAVE_SESSAO,
  CHAVE_STORE_BUSCA,
  CHAVE_STORE_MODO_ADAPTADO,
  CHAVE_STORE_TEMA,
  CHAVE_RADIO
} from '@/app/chaves';
import { criarClienteApi } from '@/app/restrito/clienteApi';
import { criarAoNaoAutorizado, criarSessaoGlobal } from '@/app/sessao/sessaoGlobal';
import { criarNavegadorReal } from '@/app/sessao/navegador';
import { criarStoreRadio, obterArmazenamentoLocal } from '@/app/radio/tocadorRadio';
import { criarConferirNaTroca } from '@/app/sessao/conferirNaTroca';
import { criarControladorAviso } from '@/app/versaoNova/controladorAviso';
import { criarTransporteFetch } from '@/app/versaoNova/transporteFetch';
import { criarTratadorDeFalhaDeModulo } from '@/app/versaoNova/falhaModulo';
import {
  criarFonteVoltaNavegador,
  iniciarVigiaVoltaNavegador
} from '@/app/sessao/vigiaVoltaNavegador';
import type { ArmazenamentoRecarga } from '@/app/atualizacaoSW/recarregarAoFalharModulo';
import '@/ui/estilos/fontes.css';
import '@/ui/estilos/tokens.css';
import '@/ui/estilos/base.css';
import '@/ui/estilos/impressao.css';

/**
 * Módulo de versão velha (mesmo pedido do líder, 23/09/2026): uma aba
 * que já estava aberta na versão A, ao navegar para uma seção ainda não
 * visitada, pede um pedaço de código com hash da versão A que a
 * publicação da B apagou do servidor. A regra de fallback do `.htaccess`
 * devolve `index.html` no lugar do módulo, o `import()` dinâmico falha, e
 * a seção fica em branco sem aviso. O Vite emite `vite:preloadError` no
 * `window` para exatamente este caso (documentação oficial, "Load Error
 * Handling"); recarregar busca `index.html` e os módulos já na versão B.
 *
 * `sessionStorage` com carimbo de tempo evita laço: se a página acabou de
 * recarregar por esta causa há poucos segundos e volta a falhar (comum,
 * porque a mesma navegação pode disparar mais de um `import()` velho em
 * sequência), a segunda falha não recarrega de novo - evita a página
 * ficar recarregando sem parar caso a causa não se resolva.
 */
const CHAVE_MARCA_RECARGA_MODULO = 'caderno-direito:recarga-modulo-em';
const JANELA_PROTECAO_LACO_MS = 10_000;

/** Armazenamento da aba do banner de versão (dispensada e laço). Sem sessionStorage, o banner
 *  ainda aparece; só não lembra o fechamento depois de um recarregamento. */
function criarArmazenamentoAvisoReal(): {
  lerChave(chave: string): string | null;
  gravarChave(chave: string, valor: string): void;
} {
  return {
    lerChave(chave) {
      try {
        return window.sessionStorage.getItem(chave);
      } catch {
        return null;
      }
    },
    gravarChave(chave, valor) {
      try {
        window.sessionStorage.setItem(chave, valor);
      } catch {
        // sessionStorage bloqueado: o banner segue, sem a lembrança desta aba.
      }
    }
  };
}

function criarArmazenamentoRecargaReal(): ArmazenamentoRecarga {
  return {
    lerMarcaRecente() {
      try {
        const valor = window.sessionStorage.getItem(CHAVE_MARCA_RECARGA_MODULO);
        if (!valor) return false;
        const registradoEm = Number(valor);
        return Number.isFinite(registradoEm) && Date.now() - registradoEm < JANELA_PROTECAO_LACO_MS;
      } catch {
        // sessionStorage bloqueado (modo privado, política do navegador):
        // não travar o recarregamento por causa disso.
        return false;
      }
    },
    gravarMarca() {
      try {
        window.sessionStorage.setItem(CHAVE_MARCA_RECARGA_MODULO, String(Date.now()));
      } catch {
        // sem sessionStorage, a proteção contra laço fica ausente aqui,
        // mas o recarregamento em si (o que importa) continua funcionando.
      }
    }
  };
}

async function bootstrap(): Promise<void> {
  const curriculo = await carregarCurriculo();
  const repositorio = criarRepositorioProgresso();
  const storeTema = criarStoreTema(repositorio);
  const storeModoAdaptado = criarStoreModoAdaptado(repositorio);
  const storeRadio = criarStoreRadio(obterArmazenamentoLocal());

  // Um único cliente da API para o site inteiro: a 401 de qualquer chamada leva à tela de entrada.
  const navegador = criarNavegadorReal();
  const aoNaoAutorizado = criarAoNaoAutorizado(navegador);
  const cliente = criarClienteApi({ aoNaoAutorizado });
  const sessao = criarSessaoGlobal({
    cliente,
    navegador,
    suspenderAviso: aoNaoAutorizado.suspender
  });
  const storeBusca = criarStoreBusca(aoNaoAutorizado);

  const app = createApp(App);
  app.provide(CHAVE_CURRICULO, curriculo);
  app.provide(CHAVE_REPOSITORIO, repositorio);
  app.provide(CHAVE_STORE_TEMA, storeTema);
  app.provide(CHAVE_STORE_BUSCA, storeBusca);
  app.provide(CHAVE_STORE_MODO_ADAPTADO, storeModoAdaptado);
  app.provide(CHAVE_RADIO, storeRadio);
  app.provide(CHAVE_CLIENTE_RESTRITO, cliente);
  app.provide(CHAVE_SESSAO, sessao);

  // Banner de versão nova (AV-F11): consulta com a sessão do site, vigia de D2 e falha de
  // módulo que mostra o banner em vez de recarregar (D2b, ratificado pelo líder).
  const avisoVersao = criarControladorAviso({
    daAba: __VERSAO_SITE__,
    transporte: criarTransporteFetch(),
    relogio: { agora: () => Date.now() },
    documento: document,
    armazenamento: criarArmazenamentoAvisoReal(),
    usuario: sessao.usuario,
    navegarParaInicio: () => window.location.assign('/'),
    curriculo,
    caminhoAtual: () => router.currentRoute.value.path
  });
  app.provide(CHAVE_AVISO_VERSAO, avisoVersao);
  window.addEventListener(
    'vite:preloadError',
    criarTratadorDeFalhaDeModulo({
      daAba: __VERSAO_SITE__,
      dispensadaPara: () => avisoVersao.versaoDispensada(),
      consultar: () => avisoVersao.consultar(),
      armazenamento: criarArmazenamentoRecargaReal(),
      recarregar: () => window.location.reload()
    })
  );

  const router = criarRouter();
  app.use(router);

  // SU-F1 (plano 1.6): a troca de página confere a sessão no servidor, no máximo uma vez a cada
  // 30 s, sem esperar a resposta. A navegação inicial não conta (o iniciar() já leu a sessão),
  // e navegação falha ou repetida também não.
  const conferirNaTroca = criarConferirNaTroca({
    conferir: () => sessao.conferirAoVoltar(),
    agora: () => Date.now()
  });
  // Troca de rota (inclusive a inicial, que é a carga e consulta, decisão 74) alimenta o vigia do banner.
  router.afterEach((_para, _de, falha) => {
    if (!falha) avisoVersao.aoTrocarRota();
  });
  avisoVersao.iniciar();
  router.afterEach((_para, de, falha) => {
    if (falha || de.matched.length === 0) return;
    conferirNaTroca();
  });

  // Volta do cache (botão Voltar depois de sair) e aba que volta: fiação em vigiaVoltaNavegador.ts.
  iniciarVigiaVoltaNavegador(criarFonteVoltaNavegador(window, document), { navegador, sessao });
  // Lê usuário e admin sem bloquear a tela; falha aqui não derruba a página.
  void sessao.iniciar().catch(() => undefined);

  await router.isReady();
  app.mount('#app');
}

bootstrap();
