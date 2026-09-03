import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  { 
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], 
    languageOptions: { 
      globals: globals.node,
    } 
  },
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/indent': ['error', 2],
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@typescript-eslint/no-unsafe-assignment': 'error'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'build/**', 'frontend/**']
  }
]);