import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';
import tailwind from 'eslint-plugin-tailwindcss';

export default defineConfig([
  tseslint.configs.recommended, 
  pluginReact.configs.flat.recommended,
  ...tailwind.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'react/jsx-tag-spacing': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-filename-extension': [
        1,
        { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      ],
      'react/jsx-curly-spacing': 'error',
      'react/jsx-boolean-value': 'error',
      'react/no-array-index-key': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-closing-bracket-location': 'error',
    },
    settings: {
      tailwindcss: {
      },
      react: {
        version: 'detect',
      },
    },
  },
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/indent': ['error', 2],
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylistic/no-multi-spaces': ['error'],
      '@stylistic/semi': ['error'],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
]);
