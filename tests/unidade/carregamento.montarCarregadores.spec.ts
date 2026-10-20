import { describe, expect, it, vi } from 'vitest';
import { agruparPorUnidade } from '@/core/curriculo/agruparPorUnidade';
import { ErroDeConteudo } from '@/core/curriculo/erroDeConteudo';
import {
  montarCarregadores,
  montarCarregadoresDispositivos
} from '@/app/carregamento/montarCarregadores';

/**
 * Montagem dos carregadores a partir das unidades descobertas, com um
 * importador falso (sem glob e sem disco). Prova a forma do ConteudoUnidade:
 * só as partes que existem entram, e cada carregador é preguiçoso.
 */
const META = { titulo: 'T', subtitulo: 'S', descricao: 'D' };
const MODULOS: Record<string, Record<string, unknown>> = {
  'p1/intr-direito/u1/meta.ts': { meta: META },
  'p1/intr-direito/u1/resumo.ts': { resumo: [{ id: 'bloco-1' }] },
  'p1/intr-direito/u1/peticao.ts': { peticao: { secoes: [] } },
  'p1/intr-direito/u1/quiz.ts': { quiz: [{ id: 'q-1' }] },
  'p1/intr-direito/u1/dispositivos.ts': { dispositivos: { 'cpc-1': { id: 'cpc-1' } } },
  'p1/sociologia-juridica/u1/meta.ts': { meta: META },
  'p1/sociologia-juridica/u1/resumo.ts': { resumo: [{ id: 'bloco-s' }] },
  'p1/sociologia-juridica/u1/quiz/index.ts': { quiz: [{ id: 'q-s' }] }
};

function importadorFalso() {
  return vi.fn(async (caminho: string) => {
    const modulo = MODULOS[caminho];
    if (!modulo) throw new Error(`sem módulo sintético para ${caminho}`);
    return modulo;
  });
}

const UNIDADES = agruparPorUnidade(Object.keys(MODULOS));

describe('montarCarregadores: uma entrada por unidade descoberta', () => {
  it('registra a chave de cada unidade, na chave periodo/cadeira/unidade', () => {
    const registro = montarCarregadores(UNIDADES, importadorFalso());
    expect(Object.keys(registro).sort()).toEqual([
      'p1/intr-direito/u1',
      'p1/sociologia-juridica/u1'
    ]);
  });

  it('carregador só traz as partes que existem (sem chave com undefined)', async () => {
    const registro = montarCarregadores(UNIDADES, importadorFalso());
    const conteudo = await registro['p1/intr-direito/u1']!();
    expect(Object.keys(conteudo).sort()).toEqual(['meta', 'peticao', 'quiz', 'resumo']);
  });

  it('quiz em quiz/index.ts entra como quiz, sem peticao', async () => {
    const registro = montarCarregadores(UNIDADES, importadorFalso());
    const conteudo = await registro['p1/sociologia-juridica/u1']!();
    expect(Object.keys(conteudo).sort()).toEqual(['meta', 'quiz', 'resumo']);
    expect(conteudo.quiz).toEqual([{ id: 'q-s' }]);
  });

  it('não importa nenhum arquivo até o carregador ser chamado (carregamento sob demanda)', async () => {
    const importar = importadorFalso();
    montarCarregadores(UNIDADES, importar);
    expect(importar).not.toHaveBeenCalled();
  });

  it('reprova export ausente no arquivo, nomeando o arquivo e a parte', async () => {
    const importarSemExport = vi.fn(async () => ({}));
    const registro = montarCarregadores(UNIDADES, importarSemExport);
    await expect(registro['p1/intr-direito/u1']!()).rejects.toThrow(ErroDeConteudo);
    await expect(registro['p1/intr-direito/u1']!()).rejects.toThrow(/meta/);
  });
});

describe('montarCarregadoresDispositivos: só unidade com dispositivos.ts gerado', () => {
  it('registra só as unidades que têm dispositivos.ts', async () => {
    const registro = montarCarregadoresDispositivos(UNIDADES, importadorFalso());
    expect(Object.keys(registro)).toEqual(['p1/intr-direito/u1']);
    const indice = await registro['p1/intr-direito/u1']!();
    expect(Object.keys(indice)).toEqual(['cpc-1']);
  });
});
