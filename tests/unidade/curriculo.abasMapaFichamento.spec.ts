import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { resolverRota } from '@/core/curriculo/resolverRota';
import { ROTULOS_ABA } from '@/core/curriculo/rotulosAba';
import { meta } from '@/conteudo/p1/filosofia-juridica/u1/meta';

const base = '/p/p1/filosofia-juridica/u1';

const ABAS_NOVAS = ['mapa', 'fichamento', 'mnemonicos'] as const;
const CADEIRAS_COM_ABAS_DE_ARQUIVO = ['intr-direito', 'redacao-juridica-1', 'sociologia-juridica'];
const ARQUIVO_DA_ABA = {
  mapa: 'mapaFichamento.ts',
  fichamento: 'mapaFichamento.ts',
  mnemonicos: 'mnemonicos.ts'
} as const;

/** Coerência com o disco: o arquivo de conteúdo da u1 existe ou não existe. */
function existeArquivo(cadeira: string, arquivo: string): boolean {
  return existsSync(resolve(__dirname, '../../src/conteudo/p1', cadeira, 'u1', arquivo));
}
const filosofia = curriculo
  .find((p) => p.id === 'p1')!
  .cadeiras.find((c) => c.id === 'filosofia-juridica')!;
const u1 = filosofia.unidades.find((u) => u.id === 'u1')!;

describe('abas Mapa mental, Fichamento e Mnemônicos', () => {
  it('têm rótulo próprio, com acentuação', () => {
    expect(ROTULOS_ABA.mapa).toBe('Mapa mental');
    expect(ROTULOS_ABA.fichamento).toBe('Fichamento');
    expect(ROTULOS_ABA.mnemonicos).toBe('Mnemônicos');
  });

  it('Filosofia u1 declara as abas na ordem Resumo, Mapa, Fichamento, Mnemônicos, Quiz', () => {
    expect([...u1.abas]).toEqual(['resumo', 'mapa', 'fichamento', 'mnemonicos', 'quiz']);
  });

  it.each(['mapa', 'fichamento', 'mnemonicos'] as const)(
    'a rota /%s resolve como encontrada',
    (aba) => {
      const r = resolverRota(curriculo, `${base}/${aba}`);
      expect(r.tipo).toBe('encontrado');
      if (r.tipo === 'encontrado') expect(r.aba).toBe(aba);
    }
  );

  it.each(
    CADEIRAS_COM_ABAS_DE_ARQUIVO.flatMap((cadeira) =>
      ABAS_NOVAS.map((aba) => [cadeira, aba] as const)
    )
  )('%s/u1 / %s: a aba existe se, e só se, o arquivo existe', (cadeira, aba) => {
    const r = resolverRota(curriculo, `/p/p1/${cadeira}/u1/${aba}`);
    const abaDeclarada = r.tipo === 'encontrado' && r.aba === aba;
    expect(abaDeclarada).toBe(existeArquivo(cadeira, ARQUIVO_DA_ABA[aba]));
  });

  it('os metadados da unidade (título e descrição) acompanham as abas novas', () => {
    expect(meta.titulo).toBe(u1.titulo);
    const descricao = meta.descricao.toLowerCase();
    for (const termo of ['mapa mental', 'fichamento', 'mnemônicos', 'quiz']) {
      expect(descricao, termo).toContain(termo);
    }
  });
});

describe('aba Texto integral', () => {
  it('tem rótulo próprio, com acentuação', () => {
    expect(ROTULOS_ABA.texto).toBe('Texto integral');
  });
});
