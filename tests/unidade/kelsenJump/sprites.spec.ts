import { describe, expect, it } from 'vitest';
import { KELSEN, NUVEM } from '@/core/kelsenJump/constantes';
import { apexDoSalto, ehPassavelAbaixado, nuvemNaoSaltavel } from '@/core/kelsenJump/obstaculos';
import medidas from '@/ui/kelsenJump/sprites/medidas.json';

/**
 * A caixa de colisão do Kelsen bate com o desenho dos quadros normalizados (medidas.json, gerado pelo
 * script de geração a partir dos PNG do PixelLab). Se um quadro mudar, este teste acusa.
 */
const quadros = medidas.quadros as Record<string, { largura: number; altura: number }>;

describe('caixa de colisão do Kelsen bate com os quadros', () => {
  it('altura em pé é a do quadro parado', () => {
    expect(KELSEN.alturaEmPe).toBe(quadros['parado-0']!.altura);
  });

  it('altura agachada é a do quadro abaixado (cerca de 87% da altura em pé)', () => {
    expect(KELSEN.alturaAgachado).toBe(quadros['abaixado-0']!.altura);
    expect(KELSEN.alturaAgachado / KELSEN.alturaEmPe).toBeGreaterThan(0.85);
    expect(KELSEN.alturaAgachado / KELSEN.alturaEmPe).toBeLessThan(0.9);
  });

  it('largura cabe no corpo parado e fica abaixo dos quadros de corrida (o braço fica de fora)', () => {
    const parado = quadros['parado-0']!.largura;
    const corrida = Math.min(quadros['correndo-0']!.largura, quadros['correndo-1']!.largura);
    expect(KELSEN.largura).toBeLessThanOrEqual(parado);
    expect(KELSEN.largura).toBeGreaterThanOrEqual(parado - 4);
    expect(KELSEN.largura).toBeLessThan(corrida);
  });

  it('todos os quadros têm os pés na mesma linha do chão', () => {
    const linhas = new Set(Object.values(medidas.quadros).map((q) => q.linhaDoChao));
    expect(linhas.size).toBe(1);
    expect([...linhas][0]).toBe(medidas.canvas.altura - 1);
  });
});

describe('a base da nuvem separa agachado de em pé', () => {
  it('agachado passa por baixo da base e em pé bate nela', () => {
    expect(KELSEN.alturaAgachado).toBeLessThan(NUVEM.baseY);
    expect(KELSEN.alturaEmPe).toBeGreaterThan(NUVEM.baseY);
  });

  it('a nuvem tem o tamanho do PNG na escala usada (medidas.json)', () => {
    expect(NUVEM.largura).toBe(medidas.nuvem.largura);
    expect(NUVEM.altura).toBe(medidas.nuvem.altura);
  });

  it('a nuvem continua não saltável e passável abaixado', () => {
    const nuvem = {
      tipo: 'nuvem' as const,
      id: 0,
      x: 0,
      largura: NUVEM.largura,
      altura: NUVEM.altura,
      baseY: NUVEM.baseY,
      contado: false
    };
    expect(nuvemNaoSaltavel(nuvem)).toBe(true);
    expect(ehPassavelAbaixado(nuvem)).toBe(true);
    expect(apexDoSalto()).toBeGreaterThan(nuvem.baseY + nuvem.altura);
  });
});
