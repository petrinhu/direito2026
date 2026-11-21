import { describe, expect, it } from 'vitest';
import { avisosDeRegrasDeConteudo } from '@/core/restrito/regrasConteudo';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso } from './apoio/conteudoRestritoFalso';

type Json = {
  resumo: Record<string, unknown>[];
  quiz: Record<string, unknown>[];
  slides: Record<string, unknown>[];
};

function avisos(mutar: (c: Json) => void): string[] {
  const c = conteudoRestritoFalso() as Json;
  mutar(c);
  const r = validarConteudoRestrito(c);
  if (!r.ok) throw new Error('fixture inválida');
  return avisosDeRegrasDeConteudo(r.conteudo).map((a) => a.regra);
}

describe('avisosDeRegrasDeConteudo', () => {
  it('conteúdo falso limpo não gera aviso', () => {
    expect(avisos(() => {})).toEqual([]);
  });

  it('explicação que cita letra de alternativa', () => {
    expect(
      avisos((c) => (c.quiz[0]!.explicacaoHtml = '<p>A alternativa B está certa.</p>'))
    ).toContain('cita-letra-ou-posicao');
    expect(avisos((c) => (c.quiz[0]!.explicacaoHtml = '<p>Veja a resposta acima.</p>'))).toContain(
      'cita-letra-ou-posicao'
    );
  });

  // CITA-LETRA-UNICODE: gêmeo da regra de conteudo (validarCitacaoDeAlternativa).
  // \b ASCII deixava passar "última alternativa" e barrava "e a Bíblia".
  it('explicação que cita posição com acento ("última alternativa") ou letra', () => {
    expect(
      avisos((c) => (c.quiz[0]!.explicacaoHtml = '<p>Confira a última alternativa.</p>'))
    ).toContain('cita-letra-ou-posicao');
    expect(
      avisos((c) => (c.quiz[0]!.explicacaoHtml = '<p>A Primeira opção é a certa.</p>'))
    ).toContain('cita-letra-ou-posicao');
    expect(avisos((c) => (c.quiz[0]!.explicacaoHtml = '<p>Resposta: letra B.</p>'))).toContain(
      'cita-letra-ou-posicao'
    );
  });

  it('não avisa palavra que só começa como letra ("e a Bíblia", "a lei B")', () => {
    expect(
      avisos((c) => (c.quiz[0]!.explicacaoHtml = '<p>A lei é clara, e a Bíblia diz o mesmo.</p>'))
    ).toEqual([]);
    expect(
      avisos((c) => (c.quiz[0]!.explicacaoHtml = '<p>Conforme a lei B do estatuto.</p>'))
    ).toEqual([]);
  });

  it('texto que cita aula ou slide', () => {
    expect(avisos((c) => (c.resumo[0]!.corpoHtml = '<p>Como visto na aula 3.</p>'))).toContain(
      'cita-aula-ou-slide'
    );
    expect(avisos((c) => (c.quiz[2]!.enunciadoHtml = '<p>No slide dois.</p>'))).toContain(
      'cita-aula-ou-slide'
    );
  });

  it('travessão em slide', () => {
    expect(avisos((c) => (c.slides[3]!.destaque = 'a \u2014 b'))).toContain('travessao');
  });

  it('a palavra slide dentro de um slide não é citação de aula', () => {
    expect(avisos((c) => (c.slides[1]!.titulo = 'Próximos slides do grupo'))).toEqual([]);
  });

  it('travessão e meia-risca', () => {
    expect(avisos((c) => (c.resumo[0]!.titulo = 'a — b'))).toContain('travessao');
    expect(avisos((c) => (c.resumo[0]!.titulo = 'a – b'))).toContain('travessao');
  });
});
