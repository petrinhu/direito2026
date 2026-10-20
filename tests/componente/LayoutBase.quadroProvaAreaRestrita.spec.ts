// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import LayoutBase from '@/ui/layout/LayoutBase.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Ordem do líder (20/10/2026): o quadro de contagem de prova não aparece na
 * área restrita Interdisciplinar (a rota da cadeira e qualquer subrota dela,
 * login e slides incluídos). O critério é o mesmo que já esconde o aviso de
 * armazenamento (caminhoEmAreaRestrita, reaproveitado, não duplicado). O botão
 * Home continua lá.
 */
const curriculo: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      { id: 'intr-direito', nome: 'Introdução ao Direito', estado: 'publicado', unidades: [] },
      {
        id: 'interdisciplinar',
        nome: 'Interdisciplinar',
        estado: 'publicado',
        restrita: true,
        unidades: []
      }
    ]
  }
];

let montado: VueWrapper | undefined;

function montarLayout(caminhoAtual: string) {
  const repo = new RepositorioMemoria();
  return mount(LayoutBase, {
    props: {
      curriculo,
      caminhoAtual,
      repositorio: repo,
      storeTema: criarStoreTema(repo),
      storeBusca: criarStoreBusca(),
      storeModoAdaptado: criarStoreModoAdaptado(repo)
    },
    slots: { default: () => 'conteúdo da página' },
    attachTo: document.body
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-20T15:00:00Z'));
  window.localStorage.clear();
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('LayoutBase, quadro de contagem fora da área restrita Interdisciplinar', () => {
  it.each(['p/p1/interdisciplinar', 'p/p1/interdisciplinar/subrota-qualquer'])(
    'em %s o quadro não existe e o botão Home continua',
    (caminho) => {
      montado = montarLayout(caminho);
      expect(document.querySelector('.quadro-prova')).toBeNull();
      expect(document.querySelector('.botao-home')).not.toBeNull();
    }
  );

  it('em outra cadeira (fora da área restrita) o quadro existe', () => {
    montado = montarLayout('p/p1/intr-direito');
    expect(document.querySelector('.quadro-prova')).not.toBeNull();
  });
});
