// Repasse fino de core/fichamento para a camada de apresentação: por desenho
// (gate "ui-nao-pula-app"), um componente Vue importa LÓGICA de core sempre
// por trás de um módulo de app. Tipos vão direto (import type).
export { construirArvoreMapa, idsExpansiveis } from '@/core/fichamento/arvoreMapa';
export { abertosIniciais, interpretarTecla } from '@/core/fichamento/navegacaoArvore';
export { filtrarFichas, ordenarFichas, rotuloDaFase } from '@/core/fichamento/filtrarFichas';
