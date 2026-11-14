import { describe, expect, it } from 'vitest';
import { textoDoAviso } from '@/core/versaoNova/textoDoAviso';

/**
 * Variantes do texto do banner (AV-F2, seção 3.6 do plano, e a proposta do líder de 14/11).
 * Os textos fixos são de [PREENCHIMENTO DO AGENTE]: a ratificar pelo líder na revisão.
 */
const COM_LISTA = {
  rollback: false,
  foraDoHistorico: false,
  itens: ['Filosofia Jurídica (1º período) atualizada', 'Novo: rádio para estudar'],
  mais: 0
};

describe('textoDoAviso: nome, lista e promessa de continuidade', () => {
  it('versão completa, com nome capitalizado e a lista', () => {
    const t = textoDoAviso({
      nome: 'Ana Paula',
      resumo: COM_LISTA,
      sessaoTerminou: false,
      continuaConectado: true,
      avisoQuiz: null
    });
    expect(t.titulo).toBe('Ana Paula, o site foi atualizado.');
    expect(t.oQueMudou).toBe(
      'O que mudou: Filosofia Jurídica (1º período) atualizada; Novo: rádio para estudar.'
    );
    expect(t.acao).toBe('Recarregar a página');
    expect(t.promessa).toBe(
      'para ver a versão nova. Você volta para a página inicial e continua conectado, sem precisar digitar login e senha de novo.'
    );
  });

  it('sem nome, a variante fica sem nome', () => {
    expect(
      textoDoAviso({
        nome: '',
        resumo: COM_LISTA,
        sessaoTerminou: false,
        continuaConectado: true,
        avisoQuiz: null
      }).titulo
    ).toBe('O site foi atualizado.');
  });

  it('mais de 110 min sem confirmação: sem a frase "e continua conectado"', () => {
    const t = textoDoAviso({
      nome: 'Ana Paula',
      resumo: COM_LISTA,
      sessaoTerminou: false,
      continuaConectado: false,
      avisoQuiz: null
    });
    expect(t.promessa).not.toContain('continua conectado');
    expect(t.promessa).toContain('para ver a versão nova.');
  });

  it('rollback: não há lista', () => {
    const t = textoDoAviso({
      nome: 'Ana Paula',
      resumo: { rollback: true, foraDoHistorico: false, itens: [], mais: 0 },
      sessaoTerminou: false,
      continuaConectado: true,
      avisoQuiz: null
    });
    expect(t.oQueMudou).toBeNull();
  });

  it('mais itens: "e mais N novidades" e "e outras novidades" entram na lista', () => {
    const comMais = textoDoAviso({
      nome: 'Ana Paula',
      resumo: { ...COM_LISTA, mais: 2 },
      sessaoTerminou: false,
      continuaConectado: true,
      avisoQuiz: null
    });
    expect(comMais.oQueMudou).toContain('; e mais 2 novidades.');
    const fora = textoDoAviso({
      nome: 'Ana Paula',
      resumo: { ...COM_LISTA, foraDoHistorico: true },
      sessaoTerminou: false,
      continuaConectado: true,
      avisoQuiz: null
    });
    expect(fora.oQueMudou).toContain('; e outras novidades.');
  });
});

describe('textoDoAviso: sessão terminada e quiz de área restrita', () => {
  it('sessão terminada troca a ação por "Entrar de novo", sem prometer continuidade', () => {
    const t = textoDoAviso({
      nome: 'Ana Paula',
      resumo: COM_LISTA,
      sessaoTerminou: true,
      continuaConectado: false,
      avisoQuiz: null
    });
    expect(t.titulo).toBe('Sua sessão terminou.');
    expect(t.acao).toBe('Entrar de novo');
    expect(t.promessa).toBe('para ver a versão nova.');
  });

  it('o aviso do quiz aparece quando a área pede', () => {
    const aviso =
      'Se você estiver fazendo o quiz desta área, as respostas marcadas aqui se perdem ao recarregar.';
    expect(
      textoDoAviso({
        nome: 'Ana Paula',
        resumo: COM_LISTA,
        sessaoTerminou: false,
        continuaConectado: true,
        avisoQuiz: aviso
      }).avisoQuiz
    ).toBe(aviso);
  });
});
