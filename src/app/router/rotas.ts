import type { RouteRecordRaw } from 'vue-router';

/**
 * As rotas da seção 5 da arquitetura (e as três abas novas de Filosofia), separadas de `criarRouter` para
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
  ...(['mapa', 'fichamento', 'mnemonicos'] as const).map((aba): RouteRecordRaw => ({
    path: `/p/:periodo/:cadeira/:unidade/${aba}`,
    name: `unidade-${aba}`,
    component: () => import('@/ui/paginas/Unidade.vue'),
    props: (route) => ({ ...route.params, aba })
  })),
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
