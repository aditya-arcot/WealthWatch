module.exports = {
    target: (name, _) => {
        if (name === 'typescript') return 'patch'
        return 'latest'
    },
}
