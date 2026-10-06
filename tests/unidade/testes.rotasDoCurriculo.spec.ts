import { describe, expect, it } from 'vitest';
import {
  rotasDoCurriculo,
  rotasDeUnidades,
  rotasDeAbaAusente
} from '../e2e/apoio/rotasDoCurriculo';
import { curriculo } from '@/conteudo/curriculo';
import { TITULO_AREA_RESTRITA } from '@/core/restrito/titulo';
import type { Curriculo } from '@/core/curriculo/tipos';

const sintetico: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      {
        id: 'com-peticao',
        nome: 'Com Petição',
        estado: 'publicado',
        unidades: [
          {
            id: 'u1',
            rotulo: 'Unidade 1',
            titulo: 'Titulo A',
            estado: 'publicado',
            abas: ['resumo', 'peticao', 'quiz']
          }
        ]
      },
      {
        id: 'sem-peticao',
        nome: 'Sem Petição',
        estado: 'publicado',
        unidades: [
          {
            id: 'u1',
            rotulo: 'Unidade 1',
            titulo: 'Titulo B',
            estado: 'publicado',
            abas: ['resumo', 'quiz']
          },
          { id: 'u2', rotulo: 'Unidade 2', titulo: 'Futura', estado: 'em-breve', abas: [] }
        ]
      }
    ]
  },
  { id: 'p2', numero: 2, rotulo: '2º período', cadeiras: [] }
];

describe('rotasDoCurriculo', () => {
  it('monta período, cadeira e cada aba que a unidade tem, e nenhuma que ela não tem', () => {
    const caminhos = rotasDoCurriculo(sintetico).map((r) => r.caminho);
    expect(caminhos).toEqual([
      '/p/p1',
      '/p/p1/com-peticao',
      '/p/p1/com-peticao/u1',
      '/p/p1/com-peticao/u1/peticao',
      '/p/p1/com-peticao/u1/quiz',
      '/p/p1/sem-peticao',
      '/p/p1/sem-peticao/u1',
      '/p/p1/sem-peticao/u1/quiz'
    ]);
  });

  it('o h1 esperado vem do currículo: período, nome da cadeira e título da unidade', () => {
    const porCaminho = Object.fromEntries(
      rotasDoCurriculo(sintetico).map((r) => [r.caminho, r.h1])
    );
    expect(porCaminho['/p/p1']).toBe('1º período');
    expect(porCaminho['/p/p1/sem-peticao']).toBe('Sem Petição');
    expect(porCaminho['/p/p1/sem-peticao/u1/quiz']).toBe('Titulo B');
  });

  it('ignora período sem cadeira e unidade em breve', () => {
    const caminhos = rotasDoCurriculo(sintetico).map((r) => r.caminho);
    expect(caminhos.some((c) => c.startsWith('/p/p2'))).toBe(false);
    expect(caminhos.some((c) => c.includes('/u2'))).toBe(false);
  });

  it('rotasDeUnidades traz só as páginas de unidade, com nome legível para o relatório', () => {
    const rotas = rotasDeUnidades(sintetico);
    expect(rotas).toHaveLength(5);
    expect(rotas[0]!.nome).toBe('Com Petição: unidade (resumo)');
  });

  it('no currículo real, a Sociologia Jurídica aparece com resumo e quiz e sem petição', () => {
    const caminhos = rotasDoCurriculo(curriculo).map((r) => r.caminho);
    expect(caminhos).toContain('/p/p1/sociologia-juridica/u1');
    expect(caminhos).toContain('/p/p1/sociologia-juridica/u1/quiz');
    expect(caminhos).not.toContain('/p/p1/sociologia-juridica/u1/peticao');
    expect(caminhos).toContain('/p/p1/intr-direito/u1/peticao');
  });
});

describe('rotasDoCurriculo e a cadeira restrita', () => {
  const comRestrita: Curriculo = [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: [
        { id: 'secreta', nome: 'Secreta', estado: 'publicado', restrita: true, unidades: [] }
      ]
    }
  ];

  it('a cadeira restrita entra com o h1 da área restrita (não o nome da cadeira) e marcada', () => {
    const rota = rotasDoCurriculo(comRestrita).find((r) => r.caminho === '/p/p1/secreta')!;
    expect(rota.h1).toBe(TITULO_AREA_RESTRITA);
    expect(rota.restrita).toBe(true);
  });

  it('no currículo real, o Interdisciplinar está nas rotas, marcado como restrito', () => {
    const rota = rotasDoCurriculo(curriculo).find((r) => r.caminho === '/p/p1/interdisciplinar')!;
    expect(rota.h1).toBe(TITULO_AREA_RESTRITA);
    expect(rota.restrita).toBe(true);
  });

  it('rotas comuns não levam a marca de restrita', () => {
    const marcadas = rotasDoCurriculo(curriculo).filter((r) => r.restrita);
    expect(marcadas.map((r) => r.caminho)).toEqual(['/p/p1/interdisciplinar']);
  });
});

describe('rotasDeAbaAusente', () => {
  it('lista só as abas que a unidade não tem', () => {
    expect(rotasDeAbaAusente(sintetico)).toEqual(['/p/p1/sem-peticao/u1/peticao']);
  });

  it('no currículo real, as petições de Sociologia e de Filosofia Jurídica são as únicas ausências', () => {
    expect(rotasDeAbaAusente(curriculo)).toEqual([
      '/p/p1/sociologia-juridica/u1/peticao',
      '/p/p1/filosofia-juridica/u1/peticao'
    ]);
  });
});
