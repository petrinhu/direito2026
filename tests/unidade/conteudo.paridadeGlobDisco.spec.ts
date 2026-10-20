import { describe, expect, it } from 'vitest';
import { CAMINHOS_DO_CONTEUDO } from '@/app/carregamento/modulosDoConteudo';
import { curriculo } from '@/conteudo/curriculo';
import { caminhosDoDisco, curriculoDoDisco } from '../../scripts/apoio/conteudoDoDisco';

/**
 * Paridade entre os dois modos de descoberta: o glob do Vite (site e vitest)
 * e a leitura direta de pastas (scripts Node e e2e). Os dois precisam achar
 * exatamente os mesmos arquivos de unidade; se divergirem, um deles vê
 * conteúdo que o outro não vê, e o build e o site passam a dizer coisas
 * diferentes.
 */
describe('paridade: glob do Vite x leitura direta do disco', () => {
  const doDisco = caminhosDoDisco();

  it('há arquivos de unidade para conferir (piso contra varredura vazia)', () => {
    expect(CAMINHOS_DO_CONTEUDO.length).toBeGreaterThan(0);
    expect(doDisco.length).toBeGreaterThan(0);
  });

  it('as chaves do glob são exatamente as lidas do disco', () => {
    expect([...CAMINHOS_DO_CONTEUDO].sort()).toEqual([...doDisco].sort());
  });

  it('o currículo montado pelo glob é igual ao montado do disco', async () => {
    expect(JSON.stringify(curriculo)).toBe(JSON.stringify(await curriculoDoDisco()));
  });
});
