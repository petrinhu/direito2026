import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carregadoresDoDisco } from '../../scripts/apoio/conteudoDoDisco';

/**
 * Raiz informada por argumento. Antes, importarDoDisco ignorava a raiz e
 * sempre lia src/conteudo do repositório: uma raiz com unidades reprovava com
 * "Cannot find module". A fixture tem uma unidade só, e o teste prova que a
 * leitura e o validador usam a raiz que receberam.
 */
const RAIZ_MINIMA = resolve(__dirname, 'apoio/raizMinima');
const VALIDADOR = resolve(__dirname, '../../scripts/validar-conteudo.ts');

describe('leitura do disco respeita a raiz informada', () => {
  it('o carregador da fixture importa a unidade da raiz recebida', async () => {
    const carregadores = carregadoresDoDisco(RAIZ_MINIMA);
    expect(Object.keys(carregadores)).toEqual(['p1/cad/u1']);
    const conteudo = await carregadores['p1/cad/u1']!();
    expect(conteudo.meta.titulo).toBe('Unidade de Teste');
  });

  it('validar-conteudo com raiz que tem unidade sai 0 e conta a unidade', () => {
    const saida = spawnSync(process.execPath, ['--import', 'tsx', VALIDADOR, RAIZ_MINIMA], {
      encoding: 'utf-8'
    });
    expect(saida.stderr).not.toContain('Cannot find module');
    expect(saida.stdout).toContain('encontradas=1 validadas=1 falharam=0');
    expect(saida.status).toBe(0);
  });
});
