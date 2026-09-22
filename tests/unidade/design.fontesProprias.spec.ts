import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

/**
 * Item 5 da onda (pendência, não a especificação do modo adaptado): o site
 * usava só a pilha de fontes do sistema; docs/design-visual.md já pedia
 * Lora/Inter "hospedada no próprio site". As duas fontes já vinham como
 * devDependency (@fontsource/lora, @fontsource-variable/inter) — este
 * teste prova que os arquivos recortados existem, ficam dentro do teto de
 * scripts/verificar-fontes.sh (60KB) e que os tokens realmente os usam
 * (nunca só a pilha de sistema).
 *
 * Fonte moram em src/ui/estilos/fontes/ (não public/assets/fontes/) desde
 * o achado do líder, medido no site já publicado, 22/09/2026: em public/
 * o Vite copia o arquivo cru, com nome fixo, e public/.htaccess marca
 * .woff2 como cache imutável de um ano - nome fixo + cache imutável é
 * inseguro (quem já tinha a versão quebrada em cache não recebia o
 * conserto). Em src/, referenciado por caminho relativo em fontes.css, o
 * Vite processa como asset e dá ao arquivo final um nome com hash do
 * conteúdo (scripts/verificar-cache-fingerprint.ts é o portão que prova
 * isso para o pacote inteiro, não só fontes).
 */
const RAIZ = resolve(__dirname, '../..');
const TETO_BYTES = 60 * 1024;

const ARQUIVOS_ESPERADOS = [
  'src/ui/estilos/fontes/inter-400.woff2',
  'src/ui/estilos/fontes/inter-500.woff2',
  'src/ui/estilos/fontes/inter-700.woff2',
  'src/ui/estilos/fontes/lora-700.woff2'
];

describe('fontes próprias (Lora/Inter), self-hosted, sem CDN', () => {
  it.each(ARQUIVOS_ESPERADOS)('%s existe e fica abaixo de 60KB', (caminhoRelativo) => {
    const caminho = resolve(RAIZ, caminhoRelativo);
    expect(existsSync(caminho), `arquivo ausente: ${caminho}`).toBe(true);
    const tamanho = statSync(caminho).size;
    expect(tamanho).toBeLessThanOrEqual(TETO_BYTES);
  });

  it('fontes.css não referencia nenhuma origem externa (CDN), e usa caminho relativo (processado pelo Vite, com hash)', () => {
    const css = readFileSync(resolve(RAIZ, 'src/ui/estilos/fontes.css'), 'utf-8');
    expect(css).not.toMatch(/https?:\/\//);
    expect(css).toMatch(/url\('\.\/fontes\/inter-400\.woff2'\)/);
    expect(css).toMatch(/url\('\.\/fontes\/lora-700\.woff2'\)/);
  });

  it('tokens.css usa Lora/Inter como fonte primária (não só a pilha de sistema)', () => {
    const css = readFileSync(resolve(RAIZ, 'src/ui/estilos/tokens.css'), 'utf-8');
    expect(css).toMatch(/--fonte-titulo:\s*'Lora'/);
    expect(css).toMatch(/--fonte-texto:\s*'Inter'/);
  });

  it('main.ts importa fontes.css', () => {
    const main = readFileSync(resolve(RAIZ, 'src/main.ts'), 'utf-8');
    expect(main).toMatch(/@\/ui\/estilos\/fontes\.css/);
  });

  /**
   * Achado do líder, 22/09/2026, verbatim: "O 'A' maiúsculo está muito
   * maior no texto que as outras maiúsculas." Causa medida: os quatro
   * arquivos recortados tinham 129 glifos, dos quais só a letra "A"
   * maiúscula - zero minúsculas, zero dígitos. Os testes acima (existe,
   * abaixo de 60KB) já passavam com o recorte quebrado; nenhum deles
   * conferia o CONTEÚDO da fonte. scripts/verificar-fontes-glifos.py
   * fecha esse buraco (lê com fontTools, exige o conjunto mínimo: 26
   * maiúsculas, 26 minúsculas, dígitos, acentuação pt-br) - chamado
   * aqui via subprocesso para dar o mesmo sinal rápido de
   * `npm run test:unit`, sem esperar `npm run build`.
   */
  it('cada fonte recortada tem o conjunto mínimo de glifos (maiúsculas, minúsculas, dígitos, acentuação)', () => {
    const resultado = spawnSync(
      'python3',
      [resolve(RAIZ, 'scripts/verificar-fontes-glifos.py'), resolve(RAIZ, 'src/ui/estilos/fontes')],
      { encoding: 'utf-8' }
    );
    expect(
      resultado.status,
      `saída do verificador:\n${resultado.stdout}\n${resultado.stderr}`
    ).toBe(0);
  });
});
