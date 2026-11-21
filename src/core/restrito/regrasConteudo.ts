import {
  CITA_AULA_OU_SLIDE,
  CITA_LETRA,
  CITA_POSICAO,
  EXPRESSAO_ACIMA_DO_HOMEM,
  TRAVESSAO
} from '../conteudo/regrasDeTexto';
import type { ConteudoRestrito } from './tipos';

export type RegraDeConteudo = 'cita-letra-ou-posicao' | 'cita-aula-ou-slide' | 'travessao';

export interface AvisoDeConteudo {
  readonly regra: RegraDeConteudo;
  readonly caminho: string;
}

// Expressões únicas em src/core/conteudo/regrasDeTexto.ts: o motor embaralha,
// então explicação nunca aponta letra nem posição; texto ao aluno nunca cita
// aula nem slide. Não há cópia local: a regra do conteúdo público vale aqui.

/**
 * Regras de conteúdo do líder, em forma de aviso (não bloqueiam a
 * renderização, ao contrário do validador). Só devolve regra e caminho,
 * nunca o texto.
 */
export function avisosDeRegrasDeConteudo(conteudo: ConteudoRestrito): AvisoDeConteudo[] {
  const avisos: AvisoDeConteudo[] = [];
  const checar = (regra: RegraDeConteudo, ok: boolean, caminho: string): void => {
    if (ok) avisos.push({ regra, caminho });
  };
  const textoCorrido = (texto: string, caminho: string): void => {
    checar('cita-aula-ou-slide', CITA_AULA_OU_SLIDE.test(texto), caminho);
    checar('travessao', TRAVESSAO.test(texto), caminho);
  };

  conteudo.resumo.forEach((bloco, i) => {
    const base = `resumo[${i}]`;
    textoCorrido(bloco.titulo, `${base}.titulo`);
    textoCorrido(bloco.corpoHtml, `${base}.corpoHtml`);
    textoCorrido(bloco.exemploHtml, `${base}.exemploHtml`);
    bloco.resumo.forEach((item, j) => textoCorrido(item, `${base}.resumo[${j}]`));
  });
  conteudo.quiz.forEach((pergunta, i) => {
    const base = `quiz[${i}]`;
    textoCorrido(pergunta.enunciadoHtml, `${base}.enunciadoHtml`);
    textoCorrido(pergunta.explicacaoHtml, `${base}.explicacaoHtml`);
    pergunta.alternativasHtml.forEach((alt, j) =>
      textoCorrido(alt, `${base}.alternativasHtml[${j}]`)
    );
    const semAcimaDoHomem = pergunta.explicacaoHtml.replace(EXPRESSAO_ACIMA_DO_HOMEM, '');
    checar(
      'cita-letra-ou-posicao',
      CITA_LETRA.test(pergunta.explicacaoHtml) ||
        CITA_POSICAO.test(semAcimaDoHomem) ||
        CITA_LETRA.test(pergunta.enunciadoHtml),
      base
    );
  });
  conteudo.slides.forEach((slide, i) => {
    const textos = [
      slide.titulo,
      slide.subtitulo,
      slide.destaque,
      slide.notas,
      ...(slide.itens ?? [])
    ];
    for (const coluna of slide.colunas ?? []) textos.push(coluna.titulo, ...coluna.itens);
    for (const imagem of slide.imagens ?? []) textos.push(imagem.alt, imagem.legenda ?? '');
    checar(
      'travessao',
      textos.some((t) => t !== undefined && TRAVESSAO.test(t)),
      `slides[${i}]`
    );
  });
  conteudo.mapa.filhos?.forEach((filho, i) => {
    checar('travessao', TRAVESSAO.test(filho.rotulo), `mapa.filhos[${i}].rotulo`);
  });
  return avisos;
}
