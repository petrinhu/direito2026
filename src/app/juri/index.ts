// Repasse fino de core/juri para a camada de apresentação (gate "ui-nao-pula-app"):
// um componente Vue importa lógica de core sempre por trás de um módulo de app.
export { ehIdImagem } from '@/core/juri/idImagem';
export { paraBlocosResumo } from './blocosResumo';
export { carregarConteudoJuri } from './conteudo';
export type { ResultadoConteudoJuri } from './conteudo';
export type { ConteudoJuriValidado } from '@/core/juri/tipos';
