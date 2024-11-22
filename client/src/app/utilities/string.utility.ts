export const capitalize = (str: string | null): string => {
    if (!str) return ''
    return str
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
