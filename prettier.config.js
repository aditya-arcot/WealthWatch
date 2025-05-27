module.exports = {
    trailingComma: 'es5',
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
