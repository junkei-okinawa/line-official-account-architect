import js from '@eslint/js';
import tseslang from 'typescript-eslint';

export default [
  { ignores: ['dist', 'node_modules'] },

  js.configs.recommended,
  ...tseslang.configs.recommended,

  {
    languageOptions: {
      parser: tseslang.parser,
      globals: {}, // No global declarations - use env from configs above instead
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
