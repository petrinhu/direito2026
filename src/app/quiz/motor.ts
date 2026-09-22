// Repassa o motor puro de core/quiz para quem está em src/ui/: por desenho
// (seção 2 da arquitetura, gate "ui-nao-pula-app"), um componente Vue
// importa LÓGICA de core sempre por trás de um módulo de app, mesmo
// quando o módulo em si é só um repasse. Tipos continuam indo direto
// (import type), porque tipo é apagado na compilação e não é a
// preocupação do gate.
export { embaralharRodada, corrigirResposta, calcularPontuacao } from '@/core/quiz/motor';
