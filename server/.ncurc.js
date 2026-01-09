export function target(name) {
    if (name === 'ioredis') return 'patch'
    return 'latest'
}
