import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LICOES } from '@/conteudo/kelsen-jump/licoes';
import esperado from '../../caracterizacao/rotas.esperado.json';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CONTEUDO_P1 = resolve(AQUI, '../../../src/conteudo/p1');
const CAMINHOS_PUBLICOS = new Set(
  (esperado.rotasDoCurriculo as { caminho: string }[]).map((r) => r.caminho)
);

describe('lições do Kelsen Jump', () => {
  it('são de 10 a 20 trechos', () => {
    expect(LICOES.length).toBeGreaterThanOrEqual(10);
    expect(LICOES.length).toBeLessThanOrEqual(20);
  });

  for (const licao of LICOES) {
    it(`"${licao.texto.slice(0, 48)}..." existe no resumo de origem`, () => {
      const caminho = resolve(CONTEUDO_P1, licao.arquivo, 'resumo.ts');
      expect(existsSync(caminho)).toBe(true);
      expect(
        readFileSync(caminho, 'utf-8')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
      ).toContain(licao.texto);
    });

    it(`"${licao.texto.slice(0, 48)}..." vem de unidade pública e tem caminho válido`, () => {
      expect(licao.arquivo).not.toMatch(/(^|\/)juri|interdisciplinar/i);
      expect(licao.caminho).not.toMatch(/(^|\/)juri|interdisciplinar/i);
      expect(CAMINHOS_PUBLICOS.has(licao.caminho)).toBe(true);
    });

    it(`"${licao.texto.slice(0, 48)}..." não tem travessão`, () => {
      expect(licao.texto).not.toMatch(/[—–]/);
    });
  }
});
