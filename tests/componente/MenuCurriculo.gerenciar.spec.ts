// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Ordem do líder: "Acrescente no menu lateral a opcao de gerenciar usuarios" e
 * "retire senha de partes internas do site". O bloco da conta fica no topo da
 * barra, depois do Calendário (fora da árvore do currículo, como ele; T21).
 * Gerenciar usuários só para administrador; Trocar senha e Sair para todo logado.
 */
function curriculoMinimo(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: []
    }
  ];
}

interface OpcoesMenu {
  usuario?: string;
  admin?: boolean;
  caminhoAtual?: string;
}

function montar(opcoes: OpcoesMenu = {}, anexar = false) {
  return mount(MenuCurriculo, {
    props: {
      curriculo: curriculoMinimo(),
      caminhoAtual: opcoes.caminhoAtual ?? '',
      usuario: opcoes.usuario ?? '',
      admin: opcoes.admin ?? false
    },
    attachTo: anexar ? document.body : undefined
  });
}

describe('MenuCurriculo, bloco da conta: Gerenciar usuários', () => {
  it('administrador vê Gerenciar usuários apontando para /usuarios', () => {
    const w = montar({ usuario: 'admin-teste', admin: true });
    const link = w.find('a[href="/usuarios"]');
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe('Gerenciar usuários');
  });

  it('participante comum não vê Gerenciar usuários nem o endereço /usuarios', () => {
    const w = montar({ usuario: 'ana', admin: false });
    expect(w.find('a[href="/usuarios"]').exists()).toBe(false);
    expect(w.text()).not.toContain('Gerenciar usuários');
  });

  it('todo usuário logado vê Trocar senha (/conta) e o botão Sair, admin ou não', () => {
    for (const admin of [true, false]) {
      const w = montar({ usuario: 'ana', admin });
      expect(w.find('a[href="/conta"]').text()).toBe('Trocar senha');
      const sair = w.findAll('button').filter((b) => b.text() === 'Sair');
      expect(sair).toHaveLength(1);
    }
  });

  it('sem usuário logado, o bloco da conta não aparece', () => {
    const w = montar({ usuario: '', admin: true });
    expect(w.find('a[href="/conta"]').exists()).toBe(false);
    expect(w.find('a[href="/usuarios"]').exists()).toBe(false);
    expect(w.text()).not.toContain('Sair');
  });

  it('ordem: Calendário, Gerenciar usuários, Trocar senha, Sair, e só então o período', () => {
    const w = montar({ usuario: 'admin-teste', admin: true });
    const rotulos = w.findAll('nav a, nav button').map((el) => el.text().trim());
    expect(rotulos.slice(0, 5)).toEqual([
      'Calendário',
      'Gerenciar usuários',
      'Trocar senha',
      'Sair',
      '1º período'
    ]);
  });

  it('na rota /usuarios, o link de Gerenciar usuários recebe aria-current="page"', () => {
    const w = montar({ usuario: 'admin-teste', admin: true, caminhoAtual: 'usuarios' });
    expect(w.find('a[href="/usuarios"]').attributes('aria-current')).toBe('page');
    expect(w.find('a[href="/conta"]').attributes('aria-current')).toBeUndefined();
  });

  it('na rota /conta, o link de Trocar senha recebe aria-current="page"', () => {
    const w = montar({ usuario: 'ana', admin: false, caminhoAtual: 'conta' });
    expect(w.find('a[href="/conta"]').attributes('aria-current')).toBe('page');
  });

  it('fora dessas rotas, nenhum item do bloco tem aria-current', () => {
    const w = montar({ usuario: 'admin-teste', admin: true, caminhoAtual: '' });
    expect(w.find('a[href="/usuarios"]').attributes('aria-current')).toBeUndefined();
    expect(w.find('a[href="/conta"]').attributes('aria-current')).toBeUndefined();
  });

  it('o botão Sair emite o evento sair do menu, uma vez por clique', async () => {
    const w = montar({ usuario: 'ana', admin: false });
    const sair = w.findAll('button').find((b) => b.text() === 'Sair');
    await sair!.trigger('click');
    expect(w.emitted('sair')).toHaveLength(1);
  });

  it('o bloco da conta, com administrador, não tem violação de axe', async () => {
    const w = montar({ usuario: 'admin-teste', admin: true }, true);
    // Sem o bloco, o axe varreria um menu vazio e passaria por engano.
    expect(w.find('a[href="/usuarios"]').exists()).toBe(true);
    try {
      const resultado = await axe.run(w.find('nav').element, {
        rules: { 'color-contrast': { enabled: false } }
      });
      expect(resultado.violations.map((v) => v.id)).toEqual([]);
    } finally {
      w.unmount();
    }
  });
});
