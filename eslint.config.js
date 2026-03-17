import js from '@eslint/js';
import tseslang from 'typescript-eslint';
import globals from 'globals';

export default [
  { ignores: ['dist', 'node_modules', '.pnp.cjs', '.pnp.loader.mjs', 'coverage'] },

  js.configs.recommended,
  ...tseslang.configs.recommended,

  {
    languageOptions: {
      parser: tseslang.parser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      '@typescript-eslint': tseslang.plugin,
    },

    rules: {
      ...tseslang.configs.recommended.rules,

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  { files: ['**/*.{js,jsx,ts,tsx}'], languageOptions: { globals: { React: 'readonly' } } },
];
