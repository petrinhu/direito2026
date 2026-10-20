import { describe, expect, it } from 'vitest';
import {
  rotasDoCurriculo,
  rotasDeUnidades,
  rotasDeAbaAusente
} from '../e2e/apoio/rotasDoCurriculo';
import { curriculo } from '@/conteudo/curriculo';
import esperado from './rotas.esperado.json';

/**
 * Caracterização das rotas que o e2e percorre (tests/e2e/apoio/
 * rotasDoCurriculo.ts). Se a lista de caminhos, h1 ou abas mudar, o e2e
 * passa a exercitar outra coisa sem aviso; este teste torna a mudança
 * vermelha e obriga a revisar a referência. Para regravá-la depois de
 * acrescentar conteúdo de propósito: `npm run atualizar-referencias`.
 */
describe('rotas do e2e: lista congelada', () => {
  it('rotasDoCurriculo(curriculo) é igual à referência', () => {
    const rotas = JSON.parse(JSON.stringify(rotasDoCurriculo(curriculo)));
    expect(rotas.length).toBeGreaterThan(0);
    expect(rotas).toEqual(esperado.rotasDoCurriculo);
  });

  it('rotasDeUnidades(curriculo) é igual à referência', () => {
    const rotas = JSON.parse(JSON.stringify(rotasDeUnidades(curriculo)));
    expect(rotas.length).toBeGreaterThan(0);
    expect(rotas).toEqual(esperado.rotasDeUnidades);
  });

  it('rotasDeAbaAusente(curriculo) é igual à referência', () => {
    const caminhos = rotasDeAbaAusente(curriculo);
    expect(caminhos.length).toBeGreaterThan(0);
    expect(caminhos).toEqual(esperado.rotasDeAbaAusente);
  });
});
