// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import LayoutBase from '@/ui/layout/LayoutBase.vue';
import Home from '@/ui/paginas/Home.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import { curriculo } from '@/conteudo/curriculo';

/**
 * Sequência real do App: a rota passa de outra página para a home. O
 * `comFaixa` do layout vira verdadeiro no mesmo ciclo em que a Home entra no
 * slot. Se o Teleport da Home procurar `#faixa-do-layout` antes de o layout
 * ter inserido o alvo, o Vue avisa "Failed to locate Teleport target" e a
 * abertura (o h1) nunca aparece. Este teste reproduz a troca, não só a
 * montagem inicial.
 */
let montado: VueWrapper | undefined;

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('LayoutBase com Home entrando depois, pela troca de rota', () => {
  it('a abertura da home aparece na faixa quando a rota muda para ela, sem aviso de alvo ausente', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ativo = ref(false);
    const repo = new RepositorioMemoria();
    const Pai = defineComponent({
      setup() {
        return () =>
          h(
            LayoutBase,
            {
              curriculo,
              caminhoAtual: ativo.value ? '' : 'outra',
              repositorio: repo,
              storeTema: criarStoreTema(repo),
              storeBusca: criarStoreBusca(),
              storeModoAdaptado: criarStoreModoAdaptado(repo),
              comFaixa: ativo.value
            },
            { default: () => (ativo.value ? h(Home) : h('p', 'outra página')) }
          );
      }
    });

    montado = mount(Pai, {
      attachTo: document.body,
      global: { provide: { [CHAVE_CURRICULO as unknown as symbol]: curriculo } }
    });
    expect(document.querySelector('#faixa-do-layout')).toBeNull();

    ativo.value = true;
    await nextTick();
    await nextTick();

    expect(document.querySelector('#faixa-do-layout .abertura h1')?.textContent).toBe(
      'Caderno de Direito'
    );
    const avisos = aviso.mock.calls.map((a) => String(a[0]));
    expect(avisos.filter((t) => t.includes('Teleport'))).toEqual([]);
  });
});
