// @ts-check
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

// Globais escritos à mão (sem instalar o pacote "globals", fora da lista
// autorizada do plano, seção 16): só os identificadores que o código
// realmente usa, levantados por grep antes de escrever esta lista.
const GLOBAIS_NAVEGADOR = {
  window: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  Storage: 'readonly',
  DOMException: 'readonly',
  IntersectionObserver: 'readonly',
  HTMLElement: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLCanvasElement: 'readonly',
  CanvasRenderingContext2D: 'readonly',
  KeyboardEvent: 'readonly',
  MouseEvent: 'readonly',
  PointerEvent: 'readonly',
  FocusEvent: 'readonly',
  Event: 'readonly',
  EventTarget: 'readonly',
  CSS: 'readonly',
  matchMedia: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  fetch: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  getComputedStyle: 'readonly',
  navigator: 'readonly'
};

const GLOBAIS_COMUNS = {
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly'
};

const GLOBAIS_NODE = {
  process: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly'
};

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', '.dependency-cruiser.cjs']
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module' },
      globals: { ...GLOBAIS_COMUNS, ...GLOBAIS_NAVEGADOR }
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'error'
    }
  },
  {
    files: ['scripts/**/*.ts', 'tests/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      // Testes e scripts rodam em Node: precisam dos globais de Node além
      // dos de navegador (ex.: process.env para apontar um caminho de
      // teste, __dirname para resolver um arquivo local).
      globals: { ...GLOBAIS_COMUNS, ...GLOBAIS_NAVEGADOR, ...GLOBAIS_NODE }
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsParser, sourceType: 'module' },
      globals: { ...GLOBAIS_COMUNS, ...GLOBAIS_NAVEGADOR }
    },
    plugins: { vue, '@typescript-eslint': tseslint },
    rules: {
      ...vue.configs['flat/recommended'].rules,
      // v-html é permitido de propósito (seção 4.4 da arquitetura), mas a
      // regra "só recebe valor vindo de src/conteudo" é conferida pelo
      // script scripts/verificar-v-html.sh, não por este linter: ESLint
      // não distingue a ORIGEM do dado, só a sintaxe do template.
      'vue/no-v-html': 'off',
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    files: ['tests/**/*.ts', 'scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: { ...GLOBAIS_COMUNS, ...GLOBAIS_NODE, Request: 'readonly' }
    }
  }
];
