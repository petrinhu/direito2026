/**
 * Tabela do conteúdo da Júri dentro de um quadro com rolagem própria. As páginas de
 * estudo trazem esse quadro na própria fonte; o conteúdo da Júri chega do acervo sem
 * ele, e a tabela então força a largura da página inteira no celular. A allowlist de
 * HTML (src/core/restrito/allowlist.ts) deixa `<table>` sem nada além do nome da tag,
 * e a validação roda antes: por isso o casamento aqui é pela tag, sem parser.
 */
const ABERTURA_DE_TABELA = /<table(\s[^>]*)?>/g;
const FECHAMENTO_DE_TABELA = /<\/table>/g;

export function envolverTabelas(html: string): string {
  return html
    .replace(
      ABERTURA_DE_TABELA,
      (_tag, atributos: string | undefined = '') =>
        `<div class="juri-tabela-rolavel" tabindex="0" role="region" aria-label="Tabela"><table${atributos}>`
    )
    .replace(FECHAMENTO_DE_TABELA, '</table></div>');
}

/**
 * Aplica `envolverTabelas` a todo texto de uma estrutura (objeto, lista ou texto), sem
 * tocar no original: o conteúdo validado pode estar congelado. Só texto com `<table` muda.
 */
export function envolverTabelasNoConteudo<T>(valor: T): T {
  if (typeof valor === 'string') {
    return (valor.includes('<table') ? envolverTabelas(valor) : valor) as T;
  }
  if (Array.isArray(valor)) {
    return valor.map((item: unknown) => envolverTabelasNoConteudo(item)) as T;
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([chave, item]: [string, unknown]) => [
        chave,
        envolverTabelasNoConteudo(item)
      ])
    ) as T;
  }
  return valor;
}
