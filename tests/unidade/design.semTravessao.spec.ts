import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Portão de travessão longo (em-dash, U+2014, e en-dash, U+2013): proibido
 * em texto renderizado de componente Vue, por regra geral do líder. Nasce
 * neste commit (nenhum portão de projeto cobria isto antes; buscado e não
 * achado antes de escrever este arquivo) e nasce provado vermelho: o
 * terceiro teste injeta um travessão sintético fora da exceção e prova
 * que o varredor reprova.
 *
 * Sem exceção. A exceção que existia para a linha de direitos do rodapé
 * (ordem de 22/09/2026, com travessões) foi REVOGADA pela decisão do
 * líder de 20/10/2026: "v1.0.0.0 · © 2026 Caderno de Direito. A partir de
 * 2027 vira © 2026-2027" (hífen comum, sem travessão). Travessão continua
 * proibido em todo o produto, inclusive no rodapé.
 *
 * Escopo do varredor: só o bloco <template> de cada .vue em src/ui, com
 * comentário HTML (<!-- ... -->) removido antes de comparar — é ali que
 * mora texto realmente renderizado ao leitor. Comentário de código (// e
 * /* * /) não é o alvo desta regra e não é varrido.
 */
const TRAVESSOES = ['—', '–'];

const RAIZ_UI = resolve(__dirname, '../../src/ui');

function listarArquivosVue(dir: string): string[] {
  const resultado: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    const stat = statSync(caminho);
    if (stat.isDirectory()) resultado.push(...listarArquivosVue(caminho));
    else if (entrada.endsWith('.vue')) resultado.push(caminho);
  }
  return resultado;
}

function extrairTemplateSemComentarios(conteudo: string): string | undefined {
  const match = conteudo.match(/<template>([\s\S]*)<\/template>/);
  if (!match) return undefined;
  return match[1]!.replace(/<!--[\s\S]*?-->/g, '');
}

function violacoesNoTexto(texto: string): string[] {
  const linhas = texto.split('\n');
  const achados: string[] = [];
  linhas.forEach((linha, indice) => {
    if (TRAVESSOES.some((t) => linha.includes(t))) {
      achados.push(`linha ${indice + 1}: ${linha.trim()}`);
    }
  });
  return achados;
}

describe('nenhum travessão longo (—) ou meio (–) em texto renderizado, fora da exceção declarada', () => {
  const arquivos = listarArquivosVue(RAIZ_UI);

  it('varredura não está vazia (piso de varredura, L-36)', () => {
    expect(arquivos.length).toBeGreaterThan(0);
  });

  it.each(arquivos)('%s', (caminho) => {
    const conteudo = readFileSync(caminho, 'utf-8');
    const template = extrairTemplateSemComentarios(conteudo);
    if (!template) return;

    const caminhoRelativo = relative(resolve(__dirname, '../..'), caminho).replace(/\\/g, '/');
    const violacoes = violacoesNoTexto(template);

    expect(violacoes, `travessão em ${caminhoRelativo}: ${violacoes.join('; ')}`).toEqual([]);
  });

  it('prova vermelha: o varredor REPROVA travessão fora da exceção declarada', () => {
    const textoComTravessaoForaDaExcecao = 'não é X — é Y';
    expect(violacoesNoTexto(textoComTravessaoForaDaExcecao)).not.toEqual([]);
  });
});
