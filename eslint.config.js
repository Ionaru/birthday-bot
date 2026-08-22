// Flat config, replacing @ionaru/eslint-config. That package pinned eslint to
// "7.17.0 - 8", which is what kept the ESLint dependabot PR stuck.
//
// ESLint 10 no longer ships formatting rules in core, so the handful that define
// this codebase's look come from @stylistic instead.
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

/** The runnable services. Each is its own process and its own Docker image. */
const APPS = ['api', 'calendar', 'discord-client', 'storage'];

export default tseslint.config(
    {
        ignores: ['data/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    // eslint.config.js is not part of tsconfig's program.
                    allowDefaultProject: ['eslint.config.js'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/max-len': ['error', { code: 140, ignoreUrls: true }],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/semi': ['error', 'always'],

            '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
            '@typescript-eslint/explicit-member-accessibility': 'error',
            '@typescript-eslint/naming-convention': [
                'error',
                { format: ['camelCase', 'UPPER_CASE'], selector: 'variable' },
                { format: ['camelCase'], leadingUnderscore: 'allow', selector: 'parameter' },
                { format: ['PascalCase'], selector: 'typeLike' },
            ],

            // Carried over from the previous config: these caught real problems.
            'no-console': 'error',
            'sort-keys': ['error', 'asc', { caseSensitive: false, natural: true }],
        },
    },
    {
        // node:test's describe/it are meant to be called without awaiting.
        files: ['**/*.test.ts'],
        rules: {
            '@typescript-eslint/no-floating-promises': 'off',
            'sort-keys': 'off',
        },
    },

    // The apps/ and libs/ boundary, which nothing else enforces now that Nx and its
    // @nrwl/nx/enforce-module-boundaries rule are gone. Both directions matter: shared
    // code must stay shared, and the four services must stay four services.
    {
        files: ['libs/**/*.ts'],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: APPS.map((app) => `@birthday-bot/${app}`),
                    message: 'libs/ is shared code and must not depend on a runnable service in apps/.',
                }],
            }],
        },
    },
    ...APPS.map((app) => ({
        files: [`apps/${app}/**/*.ts`],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: APPS.filter((other) => other !== app).map((other) => `@birthday-bot/${other}`),
                    message: 'Each app in apps/ is a separate process. They talk over HTTP, not by importing each other.',
                }],
            }],
        },
    })),
);
