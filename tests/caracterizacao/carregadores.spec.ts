import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { CARREGADORES_DISPOSITIVOS } from '@/app/carregamento/carregadoresDispositivos';
import esperado from './carregadores.esperado.json';
import { chavesDasUnidadesPublicadas, resumirConteudo } from './projecoes';

/**
 * Caracterização do carregamento sob demanda (src/app/carregamento/).
 *
 * Congela: (a) as chaves dos dois registros escritos à mão; (b) para cada
 * unidade publicada, quais propriedades o ConteudoUnidade carregado tem e
 * quantos itens cada uma traz (blocos de resumo, perguntas do quiz e suas
 * categorias, seções da petição, eras/pensadores do mapa, mnemônicos).
 *
 * Depois de acrescentar conteúdo de propósito, rode `npm run atualizar-referencias`
 * e commite a referência junto. Mudança que você não pediu continua reprovando aqui.
 */
describe('carregadores: chaves congeladas', () => {
  it('CARREGADORES tem as chaves da referência', () => {
    expect(Object.keys(CARREGADORES).sort()).toEqual(esperado.chavesCarregadores);
  });

  it('CARREGADORES_DISPOSITIVOS tem as chaves da referência', () => {
    expect(Object.keys(CARREGADORES_DISPOSITIVOS).sort()).toEqual(
      esperado.chavesCarregadoresDispositivos
    );
  });
});

describe('carregadores: conteúdo de cada unidade publicada', () => {
  const chaves = chavesDasUnidadesPublicadas(curriculo);

  it('há unidades publicadas para conferir (piso contra varredura vazia)', () => {
    expect(chaves.length).toBeGreaterThan(0);
  });

  it('a referência cobre exatamente as unidades publicadas do currículo', () => {
    expect([...chaves].sort()).toEqual(Object.keys(esperado.unidades).sort());
  });

  it.each(Object.keys(esperado.unidades))('%s carrega a forma congelada', async (chave) => {
    const carregar = CARREGADORES[chave];
    expect(carregar, `carregador de ${chave}`).toBeTypeOf('function');
    const conteudo = await carregar!();
    expect(JSON.parse(JSON.stringify(resumirConteudo(conteudo)))).toEqual(
      esperado.unidades[chave as keyof typeof esperado.unidades]
    );
  });
});
