module.exports = {
    trailingComma: 'es5',
    tabWidth: 4,
    semi: false,
    singleQuote: true,
    plugins: ['prettier-plugin-organize-imports'],
    overrides: [
        {
            files: '*.html',
            options: {
                printWidth: 160,
            },
        },
    ],
}
