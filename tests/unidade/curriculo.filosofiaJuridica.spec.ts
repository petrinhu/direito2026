import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { resolverRota } from '@/core/curriculo/resolverRota';
import { meta } from '@/conteudo/p1/filosofia-juridica/u1/meta';
import { resumo } from '@/conteudo/p1/filosofia-juridica/u1/resumo';

const periodo1 = curriculo.find((p) => p.id === 'p1')!;
const filosofia = periodo1.cadeiras.find((c) => c.id === 'filosofia-juridica');

describe('currículo: Filosofia Jurídica, 1a unidade', () => {
  it('a cadeira entra no 1º período com o nome dela, como quarta publicada', () => {
    expect(filosofia?.nome).toBe('Filosofia Jurídica');
    expect(filosofia?.estado).toBe('publicado');
    expect(periodo1.cadeiras.filter((c) => c.estado === 'publicado')).toHaveLength(4);
  });

  it('tem só duas abas, resumo e quiz, e o título não fala de petição', () => {
    const u1 = filosofia!.unidades.find((u) => u.id === 'u1')!;
    expect([...u1.abas]).toEqual(['resumo', 'quiz']);
    expect(u1.titulo.toLowerCase()).not.toContain('peti');
  });

  it('resumo e quiz resolvem como encontrados; a aba de petição não existe', () => {
    const base = '/p/p1/filosofia-juridica/u1';
    expect(resolverRota(curriculo, base).tipo).toBe('encontrado');
    expect(resolverRota(curriculo, `${base}/quiz`).tipo).toBe('encontrado');
    expect(resolverRota(curriculo, `${base}/peticao`).tipo).not.toBe('encontrado');
  });
});

describe('resumo de Filosofia Jurídica', () => {
  it('numera os blocos de 1 a N, com id único e tudo preenchido', () => {
    expect(resumo.length).toBeGreaterThanOrEqual(10);
    expect(resumo.map((b) => b.numero)).toEqual(resumo.map((_, i) => i + 1));
    expect(new Set(resumo.map((b) => b.id)).size).toBe(resumo.length);
    for (const b of resumo) {
      expect(b.titulo.trim(), b.id).not.toBe('');
      expect(b.fonte.trim(), b.id).not.toBe('');
      expect(b.corpoHtml.trim(), b.id).not.toBe('');
      expect(b.exemploHtml.trim(), b.id).not.toBe('');
      expect(b.resumo.length, b.id).toBeGreaterThan(0);
    }
  });

  it('cobre os temas da unidade e o quadro comparativo', () => {
    const titulos = resumo.map((b) => b.titulo).join(' | ');
    for (const tema of [
      'Antígona',
      'sofistas',
      'Sócrates',
      'Platão',
      'Aristóteles',
      'Cícero',
      'Agostinho',
      'Tomás',
      'Quadro comparativo'
    ]) {
      expect(titulos.toLowerCase(), tema).toContain(tema.toLowerCase());
    }
  });

  it('fica fora do escopo decidido: aula de retórica e Big Techs não entram', () => {
    const tudo = JSON.stringify(resumo).toLowerCase() + meta.descricao.toLowerCase();
    expect(tudo).not.toContain('big tech');
    for (const termo of ['cânones', 'kairos', 'ethos', 'pathos']) expect(tudo).not.toContain(termo);
  });

  it('não cita dispositivo de lei nem usa travessão, e não diz que autor errou', () => {
    const tudo = JSON.stringify(resumo) + JSON.stringify(meta);
    expect(tudo).not.toContain('data-dispositivo');
    expect(tudo).not.toMatch(/[–—]/);
    expect(tudo.toLowerCase()).not.toMatch(/\b(errou|erro do|equivocou-se)\b/);
  });
});
