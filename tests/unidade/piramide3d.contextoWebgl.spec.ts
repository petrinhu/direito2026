import { describe, expect, it } from 'vitest';
import { ouvirContextoDoWebgl } from '@/ui/piramide3d/contexto';

/**
 * Perda do contexto WebGL (captura do líder e pistas da web): sem tratamento, o canvas fica em branco e
 * sem erro visível. O tratamento cancela a perda (preventDefault), para o navegador poder restaurar o
 * contexto, e avisa quando a restauração chega, para a cena voltar a desenhar.
 */
function alvoFalso() {
  const alvo = new EventTarget();
  return alvo;
}

describe('webglcontextlost', () => {
  it('cancela a perda do contexto e avisa que o contexto caiu', () => {
    const canvas = alvoFalso();
    let perdeu = 0;
    ouvirContextoDoWebgl(canvas, { onPerdido: () => perdeu++, onRestaurado: () => {} });
    const evento = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(evento);
    expect(evento.defaultPrevented).toBe(true);
    expect(perdeu).toBe(1);
  });

  it('avisa quando o contexto é restaurado', () => {
    const canvas = alvoFalso();
    let restaurou = 0;
    ouvirContextoDoWebgl(canvas, { onPerdido: () => {}, onRestaurado: () => restaurou++ });
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(restaurou).toBe(1);
  });

  it('depois de remover o tratamento, os avisos param', () => {
    const canvas = alvoFalso();
    let chamadas = 0;
    const retirar = ouvirContextoDoWebgl(canvas, {
      onPerdido: () => chamadas++,
      onRestaurado: () => chamadas++
    });
    retirar();
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(chamadas).toBe(0);
  });
});
