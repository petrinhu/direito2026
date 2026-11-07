import { createApp } from 'vue';
import App from './App.vue';
import { criarRouter } from '@/app/router';
import { carregarCurriculo } from '@/app/carregamento/carregarCurriculo';
import { criarRepositorioProgresso } from '@/app/persistencia/criarRepositorioProgresso';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import {
  CHAVE_CLIENTE_RESTRITO,
  CHAVE_CURRICULO,
  CHAVE_REPOSITORIO,
  CHAVE_SESSAO,
  CHAVE_STORE_BUSCA,
  CHAVE_STORE_MODO_ADAPTADO,
  CHAVE_STORE_TEMA
} from '@/app/chaves';
import { criarClienteApi } from '@/app/restrito/clienteApi';
import { criarAoNaoAutorizado, criarSessaoGlobal } from '@/app/sessao/sessaoGlobal';
import { criarNavegadorReal } from '@/app/sessao/navegador';
import { vigiarVolta, type FonteVolta } from '@/app/sessao/vigiarVolta';
import {
  criarTratadorFalhaModulo,
  type ArmazenamentoRecarga
} from '@/app/atualizacaoSW/recarregarAoFalharModulo';
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

window.addEventListener(
  'vite:preloadError',
  criarTratadorFalhaModulo(criarArmazenamentoRecargaReal(), () => window.location.reload())
);

/**
 * Fonte real dos dois gatilhos de volta (plano 2.2): pageshow (com `persisted`
 * quando a página vem do cache de navegação, o caso do botão Voltar depois de
 * sair) e aba que volta a ficar visível.
 */
function criarFonteVoltaReal(): FonteVolta {
  return {
    aoMostrarPagina(callback) {
      const ouvinte = (evento: { readonly persisted: boolean }) => callback(evento.persisted);
      window.addEventListener('pageshow', ouvinte);
      return () => window.removeEventListener('pageshow', ouvinte);
    },
    aoFicarVisivel(callback) {
      const ouvinte = () => {
        if (document.visibilityState === 'visible') callback();
      };
      document.addEventListener('visibilitychange', ouvinte);
      return () => document.removeEventListener('visibilitychange', ouvinte);
    }
  };
}

async function bootstrap(): Promise<void> {
  const curriculo = await carregarCurriculo();
  const repositorio = criarRepositorioProgresso();
  const storeTema = criarStoreTema(repositorio);
  const storeModoAdaptado = criarStoreModoAdaptado(repositorio);

  // Um único cliente da API para o site inteiro: a 401 de qualquer chamada leva à tela de entrada.
  const navegador = criarNavegadorReal();
  const aoNaoAutorizado = criarAoNaoAutorizado(navegador);
  const cliente = criarClienteApi({ aoNaoAutorizado });
  const sessao = criarSessaoGlobal({ cliente, navegador });
  const storeBusca = criarStoreBusca(aoNaoAutorizado);

  const app = createApp(App);
  app.provide(CHAVE_CURRICULO, curriculo);
  app.provide(CHAVE_REPOSITORIO, repositorio);
  app.provide(CHAVE_STORE_TEMA, storeTema);
  app.provide(CHAVE_STORE_BUSCA, storeBusca);
  app.provide(CHAVE_STORE_MODO_ADAPTADO, storeModoAdaptado);
  app.provide(CHAVE_CLIENTE_RESTRITO, cliente);
  app.provide(CHAVE_SESSAO, sessao);

  const router = criarRouter();
  app.use(router);

  vigiarVolta(criarFonteVoltaReal(), {
    recarregar: navegador.recarregar,
    conferir: () => void sessao.conferirAoVoltar()
  });
  // Lê usuário e admin sem bloquear a tela; falha aqui não derruba a página.
  void sessao.iniciar().catch(() => undefined);

  await router.isReady();
  app.mount('#app');
}

bootstrap();
