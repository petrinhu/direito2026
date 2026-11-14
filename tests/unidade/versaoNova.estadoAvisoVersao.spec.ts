import { describe, expect, it } from 'vitest';
import {
  aoClicarRecarregar,
  CHAVE_DISPENSADA,
  CHAVE_RECARREGOU_PARA,
  continuaConectado,
  decidirEstadoAviso
} from '@/app/versaoNova/estadoAvisoVersao';
import { LIMITE_CONTINUA_CONECTADO_MIN } from '@/core/versaoNova/limites';

/**
 * AV-F7: estado do banner. Mostra só versão diferente da aba, não dispensada e sem laço
 * (plano 3.5 e pedido do líder: fechar guarda a versão dispensada). Clique faz UMA
 * consulta antes de navegar: 200 navega; 401/403 vira "sessão terminou" sem navegar;
 * rede navega do mesmo jeito.
 */
const MINUTO = 60_000;

describe('decidirEstadoAviso', () => {
  it('oculto sem resultado ou com sem informação', () => {
    const base = { daAba: '1.12.0.0', dispensadaPara: null, recarregouPara: null };
    expect(decidirEstadoAviso({ ...base, resultado: null })).toEqual({ tipo: 'oculto' });
    expect(decidirEstadoAviso({ ...base, resultado: { tipo: 'sem-informacao' } })).toEqual({ tipo: 'oculto' });
  });

  it('versão diferente da aba mostra o aviso com a publicada', () => {
    const estado = decidirEstadoAviso({
      daAba: '1.12.0.0',
      resultado: { tipo: 'publicada', versao: '1.12.1.0', historico: [] },
      dispensadaPara: null,
      recarregouPara: null
    });
    expect(estado).toEqual({ tipo: 'versao-nova', publicada: '1.12.1.0' });
  });

  it('versão igual à da aba não mostra', () => {
    expect(
      decidirEstadoAviso({
        daAba: '1.12.1.0',
        resultado: { tipo: 'publicada', versao: '1.12.1.0', historico: [] },
        dispensadaPara: null,
        recarregouPara: null
      })
    ).toEqual({ tipo: 'oculto' });
  });

  it('versão dispensada não volta, mas uma publicada nova volta', () => {
    const publicada = { tipo: 'publicada' as const, versao: '1.12.1.0', historico: [] };
    expect(
      decidirEstadoAviso({ daAba: '1.12.0.0', resultado: publicada, dispensadaPara: '1.12.1.0', recarregouPara: null })
    ).toEqual({ tipo: 'oculto' });
    expect(
      decidirEstadoAviso({
        daAba: '1.12.0.0',
        resultado: { ...publicada, versao: '1.12.2.0' },
        dispensadaPara: '1.12.1.0',
        recarregouPara: null
      })
    ).toEqual({ tipo: 'versao-nova', publicada: '1.12.2.0' });
  });

  it('anti-laço: já recarregou para esta publicada e a aba continua diferente, não mostra', () => {
    expect(
      decidirEstadoAviso({
        daAba: '1.12.0.0',
        resultado: { tipo: 'publicada', versao: '1.12.1.0', historico: [] },
        dispensadaPara: null,
        recarregouPara: '1.12.1.0'
      })
    ).toEqual({ tipo: 'oculto' });
  });

  it('sessão terminada na consulta do vigia esconde o banner', () => {
    expect(
      decidirEstadoAviso({
        daAba: '1.12.0.0',
        resultado: { tipo: 'sessao-terminada' },
        dispensadaPara: null,
        recarregouPara: null
      })
    ).toEqual({ tipo: 'oculto' });
  });
});

describe('continuaConectado', () => {
  it('sem confirmação registrada não promete continuidade', () => {
    expect(continuaConectado(null, 1_000)).toBe(false);
  });

  it('confirmação dentro do limite (110 min) mantém a frase', () => {
    const agora = 10_000_000_000;
    expect(continuaConectado(agora - (LIMITE_CONTINUA_CONECTADO_MIN - 1) * MINUTO, agora)).toBe(true);
  });

  it('confirmação além do limite tira a frase', () => {
    const agora = 10_000_000_000;
    expect(continuaConectado(agora - (LIMITE_CONTINUA_CONECTADO_MIN + 1) * MINUTO, agora)).toBe(false);
  });
});

function armazenamentoFalso(inicial: Record<string, string> = {}) {
  const dados = { ...inicial };
  return {
    lerChave: (chave: string) => dados[chave] ?? null,
    gravarChave: (chave: string, valor: string) => {
      dados[chave] = valor;
    },
    dados
  };
}

describe('aoClicarRecarregar', () => {
  it('200: marca a versão antes de navegar e navega para a Home', async () => {
    const armazenamento = armazenamentoFalso();
    const ordem: string[] = [];
    const resultado = await aoClicarRecarregar({
      versaoPublicada: '1.12.1.0',
      consultar: async () => {
        ordem.push('consulta');
        return { tipo: 'publicada', versao: '1.12.1.0', historico: [] };
      },
      marcarRecarregouPara: (versao) => {
        ordem.push('marca');
        armazenamento.gravarChave(CHAVE_RECARREGOU_PARA, versao);
      },
      navegar: () => ordem.push('navega')
    });
    expect(resultado).toBe('navegou');
    expect(ordem).toEqual(['consulta', 'marca', 'navega']);
    expect(armazenamento.dados[CHAVE_RECARREGOU_PARA]).toBe('1.12.1.0');
  });

  it('401 ou 403: não navega e devolve sessão terminada', async () => {
    for (const tipo of [401, 403]) {
      let navegou = false;
      const resultado = await aoClicarRecarregar({
        versaoPublicada: '1.12.1.0',
        consultar: async () => ({ tipo: 'sessao-terminada' }),
        marcarRecarregouPara: () => undefined,
        navegar: () => (navegou = true)
      });
      expect(resultado, `status ${tipo}`).toBe('sessao-terminada');
      expect(navegou).toBe(false);
    }
  });

  it('rede caindo na consulta navega do mesmo jeito', async () => {
    let navegou = false;
    const resultado = await aoClicarRecarregar({
      versaoPublicada: '1.12.1.0',
      consultar: async () => {
        throw new TypeError('Failed to fetch');
      },
      marcarRecarregouPara: () => undefined,
      navegar: () => (navegou = true)
    });
    expect(resultado).toBe('navegou');
    expect(navegou).toBe(true);
  });
});

it('as chaves de sessionStorage seguem o plano', () => {
  expect(CHAVE_DISPENSADA).toBe('caderno-direito:aviso-versao:dispensada');
  expect(CHAVE_RECARREGOU_PARA).toBe('caderno-direito:aviso-versao:recarregou-para');
});
