import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';
import { extrairVariaveisHex, recortarBlocoDeSeletorTopoDeArquivo } from '@/core/design/tokens';

/**
 * AV-F8 (plano 3.6 e pedido do líder, 14/11): o banner de versão nova é semitransparente
 * e fica por cima do conteúdo. Por isso o contraste é medido com a cor do banner COMPOSTA
 * sobre os dois extremos de fundo de página (branco e preto), não sobre o token sozinho
 * (L-17: fundo real do elemento). Quatro blocos de tokens.css: claro, escuro por
 * preferência, escuro por escolha e modo adaptado (que só redefine parte dos tokens; o que
 * faltar cai em :root).
 */
const CAMINHO_TOKENS = resolve(__dirname, '../../src/ui/estilos/tokens.css');
const PISO_TEXTO = 4.5;
const PISO_NAO_TEXTO = 3;
const TOKENS_COR = [
  '--cor-aviso-versao-fundo',
  '--cor-aviso-versao-texto',
  '--cor-aviso-versao-foco'
];

const SELETORES = {
  claro: ':root {',
  escuroSistema: ':root:not([data-theme="light"])',
  escuroEscolha: ':root[data-theme="dark"]',
  modoAdaptado: ':root[data-modo-adaptado="on"]'
} as const;

function lerBlocos(): Record<keyof typeof SELETORES, string> {
  const css = readFileSync(CAMINHO_TOKENS, 'utf-8');
  const blocos = {} as Record<keyof typeof SELETORES, string>;
  for (const [nome, seletor] of Object.entries(SELETORES) as Array<
    [keyof typeof SELETORES, string]
  >) {
    const bloco =
      seletor === SELETORES.escuroSistema
        ? recortarDentroDeMedia(css, seletor)
        : recortarBlocoDeSeletorTopoDeArquivo(css, seletor);
    if (bloco === undefined) throw new Error(`não achei o bloco ${seletor} em tokens.css`);
    blocos[nome] = bloco;
  }
  return blocos;
}

/** O bloco do escuro por preferência fica dentro de @media (prefers-color-scheme: dark). */
function recortarDentroDeMedia(css: string, seletor: string): string | undefined {
  const inicio = css.indexOf(`${seletor} {`);
  if (inicio < 0) return undefined;
  const abre = css.indexOf('{', inicio);
  let profundidade = 0;
  for (let i = abre; i < css.length; i++) {
    if (css[i] === '{') profundidade++;
    if (css[i] === '}') {
      profundidade--;
      if (profundidade === 0) return css.slice(abre + 1, i);
    }
  }
  return undefined;
}

function valorResolvido(
  blocos: Record<keyof typeof SELETORES, string>,
  nome: keyof typeof SELETORES,
  token: string
): string | undefined {
  const proprio = extrairVariaveisHex(blocos[nome])[token];
  if (proprio !== undefined) return proprio;
  return extrairVariaveisHex(blocos.claro)[token];
}

function opacidade(
  blocos: Record<keyof typeof SELETORES, string>,
  nome: keyof typeof SELETORES
): number | undefined {
  const lido = (bloco: string) => /--opacidade-aviso-versao\s*:\s*([0-9.]+)\s*;/.exec(bloco)?.[1];
  const valor = lido(blocos[nome]) ?? lido(blocos.claro);
  return valor === undefined ? undefined : Number(valor);
}

/** Cor do banner (hex com alpha) composta sobre uma cor de página, por canal. */
function comporSobre(fundoHex: string, alfa: number, paginaHex: string): string {
  const canais = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const f = canais(fundoHex);
  const p = canais(paginaHex);
  const misto = f.map((c, i) => Math.round(alfa * c + (1 - alfa) * p[i]!));
  return '#' + misto.map((c) => c.toString(16).padStart(2, '0')).join('');
}

const EXTREMOS_DE_PAGINA = ['#ffffff', '#000000'] as const;

describe('contraste do aviso de versão nova (AV-F8)', () => {
  const blocos = lerBlocos();

  for (const nome of Object.keys(SELETORES) as Array<keyof typeof SELETORES>) {
    describe(`bloco ${nome}`, () => {
      it('define os três tokens de cor e a opacidade', () => {
        for (const token of TOKENS_COR) {
          expect(valorResolvido(blocos, nome, token), `${token} em ${nome}`).toBeDefined();
        }
        expect(opacidade(blocos, nome), `opacidade em ${nome}`).toBeGreaterThan(0);
      });

      it('texto e link passam de 4,5:1 contra o fundo composto nos dois extremos da página', () => {
        const fundo = valorResolvido(blocos, nome, '--cor-aviso-versao-fundo')!;
        const texto = valorResolvido(blocos, nome, '--cor-aviso-versao-texto')!;
        const alfa = opacidade(blocos, nome)!;
        for (const pagina of EXTREMOS_DE_PAGINA) {
          const efetivo = comporSobre(fundo, alfa, pagina);
          expect(
            calcularContraste(texto, efetivo),
            `texto sobre ${efetivo} (página ${pagina})`
          ).toBeGreaterThanOrEqual(PISO_TEXTO);
        }
      });

      it('contorno de foco passa de 3:1 contra o fundo composto', () => {
        const fundo = valorResolvido(blocos, nome, '--cor-aviso-versao-fundo')!;
        const foco = valorResolvido(blocos, nome, '--cor-aviso-versao-foco')!;
        const alfa = opacidade(blocos, nome)!;
        for (const pagina of EXTREMOS_DE_PAGINA) {
          const efetivo = comporSobre(fundo, alfa, pagina);
          expect(calcularContraste(foco, efetivo), `foco sobre ${efetivo}`).toBeGreaterThanOrEqual(
            PISO_NAO_TEXTO
          );
        }
      });
    });
  }

  it('o escuro por preferência e o escuro por escolha têm os mesmos valores do banner', () => {
    for (const token of TOKENS_COR) {
      expect(valorResolvido(blocos, 'escuroSistema', token)).toBe(
        valorResolvido(blocos, 'escuroEscolha', token)
      );
    }
    expect(opacidade(blocos, 'escuroSistema')).toBe(opacidade(blocos, 'escuroEscolha'));
  });
});
