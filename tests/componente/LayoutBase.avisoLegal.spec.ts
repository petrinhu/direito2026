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
 * Ordem do líder (20/10/2026): aviso legal "bem visível" no rodapé de TODAS
 * as páginas, exceto a área restrita Interdisciplinar (a rota da cadeira e
 * qualquer subrota dela). O texto abaixo é a aprovação literal do líder.
 */
const TEXTO_APROVADO =
  'Aviso: este site não é oficial e não tem vínculo com a instituição de ensino nem com seus professores. É um projeto pessoal, independente e gratuito, feito para apoiar os estudos da turma de Direito. O conteúdo foi preparado a partir de materiais de aula, mas a seleção, a redação e eventuais erros são de responsabilidade exclusiva do autor, e não dos professores nem da instituição. O material é oferecido como está, apenas para estudo, sem garantia de exatidão ou atualização, e não substitui as aulas, a bibliografia indicada nem orientação jurídica profissional.';

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

// 4 é Node.DOCUMENT_POSITION_FOLLOWING: o alvo vem depois de `antes` no documento.
const DOCUMENT_POSITION_FOLLOWING = 4;

interface NoDoDom {
  compareDocumentPosition(outro: NoDoDom): number;
}

function vemDepois(antes: NoDoDom, depois: NoDoDom): boolean {
  return (antes.compareDocumentPosition(depois) & DOCUMENT_POSITION_FOLLOWING) !== 0;
}

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

describe('LayoutBase, aviso legal antes do rodapé', () => {
  it.each(['', 'p/p1/intr-direito'])(
    'em "%s" (home ou cadeira comum) o texto exato aparece dentro de .aviso-legal',
    (caminho) => {
      montado = montarLayout(caminho);
      const aviso = document.querySelector('.aviso-legal');
      expect(aviso).not.toBeNull();
      expect(aviso!.textContent?.replace(/\s+/g, ' ').trim()).toBe(TEXTO_APROVADO);
    }
  );

  it('o aviso vem ANTES do rodapé na ordem do documento, e fora dele (o rodapé some na impressão)', () => {
    montado = montarLayout('p/p1/intr-direito');
    const aviso = document.querySelector('.aviso-legal')!;
    const rodape = document.querySelector('footer.rodape')!;
    expect(rodape).not.toBeNull();
    expect(rodape.contains(aviso)).toBe(false);
    expect(vemDepois(aviso, rodape)).toBe(true);
  });

  it('o aviso vem antes da pilha flutuante inferior (que não pode cobri-lo ao fim da página)', () => {
    montado = montarLayout('p/p1/intr-direito');
    const aviso = document.querySelector('.aviso-legal')!;
    const pilha = document.querySelector('.layout-base__inferior')!;
    expect(vemDepois(aviso, pilha)).toBe(true);
  });

  it.each(['p/p1/interdisciplinar', 'p/p1/interdisciplinar/subrota-qualquer'])(
    'em %s (área restrita Interdisciplinar) o aviso não existe',
    (caminho) => {
      montado = montarLayout(caminho);
      expect(document.querySelector('.aviso-legal')).toBeNull();
      expect(document.querySelector('footer.rodape')).not.toBeNull();
    }
  );
});
