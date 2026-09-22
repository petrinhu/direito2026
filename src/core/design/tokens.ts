/**
 * Extrai as declarações `--variavel: #hex;` de UM bloco de regra CSS (ex.:
 * o conteúdo entre as chaves de `:root { ... }`). Só reconhece valor
 * hexadecimal de 6 dígitos: sombra, transição e outros valores não-cor não
 * interessam a um verificador de contraste.
 */
export function extrairVariaveisHex(blocoCss: string): Record<string, string> {
  const variaveis: Record<string, string> = {};
  const regex = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(blocoCss)) !== null) {
    variaveis[`--${m[1]}`] = (m[2] as string).toLowerCase();
  }
  return variaveis;
}

/**
 * Recorta o conteúdo de chaves do primeiro seletor CSS que bate
 * exatamente com `seletor` no nível mais externo do arquivo (não desce em
 * @media). Usado para pegar `:root { ... }` e
 * `:root[data-theme="dark"] { ... }` de tokens.css separadamente do bloco
 * dentro de `@media (prefers-color-scheme: dark)`.
 */
export function recortarBlocoDeSeletorTopoDeArquivo(
  cssTexto: string,
  seletor: string
): string | undefined {
  const linhas = cssTexto.split('\n');
  let colchetes = 0;
  let dentroDeMedia = false;
  let capturando = false;
  let coletado: string[] = [];

  for (const linha of linhas) {
    if (!capturando) {
      if (/^@media/.test(linha.trim())) dentroDeMedia = true;
      if (dentroDeMedia) {
        if (linha.includes('}') && !linha.includes('{')) dentroDeMedia = false;
        continue;
      }
      if (linha.trim().startsWith(seletor) && linha.includes('{')) {
        capturando = true;
        colchetes = 1;
        continue;
      }
      continue;
    }
    colchetes += (linha.match(/{/g) ?? []).length;
    colchetes -= (linha.match(/}/g) ?? []).length;
    if (colchetes <= 0) break;
    coletado.push(linha);
  }

  return coletado.length > 0 ? coletado.join('\n') : undefined;
}
