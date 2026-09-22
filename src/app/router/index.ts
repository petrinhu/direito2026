import { createRouter, createWebHistory } from 'vue-router';
import { rotas } from './rotas';

export function criarRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: rotas,
    scrollBehavior(to) {
      if (to.hash) return { el: to.hash, behavior: 'smooth' };
      return { top: 0 };
    }
  });

  // Seção 11 da arquitetura: na troca de rota, o foco vai para o <h1> (aqui,
  // para a área de conteúdo com tabindex="-1" em LayoutBase), e não fica
  // preso na página anterior para quem usa leitor de tela.
  router.afterEach(() => {
    requestAnimationFrame(() => {
      document.getElementById('conteudo-principal')?.focus();
    });
  });

  return router;
}
