// @ts-check
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', '.dependency-cruiser.cjs']
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module' }
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'error'
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsParser, sourceType: 'module' }
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
  }
];
