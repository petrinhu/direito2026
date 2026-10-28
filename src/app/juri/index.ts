// Repasse fino de core/juri para a camada de apresentação (gate "ui-nao-pula-app"):
// um componente Vue importa lógica de core sempre por trás de um módulo de app.
// Tipos vão pelo mesmo repasse, para a tela ter um único ponto de entrada.
export { contarCaracteres, MINIMO_SENHA } from '@/core/juri/senha';
export { validarTrocaSenhaJuri } from '@/core/juri/trocaSenha';
export type { ProblemaTrocaSenhaJuri } from '@/core/juri/trocaSenha';
export { paraBlocosResumo } from './blocosResumo';
export type { ImagemAberta } from './sessaoJuri';
export type { ResultadoConteudoJuri } from './conteudo';
export type { ConteudoJuriValidado } from '@/core/juri/tipos';
