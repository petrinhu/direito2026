import { describe, expect, it, vi } from 'vitest';
import { criarBuscadorImagemJuri } from '@/app/juri/buscadorImagem';

const ID = 'ab'.repeat(16);

function respostaBinaria(bytes: Uint8Array<ArrayBuffer>, status = 200): Response {
  return new Response(bytes, { status, headers: { 'Content-Type': 'application/octet-stream' } });
}

describe('buscador binário da imagem', () => {
  it('pede imagem.php?id= na mesma origem, sem cache, com credenciais same-origin', async () => {
    const buscar = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () =>
      respostaBinaria(new Uint8Array([1]))
    );
    await criarBuscadorImagemJuri({ buscar })(ID);
    const [url, init] = buscar.mock.calls[0]!;
    expect(url).toBe(`/api/juri/imagem.php?id=${ID}`);
    expect(init?.method).toBe('GET');
    expect(init?.credentials).toBe('same-origin');
    expect(init?.cache).toBe('no-store');
  });

  it('devolve os bytes exatamente como vieram, sem decodificar como JSON', async () => {
    const bruto = new Uint8Array([0x4a, 0x55, 0x52, 0x49, 0x00, 0xff]);
    const bytes = await criarBuscadorImagemJuri({
      buscar: async () => respostaBinaria(bruto)
    })(ID);
    expect(Array.from(bytes)).toEqual(Array.from(bruto));
  });

  it.each([
    [401, 'sem-sessao'],
    [403, 'troca-pendente'],
    [404, 'nao-encontrada'],
    [500, 'servidor']
  ])('status %i vira o código %s', async (status, codigo) => {
    const buscarImagem = criarBuscadorImagemJuri({
      buscar: async () => new Response('{"ok":false}', { status })
    });
    await expect(buscarImagem(ID)).rejects.toMatchObject({ status, codigo });
  });

  it('falha de rede vira o código rede', async () => {
    const buscarImagem = criarBuscadorImagemJuri({
      buscar: async () => {
        throw new TypeError('Failed to fetch');
      }
    });
    await expect(buscarImagem(ID)).rejects.toMatchObject({ codigo: 'rede' });
  });

  it.each(['../x', 'AB'.repeat(16), ''])(
    'id %j fora do formato não sai da máquina',
    async (invalido) => {
      const buscar = vi.fn(async () => respostaBinaria(new Uint8Array([1])));
      await expect(criarBuscadorImagemJuri({ buscar })(invalido)).rejects.toMatchObject({
        codigo: 'id-invalido'
      });
      expect(buscar).not.toHaveBeenCalled();
    }
  );

  it('corpo vazio é resposta inválida, nunca um arquivo vazio aceito', async () => {
    const buscarImagem = criarBuscadorImagemJuri({
      buscar: async () => respostaBinaria(new Uint8Array(0))
    });
    await expect(buscarImagem(ID)).rejects.toMatchObject({ codigo: 'resposta-invalida' });
  });
});
