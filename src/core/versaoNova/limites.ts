/**
 * Limite, em minutos sem confirmação de sessão, para a frase "e continua conectado" do
 * banner. Tem de ficar abaixo da ociosidade do servidor (D26_SESSAO_OCIOSIDADE, 7200 s):
 * o teste gêmeo tests/unidade/versaoNova.limiteOciosidade.spec.ts confere.
 */
export const LIMITE_CONTINUA_CONECTADO_MIN = 110;
