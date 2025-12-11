export const safeStringify = (obj: object) => {
    const seen = new WeakSet()
    return JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            const objValue = value as object
            if (seen.has(objValue)) return
            seen.add(objValue)
        }
        return value as unknown
    })
}
