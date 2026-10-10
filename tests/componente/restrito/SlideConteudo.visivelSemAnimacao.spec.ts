// Teste estrutural do CSS do slide: jsdom não aplica animação, então o que se
// pode provar aqui é a regra escrita. O conteúdo tem de nascer visível; a
// animação só enfeita. Sem isso, um navegador sem animação (Edge antigo, GPU
// desligada, modo de segurança) deixa o slide invisível (sintoma do líder).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonte = readFileSync('src/ui/area-restrita/SlideConteudo.vue', 'utf-8');
const estilo = fonte.slice(fonte.indexOf('<style'));

/** Regras (seletor + corpo) sem aninhamento: basta para os blocos deste arquivo. */
function regras(texto: string): { seletor: string; corpo: string }[] {
  return [...texto.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    seletor: m[1]!.trim(),
    corpo: m[2]!
  }));
}

describe('SlideConteudo: conteúdo visível sem depender da animação', () => {
  it('a animação de entrada não usa fill-mode both (que prende o estado inicial invisível)', () => {
    const usos = [...estilo.matchAll(/animation:[^;]*;/g)].map((m) => m[0]);
    expect(usos.length).toBeGreaterThan(0);
    for (const uso of usos) expect(uso).not.toMatch(/\bboth\b/);
  });

  it('a animação de entrada só existe sob prefers-reduced-motion: no-preference', () => {
    const bloco = estilo.match(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{([\s\S]*?)\n\}/
    );
    expect(bloco, 'falta o bloco no-preference').not.toBeNull();
    expect(bloco![1]).toMatch(/ar-slide-entra/);
    const foraDoBloco = estilo.replace(bloco![0], '');
    expect(foraDoBloco).not.toMatch(/animation:[^;]*ar-slide-entra/);
  });

  it('nenhuma regra base de conteúdo esconde o elemento (opacity 0 só dentro do keyframe)', () => {
    const base = regras(estilo.replace(/@keyframes[\s\S]*?\}\s*\}/, ''));
    const escondidas = base.filter((r) => /opacity:\s*0(?![.\d])/.test(r.corpo));
    expect(escondidas.map((r) => r.seletor)).toEqual([]);
  });

  it('todo background com color-mix tem antes uma declaração de fallback em rgba fixo', () => {
    const faltando: string[] = [];
    for (const r of regras(estilo)) {
      let temFallback = false;
      const semComentario = r.corpo.replace(/\/\*[\s\S]*?\*\//g, '');
      for (const decl of semComentario.split(';')) {
        const d = decl.trim();
        if (!/^background(-image)?:/.test(d)) continue;
        if (d.includes('color-mix(') && !temFallback) faltando.push(d.slice(0, 60));
        if (d.includes('rgba(') && !d.includes('color-mix(')) temFallback = true;
      }
    }
    expect(faltando).toEqual([]);
  });
});
