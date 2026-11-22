/** Luz de sessão: verde com sessão aberta, vermelha vazada sem ela, neutra sem o campo (servidor antigo). */
export function classeDoLed(conectado: boolean | undefined): string {
  if (conectado === true) return 'ar-led--verde';
  if (conectado === false) return 'ar-led--vermelho';
  return 'ar-led--sem';
}

/** Texto oculto da luz, para leitor de tela: diz o mesmo que a cor. */
export function textoDaSessao(conectado: boolean | undefined): string {
  if (conectado === true) return 'Sessão aberta';
  if (conectado === false) return 'Sem sessão aberta';
  return 'sem informação';
}
