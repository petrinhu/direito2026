import { describe, expect, it } from 'vitest';
import { planejar } from '../../scripts/apoio/preciSeletivo';

/**
 * PRECI-SELETIVO: a classificação dos arquivos mudados decide quais passos seletivos do preci
 * rodam. Cada caso fixa uma decisão que, se errar, ou deixa de checar algo que a mudança tocou
 * (afrouxa o portão), ou roda à toa. Os passos de segurança (cifra, partição, travessão, build,
 * varreduras do dist) não passam por aqui: rodam sempre.
 */

const CARACTERIZACAO = [
  'tests/caracterizacao/curriculo.spec.ts',
  'tests/caracterizacao/indiceBusca.spec.ts'
];
const existeTudo = () => true;

describe('planejar (classificação do preci seletivo)', () => {
  it('só CSS: lint e prettier só no CSS, vitest pulado, vue-tsc roda por estar em src/', () => {
    const p = planejar(['src/ui/tema/tokens.css'], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(false);
    expect(p.passos.lint).toMatchObject({ roda: false, alvo: null });
    expect(p.passos.prettier).toMatchObject({ roda: true, alvo: ['src/ui/tema/tokens.css'] });
    expect(p.passos.vitest).toMatchObject({ roda: false, alvo: null });
    expect(p.passos.vueTsc.roda).toBe(true);
    expect(p.passos.conteudo.roda).toBe(false);
    expect(p.passos.php.roda).toBe(false);
    expect(p.passos.php.motivo).toBe(
      'pulado: nada em servidor/, public/api/ ou public/.htaccess mudou'
    );
  });

  it('só conteúdo: roda validação, citações e R3 da fonte; vitest inclui tests/caracterizacao inteira', () => {
    const arquivo = 'src/conteudo/p1/intr-direito/u1/resumo.ts';
    const p = planejar([arquivo], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(false);
    expect(p.passos.conteudo.roda).toBe(true);
    expect(p.passos.lint).toMatchObject({ roda: true, alvo: [arquivo] });
    expect(p.passos.vueTsc.roda).toBe(true);
    expect(p.passos.depcruise.roda).toBe(true);
    expect(p.passos.php.roda).toBe(false);
    const alvo = p.passos.vitest.alvo as string[];
    expect(p.passos.vitest.roda).toBe(true);
    expect(alvo).toEqual(expect.arrayContaining([arquivo, ...CARACTERIZACAO]));
    expect(new Set(alvo).size).toBe(alvo.length);
  });

  it('servidor: só a suíte PHP roda; o resto dos seletivos fica pulado', () => {
    const p = planejar(['servidor/api/portao.php'], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(false);
    expect(p.passos.php.roda).toBe(true);
    expect(p.passos.lint.roda).toBe(false);
    expect(p.passos.prettier.roda).toBe(false);
    expect(p.passos.vueTsc.roda).toBe(false);
    expect(p.passos.depcruise.roda).toBe(false);
    expect(p.passos.vitest.roda).toBe(false);
    expect(p.passos.conteudo.roda).toBe(false);
  });

  it('scripts/ muda: completo, com o motivo nomeando o arquivo', () => {
    const p = planejar(['scripts/preci.sh'], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(true);
    expect(p.motivo).toContain('scripts/preci.sh');
    for (const passo of Object.values(p.passos)) {
      expect(passo.roda).toBe(true);
      expect(passo.alvo).toBe('todos');
    }
  });

  it('lista vazia: nenhum seletivo roda, sem completo', () => {
    const p = planejar([], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(false);
    for (const passo of Object.values(p.passos)) {
      expect(passo.roda).toBe(false);
    }
  });

  it('completo sem seleção: sem tag base, ou PRECI_COMPLETO=1, ou gatilho de config/teste compartilhado', () => {
    expect(planejar(['src/ui/x.css'], { base: null, existe: existeTudo }).completo).toBe(true);
    expect(
      planejar(['src/ui/x.css'], { base: 'v1.18.3.0', completoForcado: true, existe: existeTudo })
        .completo
    ).toBe(true);
    for (const gatilho of [
      'package.json',
      'package-lock.json',
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.portao.config.ts',
      'tsconfig.app.json',
      '.dependency-cruiser.cjs',
      'tests/apoio/setupVitest.ts'
    ]) {
      expect(planejar([gatilho], { base: 'v1.18.3.0', existe: existeTudo }).completo, gatilho).toBe(
        true
      );
    }
  });

  it('arquivo apagado conta para a classificação, mas não entra no lint nem no vitest', () => {
    const apagado = 'src/conteudo/p1/x/u1/resumo.ts';
    const p = planejar([apagado], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: (caminho) => caminho !== apagado
    });

    expect(p.passos.conteudo.roda).toBe(true);
    expect(p.passos.lint.roda).toBe(false);
    expect(p.passos.vitest.alvo).toEqual(CARACTERIZACAO);
  });
});
