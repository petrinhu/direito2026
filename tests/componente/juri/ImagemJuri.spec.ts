// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ImagemJuri from '@/ui/area-juri/ImagemJuri.vue';
import { CHAVE_SESSAO } from '@/app/chaves';

/** Id sintético de 32 hex: nenhuma imagem real entra em teste (L-28). */
const ID = '0123456789abcdef0123456789abcdef';
const SRC = `/api/juri/imagem.php?id=${ID}`;

function montar(id: string) {
  const conferirAoVoltar = vi.fn(async () => undefined);
  const w = mount(ImagemJuri, {
    props: { id, legenda: 'Legenda fictícia da imagem' },
    global: {
      provide: { [CHAVE_SESSAO as unknown as symbol]: { conferirAoVoltar } as never }
    }
  });
  return { w, conferirAoVoltar };
}

describe('ImagemJuri: imagem comum, servida com a sessão do site', () => {
  it('põe o src exato da rota com sessão, alt da legenda e carga preguiçosa, sem blob', () => {
    const { w } = montar(ID);
    const img = w.get('img');
    expect(img.attributes('src')).toBe(SRC);
    expect(img.attributes('alt')).toBe('Legenda fictícia da imagem');
    expect(img.attributes('loading')).toBe('lazy');
    expect(img.attributes('src')).not.toMatch(/^blob:/);
    w.unmount();
  });

  it('enquanto carrega mostra o estado, e o evento load o tira', async () => {
    const { w } = montar(ID);
    expect(w.get('[role="status"]').text()).toBe('Abrindo a imagem…');
    await w.get('img').trigger('load');
    expect(w.find('[role="status"]').exists()).toBe(false);
    expect(w.find('[role="alert"]').exists()).toBe(false);
    w.unmount();
  });

  it('falha de carga com sessão viva mostra o erro e confere a sessão, sem levar à entrada', async () => {
    const { w, conferirAoVoltar } = montar(ID);
    await w.get('img').trigger('error');
    expect(w.get('[role="alert"]').text()).toBe('Não foi possível mostrar esta imagem.');
    expect(conferirAoVoltar).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('mantém a legenda como figcaption, mesmo com erro', async () => {
    const { w } = montar(ID);
    await w.get('img').trigger('error');
    expect(w.get('figcaption').text()).toBe('Legenda fictícia da imagem');
    w.unmount();
  });

  it('id fora do formato nunca vira src: sem img, com erro, e sem consulta', () => {
    const { w, conferirAoVoltar } = montar('../segredo');
    expect(w.find('img').exists()).toBe(false);
    expect(w.get('[role="alert"]').text()).toBe('Não foi possível mostrar esta imagem.');
    expect(conferirAoVoltar).not.toHaveBeenCalled();
    w.unmount();
  });
});
