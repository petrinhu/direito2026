import { describe, expect, it } from 'vitest';
import { envolverTabelas, envolverTabelasNoConteudo } from '@/ui/area-juri/tabelaRolavel';

describe('envolverTabelas: tabela da Júri dentro de quadro com rolagem própria', () => {
  it('envolve a tabela num quadro focável e deixa o resto do HTML igual', () => {
    const html = '<p>Texto.</p><table><tr><td>a</td></tr></table><p>Fim.</p>';
    expect(envolverTabelas(html)).toBe(
      '<p>Texto.</p><div class="juri-tabela-rolavel" tabindex="0" role="region" aria-label="Tabela"><table><tr><td>a</td></tr></table></div><p>Fim.</p>'
    );
  });

  it('envolve cada tabela separadamente, na ordem em que aparecem', () => {
    const html = '<table><tr><td>1</td></tr></table><p>meio</p><table><tr><td>2</td></tr></table>';
    const saida = envolverTabelas(html);
    expect(saida.match(/juri-tabela-rolavel/g)).toHaveLength(2);
    expect(saida.indexOf('<td>1</td>')).toBeLessThan(saida.indexOf('<td>2</td>'));
    expect(saida).toContain('</table></div><p>meio</p><div class="juri-tabela-rolavel"');
  });

  it('preserva atributos que a tabela já tiver', () => {
    expect(envolverTabelas('<table class="x"><tr><td>a</td></tr></table>')).toContain(
      '<table class="x"><tr><td>a</td></tr></table></div>'
    );
  });

  it('HTML sem tabela volta idêntico', () => {
    const html = '<p>Sem tabela, com <strong>ênfase</strong>.</p>';
    expect(envolverTabelas(html)).toBe(html);
  });
});

describe('envolverTabelasNoConteudo: aplica a todo texto HTML do conteúdo validado', () => {
  it('percorre objetos e listas, envolve só o que tem tabela e mantém o resto', () => {
    const entrada = {
      resumo: [{ corpoHtml: '<table><tr><td>x</td></tr></table>', titulo: 'Título' }],
      quantidade: 3,
      vazio: null
    };
    const saida = envolverTabelasNoConteudo(entrada);
    expect(saida.resumo[0]!.corpoHtml).toContain('class="juri-tabela-rolavel"');
    expect(saida.resumo[0]!.titulo).toBe('Título');
    expect(saida.quantidade).toBe(3);
    expect(saida.vazio).toBeNull();
  });

  it('não altera o objeto de entrada, que pode estar congelado ou compartilhado', () => {
    const entrada = Object.freeze({ corpoHtml: '<table><tr><td>x</td></tr></table>' });
    envolverTabelasNoConteudo(entrada);
    expect(entrada.corpoHtml).toBe('<table><tr><td>x</td></tr></table>');
  });
});
