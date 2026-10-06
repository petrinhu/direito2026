// Repasse fino de core/restrito para a camada de apresentação (gate
// "ui-nao-pula-app"): um componente Vue importa lógica de core sempre por
// trás de um módulo de app. Tipos vão direto (import type).
export { criarClienteApi, ErroDeApi } from './clienteApi';
export type { ClienteApi, UsuarioAdmin } from './clienteApi';
export { criarSessaoRestrita } from './sessaoRestrita';
export { usarSemMovimento } from './semMovimento';
export type {
  Administrar,
  ResultadoAdministracao,
  SessaoRestrita,
  FaseSessao
} from './sessaoRestrita';
export {
  LIMITE_MAXIMO_SENHA,
  LIMITE_MINIMO_SENHA,
  validarTrocaDeSenha
} from '@/core/restrito/senha';
export type { ProblemaSenha } from '@/core/restrito/senha';
export { loginValido } from '@/core/restrito/login';
export { paraArvoreLista, paraArvoreMarkmapRestrita } from '@/core/restrito/arvoreRestrita';

export { TITULO_AREA_RESTRITA } from '@/core/restrito/titulo';
