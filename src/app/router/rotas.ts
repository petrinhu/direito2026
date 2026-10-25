import type { RouteRecordRaw } from 'vue-router';
import { ENDERECOS_MOVIDOS } from '@/app/curriculo/enderecosMovidos';

/**
 * Registros de redirecionamento de um endereço movido: o caminho exato e o que vem
 * depois dele (aba), levados ao novo com a query e a âncora (hash). Ordem do líder
 * de 25/10/2026: o endereço antigo não pode quebrar, nem o link da aba nem a âncora.
 */
function registrosDeMovido(antigo: string, novo: string): RouteRecordRaw[] {
  const origem = `/p/${antigo}`;
  const destino = `/p/${novo}`;
  return [
    {
      path: origem,
      redirect: (to) => ({ path: destino, query: to.query, hash: to.hash })
    },
    {
      path: `${origem}/:resto(.*)`,
      redirect: (to) => ({
        path: `${destino}/${String(to.params.resto)}`,
        query: to.query,
        hash: to.hash
      })
    }
  ];
}

/**
 * As rotas da seção 5 da arquitetura (e as três abas novas de Filosofia), separadas de `criarRouter` para
 * poderem ser importadas em Node puro (scripts/verificar-colisao-rotas.sh),
 * sem precisar de `window`/`document` que `createWebHistory()` exige.
 */
export const rotas: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/ui/paginas/Home.vue'),
    // Faixa de topo (fachada do templo): só a página inicial a pede (LayoutBase, prop comFaixa).
    meta: { faixaDeTopo: true }
  },
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
  // Antes da unidade: um endereço movido não pode cair na página de unidade nova ou
  // num 404 (ordem do líder, 25/10/2026).
  ...Object.entries(ENDERECOS_MOVIDOS).flatMap(([antigo, novo]) => registrosDeMovido(antigo, novo)),
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
  ...(['texto', 'mapa', 'fichamento', 'mnemonicos'] as const).map((aba): RouteRecordRaw => ({
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
    // Calendário (ordem do líder, 20/10/2026): a grade do FullCalendar só é
    // baixada nesta rota, por import() preguiçoso.
    path: '/calendario',
    name: 'calendario',
    component: () => import('@/ui/paginas/Calendario.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'nao-encontrado',
    component: () => import('@/ui/paginas/NaoEncontrado.vue')
  }
];
