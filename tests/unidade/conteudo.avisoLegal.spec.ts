import { describe, expect, it } from 'vitest';
import { AVISO_LEGAL } from '@/conteudo/avisoLegal';

/**
 * Ordem do líder (20/10/2026): aviso legal no rodapé de todas as páginas,
 * com o texto APROVADO pelo líder, literal. O texto abaixo é cópia da
 * aprovação, escrita aqui à mão de propósito: importar de
 * src/conteudo/avisoLegal.ts tornaria o teste circular (passaria com
 * qualquer texto). Alterar o aviso exige alterar este teste junto, com nova
 * ordem do líder.
 */
const TEXTO_APROVADO =
  'Aviso: este site não é oficial e não tem vínculo com a instituição de ensino nem com seus professores. É um projeto pessoal, independente e gratuito, feito para apoiar os estudos da turma de Direito. O conteúdo foi preparado a partir de materiais de aula, mas a seleção, a redação e eventuais erros são de responsabilidade exclusiva do autor, e não dos professores nem da instituição. O material é oferecido como está, apenas para estudo, sem garantia de exatidão ou atualização, e não substitui as aulas, a bibliografia indicada nem orientação jurídica profissional.';

describe('AVISO_LEGAL (conteúdo editável do aviso do rodapé)', () => {
  it('monta exatamente o texto aprovado pelo líder, rótulo e corpo juntos', () => {
    expect(`${AVISO_LEGAL.rotulo} ${AVISO_LEGAL.corpo}`).toBe(TEXTO_APROVADO);
  });

  it('o rótulo é "Aviso:", em separado, para o componente pôr em negrito', () => {
    expect(AVISO_LEGAL.rotulo).toBe('Aviso:');
  });

  it('não usa travessão longo nem curto (regra do líder para texto ao usuário)', () => {
    expect(`${AVISO_LEGAL.rotulo} ${AVISO_LEGAL.corpo}`).not.toMatch(/[—–]/);
  });
});
