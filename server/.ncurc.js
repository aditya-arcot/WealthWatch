export function target(name) {
    if (name === 'pino') return 'minor'
    if (name === 'ioredis') return 'patch'
    return 'latest'
}
