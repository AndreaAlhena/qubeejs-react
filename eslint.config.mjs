import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import perfectionist from 'eslint-plugin-perfectionist';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // docs/ holds the specs, the plans and the documentation site, which has its own toolchain.
    // consumer/ and fixtures/ hold projects of their own: the packed-tarball tests install them,
    // and build, type-check and run them there.
    ignores: ['consumer/**', 'coverage/**', 'dist/**', 'docs/**', 'fixtures/**', 'node_modules/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { jsdoc, perfectionist, 'react-hooks': reactHooks },
    rules: {
      /* --- Type safety --- */
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: false }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      /* --- Naming: underscore required on private, forbidden elsewhere --- */
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['camelCase'],
          leadingUnderscore: 'require',
          modifiers: ['private'],
          selector: 'memberLike',
        },
        {
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
          modifiers: ['protected'],
          selector: 'memberLike',
        },
        {
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
          modifiers: ['public'],
          selector: 'memberLike',
        },
        { format: ['PascalCase'], selector: 'typeLike' },
        { format: ['UPPER_CASE'], selector: 'enumMember' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      /* --- Modern syntax --- */
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      /* --- Documentation --- */
      'jsdoc/require-jsdoc': [
        'error',
        {
          contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'TSEnumDeclaration'],
          publicOnly: true,
          require: {
            ClassDeclaration: true,
            FunctionDeclaration: true,
            MethodDefinition: true,
          },
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-prototype-builtins': 'error',
      'no-var': 'error',
      /* --- Ordering: alphabetical everywhere, auto-fixed --- */
      'perfectionist/sort-classes': [
        'error',
        {
          groups: [
            'index-signature',
            'static-property',
            'private-property',
            'protected-property',
            'property',
            'constructor',
            'private-method',
            'protected-method',
            'method',
          ],
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-imports': ['error', { order: 'asc', type: 'alphabetical' }],
      'perfectionist/sort-named-imports': ['error', { order: 'asc', type: 'alphabetical' }],
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      /* --- React --- */
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },

  {
    files: ['src/**/*.spec.{ts,tsx}', 'test/**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },

  {
    // Config files and Node scripts: they are outside the tsconfig project, so type-checked
    // rules cannot run here. `sort-objects` stays out of src/, exactly as in @qubeejs/core, so
    // the two repositories lint alike.
    files: ['*.config.ts', '*.config.mjs', 'scripts/**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
    plugins: { perfectionist },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      'perfectionist/sort-objects': 'error',
    },
  }
);
