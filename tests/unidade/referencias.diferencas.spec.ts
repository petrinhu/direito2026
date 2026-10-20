import { describe, expect, it } from 'vitest';
import type { Referencias } from '../../scripts/apoio/referencias/capturar';
import {
  diferencaPorChave,
  secaoDoResumo,
  temMudanca
} from '../../scripts/apoio/referencias/diferencas';
import { resumirMudancas } from '../../scripts/apoio/referencias/resumo';

/**
 * Diferença que o atualizar-referencias imprime. O resumo tem de mostrar os três
 * sinais (+ entrou, - saiu, ~ mudou de forma) e nunca um falso "nenhuma mudança".
 * Dados sintéticos: nenhum conteúdo real entra aqui.
 */
function referenciaVazia(): Referencias {
  return {
    carregadores: { chavesCarregadores: [], chavesCarregadoresDispositivos: [], unidades: {} },
    curriculo: [],
    rotas: { rotasDoCurriculo: [], rotasDeUnidades: [], rotasDeAbaAusente: [] },
    indiceBusca: { documentosEncontrados: 0, documentos: [] }
  };
}

describe('diferencaPorChave', () => {
  const porId = (item: { id: string }) => item.id;

  it('sinaliza o que entrou (+) quando a chave é nova', () => {
    const d = diferencaPorChave([{ id: 'a' }], [{ id: 'a' }, { id: 'b' }], porId);
    expect(d).toEqual({ adicionados: ['b'], removidos: [], alterados: [] });
  });

  it('sinaliza o que saiu (-) quando a chave some', () => {
    const d = diferencaPorChave([{ id: 'a' }, { id: 'b' }], [{ id: 'a' }], porId);
    expect(d).toEqual({ adicionados: [], removidos: ['b'], alterados: [] });
  });

  it('sinaliza o que mudou de forma (~) quando a chave é a mesma e o conteúdo não', () => {
    const d = diferencaPorChave(
      [{ id: 'x', v: 1 }],
      [{ id: 'x', v: 2 }],
      porId as (item: { id: string; v: number }) => string
    );
    expect(d).toEqual({ adicionados: [], removidos: [], alterados: ['x'] });
  });

  it('ignora a posição: a mesma lista em outra ordem não é mudança', () => {
    const anterior = [
      { id: 'a', v: 1 },
      { id: 'b', v: 2 }
    ];
    const atual = [
      { id: 'b', v: 2 },
      { id: 'a', v: 1 }
    ];
    const d = diferencaPorChave(anterior, atual, porId);
    expect(temMudanca(d)).toBe(false);
  });

  it('sem anterior (primeira geração), tudo é entrada', () => {
    const d = diferencaPorChave([], [{ id: 'a' }], porId);
    expect(d.adicionados).toEqual(['a']);
  });
});

describe('secaoDoResumo', () => {
  it('mostra o cabeçalho com as três contagens e uma linha por item', () => {
    const linhas = secaoDoResumo('unidades', {
      adicionados: ['p1/x/u1'],
      removidos: ['p1/y/u1'],
      alterados: ['p1/z/u1']
    });
    expect(linhas[0]).toBe('unidades: +1 -1 ~1');
    expect(linhas).toContain('  + p1/x/u1');
    expect(linhas).toContain('  - p1/y/u1');
    expect(linhas).toContain('  ~ p1/z/u1');
  });

  it('corta acima do teto e diz quantos ficaram de fora (o terminal não vira parede)', () => {
    const muitos = Array.from({ length: 30 }, (_, i) => `doc-${i}`);
    const linhas = secaoDoResumo(
      'documentos',
      { adicionados: muitos, removidos: [], alterados: [] },
      25
    );
    expect(linhas.filter((l) => l.startsWith('  + doc-'))).toHaveLength(25);
    expect(linhas).toContain('  + ... e mais 5');
  });
});

describe('resumirMudancas', () => {
  it('sem diferença, diz que a referência já era o estado atual', () => {
    const r = resumirMudancas(referenciaVazia(), referenciaVazia());
    expect(r.houveMudanca).toBe(false);
    expect(r.linhas).toEqual(['nenhuma mudança: a referência já era o estado atual']);
  });

  it('primeira geração (sem anterior) lista tudo como entrada', () => {
    const atual = referenciaVazia();
    atual.rotas.rotasDoCurriculo.push({
      caminho: '/p/p1',
      h1: '1º período',
      nome: '1º período',
      tipo: 'periodo'
    });
    const r = resumirMudancas({}, atual);
    expect(r.houveMudanca).toBe(true);
    expect(r.linhas).toContain('  + /p/p1');
  });

  it('rota que sumiu aparece com (-)', () => {
    const anterior = referenciaVazia();
    anterior.rotas.rotasDoCurriculo.push({ caminho: '/p/p9', h1: 'x', nome: 'x', tipo: 'periodo' });
    const r = resumirMudancas(anterior, referenciaVazia());
    expect(r.linhas).toContain('  - /p/p9');
  });

  it('rota com o mesmo caminho e outro h1 aparece com (~)', () => {
    const anterior = referenciaVazia();
    anterior.rotas.rotasDoCurriculo.push({
      caminho: '/p/p1',
      h1: 'antigo',
      nome: 'n',
      tipo: 'periodo'
    });
    const atual = referenciaVazia();
    atual.rotas.rotasDoCurriculo.push({ caminho: '/p/p1', h1: 'novo', nome: 'n', tipo: 'periodo' });
    const r = resumirMudancas(anterior, atual);
    expect(r.linhas).toContain('  ~ /p/p1');
    expect(r.linhas.join('\n')).not.toContain('  + /p/p1');
  });

  it('documento de busca com mesma id e outra url aparece com (~)', () => {
    const anterior = referenciaVazia();
    anterior.indiceBusca.documentos.push({ id: 'd1', url: '/a' });
    const atual = referenciaVazia();
    atual.indiceBusca.documentos.push({ id: 'd1', url: '/b' });
    const r = resumirMudancas(anterior, atual);
    expect(r.linhas).toContain('  ~ d1');
  });
});
