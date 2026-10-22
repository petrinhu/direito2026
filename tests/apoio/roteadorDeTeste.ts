import { createMemoryHistory, createRouter } from 'vue-router';

/**
 * Roteador de teste (rota coringa, sem tela). Não é instalado globalmente: quem
 * precisa da navegação real (o clique no link troca a rota) instala só na própria
 * montagem. O padrão, nos demais testes, é o stub de RouterLink em setupVitest.ts.
 */
export const roteadorDeTeste = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:caminho(.*)*', component: { render: () => null } }]
});
