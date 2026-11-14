import { describe, expect, it } from 'vitest';
import { textoDoAviso } from '@/core/versaoNova/textoDoAviso';

/**
 * Variantes do texto do banner (AV-F2, seção 3.6 do plano; texto do líder de 14/11/2026):
 * "<Nome>, o site foi atualizado: <resumo>. [Recarregar a página] para ver a versão nova.
 * Você volta para a página inicial e continua conectado, sem precisar digitar login e senha
 * de novo." A redação do agente segue para a revisão do líder.
 */
const COM_RESUMO = {
  rollback: false,
  foraDoHistorico: false,
  itens: ['Filosofia Jurídica (1º período) atualizada', 'Novo: rádio para estudar'],
  mais: 0
};

describe('textoDoAviso: nome, resumo e promessa de continuidade', () => {
  it('versão completa: nome, dois dois pontos, resumo e a continuidade', () => {
    const t = textoDoAviso({
      nome: 'Ana Paula',
      resumo: COM_RESUMO,
      sessaoTerminou: false,
      continuaConectado: true,
      avisoQuiz: null
    });
    expect(t.frase).toBe(
      'Ana Paula, o site foi atualizado: Filosofia Jurídica (1º período) atualizada; Novo: rádio para estudar.'
    );
    expect(t.acao).toBe('Recarregar a página');
    expect(t.promessa).toBe(
      'para ver a versão nova. Você volta para a página inicial e continua conectado, sem precisar digitar login e senha de novo.'
    );
  });

  it('sem nome, a frase começa por "O site foi atualizado"', () => {
    expect(
      textoDoAviso({
        nome: '',
        resumo: COM_RESUMO,
        sessaoTerminou: false,
        continuaConectado: true,
        avisoQuiz: null
      }).frase
    ).toBe(
      'O site foi atualizado: Filosofia Jurídica (1º período) atualizada; Novo: rádio para estudar.'
    );
  });

  it('mais de 110 min sem confirmação: sem a frase "e continua conectado"', () => {
    const t = textoDoAviso({
      nome: 'Ana Paula',
      resumo: COM_RESUMO,
      sessaoTerminou: false,
      continuaConectado: false,
      avisoQuiz: null
    });
    expect(t.promessa).not.toContain('continua conectado');
    expect(t.promessa).toContain('para ver a versão nova.');
  });

  it('rollback: sem resumo, a frase fica só no "o site foi atualizado"', () => {
    const t = textoDoAviso({
      nome: 'Ana Paula',
      resumo: { rollback: true, foraDoHistorico: false, itens: [], mais: 0 },
      sessaoTerminou: false,
      continuaConectado: true,
      avisoQuiz: null
    });
    expect(t.frase).toBe('Ana Paula, o site foi atualizado.');
  });

  it('"e mais N novidades" e "e outras novidades" entram no resumo', () => {
    const comMais = textoDoAviso({
      nome: 'Ana Paula',
      resumo: { ...COM_RESUMO, mais: 2 },
      sessaoTerminou: false,
      continuaConectado: true,
      avisoQuiz: null
    });
    expect(comMais.frase).toContain('; e mais 2 novidades.');
    const fora = textoDoAviso({
      nome: 'Ana Paula',
      resumo: { ...COM_RESUMO, foraDoHistorico: true },
      sessaoTerminou: false,
      continuaConectado: true,
      avisoQuiz: null
    });
    expect(fora.frase).toContain('; e outras novidades.');
  });
});

describe('textoDoAviso: sessão terminada e quiz de área restrita', () => {
  it('sessão terminada troca a ação por "Entrar de novo", sem prometer continuidade', () => {
    const t = textoDoAviso({
      nome: 'Ana Paula',
      resumo: COM_RESUMO,
      sessaoTerminou: true,
      continuaConectado: false,
      avisoQuiz: null
    });
    expect(t.frase).toBe('Sua sessão terminou.');
    expect(t.acao).toBe('Entrar de novo');
    expect(t.promessa).toBe('para ver a versão nova.');
  });

  it('o aviso do quiz aparece quando a área pede', () => {
    const aviso =
      'Se você estiver fazendo o quiz desta área, as respostas marcadas aqui se perdem ao recarregar.';
    expect(
      textoDoAviso({
        nome: 'Ana Paula',
        resumo: COM_RESUMO,
        sessaoTerminou: false,
        continuaConectado: true,
        avisoQuiz: aviso
      }).avisoQuiz
    ).toBe(aviso);
  });
});
