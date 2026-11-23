import { describe, expect, it } from 'vitest';
import { cenaDe } from '@/app/kelsenJump';
import { MUNDO, NUVEM, ROTULO_NHF } from '@/core/kelsenJump/constantes';
import { estadoInicial } from '@/core/kelsenJump/partida';
import type { Nuvem } from '@/core/kelsenJump/obstaculos';

/** Um rótulo por grupo visível; ele fica acima da nuvem e dentro do canvas, e não entra na colisão. */
describe('rótulo NHF: uma vez por grupo, acima dele, fora da colisão', () => {
  const estado = estadoInicial(9);
  const cena = cenaDe(estado);

  it('há um rótulo para o primeiro grupo da partida, centrado no grupo', () => {
    expect(cena.rotulos.length).toBeGreaterThanOrEqual(1);
    const primeiro = cena.rotulos[0]!;
    const grupo = estado.obstaculos.find((o): o is Nuvem => o.tipo === 'nuvem' && o.primeira)!;
    expect(primeiro.x).toBeCloseTo(grupo.x + grupo.larguraGrupo / 2 - estado.distancia, 6);
    expect(primeiro.texto).toBe(NUVEM.texto);
  });

  it('o rótulo fica acima do topo da nuvem e dentro da altura do mundo', () => {
    for (const r of cena.rotulos) {
      expect(r.alturaChao - ROTULO_NHF.fonte / 2).toBeGreaterThan(NUVEM.baseY + NUVEM.altura);
      expect(r.alturaChao + ROTULO_NHF.fonte / 2).toBeLessThan(MUNDO.altura);
    }
  });

  it('o rótulo não está na lista de obstáculos da colisão: só as nuvens e pirâmides entram nela', () => {
    expect(estado.obstaculos.every((o) => !('texto' in o))).toBe(true);
    expect(cena.rotulos.length).toBeLessThanOrEqual(
      estado.obstaculos.filter((o) => o.tipo === 'nuvem' && o.primeira).length
    );
  });
});
