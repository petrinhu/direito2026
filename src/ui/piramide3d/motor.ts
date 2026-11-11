// Ponto de entrada do pedaço carregado sob demanda: tudo que depende da biblioteca gráfica fica
// atrás deste módulo (src/app/piramide3d/carregarMotor.ts é o único que o importa).
export { criarFigura } from './figura';
export { obterControleSom as obterSom } from './controleSom';
