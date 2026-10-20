import { describe, expect, it } from 'vitest';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { ROTULOS_CATEGORIA_QUIZ } from '@/conteudo/quiz/categorias';
import { validarUnidade } from '@/core/conteudo/validarUnidade';

/**
 * Varredura de TODA unidade descoberta em src/conteudo (glob do Vite, via
 * CARREGADORES). Não há lista manual de unidades nem de contagens: uma unidade
 * nova entra sozinha. A mesma função pura roda no script
 * scripts/validar-conteudo.ts, antes do build.
 */
describe('varredura: toda unidade descoberta cumpre as regras de conteúdo', () => {
  const chaves = Object.keys(CARREGADORES);

  it('há unidades descobertas para varrer (piso: zero é varredura quebrada)', () => {
    expect(chaves.length, 'nenhuma unidade descoberta').toBeGreaterThan(0);
  });

  it('nenhuma unidade reprova; cada falha diz unidade, caminho, regra e detalhe', async () => {
    const falhas: string[] = [];
    for (const chave of chaves) {
      const conteudo = await CARREGADORES[chave]!();
      for (const erro of validarUnidade(conteudo, ROTULOS_CATEGORIA_QUIZ)) {
        falhas.push(`${chave} ${erro.caminho} [${erro.regra}] ${erro.detalhe}`);
      }
    }
    expect(falhas).toEqual([]);
  });
});
