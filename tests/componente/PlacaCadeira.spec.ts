// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PlacaCadeira from '@/ui/componentes/PlacaCadeira.vue';
import type { Cadeira, Periodo } from '@/core/curriculo/tipos';

const interdisciplinar: Cadeira = {
  id: 'interdisciplinar',
  nome: 'Interdisciplinar',
  estado: 'publicado',
  restrita: true,
  unidades: []
};

// O atalho só vira link se a cadeira de destino estiver no mesmo período.
const periodo: Periodo = {
  id: 'p1',
  numero: 1,
  rotulo: '1º período',
  cadeiras: [interdisciplinar]
};

describe('PlacaCadeira, uma placa por cadeira na página inicial', () => {
  it('cadeira pública lista suas unidades publicadas e o atalho logo depois da unidade indicada', () => {
    const cadeira: Cadeira = {
      id: 'intr-direito',
      nome: 'Introdução ao Direito',
      estado: 'publicado',
      unidades: [
        {
          id: 'u1',
          rotulo: 'Unidade 1',
          titulo: 'Resumo de estudo e quiz',
          estado: 'publicado',
          abas: ['resumo']
        }
      ],
      atalhoUnidade: { rotulo: 'Interdisciplinar', apos: 'u1', cadeiraId: 'interdisciplinar' }
    };
    const w = mount(PlacaCadeira, { props: { periodo, cadeira } });
    const linhas = w.findAll('a.linha');
    expect(linhas.map((l) => l.attributes('href'))).toEqual([
      '/p/p1/intr-direito/u1',
      '/p/p1/interdisciplinar'
    ]);
    expect(linhas[0]!.text()).toContain('Resumo de estudo e quiz');
    expect(linhas[1]!.find('svg').attributes('aria-hidden')).toBe('true');
    expect(linhas[1]!.text()).toContain('Acesso restrito');
    expect(w.classes()).not.toContain('placa--restrita');
  });

  it('cadeira restrita não lista unidade nem traz o conteúdo, só o selo e a entrada', () => {
    const cadeira: Cadeira = {
      id: 'interdisciplinar',
      nome: 'Interdisciplinar',
      estado: 'publicado',
      restrita: true,
      unidades: []
    };
    const w = mount(PlacaCadeira, { props: { periodo, cadeira } });
    expect(w.classes()).toContain('placa--restrita');
    expect(w.find('.selo').text()).toContain('Área restrita');
    expect(w.findAll('a.linha')).toHaveLength(1);
    expect(w.get('a.linha').attributes('href')).toBe('/p/p1/interdisciplinar');
  });

  it('a placa se rotula pelo nome da cadeira, ligado ao título por aria-labelledby', () => {
    const cadeira: Cadeira = {
      id: 'sociologia-juridica',
      nome: 'Sociologia Jurídica',
      estado: 'publicado',
      unidades: []
    };
    const w = mount(PlacaCadeira, { props: { periodo, cadeira } });
    const id = w.get('h3').attributes('id');
    expect(id).toBeTruthy();
    expect(w.attributes('aria-labelledby')).toBe(id);
  });
});
