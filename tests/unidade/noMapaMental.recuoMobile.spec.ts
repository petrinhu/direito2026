// Recuo da lista do mapa em telas estreitas (360 px, QA): cada grupo com
// margem e padding pesa na coluna do texto do nível 6 (conceito). Os grupos de
// era e fase também precisam ceder recuo com a lista abaixo de 880px (container
// query sobre .mapa-mental__area, PD-05), como já cedem pensador e conceitos. Sem layout em jsdom, a medida real fica com o e2e
// abas-novas-mapa-estreito (QA); aqui se prova que a regra existe.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonte = readFileSync('src/ui/componentes/NoMapaMental.vue', 'utf-8');
const estilo = fonte.slice(fonte.indexOf('<style'));
const bloco = estilo.match(/@container \(max-width: 879px\) \{([\s\S]*?)\n\}\n/);

describe('lista do mapa: recuo dos níveis em tela estreita', () => {
  it('existe bloco de contêiner max-width 879px', () => {
    expect(bloco).not.toBeNull();
  });

  it.each(['era', 'fase'])(
    'o grupo de %s cede a margem (margin-inline-start: 0) com a lista abaixo de 880px',
    (tipo) => {
      expect(bloco![1]).toMatch(
        new RegExp(`\\.no-mapa--${tipo} > \\.no-mapa__grupo[^{]*\\{[^}]*margin-inline-start:\\s*0`)
      );
    }
  );
});
