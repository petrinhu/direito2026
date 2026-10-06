/**
 * Roda, sobre o JSON restrito PRIVADO, o mesmo validador que o navegador
 * roda antes de renderizar (src/core/restrito/validar.ts). Imprime só
 * contagens, códigos de erro e caminhos estruturais (ex.: quiz[3].correta):
 * nunca o texto do conteúdo.
 *
 * Uso: node --import tsx scripts/validar-conteudo-restrito.ts <caminho-do-json>
 * Saída 0 só se o JSON é válido. Falha fechada: sem argumento, arquivo
 * ilegível ou JSON malformado também saem 1.
 */
import { readFileSync } from 'node:fs';
import { avisosDeRegrasDeConteudo } from '../src/core/restrito/regrasConteudo';
import { validarConteudoRestrito } from '../src/core/restrito/validar';

function contar<T extends string>(itens: readonly T[]): string {
  const total = new Map<T, number>();
  for (const item of itens) total.set(item, (total.get(item) ?? 0) + 1);
  return [...total].map(([k, v]) => `${k}=${v}`).join(' ') || 'nenhum';
}

function principal(): number {
  const caminho = process.argv[2];
  if (!caminho) {
    console.error('validar-conteudo-restrito: informe o caminho do JSON');
    return 1;
  }
  let bruto: unknown;
  try {
    bruto = JSON.parse(readFileSync(caminho, 'utf-8'));
  } catch {
    console.error('validar-conteudo-restrito: arquivo ausente, ilegível ou JSON malformado');
    return 1;
  }

  const resultado = validarConteudoRestrito(bruto);
  if (!resultado.ok) {
    console.error(`validar-conteudo-restrito: INVÁLIDO, erros=${resultado.erros.length}`);
    console.error(`códigos: ${contar(resultado.erros.map((e) => e.codigo))}`);
    for (const erro of resultado.erros) console.error(`  ${erro.codigo} em ${erro.caminho}`);
    return 1;
  }

  const c = resultado.conteudo;
  const nos = (no: { filhos?: readonly unknown[] }): number =>
    1 +
    (no.filhos ?? []).reduce<number>((s, f) => s + nos(f as { filhos?: readonly unknown[] }), 0);
  console.log(
    `validar-conteudo-restrito: VÁLIDO / blocos: ${c.resumo.length} / perguntas: ${c.quiz.length} / nós do mapa: ${nos(c.mapa)} / integrantes: ${c.equipe.integrantes.length}`
  );

  const avisos = avisosDeRegrasDeConteudo(c);
  console.log(
    `avisos de regra de conteúdo: ${avisos.length} (${contar(avisos.map((a) => a.regra))})`
  );
  for (const aviso of avisos) console.log(`  ${aviso.regra} em ${aviso.caminho}`);
  return avisos.length > 0 ? 1 : 0;
}

process.exitCode = principal();
