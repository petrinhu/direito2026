import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';
import { extrairVariaveisHex, recortarBlocoDeSeletorTopoDeArquivo } from '@/core/design/tokens';

/**
 * Portão de contraste (achado do líder, 22/09/2026, terceira reincidência
 * da mesma classe de erro: variável pensada para fundo usada como cor de
 * texto, ou par texto/fundo colapsando no mesmo valor num tema). Lê
 * tokens.css de verdade — nunca duplica os valores à mão aqui — e reprova
 * qualquer par abaixo de 4,5:1 (WCAG AA, texto normal), nos dois temas.
 *
 * TOKENS_CSS_PATH permite apontar para uma cópia de teste (ex.: uma
 * revisão antiga, via `git show`), sem tocar no arquivo real: é assim que
 * este teste foi provado vermelho contra a versão com o bug da lateral,
 * antes de tokens.css ser corrigido.
 */
const CAMINHO_TOKENS =
  process.env.TOKENS_CSS_PATH ?? resolve(__dirname, '../../src/ui/estilos/tokens.css');

const PISO_CONTRASTE_TEXTO_NORMAL = 4.5;

function carregarTemas(): { claro: Record<string, string>; escuro: Record<string, string> } {
  const cssTexto = readFileSync(CAMINHO_TOKENS, 'utf-8');
  const blocoClaro = recortarBlocoDeSeletorTopoDeArquivo(cssTexto, ':root {');
  const blocoEscuro = recortarBlocoDeSeletorTopoDeArquivo(cssTexto, ':root[data-theme="dark"]');
  if (!blocoClaro || !blocoEscuro) {
    throw new Error('não achei os blocos :root e :root[data-theme="dark"] em ' + CAMINHO_TOKENS);
  }
  return {
    claro: extrairVariaveisHex(blocoClaro),
    escuro: extrairVariaveisHex(blocoEscuro)
  };
}

/**
 * Os pares que o desenho realmente usa (pedido explícito do líder):
 * texto sobre fundo da página, texto sobre cartão, texto sobre a lateral,
 * título sobre fundo, selo em breve, marcador de lido (sucesso), e o
 * balão (usa as mesmas variáveis de cartão).
 */
const PARES: ReadonlyArray<{ nome: string; texto: string; fundo: string }> = [
  { nome: 'texto sobre fundo da página', texto: '--cor-texto', fundo: '--cor-fundo' },
  { nome: 'texto sobre cartão', texto: '--cor-texto', fundo: '--cor-fundo-elevado' },
  { nome: 'texto sobre a lateral', texto: '--cor-sidebar-texto', fundo: '--cor-sidebar-fundo' },
  {
    nome: 'texto suave sobre a lateral',
    texto: '--cor-sidebar-texto-suave',
    fundo: '--cor-sidebar-fundo'
  },
  { nome: 'título sobre fundo', texto: '--cor-titulo-texto', fundo: '--cor-fundo' },
  { nome: 'selo em breve, tela', texto: '--cor-selo-texto', fundo: '--cor-selo-bg' },
  {
    nome: 'selo em breve, dentro da lateral',
    texto: '--cor-sidebar-selo-texto',
    fundo: '--cor-sidebar-selo-bg'
  },
  {
    nome: 'marcador de lido (sucesso)',
    texto: '--cor-sucesso-texto',
    fundo: '--cor-sucesso-bg'
  },
  // O balão de citação legal usa as mesmas variáveis do cartão (seção 12).
  { nome: 'balão de citação', texto: '--cor-texto', fundo: '--cor-fundo-elevado' },
  // Hero da home (achado do QA em produção, 22/09/2026): fica sobre o
  // FundoAnimado, sempre escuro nos dois temas, mesma classe de bug da
  // lateral, só que no <h1> em vez do fundo.
  { nome: 'hero da home', texto: '--cor-hero-texto', fundo: '--cor-sidebar-fundo' },
  // Botão primário: as duas variáveis mudam JUNTAS com o tema (não é o
  // bug da lateral, onde uma delas ficava fixa) — entra no portão mesmo
  // assim, para nunca precisar descobrir de novo por acidente.
  { nome: 'botão primário', texto: '--cor-texto-invertido', fundo: '--cor-primaria' },
  // Rodapé (ordem do líder, 22/09/2026, linha de oferecimento e linha de
  // direitos): o par já existia em uso desde a fundação, mas nunca tinha
  // entrado neste portão. A linha de oferecimento usa o par dedicado da
  // lateral, já coberto acima ('texto suave sobre a lateral').
  { nome: 'texto suave sobre fundo da página', texto: '--cor-texto-suave', fundo: '--cor-fundo' },
  // Cabeçalho (ordem do líder, 22/09/2026): trilha de navegação sobre a
  // faixa (mesmo par da lateral) e o fio de progresso dourado, que por
  // ser cor nova (não reaproveita --cor-acento, que muda com o tema)
  // entra no portão desde o nascimento.
  {
    nome: 'trilha de navegação sobre o cabeçalho',
    texto: '--cor-sidebar-texto-suave',
    fundo: '--cor-sidebar-fundo'
  },
  {
    nome: 'fio de progresso sobre o cabeçalho',
    texto: '--cor-cabecalho-progresso',
    fundo: '--cor-sidebar-fundo'
  }
];

describe('contraste dos tokens de design', () => {
  const temas = carregarTemas();

  it.each(PARES)('$nome, tema claro, no mínimo 4,5:1', ({ texto, fundo }) => {
    const corTexto = temas.claro[texto];
    const corFundo = temas.claro[fundo];
    expect(corTexto, `variável ${texto} ausente no tema claro`).toBeDefined();
    expect(corFundo, `variável ${fundo} ausente no tema claro`).toBeDefined();
    const contraste = calcularContraste(corTexto as string, corFundo as string);
    expect(contraste, `${texto} (${corTexto}) sobre ${fundo} (${corFundo})`).toBeGreaterThanOrEqual(
      PISO_CONTRASTE_TEXTO_NORMAL
    );
  });

  it.each(PARES)('$nome, tema escuro, no mínimo 4,5:1', ({ texto, fundo }) => {
    const corTexto = temas.escuro[texto];
    const corFundo = temas.escuro[fundo];
    expect(corTexto, `variável ${texto} ausente no tema escuro`).toBeDefined();
    expect(corFundo, `variável ${fundo} ausente no tema escuro`).toBeDefined();
    const contraste = calcularContraste(corTexto as string, corFundo as string);
    expect(contraste, `${texto} (${corTexto}) sobre ${fundo} (${corFundo})`).toBeGreaterThanOrEqual(
      PISO_CONTRASTE_TEXTO_NORMAL
    );
  });
});
