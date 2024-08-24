import pluginJs from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
    {
        ignores: ['eslint.config.js', 'dist/**/*'],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                project: 'tsconfig.json',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
        },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
]
