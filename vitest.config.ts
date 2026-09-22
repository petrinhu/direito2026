import { fileURLToPath, URL } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default mergeConfig(
  defineConfig({
    plugins: [vue()],
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
      include: ['tests/unidade/**/*.spec.ts', 'tests/componente/**/*.spec.ts'],
      css: false
    }
  })
);
