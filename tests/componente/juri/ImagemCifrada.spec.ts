// @vitest-environment jsdom
/* global Blob */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import ImagemCifrada from '@/ui/area-juri/ImagemCifrada.vue';
import { ErroCifra } from '@/core/juri/cifra';

/** Bytes sintéticos: a tela nunca decodifica a imagem, só repassa o Blob. */
const BYTES = new Uint8Array([1, 2, 3]);

let urlsCriadas: string[];
let urlsRevogadas: string[];
let contador: number;
let w: VueWrapper | undefined;

beforeEach(() => {
  urlsCriadas = [];
  urlsRevogadas = [];
  contador = 0;
  // jsdom não implementa object URL: o teste grava a criação e a revogação.
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(() => {
      contador += 1;
      const url = `blob:falso-${contador}`;
      urlsCriadas.push(url);
      return url;
    })
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn((url: string) => {
      urlsRevogadas.push(url);
    })
  });
});

afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

type ImagemAbertaFalsa = { mime: string; bytes: Uint8Array<ArrayBuffer> };

type PropsImagem = {
  id: string;
  legenda: string;
  abrir: (id: string) => Promise<{ mime: string; bytes: Uint8Array<ArrayBuffer> }>;
};

function montar(props: PropsImagem): VueWrapper {
  w = mount(ImagemCifrada, { props, attachTo: document.body });
  return w;
}

describe('ImagemCifrada', () => {
  it('decifra e mostra a imagem por object URL, com a legenda como texto alternativo', async () => {
    const abrir = vi.fn(async (): Promise<ImagemAbertaFalsa> => ({
      mime: 'image/png',
      bytes: BYTES
    }));
    montar({ id: 'ab'.repeat(16), legenda: 'Legenda fictícia', abrir });
    await flushPromises();

    const img = w!.get('img');
    expect(img.attributes('src')).toBe('blob:falso-1');
    expect(img.attributes('alt')).toBe('Legenda fictícia');
    expect(abrir).toHaveBeenCalledWith('ab'.repeat(16));
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0]![0] as Blob;
    expect(blob.type).toBe('image/png');
  });

  it('chave errada ou arquivo de outro id mostra erro claro, sem imagem', async () => {
    const abrir = vi.fn(async () => {
      throw new ErroCifra('id');
    });
    montar({ id: 'ab'.repeat(16), legenda: 'Legenda fictícia', abrir });
    await flushPromises();

    expect(w!.get('[role="alert"]').text()).toBe('Não foi possível mostrar esta imagem.');
    expect(w!.find('img').exists()).toBe(false);
  });

  it('ao desmontar, revoga o object URL', async () => {
    const abrir = vi.fn(async (): Promise<ImagemAbertaFalsa> => ({
      mime: 'image/png',
      bytes: BYTES
    }));
    montar({ id: 'ab'.repeat(16), legenda: 'Legenda fictícia', abrir });
    await flushPromises();
    w!.unmount();
    w = undefined;
    expect(urlsRevogadas).toEqual(['blob:falso-1']);
  });

  it('trocar o id revoga a URL anterior antes de mostrar a nova', async () => {
    const abrir = vi.fn(async (): Promise<ImagemAbertaFalsa> => ({
      mime: 'image/png',
      bytes: BYTES
    }));
    montar({ id: 'ab'.repeat(16), legenda: 'Legenda fictícia', abrir });
    await flushPromises();
    await w!.setProps({ id: 'cd'.repeat(16) });
    await flushPromises();
    expect(urlsRevogadas).toEqual(['blob:falso-1']);
    expect(w!.get('img').attributes('src')).toBe('blob:falso-2');
  });

  it('desmontar antes de a imagem chegar não cria object URL (nada vaza)', async () => {
    let entregar: (valor: ImagemAbertaFalsa) => void = () => {};
    const abrir = vi.fn(
      () =>
        new Promise<ImagemAbertaFalsa>((resolver) => {
          entregar = resolver;
        })
    );
    montar({ id: 'ab'.repeat(16), legenda: 'Legenda fictícia', abrir });
    w!.unmount();
    w = undefined;
    entregar({ mime: 'image/png', bytes: BYTES });
    await flushPromises();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
