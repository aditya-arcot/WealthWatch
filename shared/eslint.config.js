import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig({
    files: ['**/*.ts'],
    languageOptions: {
        globals: globals.node,
        parserOptions: {
            project: 'tsconfig.json',
        },
    },
    extends: [
        eslint.configs.recommended,
        tseslint.configs.strictTypeChecked,
        tseslint.configs.stylisticTypeChecked,
        eslintConfigPrettier,
    ],
    rules: {
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
            },
        ],
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/naming-convention': [
            'warn',
            {
                selector: 'default',
                format: ['strictCamelCase'],
                leadingUnderscore: 'allow',
                trailingUnderscore: 'allow',
            },
            {
                selector: 'variableLike',
                format: ['strictCamelCase', 'UPPER_CASE'],
                leadingUnderscore: 'allow',
                trailingUnderscore: 'allow',
            },
            {
                selector: 'typeLike',
                format: ['StrictPascalCase'],
            },
            {
                selector: 'enumMember',
                format: ['StrictPascalCase'],
            },
        ],
        'no-console': 'warn',
    },
})
