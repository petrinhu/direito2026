import { describe, expect, it } from 'vitest';
import { decorarCurriculo } from '@/app/carregamento/decorarCurriculo';
import type { Curriculo } from '@/core/curriculo/tipos';

function curriculoSemCarregador(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1o período',
      cadeiras: [
        {
          id: 'intr-direito',
          nome: 'Introdução ao Direito',
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Unidade 1',
              estado: 'publicado',
              abas: ['resumo']
              // sem `carregar`: é isso que decorarCurriculo acrescenta
            },
            {
              id: 'u2',
              rotulo: 'Unidade 2',
              titulo: 'Unidade 2',
              estado: 'em-breve',
              abas: []
            }
          ]
        }
      ]
    }
  ];
}

describe('decorarCurriculo', () => {
  it('acrescenta carregar() só nas unidades publicadas que têm registro', async () => {
    const decorado = decorarCurriculo(curriculoSemCarregador(), {
      'p1/intr-direito/u1': async () => ({
        meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
        resumo: []
      })
    });
    const unidade1 = decorado[0]!.cadeiras[0]!.unidades[0]!;
    expect(typeof unidade1.carregar).toBe('function');
    const conteudo = await unidade1.carregar!();
    expect(conteudo.meta.titulo).toBe('t');
  });

  it('unidade em-breve não ganha carregar, mesmo se houver registro', () => {
    const decorado = decorarCurriculo(curriculoSemCarregador(), {
      'p1/intr-direito/u2': async () => ({
        meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
        resumo: []
      })
    });
    const unidade2 = decorado[0]!.cadeiras[0]!.unidades[1]!;
    expect(unidade2.carregar).toBeUndefined();
  });

  it('unidade publicada sem registro correspondente fica sem carregar, não quebra', () => {
    const decorado = decorarCurriculo(curriculoSemCarregador(), {});
    const unidade1 = decorado[0]!.cadeiras[0]!.unidades[0]!;
    expect(unidade1.carregar).toBeUndefined();
  });

  it('não muta o currículo original', () => {
    const original = curriculoSemCarregador();
    decorarCurriculo(original, {
      'p1/intr-direito/u1': async () => ({
        meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
        resumo: []
      })
    });
    expect(original[0]!.cadeiras[0]!.unidades[0]!.carregar).toBeUndefined();
  });
});
