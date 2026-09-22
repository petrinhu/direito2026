import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/ui/paginas/Home.vue') },
  { path: '/busca', name: 'busca', component: () => import('@/ui/paginas/Busca.vue') },
  {
    path: '/p/:periodo',
    name: 'periodo',
    component: () => import('@/ui/paginas/Periodo.vue'),
    props: true
  },
  {
    path: '/p/:periodo/:cadeira',
    name: 'cadeira',
    component: () => import('@/ui/paginas/Cadeira.vue'),
    props: true
  },
  {
    path: '/p/:periodo/:cadeira/:unidade',
    name: 'unidade-resumo',
    component: () => import('@/ui/paginas/Unidade.vue'),
    props: (route) => ({ ...route.params, aba: 'resumo' })
  },
  {
    path: '/p/:periodo/:cadeira/:unidade/peticao',
    name: 'unidade-peticao',
    component: () => import('@/ui/paginas/Unidade.vue'),
    props: (route) => ({ ...route.params, aba: 'peticao' })
  },
  {
    path: '/p/:periodo/:cadeira/:unidade/quiz',
    name: 'unidade-quiz',
    component: () => import('@/ui/paginas/Unidade.vue'),
    props: (route) => ({ ...route.params, aba: 'quiz' })
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'nao-encontrado',
    component: () => import('@/ui/paginas/NaoEncontrado.vue')
  }
];

export function criarRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
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
