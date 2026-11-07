import { fileURLToPath, URL } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { definicoesDeVersao } from './vite.config';

export default mergeConfig(
  defineConfig({
    plugins: [vue()],
    define: definicoesDeVersao,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }),
  defineVitestConfig({
    test: {
      // Padrão sem DOM (L-35, seção 14 da arquitetura: unitário de core roda em
      // Node puro). Cada teste de componente declara
      // "// @vitest-environment jsdom" no topo do próprio arquivo.
      environment: 'node',
      include: [
        'tests/unidade/**/*.spec.ts',
        'tests/componente/**/*.spec.ts',
        // Caracterização (F0 da onda estrutura pronta): congela o que tem de
        // continuar idêntico durante a refatoração.
        'tests/caracterizacao/**/*.spec.ts'
      ],
      css: false,
      // Teto de workers. O padrão do vitest aqui era 15 (núcleos menos 1), acima do teto de
      // 13 threads da L-11. Medido em 07/11/2026, com a máquina em carga de 9 a 35 (outra
      // sessão compilando e geradores de carga de teste): com 15 workers a suíte completa
      // reprovou em 7 de 12 rodadas, sempre por vi.waitFor com o prazo fixo de 1000 ms
      // (MenuCurriculo.abasMapaFichamento, calendario.modal, AreaJuri); com 6, reprovou em
      // 0 de 6 rodadas e os testes instáveis caíram de 1,0-2,6 s para 0,5-1,1 s.
      // minWorkers acompanha: sem ele o pool recusa minThreads 15 > maxThreads 6 e a
      // suíte roda com zero testes (RangeError no Tinypool).
      maxWorkers: 6,
      minWorkers: 6,
      // Stub de RouterLink para os componentes (tests/apoio/setupVitest.ts).
      setupFiles: ['tests/apoio/setupVitest.ts']
    }
  })
);
