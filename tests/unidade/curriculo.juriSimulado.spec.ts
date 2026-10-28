import { describe, expect, it } from 'vitest';
import { caminhoEmAreaRestrita, caminhoSuspendeModoAdaptado } from '@/core/curriculo/areaRestrita';
import { ErroDeConteudo } from '@/core/curriculo/erroDeConteudo';
import {
  montarCurriculo,
  type DescricaoCadeira,
  type EntradasDoCurriculo
} from '@/core/curriculo/montarCurriculo';
import type { Curriculo } from '@/core/curriculo/tipos';
import { curriculo } from '@/conteudo/curriculo';

/** Currículo com uma cadeira por vez, sem unidades (cadeira restrita ou em breve). */
function montarCom(descricao: DescricaoCadeira): Curriculo {
  const entradas: EntradasDoCurriculo = {
    caminhos: [],
    cadeiras: { 'p1/x/cadeira.ts': descricao },
    metas: {}
  };
  return montarCurriculo(entradas);
}

describe('campo area da cadeira', () => {
  it('área sem cadeira restrita reprova a montagem', () => {
    expect(() => montarCom({ nome: 'X', ordem: 1, estado: 'em-breve', area: 'juri' })).toThrow(
      ErroDeConteudo
    );
  });

  it('a área chega à cadeira montada, que continua restrita', () => {
    const [periodo] = montarCom({
      nome: 'Y',
      ordem: 1,
      estado: 'em-breve',
      restrita: true,
      area: 'juri'
    });
    const cadeira = periodo?.cadeiras[0];
    expect(cadeira).toMatchObject({ id: 'x', restrita: true, area: 'juri' });
  });

  it('cadeira restrita sem área não ganha o campo (é o Interdisciplinar)', () => {
    const [periodo] = montarCom({ nome: 'Z', ordem: 1, estado: 'em-breve', restrita: true });
    expect(periodo?.cadeiras[0]).not.toHaveProperty('area');
  });
});

describe('Júri Simulado no currículo real', () => {
  const p1 = curriculo.find((p) => p.id === 'p1');
  const ids = p1?.cadeiras.map((c) => c.id) ?? [];
  const juri = p1?.cadeiras.find((c) => c.id === 'juri-simulado');

  it('está no 1º período, restrita, publicada, na área juri, sem unidade', () => {
    expect(juri).toMatchObject({
      nome: 'Júri Simulado',
      estado: 'publicado',
      restrita: true,
      area: 'juri',
      unidades: []
    });
  });

  it('fica logo depois do Interdisciplinar', () => {
    expect(ids.indexOf('juri-simulado')).toBe(ids.indexOf('interdisciplinar') + 1);
  });
});

describe('caminhoSuspendeModoAdaptado: só a área do Interdisciplinar suspende', () => {
  it('no currículo real, o Interdisciplinar suspende e a Júri não', () => {
    expect(caminhoSuspendeModoAdaptado(curriculo, '/p/p1/interdisciplinar')).toBe(true);
    expect(caminhoSuspendeModoAdaptado(curriculo, '/p/p1/juri-simulado')).toBe(false);
    expect(caminhoSuspendeModoAdaptado(curriculo, '/p/p1/juri-simulado/u1')).toBe(false);
  });

  it('cadeira comum e caminhos desconhecidos nunca suspendem', () => {
    for (const caminho of ['/', '/p/p1/intr-direito', '/p/p9/interdisciplinar']) {
      expect(caminhoSuspendeModoAdaptado(curriculo, caminho), caminho).toBe(false);
    }
  });

  it('a Júri continua sendo área restrita para o aviso e o quadro de prova', () => {
    expect(caminhoEmAreaRestrita(curriculo, '/p/p1/juri-simulado')).toBe(true);
    expect(caminhoEmAreaRestrita(curriculo, '/p/p1/interdisciplinar')).toBe(true);
  });
});
