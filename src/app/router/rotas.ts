import type { RouteRecordRaw } from 'vue-router';

/**
 * As sete rotas da seção 5 da arquitetura, separadas de `criarRouter` para
 * poderem ser importadas em Node puro (scripts/verificar-colisao-rotas.sh),
 * sem precisar de `window`/`document` que `createWebHistory()` exige.
 */
export const rotas: RouteRecordRaw[] = [
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
