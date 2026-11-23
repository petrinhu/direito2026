import { describe, expect, it } from 'vitest';
import {
  ehTeclaDeAbaixar,
  ehTeclaDePulo,
  ehTeclaDoJogo,
  jogoFicaComATecla
} from '@/ui/kelsenJump/teclado';

describe('mapa de teclas do jogo', () => {
  it('Espaço e Seta para cima pulam; Seta para baixo abaixa; as outras não são do jogo', () => {
    expect(ehTeclaDePulo(' ')).toBe(true);
    expect(ehTeclaDePulo('Spacebar')).toBe(true);
    expect(ehTeclaDePulo('ArrowUp')).toBe(true);
    expect(ehTeclaDeAbaixar('ArrowDown')).toBe(true);
    expect(ehTeclaDoJogo('Enter')).toBe(false);
    expect(ehTeclaDoJogo('a')).toBe(false);
  });
});

describe('quando o jogo fica com a tecla', () => {
  const canvas = { ehCanvas: true, editavel: false, interativo: false };
  const corpo = { ehCanvas: false, editavel: false, interativo: false };
  const botao = { ehCanvas: false, editavel: false, interativo: true };
  const campo = { ehCanvas: false, editavel: true, interativo: true };

  it('fica com a tecla com o foco no canvas, no corpo da página ou sem foco', () => {
    expect(jogoFicaComATecla(canvas, false)).toBe(true);
    expect(jogoFicaComATecla(corpo, false)).toBe(true);
    expect(jogoFicaComATecla(null, false)).toBe(true);
  });

  it('não fica com a tecla num botão ou link que não seja o canvas (o Espaço é do botão)', () => {
    expect(jogoFicaComATecla(botao, false)).toBe(false);
  });

  it('não fica com a tecla num campo de texto ou seleção', () => {
    expect(jogoFicaComATecla(campo, false)).toBe(false);
  });

  it('não fica com a tecla com modal aberto, mesmo com o foco no canvas', () => {
    expect(jogoFicaComATecla(canvas, true)).toBe(false);
    expect(jogoFicaComATecla(corpo, true)).toBe(false);
  });
});
